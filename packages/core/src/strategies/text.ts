import { SelectorStrategy, RawCandidate } from '../types';
import { createCandidate } from './base';

export class TextStrategy implements SelectorStrategy {
  readonly name = 'text' as const;
  private static MAX_TEXT_LENGTH = 50;

  generate(element: Element, _root: Element | Document): RawCandidate[] {
    // Only for elements that typically have direct text: button, a, label, h1-h6, span, p
    const tag = element.tagName.toLowerCase();
    const textTags = ['button', 'a', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'p', 'li', 'td', 'th'];
    if (!textTags.includes(tag)) return [];

    // Get direct text content (not nested children text)
    const text = this.getDirectText(element).trim();
    if (!text || text.length > TextStrategy.MAX_TEXT_LENGTH) return [];

    // Build selector: tag:has(text) — approximate with contains selector
    // CSS doesn't support text matching natively, so we use a pseudo approach
    // The formatter will convert this to appropriate format per output type
    const candidates: RawCandidate[] = [];

    // Use a special internal format that formatters will understand
    candidates.push(createCandidate(
      `__text__[tag="${tag}"][text="${text}"]`,
      'text',
      0.6
    ));

    return candidates;
  }

  private getDirectText(element: Element): string {
    let text = '';
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      }
    }
    return text;
  }
}
