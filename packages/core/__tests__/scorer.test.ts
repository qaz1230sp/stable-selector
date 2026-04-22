import { describe, it, expect, afterEach } from 'vitest';
import { ScorerEngine } from '../src/scorer';
import type { RawCandidate } from '../src/types';

afterEach(() => {
  document.body.innerHTML = '';
});

function makeCandidate(selector: string, strategy: string, stabilityHint: number): RawCandidate {
  return { selector, strategy: strategy as any, stabilityHint };
}

describe('ScorerEngine', () => {
  describe('uniqueness scoring', () => {
    it('unique selector scores 1.0 uniqueness', () => {
      document.body.innerHTML = '<div id="unique-el"></div>';
      const el = document.querySelector('#unique-el')!;
      const scorer = new ScorerEngine();
      const scored = scorer.score(
        [makeCandidate('#unique-el', 'id', 0.95)],
        el,
        document,
      );
      expect(scored).toHaveLength(1);
      expect(scored[0].scores.uniqueness).toBe(1.0);
    });

    it('non-unique selector gets fractional uniqueness score', () => {
      document.body.innerHTML = '<div class="item"></div><div class="item"></div>';
      const el = document.querySelector('.item')!;
      const scorer = new ScorerEngine();
      const scored = scorer.score(
        [makeCandidate('.item', 'attribute', 0.8)],
        el,
        document,
      );
      // Non-unique but still included with fractional score
      expect(scored).toHaveLength(1);
      expect(scored[0].scores.uniqueness).toBe(0.5); // 1/2 matches
    });
  });

  describe('brevity scoring', () => {
    it('short selectors score higher than long ones', () => {
      document.body.innerHTML = '<div id="a"></div>';
      const el = document.querySelector('#a')!;
      const scorer = new ScorerEngine();

      const short = makeCandidate('#a', 'id', 0.9);
      const long = makeCandidate(
        'div > div > div > section > article > span.very-long-selector-chain',
        'structural',
        0.5,
      );

      const scored = scorer.score([short, long], el, document);
      // #a should be present and have higher brevity
      const shortResult = scored.find((s) => s.selector === '#a');
      expect(shortResult).toBeDefined();
      expect(shortResult!.scores.brevity).toBe(1.0); // length <= 10
    });
  });

  describe('readability scoring', () => {
    it('id strategy scores higher readability than structural', () => {
      document.body.innerHTML = '<div id="card"><span></span></div>';
      const el = document.querySelector('#card')!;
      const scorer = new ScorerEngine();

      const idCandidate = makeCandidate('#card', 'id', 0.95);
      const structCandidate = makeCandidate('div:nth-child(1)', 'structural', 0.5);

      const scored = scorer.score([idCandidate, structCandidate], el, document);
      const idResult = scored.find((s) => s.strategy === 'id');
      const structResult = scored.find((s) => s.strategy === 'structural');

      if (idResult && structResult) {
        expect(idResult.scores.readability).toBeGreaterThan(structResult.scores.readability);
      }
    });
  });

  describe('sorting', () => {
    it('candidates are sorted by total score descending', () => {
      document.body.innerHTML =
        '<div id="main"><span data-testid="label">Hello</span></div>';
      const el = document.querySelector('[data-testid="label"]')!;
      const scorer = new ScorerEngine();
      const candidates = [
        makeCandidate('[data-testid="label"]', 'attribute', 0.9),
        makeCandidate('#main > span', 'structural', 0.5),
      ];
      const scored = scorer.score(candidates, el, document);
      for (let i = 1; i < scored.length; i++) {
        expect(scored[i - 1].total).toBeGreaterThanOrEqual(scored[i].total);
      }
    });
  });

  describe('special selectors', () => {
    it('__text__ and __role__ selectors are verified for real uniqueness', () => {
      document.body.innerHTML = '<button>Submit</button>';
      const el = document.querySelector('button')!;
      const scorer = new ScorerEngine();
      const candidates = [
        makeCandidate('__text__[tag="button"][text="Submit"]', 'text', 0.6),
      ];
      const scored = scorer.score(candidates, el, document);
      const textCandidate = scored.find(s => s.strategy === 'text');
      expect(textCandidate).toBeDefined();
      expect(textCandidate!.scores.uniqueness).toBe(1.0);
    });

    it('__role__ with explicit role attribute gets uniqueness 1.0', () => {
      document.body.innerHTML = '<div role="alert">Error</div>';
      const el = document.querySelector('[role="alert"]')!;
      const scorer = new ScorerEngine();
      const candidates = [
        makeCandidate('__role__[role="alert"]', 'role', 0.55),
      ];
      const scored = scorer.score(candidates, el, document);
      expect(scored[0].scores.uniqueness).toBe(1.0);
    });

    it('non-unique __text__ selectors get fractional uniqueness', () => {
      document.body.innerHTML = '<button>OK</button><button>OK</button>';
      const el = document.querySelector('button')!;
      const scorer = new ScorerEngine();
      const candidates = [
        makeCandidate('__text__[tag="button"][text="OK"]', 'text', 0.6),
      ];
      const scored = scorer.score(candidates, el, document);
      // Two buttons with same text — still included but with low uniqueness
      expect(scored.length).toBe(1);
      expect(scored[0].scores.uniqueness).toBe(0.5);
    });

    it('non-unique __role__ selectors get fractional uniqueness', () => {
      document.body.innerHTML = '<div role="alert">Err1</div><div role="alert">Err2</div>';
      const el = document.querySelector('[role="alert"]')!;
      const scorer = new ScorerEngine();
      const candidates = [
        makeCandidate('__role__[role="alert"]', 'role', 0.55),
      ];
      const scored = scorer.score(candidates, el, document);
      // Two role="alert" elements — still included but with low uniqueness
      expect(scored.length).toBe(1);
      expect(scored[0].scores.uniqueness).toBe(0.5);
    });
  });
});
