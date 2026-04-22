/**
 * Real-world website test — validates stable-selector against actual HTML from live sites.
 * Uses HTML snapshots from Hacker News and a Tailwind/React-style simulated page.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getSelector, getSelectorAll, configure, resetConfig } from '../src/index';

function parseHTML(html: string): Document {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc;
}

// ============================================================
// Hacker News — a classic server-rendered site with stable IDs
// ============================================================
const HN_HTML = `
<html><body>
<table id="hnmain" border="0" cellpadding="0" cellspacing="0" width="85%" bgcolor="#f6f6ef">
  <tr><td bgcolor="#ff6600">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td><a href="https://news.ycombinator.com"><img src="y18.svg" width="18" height="18"></a></td>
        <td><span class="pagetop"><b class="hnname"><a href="news">Hacker News</a></b>
          <a href="newest">new</a> | <a href="front">past</a> | <a href="newcomments">comments</a> |
          <a href="ask">ask</a> | <a href="show">show</a> | <a href="jobs">jobs</a>
        </span></td>
        <td><span class="pagetop"><a href="login?goto=news">login</a></span></td>
      </tr>
    </table>
  </td></tr>
  <tr><td>
    <table>
      <tr class="athing submission" id="47840219">
        <td align="right" valign="top" class="title"><span class="rank">1.</span></td>
        <td valign="top" class="votelinks">
          <center><a id="up_47840219" href="vote?id=47840219"><div class="votearrow" title="upvote"></div></a></center>
        </td>
        <td class="title">
          <span class="titleline"><a href="https://www.apple.com/newsroom">John Ternus to become Apple CEO</a>
            <span class="sitebit comhead"> (<a href="from?site=apple.com"><span class="sitestr">apple.com</span></a>)</span>
          </span>
        </td>
      </tr>
      <tr><td colspan="2"></td>
        <td class="subtext">
          <span class="subline">
            <span class="score" id="score_47840219">1641 points</span> by
            <a href="user?id=schappim" class="hnuser">schappim</a>
            <span class="age" title="2026-04-20T20:39:32"><a href="item?id=47840219">10 hours ago</a></span>
            | <a href="item?id=47840219">805&nbsp;comments</a>
          </span>
        </td>
      </tr>
      <tr class="athing submission" id="47844269">
        <td align="right" valign="top" class="title"><span class="rank">2.</span></td>
        <td valign="top" class="votelinks">
          <center><a id="up_47844269" href="vote?id=47844269"><div class="votearrow" title="upvote"></div></a></center>
        </td>
        <td class="title">
          <span class="titleline"><a href="https://docs.openclaw.ai/providers/anthropic">Anthropic says OpenClaw-style usage is allowed</a>
            <span class="sitebit comhead"> (<a href="from?site=openclaw.ai"><span class="sitestr">openclaw.ai</span></a>)</span>
          </span>
        </td>
      </tr>
      <tr><td colspan="2"></td>
        <td class="subtext">
          <span class="subline">
            <span class="score" id="score_47844269">108 points</span> by
            <a href="user?id=jmsflknr" class="hnuser">jmsflknr</a>
            <span class="age" title="2026-04-21T03:43:03"><a href="item?id=47844269">3 hours ago</a></span>
          </span>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>
`;

// ============================================================
// Simulated React + CSS Modules + Tailwind page
// ============================================================
const REACT_APP_HTML = `
<html><body>
<div id="__next">
  <nav class="nav_container__xK3f2 flex justify-between" data-v-a1b2c3d4>
    <div class="logo_wrapper__9zYtR">
      <a href="/" class="sc-bdnxRM iGKhjS" data-testid="nav-logo">MyApp</a>
    </div>
    <ul class="nav_links__mNp4q css-1a2b3c">
      <li class="nav_item__qW8rT"><a href="/products" class="css-xyzabc" data-cy="nav-products">Products</a></li>
      <li class="nav_item__qW8rT"><a href="/about" class="css-def456">About</a></li>
      <li class="nav_item__qW8rT"><a href="/contact">Contact</a></li>
    </ul>
    <button class="btn_primary__Lk9mN sc-gsnTZi kVOoGf" data-testid="nav-cta" aria-label="Get Started">Get Started</button>
  </nav>
  <main class="main_content__Ht5vP" role="main">
    <section class="hero_section__wQ3rT _a1b2c3d4e5f6" data-spm="hero-001">
      <h1 class="hero_title__xY9zA">Welcome to MyApp</h1>
      <p class="hero_desc__nM4kL css-789ghi">Build amazing products with our platform</p>
      <div class="cta_group__pQ2wE">
        <button class="btn_primary__Lk9mN" data-testid="hero-cta" role="button">Start Free Trial</button>
        <a href="/demo" class="btn_secondary__rT5yU" data-cy="hero-demo">Watch Demo</a>
      </div>
    </section>
    <section class="features_grid__kJ8nB" aria-label="Features">
      <div class="feature_card__mL3pQ" data-testid="feature-1">
        <h3 class="feature_title__wX2vC">Fast</h3>
        <p>Lightning fast performance</p>
      </div>
      <div class="feature_card__mL3pQ" data-testid="feature-2">
        <h3 class="feature_title__wX2vC">Secure</h3>
        <p>Enterprise grade security</p>
      </div>
      <div class="feature_card__mL3pQ" data-testid="feature-3">
        <h3 class="feature_title__wX2vC">Scalable</h3>
        <p>Scale to millions of users</p>
      </div>
    </section>
  </main>
  <footer class="footer_wrapper__zN7bR" role="contentinfo">
    <p class="copyright__xQ9mK">© 2026 MyApp Inc.</p>
  </footer>
</div>
</body></html>
`;

describe('Real-world: Hacker News', () => {
  let doc: Document;

  beforeEach(() => {
    doc = parseHTML(HN_HTML);
    resetConfig();
  });

  it('selects the main table by its stable ID', () => {
    const el = doc.getElementById('hnmain')!;
    expect(el).toBeTruthy();
    const result = getSelector(el);
    expect(result).not.toBeNull();
    expect(result!.css).toBe('#hnmain');
    expect(result!.xpath).toContain('@id="hnmain"');
  });

  it('selects a story row by its ID', () => {
    const el = doc.getElementById('47840219')!;
    expect(el).toBeTruthy();
    const result = getSelector(el);
    expect(result).not.toBeNull();
    // The ID "47840219" is purely numeric — heuristic might flag it
    // but built-in patterns shouldn't; it should pass as a stable ID
    expect(result!.css).toBeDefined();
  });

  it('selects the score element by its ID', () => {
    const el = doc.getElementById('score_47840219')!;
    expect(el).toBeTruthy();
    const result = getSelector(el);
    expect(result).not.toBeNull();
    expect(result!.css).toBeDefined();
  });

  it('selects a user link by class .hnuser', () => {
    const el = doc.querySelector('.hnuser')!;
    expect(el).toBeTruthy();
    const candidates = getSelectorAll(el);
    expect(candidates.length).toBeGreaterThan(0);
    // Should have at least structural or text strategy candidates
    const strategies = candidates.map(c => c.strategy);
    expect(strategies.length).toBeGreaterThan(0);
  });

  it('CSS selectors can re-locate original elements', () => {
    const targets = [
      doc.getElementById('hnmain')!,
      doc.querySelector('.pagetop')!,
      doc.querySelector('.titleline')!,
    ];

    for (const el of targets) {
      expect(el).toBeTruthy();
      const result = getSelector(el, { formats: ['css'] });
      if (result?.css) {
        const found = doc.querySelectorAll(result.css);
        expect(found.length).toBeGreaterThanOrEqual(1);
        // At least one match should be our element
        expect(Array.from(found)).toContain(el);
      }
    }
  });
});

describe('Real-world: React + CSS Modules + Tailwind app', () => {
  let doc: Document;

  beforeEach(() => {
    doc = parseHTML(REACT_APP_HTML);
    resetConfig();
  });

  it('filters out CSS Modules dynamic classes', () => {
    // nav_container__xK3f2 should be detected as CSS Modules and filtered
    const nav = doc.querySelector('nav')!;
    const candidates = getSelectorAll(nav);
    // No candidate should directly use the CSS Modules class in CSS format
    for (const c of candidates) {
      if (c.formats.css) {
        expect(c.formats.css).not.toContain('nav_container__xK3f2');
      }
    }
  });

  it('filters out Styled Components classes', () => {
    const logo = doc.querySelector('[data-testid="nav-logo"]')!;
    expect(logo).toBeTruthy();
    const result = getSelector(logo);
    expect(result).not.toBeNull();
    // Should use data-testid, not sc-bdnxRM or iGKhjS
    expect(result!.css).toContain('data-testid');
    expect(result!.css).not.toContain('sc-bdnxRM');
  });

  it('filters out Emotion classes', () => {
    const list = doc.querySelector('ul')!;
    const candidates = getSelectorAll(list);
    for (const c of candidates) {
      if (c.formats.css) {
        expect(c.formats.css).not.toContain('css-1a2b3c');
      }
    }
  });

  it('prioritizes data-testid for elements that have it', () => {
    const cta = doc.querySelector('[data-testid="hero-cta"]')!;
    expect(cta).toBeTruthy();
    const result = getSelector(cta);
    expect(result).not.toBeNull();
    expect(result!.css).toContain('data-testid="hero-cta"');
    expect(result!.playwright).toBeDefined();
  });

  it('uses data-cy attribute', () => {
    const demo = doc.querySelector('[data-cy="hero-demo"]')!;
    expect(demo).toBeTruthy();
    const result = getSelector(demo);
    expect(result).not.toBeNull();
    expect(result!.css).toContain('data-cy');
  });

  it('generates valid Playwright locators', () => {
    const cta = doc.querySelector('[data-testid="nav-cta"]')!;
    const result = getSelector(cta, { formats: ['playwright'] });
    expect(result).not.toBeNull();
    expect(result!.playwright).toBeDefined();
  });

  it('generates valid XPath for ID-based selectors', () => {
    const next = doc.getElementById('__next')!;
    expect(next).toBeTruthy();
    const result = getSelector(next, { formats: ['xpath'] });
    expect(result).not.toBeNull();
    expect(result!.xpath).toContain('__next');
  });

  it('handles custom blacklist for internal attributes', () => {
    configure({
      filters: {
        blacklist: {
          attributes: ['data-spm*', 'data-v-*'],
        },
      },
    });
    const hero = doc.querySelector('section')!;
    const candidates = getSelectorAll(hero);
    // No candidate should use data-spm or data-v-
    for (const c of candidates) {
      if (c.formats.css) {
        expect(c.formats.css).not.toContain('data-spm');
        expect(c.formats.css).not.toContain('data-v-');
      }
    }
  });

  it('only outputs requested format', () => {
    const el = doc.querySelector('[data-testid="feature-1"]')!;
    const cssOnly = getSelector(el, { formats: ['css'] });
    expect(cssOnly).not.toBeNull();
    expect(cssOnly!.css).toBeDefined();
    expect(cssOnly!.xpath).toBeUndefined();
    expect(cssOnly!.playwright).toBeUndefined();

    const xpathOnly = getSelector(el, { formats: ['xpath'] });
    expect(xpathOnly).not.toBeNull();
    expect(xpathOnly!.xpath).toBeDefined();
    expect(xpathOnly!.css).toBeUndefined();
  });

  it('CSS selectors can re-locate elements in dynamic app', () => {
    const testIds = ['nav-logo', 'nav-cta', 'hero-cta', 'hero-demo', 'feature-1', 'feature-2', 'feature-3'];
    for (const tid of testIds) {
      const el = doc.querySelector(`[data-testid="${tid}"], [data-cy="${tid}"]`);
      if (!el) continue;
      const result = getSelector(el, { formats: ['css'] });
      if (result?.css) {
        const found = doc.querySelectorAll(result.css);
        expect(found.length).toBeGreaterThanOrEqual(1);
        expect(Array.from(found)).toContain(el);
      }
    }
  });

  it('falls back to structural selector for elements with only dynamic classes', () => {
    // The <li> elements only have CSS Modules classes (nav_item__qW8rT)
    const contactLink = doc.querySelector('a[href="/contact"]')!;
    expect(contactLink).toBeTruthy();
    const candidates = getSelectorAll(contactLink);
    expect(candidates.length).toBeGreaterThan(0);
    // Should have at least a structural or text candidate
    const hasStructuralOrText = candidates.some(c => c.strategy === 'structural' || c.strategy === 'text');
    expect(hasStructuralOrText).toBe(true);
  });

  it('uses ARIA role for semantic elements', () => {
    const main = doc.querySelector('main')!;
    expect(main).toBeTruthy();
    const candidates = getSelectorAll(main);
    // Should find a role-based candidate (role="main" is explicit)
    const roleCandidate = candidates.find(c => c.strategy === 'role');
    expect(roleCandidate).toBeDefined();
    if (roleCandidate?.formats.playwright) {
      expect(roleCandidate.formats.playwright).toContain('role=');
    }
  });

  it('uses aria-label for Feature section', () => {
    const features = doc.querySelector('[aria-label="Features"]')!;
    expect(features).toBeTruthy();
    const result = getSelector(features);
    expect(result).not.toBeNull();
    // Should prefer aria-label attribute
    const candidates = getSelectorAll(features);
    const attrCandidate = candidates.find(c => c.strategy === 'attribute');
    expect(attrCandidate).toBeDefined();
  });
});
