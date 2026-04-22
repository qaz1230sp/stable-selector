import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import {
  getSelector,
  getSelectorAll,
  configure,
  resetConfig,
} from '../src/index';

beforeEach(() => {
  resetConfig();
  // Disable heuristic globally for integration tests to focus on strategy/scoring logic
  configure({ filters: { heuristic: false } });
});

afterEach(() => {
  document.body.innerHTML = '';
  resetConfig();
});

function setupDOM(html: string): void {
  document.body.innerHTML = html;
}

const USER_CARD_HTML = `
<div id="app">
  <header class="header sc-bdnxRM">
    <nav aria-label="Main menu">
      <a href="/" data-testid="home-link">Home</a>
    </nav>
  </header>
  <main>
    <div id="user-card" class="card css-1a2b3c" data-testid="user-card">
      <img src="avatar.png" alt="Avatar" />
      <h2 class="name">Jane Doe</h2>
      <span class="role-label" role="status" aria-label="Online">Online</span>
      <button data-cy="follow-btn">Follow</button>
    </div>
    <div class="sidebar styles_sidebar__a9Bf2">
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    </div>
  </main>
</div>`;

describe('Integration — getSelector', () => {
  it('returns correct selectors for element with data-testid', () => {
    setupDOM(USER_CARD_HTML);
    const el = document.querySelector('[data-testid="user-card"]')!;
    const result = getSelector(el);
    expect(result).not.toBeNull();
    expect(result!.css).toBeDefined();
  });

  it('returns correct selectors for element with stable ID', () => {
    setupDOM(USER_CARD_HTML);
    const el = document.querySelector('#user-card')!;
    const result = getSelector(el);
    expect(result).not.toBeNull();
    expect(result!.css).toContain('user-card');
  });

  it('handles element with only dynamic classes (falls back to structural)', () => {
    setupDOM('<div class="sc-bdnxRM css-1a2b3c"><span>Hello</span></div>');
    const el = document.querySelector('span')!;
    const result = getSelector(el);
    expect(result).not.toBeNull();
    expect(result!.css || result!.xpath || result!.playwright).toBeDefined();
  });
});

describe('Integration — getSelectorAll', () => {
  it('returns multiple candidates sorted by score', () => {
    setupDOM(USER_CARD_HTML);
    const el = document.querySelector('#user-card')!;
    const candidates = getSelectorAll(el);
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].total).toBeGreaterThanOrEqual(candidates[i].total);
    }
  });
});

describe('Integration — configure', () => {
  it('custom blacklist changes behavior', () => {
    setupDOM('<div class="ant-card" id="stable"><span>Hi</span></div>');
    configure({
      filters: { blacklist: { classNames: ['ant-*'] }, heuristic: false },
    });
    const el = document.querySelector('.ant-card')!;
    const candidates = getSelectorAll(el);
    const hasId = candidates.some((c) => c.selector.includes('#stable'));
    expect(hasId).toBe(true);
  });
});

describe('Integration — per-call options override global config', () => {
  it('per-call blacklist merges with global', () => {
    setupDOM('<div id="main" class="card el-card"><span>Text</span></div>');
    const el = document.querySelector('#main')!;

    const before = getSelectorAll(el);
    expect(before.some((c) => c.selector.includes('#main'))).toBe(true);

    // With per-call blacklist, "card" class gets blocked in structural selectors
    const after = getSelectorAll(el, { blacklist: { classNames: ['card'] } });
    const hasCardAfter = after.some(
      (c) => c.selector === '.card' && c.strategy === 'attribute',
    );
    expect(hasCardAfter).toBe(false);
  });
});

describe('Integration — resetConfig', () => {
  it('restores defaults after configure', () => {
    configure({ formats: ['css'] });
    resetConfig();
    setupDOM('<div id="app"></div>');
    const el = document.querySelector('#app')!;
    const result = getSelector(el);
    // After reset all 3 formats present (id "app" passes default heuristic too)
    expect(result!.css).toBeDefined();
    expect(result!.xpath).toBeDefined();
    expect(result!.playwright).toBeDefined();
  });
});

describe('Integration — format filtering', () => {
  it('{ formats: ["css"] } only returns CSS', () => {
    setupDOM('<div id="app"></div>');
    const el = document.querySelector('#app')!;
    const result = getSelector(el, { formats: ['css'] });
    expect(result).not.toBeNull();
    expect(result!.css).toBeDefined();
    expect(result!.xpath).toBeUndefined();
    expect(result!.playwright).toBeUndefined();
  });
});

describe('Integration — round-trip CSS querySelector', () => {
  it('generated CSS selector can querySelectorAll back to the original element', () => {
    setupDOM(USER_CARD_HTML);
    const el = document.querySelector('#user-card')!;
    const result = getSelector(el, { formats: ['css'] });
    expect(result).not.toBeNull();
    const found = document.querySelectorAll(result!.css!);
    expect(found).toHaveLength(1);
    expect(found[0]).toBe(el);
  });
});
