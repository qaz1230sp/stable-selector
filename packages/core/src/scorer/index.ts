import { RawCandidate, ScoredCandidate, ScoringWeights, ScoreBreakdown } from '../types';
import { DEFAULT_WEIGHTS } from './weights';

export class ScorerEngine {
  constructor(private weights: ScoringWeights = DEFAULT_WEIGHTS) {}

  score(candidates: RawCandidate[], element: Element, root: Element | Document = document): ScoredCandidate[] {
    const scored: ScoredCandidate[] = [];

    for (const candidate of candidates) {
      const scores = this.computeScores(candidate, element, root);

      const total =
        scores.uniqueness * this.weights.uniqueness +
        scores.stability * this.weights.stability +
        scores.brevity * this.weights.brevity +
        scores.readability * this.weights.readability;

      scored.push({
        selector: candidate.selector,
        strategy: candidate.strategy,
        scores,
        total,
        formats: {}, // Formatters fill this in later
      });
    }

    return scored.sort((a, b) => b.total - a.total);
  }

  private computeScores(candidate: RawCandidate, element: Element, root: Element | Document): ScoreBreakdown {
    return {
      uniqueness: this.scoreUniqueness(candidate.selector, element, root),
      stability: candidate.stabilityHint,
      brevity: this.scoreBrevity(candidate.selector),
      readability: this.scoreReadability(candidate.selector, candidate.strategy),
    };
  }

  private scoreUniqueness(selector: string, element: Element, root: Element | Document): number {
    const queryRoot = 'querySelectorAll' in root ? root : (element.ownerDocument ?? document);

    // __role__ selectors: extract [role="X"] and verify via CSS attribute selector
    if (selector.startsWith('__role__')) {
      const roleMatch = selector.match(/\[role="([^"]+)"\]/);
      const nameMatch = selector.match(/\[name="([^"]+)"\]/);
      if (!roleMatch) return 0;
      try {
        let cssSelector = `[role="${roleMatch[1]}"]`;
        if (nameMatch) {
          cssSelector += `[aria-label="${nameMatch[1]}"]`;
        }
        const matches = queryRoot.querySelectorAll(cssSelector);
        if (matches.length === 1 && matches[0] === element) return 1.0;
        if (matches.length === 0) return 0;
        // Multiple matches — return fractional score based on match count
        const containsTarget = Array.from(matches).includes(element);
        if (!containsTarget) return 0;
        return Math.max(0.1, 1.0 / matches.length);
      } catch {
        return 0.3;
      }
    }

    // __text__ selectors: verify by finding elements with matching tag + text content
    if (selector.startsWith('__text__')) {
      const tagMatch = selector.match(/\[tag="([^"]+)"\]/);
      const textMatch = selector.match(/\[text="([^"]+)"\]/);
      if (!tagMatch || !textMatch) return 0;
      try {
        const tag = tagMatch[1];
        const text = textMatch[1];
        const elements = queryRoot.querySelectorAll(tag);
        let matchCount = 0;
        let containsTarget = false;
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          let directText = '';
          for (const node of Array.from(el.childNodes)) {
            if (node.nodeType === 3 /* TEXT_NODE */) {
              directText += node.textContent || '';
            }
          }
          if (directText.trim() === text) {
            matchCount++;
            if (el === element) containsTarget = true;
          }
        }
        if (matchCount === 1 && containsTarget) return 1.0;
        if (matchCount === 0 || !containsTarget) return 0;
        return Math.max(0.1, 1.0 / matchCount);
      } catch {
        return 0.3;
      }
    }

    try {
      const matches = queryRoot.querySelectorAll(selector);
      if (matches.length === 1 && matches[0] === element) return 1.0;
      if (matches.length === 0) return 0;
      // Multiple matches — return fractional score
      const containsTarget = Array.from(matches).includes(element);
      if (!containsTarget) return 0;
      return Math.max(0.1, 1.0 / matches.length);
    } catch {
      return 0;
    }
  }

  private scoreBrevity(selector: string): number {
    // Shorter selectors score higher. Linear: 10 chars = 1.0, 100+ chars = 0.1
    const len = selector.length;
    if (len <= 10) return 1.0;
    if (len >= 100) return 0.1;
    return Math.max(0.1, 1.0 - ((len - 10) * 0.9) / 90);
  }

  private scoreReadability(_selector: string, strategy: string): number {
    // Strategies with meaningful names score higher
    const strategyScores: Record<string, number> = {
      id: 0.9,
      attribute: 0.85,
      role: 0.8,
      text: 0.7,
      structural: 0.4,
    };
    return strategyScores[strategy] ?? 0.5;
  }
}

export { DEFAULT_WEIGHTS } from './weights';
