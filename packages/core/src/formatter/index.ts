import { SelectorFormat, SelectorResult, ScoredCandidate } from '../types';
import { formatCSS } from './css';
import { formatXPath } from './xpath';
import { formatPlaywright } from './playwright';

type FormatterFn = (selector: string) => string | null;

const FORMATTERS: Record<SelectorFormat, FormatterFn> = {
  css: formatCSS,
  xpath: formatXPath,
  playwright: formatPlaywright,
};

export function formatCandidate(
  candidate: ScoredCandidate,
  formats: SelectorFormat[] = ['css', 'xpath', 'playwright'],
): SelectorResult {
  const result: SelectorResult = {};
  for (const format of formats) {
    const fn = FORMATTERS[format];
    if (fn) {
      const formatted = fn(candidate.selector);
      if (formatted) {
        result[format] = formatted;
      }
    }
  }
  return result;
}

export function formatCandidates(
  candidates: ScoredCandidate[],
  formats: SelectorFormat[] = ['css', 'xpath', 'playwright'],
): ScoredCandidate[] {
  return candidates.map(c => ({
    ...c,
    formats: formatCandidate(c, formats),
  }));
}

export { formatCSS } from './css';
export { formatXPath } from './xpath';
export { formatPlaywright } from './playwright';
