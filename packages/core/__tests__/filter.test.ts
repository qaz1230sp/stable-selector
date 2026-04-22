import { describe, it, expect } from 'vitest';
import { BUILT_IN_PATTERNS } from '../src/filter/built-in';
import { shannonEntropy, isLikelyDynamic } from '../src/filter/heuristic';
import { FilterEngine } from '../src/filter';

function createElement(html: string): Element {
  document.body.innerHTML = html.trim();
  return document.body.firstElementChild!;
}

function cleanup() {
  document.body.innerHTML = '';
}

// ─── Built-in Patterns ──────────────────────────────────────────

describe('BUILT_IN_PATTERNS', () => {
  function matchesBuiltIn(value: string): boolean {
    return BUILT_IN_PATTERNS.some((p) => p.test(value));
  }

  it('detects CSS Modules classes', () => {
    expect(matchesBuiltIn('styles_header__3xK2a')).toBe(true);
    expect(matchesBuiltIn('Component_wrapper__a9Bf2')).toBe(true);
  });

  it('detects Styled Components classes', () => {
    expect(matchesBuiltIn('sc-bdnxRM')).toBe(true);
    expect(matchesBuiltIn('sc-abcdef')).toBe(true);
  });

  it('detects Emotion classes', () => {
    expect(matchesBuiltIn('css-1a2b3c')).toBe(true);
    expect(matchesBuiltIn('css-0')).toBe(true);
  });

  it('detects Webpack hash suffixes', () => {
    expect(matchesBuiltIn('main-ab12cd34')).toBe(true);
    expect(matchesBuiltIn('chunk_1a2b3c4d5e')).toBe(true);
  });

  it('detects Vue scoped attributes', () => {
    expect(matchesBuiltIn('data-v-abcd1234')).toBe(true);
    expect(matchesBuiltIn('data-v-00ff00aa')).toBe(true);
  });

  it('detects React internals', () => {
    expect(matchesBuiltIn('__reactFiber$abc')).toBe(true);
    expect(matchesBuiltIn('__reactInternalInstance$xyz')).toBe(true);
  });

  it('detects CSS Modules version-number suffixes', () => {
    expect(matchesBuiltIn('pe-toolbarNav-1-2-25')).toBe(true);
    expect(matchesBuiltIn('w-predicateList-1-2-80')).toBe(true);
    expect(matchesBuiltIn('Component-predicateListReadonly-1-2-82')).toBe(true);
    expect(matchesBuiltIn('some-widget-0-3-14')).toBe(true);
  });

  it('detects CSS Modules numeric hash suffixes', () => {
    expect(matchesBuiltIn('btn-23')).toBe(true);
    expect(matchesBuiltIn('Component-82')).toBe(true);
    expect(matchesBuiltIn('widget-456')).toBe(true);
    expect(matchesBuiltIn('predicateList-80')).toBe(true);
  });

  it('detects framework auto-generated counter IDs', () => {
    expect(matchesBuiltIn('Dropdown501-option')).toBe(true);
    expect(matchesBuiltIn('Pivot92-Tab0')).toBe(true);
    expect(matchesBuiltIn('FocusZone93')).toBe(true);
    expect(matchesBuiltIn('Dropdown501')).toBe(true);
  });

  it('detects embedded counter segments in IDs', () => {
    expect(matchesBuiltIn('radio-group-16-specific')).toBe(true);
    expect(matchesBuiltIn('row-657-item')).toBe(true);
    expect(matchesBuiltIn('header-580-targeted')).toBe(true);
    // Single digit between hyphens is OK (e.g., col-md-6 pattern)
    expect(matchesBuiltIn('step-3-title')).toBe(false);
  });

  it('does NOT flag normal CSS class names via built-in patterns', () => {
    expect(matchesBuiltIn('header')).toBe(false);
    expect(matchesBuiltIn('nav-bar')).toBe(false);
    expect(matchesBuiltIn('user-card')).toBe(false);
    expect(matchesBuiltIn('btn-primary')).toBe(false);
    expect(matchesBuiltIn('add-filter-button')).toBe(false);
    expect(matchesBuiltIn('col-md-6')).toBe(false); // Bootstrap grid — single digit OK
    expect(matchesBuiltIn('h-4')).toBe(false);       // Tailwind — single digit OK
    expect(matchesBuiltIn('mt-2')).toBe(false);       // Tailwind — single digit OK
    expect(matchesBuiltIn('App')).toBe(false);         // PascalCase without counter
    expect(matchesBuiltIn('MyComponent')).toBe(false); // PascalCase without digits
  });
});

