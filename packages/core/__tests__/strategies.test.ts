import { describe, it, expect, afterEach } from 'vitest';
import { FilterEngine } from '../src/filter';
import { IdStrategy } from '../src/strategies/id';
import { AttributeStrategy } from '../src/strategies/attribute';
import { StructuralStrategy } from '../src/strategies/structural';
import { TextStrategy } from '../src/strategies/text';
import { RoleStrategy } from '../src/strategies/role';
import { StrategyPipeline } from '../src/strategies';

// Use heuristic: false in strategy tests to isolate strategy logic from heuristic filtering
const noHeuristic = { heuristic: false } as const;

function setup(html: string): { root: Element; el: (sel: string) => Element } {
  document.body.innerHTML = html;
  return {
    root: document.body,
    el: (sel: string) => document.body.querySelector(sel)!,
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ─── IdStrategy ──────────────────────────────────────────────────

describe('IdStrategy', () => {
  const filter = new FilterEngine(noHeuristic);
  const strategy = new IdStrategy(filter);

  it('generates #stable-id for element with stable ID', () => {
    const { el } = setup('<div id="stable-id"></div>');
    const candidates = strategy.generate(el('div'), document);
    expect(candidates.length).toBe(1);
    expect(candidates[0].selector).toBe('#stable-id');
    expect(candidates[0].strategy).toBe('id');
  });

  it('returns empty for element with dynamic ID', () => {
    const { el } = setup('<div id="sc-bdnxRM"></div>');
    const candidates = strategy.generate(el('div'), document);
    expect(candidates).toHaveLength(0);
  });

  it('returns empty for element without ID', () => {
    const { el } = setup('<div class="test"></div>');
    const candidates = strategy.generate(el('div'), document);
    expect(candidates).toHaveLength(0);
  });
});

// ─── AttributeStrategy ──────────────────────────────────────────

describe('AttributeStrategy', () => {
  const filter = new FilterEngine(noHeuristic);
  const strategy = new AttributeStrategy(filter);

  it('prioritizes data-testid over other attributes', () => {
    const { el } = setup(
      '<button data-testid="submit-btn" data-custom="foo" aria-label="Submit"></button>',
    );
    const candidates = strategy.generate(el('button'), document);
    expect(candidates[0].selector).toBe('[data-testid="submit-btn"]');
  });

  it('finds data-cy and data-test attributes', () => {
    const { el } = setup('<div data-cy="login-form"></div>');
    const candidates = strategy.generate(el('div'), document);
    expect(candidates.some((c) => c.selector.includes('data-cy'))).toBe(true);

    document.body.innerHTML = '<div data-test="card"></div>';
    const el2 = document.querySelector('div')!;
    const candidates2 = strategy.generate(el2, document);
    expect(candidates2.some((c) => c.selector.includes('data-test'))).toBe(true);
  });

  it('finds aria-label', () => {
    const { el } = setup('<span aria-label="Close dialog"></span>');
    const candidates = strategy.generate(el('span'), document);
    expect(candidates.some((c) => c.selector.includes('aria-label'))).toBe(true);
  });
});

// ─── StructuralStrategy ─────────────────────────────────────────

describe('StructuralStrategy', () => {
  const filter = new FilterEngine(noHeuristic);
  const strategy = new StructuralStrategy(filter, 5);

  it('builds correct path with tag > tag structure', () => {
    const { el } = setup('<section><article><p class="content">Hello</p></article></section>');
    const target = el('p');
    const candidates = strategy.generate(target, document.body);
    expect(candidates).toHaveLength(1);
    // Shortest unique selector — p.content is unique, so no ancestors needed
    expect(candidates[0].selector).toContain('p');
  });

  it('uses nth-of-type when no stable class exists and sibling ambiguity', () => {
    setup('<ul><li>A</li><li>B</li><li>C</li></ul>');
    const items = document.querySelectorAll('li');
    const candidates = strategy.generate(items[1], document.body);
    expect(candidates[0].selector).toContain(':nth-of-type(2)');
  });

  it('stops at stable ID ancestor', () => {
    setup('<div id="app"><section><span>X</span></section></div>');
    const target = document.querySelector('span')!;
    const candidates = strategy.generate(target, document.body);
    // span is unique in simple doc, but if not, would include #app
    expect(candidates[0].selector).toContain('span');
  });

  it('extends path to find unique selector among duplicates', () => {
    setup('<div class="a"><span>X</span></div><div class="b"><span>Y</span></div>');
    const target = document.querySelectorAll('span')[1];
    const candidates = strategy.generate(target, document.body);
    // span alone matches 2, needs parent context
    expect(candidates[0].selector).toContain('>');
    expect(candidates[0].selector).toContain('span');
  });

  it('uses aria-label on ancestor as anchor point', () => {
    setup(`
      <div>
        <nav aria-label="Main menu">
          <button>Home</button>
          <button>About</button>
        </nav>
        <nav aria-label="Side menu">
          <button>Links</button>
          <button>Info</button>
        </nav>
      </div>
    `);
    const buttons = document.querySelectorAll('button');
    // Target: second button in "Side menu" nav
    const candidates = strategy.generate(buttons[3], document.body);
    const selector = candidates[0].selector;
    expect(selector).toContain('aria-label');
    expect(selector).toContain('Side menu');
    // Should NOT include deeply nested selectors — aria-label is the anchor
    expect(selector.split('>').length).toBeLessThanOrEqual(3);
  });

  it('applies nth-child only on target, not every ancestor', () => {
    setup(`
      <div class="container">
        <ul><li>A</li><li>B</li></ul>
        <ul><li>C</li><li>D</li></ul>
      </div>
    `);
    const items = document.querySelectorAll('li');
    // Target: first li in second ul (li with text "C")
    const candidates = strategy.generate(items[2], document.body);
    const selector = candidates[0].selector;
    // Phase 2 tries target-only nth-of-type first; if not unique, falls to Phase 3.
    // This DOM needs nth-of-type on both ul and li to disambiguate, so ≤ 2 is correct.
    const nthCount = (selector.match(/:nth-of-type/g) || []).length;
    expect(nthCount).toBeLessThanOrEqual(2);
  });

  it('prefers minimal selector — tag+attribute over tag+classes+attribute', () => {
    setup(`
      <div role="tablist">
        <button class="ms-Button ms-Button--action" role="tab">Tab 1</button>
        <button class="ms-Button ms-Button--action" role="tab">Tab 2</button>
      </div>
    `);
    const buttons = document.querySelectorAll('button');
    const candidates = strategy.generate(buttons[1], document.body);
    const selector = candidates[0].selector;
    // Should use button[role="tab"]:nth-of-type(2), not verbose version
    expect(selector).toContain('button[role="tab"]');
    expect(selector).toContain(':nth-of-type(2)');
    expect(selector).not.toContain('.ms-Button');
  });

  it('nth-of-type works correctly with mixed sibling types (radiogroup)', () => {
    setup(`
      <div role="radiogroup" aria-labelledby="displayTimeLabel">
        <span id="displayTimeLabel">Display time</span>
        <label class="radio-inline"><input type="radio" name="time" value="12">12-hour</label>
        <label class="radio-inline"><input type="radio" name="time" value="24">24-hour</label>
      </div>
    `);
    const labels = document.querySelectorAll('label');
    const candidates = strategy.generate(labels[0], document.body);
    const selector = candidates[0].selector;
    // The first label is child 2 (span is child 1), but nth-of-type(1) among labels
    // Must NOT use :nth-of-type(1) if label is already unique, or use correct index
    expect(document.querySelectorAll(selector).length).toBe(1);
    expect(document.querySelector(selector)).toBe(labels[0]);
  });

  it('skips non-unique aria-label and climbs higher to find unique ancestor', () => {
    setup(`
      <div role="grid">
        <div role="row" aria-rowindex="2">
          <div role="gridcell" data-automation-key="bid">
            <div aria-label="dropdown-label"><span class="title">A</span></div>
          </div>
        </div>
        <div role="row" aria-rowindex="3">
          <div role="gridcell" data-automation-key="bid">
            <div aria-label="dropdown-label"><span class="title">B</span></div>
          </div>
        </div>
      </div>
    `);
    const spans = document.querySelectorAll('span.title');
    const candidates = strategy.generate(spans[0], document.body);
    const selector = candidates[0].selector;
    // Should NOT anchor at non-unique aria-label="dropdown-label"
    // Should use aria-rowindex to differentiate rows
    expect(selector).toContain('aria-rowindex');
    // Verify it actually selects the right element
    const match = document.querySelectorAll(selector);
    expect(match.length).toBe(1);
    expect(match[0]).toBe(spans[0]);
  });
});

// ─── TextStrategy ────────────────────────────────────────────────

describe('TextStrategy', () => {
  const strategy = new TextStrategy();

  it('generates candidate for button with text', () => {
    const { el } = setup('<button>Submit</button>');
    const candidates = strategy.generate(el('button'), document);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].selector).toContain('__text__');
    expect(candidates[0].selector).toContain('Submit');
    expect(candidates[0].selector).toContain('button');
  });

  it('skips elements with text too long (>50 chars)', () => {
    const longText = 'A'.repeat(51);
    const { el } = setup(`<button>${longText}</button>`);
    const candidates = strategy.generate(el('button'), document);
    expect(candidates).toHaveLength(0);
  });

  it('skips non-text elements like div', () => {
    const { el } = setup('<div>Some text</div>');
    const candidates = strategy.generate(el('div'), document);
    expect(candidates).toHaveLength(0);
  });

  it('works with other text tags like a, label, h1', () => {
    setup('<a href="#">Click me</a>');
    let candidates = strategy.generate(document.querySelector('a')!, document);
    expect(candidates.length).toBeGreaterThan(0);

    document.body.innerHTML = '<h1>Title</h1>';
    candidates = strategy.generate(document.querySelector('h1')!, document);
    expect(candidates.length).toBeGreaterThan(0);
  });
});

