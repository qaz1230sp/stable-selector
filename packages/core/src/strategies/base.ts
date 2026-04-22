import { RawCandidate, StrategyType } from '../types';

export function escapeCSS(value: string): string {
  // Escape special CSS selector chars: . : [ ] > + ~ = ^ $ * | ( ) # / \
  return value.replace(/([.:#\[\]>+~=^$*|()\\/@])/g, '\\$1');
}

export function createCandidate(selector: string, strategy: StrategyType, stabilityHint: number): RawCandidate {
  return { selector, strategy, stabilityHint };
}
