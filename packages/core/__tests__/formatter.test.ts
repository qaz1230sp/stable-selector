import { describe, it, expect } from 'vitest';
import { formatCSS } from '../src/formatter/css';
import { formatXPath } from '../src/formatter/xpath';
import { formatPlaywright } from '../src/formatter/playwright';

// ─── CSS Formatter ───────────────────────────────────────────────

describe('formatCSS', () => {
  it('passes through normal CSS selectors', () => {
    expect(formatCSS('#main')).toBe('#main');
    expect(formatCSS('[data-testid="card"]')).toBe('[data-testid="card"]');
    expect(formatCSS('div > span.label')).toBe('div > span.label');
  });

  it('returns null for __text__ selectors', () => {
    expect(formatCSS('__text__[tag="button"][text="Submit"]')).toBeNull();
  });

  it('converts __role__ to attribute selector', () => {
    expect(formatCSS('__role__[role="dialog"]')).toBe('[role="dialog"]');
  });

  it('converts __role__ with name to role + aria-label', () => {
    const result = formatCSS('__role__[role="button"][name="Save"]');
    expect(result).toBe('[role="button"][aria-label="Save"]');
  });
});

// ─── XPath Formatter ─────────────────────────────────────────────

describe('formatXPath', () => {
  it('converts #id to //*[@id="..."]', () => {
    expect(formatXPath('#user-card')).toBe('//*[@id="user-card"]');
  });

  it('converts attribute selectors', () => {
    expect(formatXPath('[data-testid="card"]')).toBe('//*[@data-testid="card"]');
  });

  it('converts __text__ to text() XPath', () => {
    const result = formatXPath('__text__[tag="button"][text="Submit"]');
    expect(result).toBe('//button[normalize-space(text())="Submit"]');
  });

  it('converts __role__ to @role XPath', () => {
    expect(formatXPath('__role__[role="dialog"]')).toBe('//*[@role="dialog"]');
  });

  it('converts __role__ with name to combined XPath', () => {
    const result = formatXPath('__role__[role="dialog"][name="Settings"]');
    expect(result).toBe('//*[@role="dialog" and @aria-label="Settings"]');
  });

  it('converts child combinator (>) selectors', () => {
    const result = formatXPath('div > span');
    expect(result).toContain('/div');
    expect(result).toContain('/span');
  });

  it('handles attribute values containing spaces', () => {
    const result = formatXPath('ul[aria-label="Do you want your ads to appear"] > div');
    expect(result).toBe('//ul[@aria-label="Do you want your ads to appear"]/div');
  });

  it('handles multi-level selectors with spaced attribute values', () => {
    const result = formatXPath('nav[aria-label="Sub page menu"] > button[role="tab"]:nth-of-type(2)');
    expect(result).toBe('//nav[@aria-label="Sub page menu"]/button[position()=2 and @role="tab"]');
  });
});

// ─── Playwright Formatter ────────────────────────────────────────

describe('formatPlaywright', () => {
  it('converts __text__ to has-text locator', () => {
    const result = formatPlaywright('__text__[tag="button"][text="Submit"]');
    expect(result).toBe('button:has-text("Submit")');
  });

  it('converts __role__ to role= locator', () => {
    expect(formatPlaywright('__role__[role="dialog"]')).toBe('role=dialog');
  });

  it('converts __role__ with name', () => {
    const result = formatPlaywright('__role__[role="button"][name="Save"]');
    expect(result).toBe('role=button[name="Save"]');
  });

  it('preserves data-testid selector', () => {
    expect(formatPlaywright('[data-testid="card"]')).toBe('[data-testid="card"]');
  });

  it('passes through regular CSS selectors', () => {
    expect(formatPlaywright('#main')).toBe('#main');
    expect(formatPlaywright('div > span.label')).toBe('div > span.label');
  });
});