// ─── State Class Patterns ────────────────────────────────────────

describe('STATE_CLASS_PATTERNS', () => {
  // Use FilterEngine to test since STATE_CLASS_PATTERNS are applied there
  const filter = new FilterEngine({ heuristic: false });

  it('filters visibility state classes', () => {
    expect(filter.isClassDynamic('collapsed')).toBe(true);
    expect(filter.isClassDynamic('expanded')).toBe(true);
    expect(filter.isClassDynamic('visible')).toBe(true);
    expect(filter.isClassDynamic('hidden')).toBe(true);
    expect(filter.isClassDynamic('is-open')).toBe(true);
    expect(filter.isClassDynamic('is-closed')).toBe(true);
    expect(filter.isClassDynamic('is-visible')).toBe(true);
    expect(filter.isClassDynamic('is-hidden')).toBe(true);
  });

  it('filters interactive state classes', () => {
    expect(filter.isClassDynamic('is-selected')).toBe(true);
    expect(filter.isClassDynamic('is-active')).toBe(true);
    expect(filter.isClassDynamic('is-disabled')).toBe(true);
    expect(filter.isClassDynamic('is-focused')).toBe(true);
    expect(filter.isClassDynamic('is-checked')).toBe(true);
  });

  it('filters Fluent UI state classes', () => {
    expect(filter.isClassDynamic('isSelected')).toBe(true);
    expect(filter.isClassDynamic('linkIsSelected')).toBe(true);
    expect(filter.isClassDynamic('isExpanded')).toBe(true);
    expect(filter.isClassDynamic('isCollapsed')).toBe(true);
    // With hash suffixes (caught by BUILT_IN numeric suffix pattern, also correct)
    expect(filter.isClassDynamic('linkIsSelected-224')).toBe(true);
  });

  it('filters toggle pattern classes', () => {
    expect(filter.isClassDynamic('datePickerShow')).toBe(true);
    expect(filter.isClassDynamic('disabledDatePickerHide')).toBe(true);
    expect(filter.isClassDynamic('visible-element')).toBe(true);
  });

  it('does NOT filter semantic/structural classes', () => {
    expect(filter.isClassDynamic('navigation')).toBe(false);
    expect(filter.isClassDynamic('ms-Pivot')).toBe(false);
    expect(filter.isClassDynamic('ms-Button')).toBe(false);
    expect(filter.isClassDynamic('add-filter-button')).toBe(false);
    expect(filter.isClassDynamic('date-picker')).toBe(false);
    expect(filter.isClassDynamic('tab-bar')).toBe(false);
  });
});

describe('Heuristic entropy detection', () => {
  it('shannonEntropy returns 0 for empty string', () => {
    expect(shannonEntropy('')).toBe(0);
  });

  it('isLikelyDynamic catches random strings', () => {
    expect(isLikelyDynamic('x7q9mZkP3', 0.7)).toBe(true);
    expect(isLikelyDynamic('a1b2c3d4e5', 0.7)).toBe(true);
  });

  it('isLikelyDynamic catches random suffixes (5+ hex after separator)', () => {
    // Must contain actual a-f hex letters in the suffix, not just digits
    expect(isLikelyDynamic('component-a3f8b2', 0.7)).toBe(true);
    expect(isLikelyDynamic('widget_deadbeef', 0.7)).toBe(true);
    // Pure numeric suffixes are treated as word-like (common in real IDs)
    expect(isLikelyDynamic('score_47840219', 0.7)).toBe(false);
    expect(isLikelyDynamic('item_123', 0.7)).toBe(false);
  });

  it('does NOT flag strings with low normalized entropy', () => {
    // Strings with many repeated chars have low normalized entropy < 0.7
    // "app" → a=1,p=2 → normalized ≈ 0.58
    expect(isLikelyDynamic('app', 0.7)).toBe(false);
    // "sass" → s=3,a=1 → normalized ≈ 0.41
    expect(isLikelyDynamic('sass', 0.7)).toBe(false);
    // empty string
    expect(isLikelyDynamic('', 0.7)).toBe(false);
  });

  it('does NOT flag word-like values regardless of entropy', () => {
    // Pure alphabetic words/segments are treated as word-like
    expect(isLikelyDynamic('header', 0.7)).toBe(false);
    expect(isLikelyDynamic('container', 0.7)).toBe(false);
    expect(isLikelyDynamic('hnmain', 0.7)).toBe(false);
    expect(isLikelyDynamic('page-top', 0.7)).toBe(false);
    expect(isLikelyDynamic('user_card', 0.7)).toBe(false);
    // Purely numeric IDs are also word-like
    expect(isLikelyDynamic('47840219', 0.7)).toBe(false);
  });
});

