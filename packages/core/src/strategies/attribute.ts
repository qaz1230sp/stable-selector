import { SelectorStrategy, RawCandidate } from '../types';
import { FilterEngine } from '../filter';
import { escapeCSS, createCandidate } from './base';

export class AttributeStrategy implements SelectorStrategy {
  readonly name = 'attribute' as const;
  // Preferred attribute order for test attributes
  private static PREFERRED_ATTRS = ['data-testid', 'data-test-id', 'data-test', 'data-cy', 'data-qa'];

  constructor(private filter: FilterEngine) {}

  generate(element: Element, _root: Element | Document): RawCandidate[] {
    const candidates: RawCandidate[] = [];
    const stableAttrs = this.filter.getStableAttributes(element);

    // First try preferred test attributes (highest stability)
    for (const attr of AttributeStrategy.PREFERRED_ATTRS) {
      const found = stableAttrs.find(a => a.name === attr);
      if (found && found.value.trim()) {
        candidates.push(createCandidate(
          `[${attr}="${escapeCSS(found.value)}"]`, 'attribute', 0.9
        ));
      }
    }

    // Then try other stable data-* attributes (skip empty/whitespace values)
    for (const attr of stableAttrs) {
      if (attr.name.startsWith('data-') && !AttributeStrategy.PREFERRED_ATTRS.includes(attr.name)) {
        if (!attr.value.trim()) continue;
        candidates.push(createCandidate(
          `[${attr.name}="${escapeCSS(attr.value)}"]`, 'attribute', 0.8
        ));
      }
    }

    // Try aria-label (skip empty)
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) {
      candidates.push(createCandidate(
        `[aria-label="${escapeCSS(ariaLabel)}"]`, 'attribute', 0.75
      ));
    }

    return candidates;
  }
}