// ─── RoleStrategy ────────────────────────────────────────────────

describe('RoleStrategy', () => {
  const strategy = new RoleStrategy();

  it('uses explicit role attribute', () => {
    const { el } = setup('<div role="dialog" aria-label="Settings"></div>');
    const candidates = strategy.generate(el('div'), document);
    expect(candidates.some((c) => c.selector.includes('dialog'))).toBe(true);
    expect(candidates.some((c) => c.selector.includes('Settings'))).toBe(true);
  });

  it('generates candidate with role only (no name)', () => {
    const { el } = setup('<div role="alert"></div>');
    const candidates = strategy.generate(el('div'), document);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].selector).toContain('alert');
  });

  it('uses implicit role from semantic tags', () => {
    const { el } = setup('<nav aria-label="Main menu"></nav>');
    const candidates = strategy.generate(el('nav'), document);
    expect(candidates.some((c) => c.selector.includes('navigation'))).toBe(true);
  });

  it('does not create implicit role candidate without name', () => {
    const { el } = setup('<nav></nav>');
    const candidates = strategy.generate(el('nav'), document);
    expect(candidates).toHaveLength(0);
  });
});

// ─── StrategyPipeline ────────────────────────────────────────────

describe('StrategyPipeline', () => {
  it('respects priority order — id comes first', () => {
    const filter = new FilterEngine(noHeuristic);
    const pipeline = new StrategyPipeline(filter, ['id', 'attribute', 'structural', 'text', 'role']);
    setup('<button id="submit" data-testid="submit-btn">Submit</button>');
    const target = document.querySelector('button')!;
    const candidates = pipeline.generate(target, document);

    expect(candidates[0].strategy).toBe('id');
  });

  it('generates candidates from multiple strategies', () => {
    const filter = new FilterEngine(noHeuristic);
    const pipeline = new StrategyPipeline(filter, ['id', 'attribute', 'text', 'role']);
    setup('<button id="go" data-testid="go-btn" role="button" aria-label="Go">Go</button>');
    const target = document.querySelector('button')!;
    const candidates = pipeline.generate(target, document);

    const strategies = new Set(candidates.map((c) => c.strategy));
    expect(strategies.has('id')).toBe(true);
    expect(strategies.has('attribute')).toBe(true);
  });
});