// ─── FilterEngine ────────────────────────────────────────────────

describe('FilterEngine', () => {
  afterEach(cleanup);

  describe('whitelist', () => {
    it('overrides all rules — whitelisted values are always kept', () => {
      const filter = new FilterEngine({
        whitelist: ['css-1a2b3c'],
        blacklist: ['css-1a2b3c'],
      });
      expect(filter.isClassDynamic('css-1a2b3c')).toBe(false);
    });
  });

  describe('blacklist', () => {
    it('blocks exact strings', () => {
      // Disable heuristic to isolate blacklist behavior
      const filter = new FilterEngine({ blacklist: ['blocked-class'], heuristic: false });
      expect(filter.isClassDynamic('blocked-class')).toBe(true);
    });

    it('blocks glob wildcards (ant-*)', () => {
      const filter = new FilterEngine({ blacklist: ['ant-*'], heuristic: false });
      expect(filter.isClassDynamic('ant-btn')).toBe(true);
      expect(filter.isClassDynamic('ant-input')).toBe(true);
      expect(filter.isClassDynamic('btn-ant')).toBe(false);
    });

    it('blocks RegExp patterns', () => {
      const filter = new FilterEngine({ blacklist: [/^el-/], heuristic: false });
      expect(filter.isClassDynamic('el-button')).toBe(true);
      expect(filter.isClassDynamic('button-el')).toBe(false);
    });
  });

  describe('grouped blacklist', () => {
    it('applies classNames blacklist only to classes', () => {
      const filter = new FilterEngine({
        blacklist: { classNames: ['secret-cls'], ids: [], attributes: [] },
        heuristic: false,
      });
      expect(filter.isClassDynamic('secret-cls')).toBe(true);
      expect(filter.isIdDynamic('secret-cls')).toBe(false);
    });

    it('applies ids blacklist only to IDs', () => {
      const filter = new FilterEngine({
        blacklist: { ids: ['temp-id'], classNames: [], attributes: [] },
        heuristic: false,
      });
      expect(filter.isIdDynamic('temp-id')).toBe(true);
      expect(filter.isClassDynamic('temp-id')).toBe(false);
    });

    it('applies attributes blacklist only to attributes', () => {
      const filter = new FilterEngine({
        blacklist: { attributes: ['data-random'], classNames: [], ids: [] },
        heuristic: false,
      });
      expect(filter.isAttributeDynamic('data-random')).toBe(true);
      expect(filter.isClassDynamic('data-random')).toBe(false);
    });
  });

  describe('getStableClasses', () => {
    it('returns only stable classes, filtering out dynamic ones', () => {
      const el = createElement(
        '<div class="app sc-bdnxRM css-1a2b3c sass"></div>',
      );
      // Heuristic disabled: only built-in patterns filter
      const filter = new FilterEngine({ heuristic: false });
      const stable = filter.getStableClasses(el);
      expect(stable).toContain('app');
      expect(stable).toContain('sass');
      expect(stable).not.toContain('sc-bdnxRM');
      expect(stable).not.toContain('css-1a2b3c');
    });

    it('with heuristic enabled, filters high-entropy non-word classes too', () => {
      const el = createElement(
        '<div class="app header sc-bdnxRM x7q9mZkP3"></div>',
      );
      const filter = new FilterEngine(); // heuristic on by default
      const stable = filter.getStableClasses(el);
      // "app" and "header" are word-like → kept; "sc-bdnxRM" built-in → filtered; "x7q9mZkP3" random → filtered
      expect(stable).toContain('app');
      expect(stable).toContain('header');
      expect(stable).not.toContain('sc-bdnxRM');
      expect(stable).not.toContain('x7q9mZkP3');
    });
  });

  describe('getStableId', () => {
    it('returns null for dynamic IDs (built-in pattern match)', () => {
      const el = createElement('<div id="sc-bdnxRM"></div>');
      const filter = new FilterEngine();
      expect(filter.getStableId(el)).toBeNull();
    });

    it('returns stable IDs (low-entropy, no pattern match)', () => {
      const el = createElement('<div id="app"></div>');
      const filter = new FilterEngine();
      expect(filter.getStableId(el)).toBe('app');
    });

    it('returns stable IDs when heuristic disabled', () => {
      const el = createElement('<div id="user-profile"></div>');
      const filter = new FilterEngine({ heuristic: false });
      expect(filter.getStableId(el)).toBe('user-profile');
    });

    it('returns null when element has no ID', () => {
      const el = createElement('<div></div>');
      const filter = new FilterEngine();
      expect(filter.getStableId(el)).toBeNull();
    });
  });

  describe('getStableAttributes', () => {
    it('excludes class, id, style, and framework attributes', () => {
      const el = createElement(
        '<div id="x" class="y" style="color:red" data-v-abcd1234="" data-testid="card" aria-label="greeting"></div>',
      );
      // Disable heuristic to focus on attribute exclusion logic
      const filter = new FilterEngine({ heuristic: false });
      const attrs = filter.getStableAttributes(el);
      const names = attrs.map((a) => a.name);
      expect(names).not.toContain('id');
      expect(names).not.toContain('class');
      expect(names).not.toContain('style');
      expect(names).not.toContain('data-v-abcd1234');
      expect(names).toContain('data-testid');
      expect(names).toContain('aria-label');
    });
  });

  describe('withBlacklist', () => {
    it('merges additional blacklist rules into a new engine', () => {
      const base = new FilterEngine({ blacklist: { classNames: ['ant-*'] }, heuristic: false });
      const extended = base.withBlacklist({ classNames: ['el-*'] });

      expect(extended.isClassDynamic('ant-btn')).toBe(true);
      expect(extended.isClassDynamic('el-button')).toBe(true);
      // original still doesn't block el-*
      expect(base.isClassDynamic('el-button')).toBe(false);
    });
  });

  describe('getFilterDetails', () => {
    afterEach(cleanup);

    it('returns kept and filtered details for an element', () => {
    const el = createElement(
      '<div id="main" class="app sc-bdnxRM header" data-testid="card" data-v-abc123=""></div>',
    );
    const filter = new FilterEngine();
    const details = filter.getFilterDetails(el);

    // ID "main" should be kept
    const idDetail = details.find((d) => d.type === 'id');
    expect(idDetail).toEqual({ value: 'main', type: 'id', status: 'kept' });

    // "app" and "header" should be kept, "sc-bdnxRM" should be filtered (built-in)
    const appDetail = details.find((d) => d.value === 'app');
    expect(appDetail?.status).toBe('kept');
    const scDetail = details.find((d) => d.value === 'sc-bdnxRM');
    expect(scDetail?.status).toBe('filtered');
    expect(scDetail?.reason).toBe('built-in');

    // "data-testid" attribute should be kept
    const testidDetail = details.find((d) => d.value === 'data-testid');
    expect(testidDetail?.status).toBe('kept');

    // "data-v-abc123" should be filtered (framework-prefix)
    const vueDetail = details.find((d) => d.value === 'data-v-abc123');
    expect(vueDetail?.status).toBe('filtered');
    expect(vueDetail?.reason).toBe('framework-prefix');
  });

  it('respects blacklist in details', () => {
    const el = createElement('<div class="ant-btn custom"></div>');
    const filter = new FilterEngine({
      blacklist: { classNames: ['ant-*'], ids: [], attributes: [] },
      heuristic: false,
    });
    const details = filter.getFilterDetails(el);

    const antDetail = details.find((d) => d.value === 'ant-btn');
    expect(antDetail?.status).toBe('filtered');
    expect(antDetail?.reason).toBe('blacklist');

    const customDetail = details.find((d) => d.value === 'custom');
    expect(customDetail?.status).toBe('kept');
  });
});
});
