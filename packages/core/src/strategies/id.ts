import { SelectorStrategy, RawCandidate } from '../types';
import { FilterEngine } from '../filter';
import { escapeCSS, createCandidate } from './base';

export class IdStrategy implements SelectorStrategy {
  readonly name = 'id' as const;
  constructor(private filter: FilterEngine) {}

  generate(element: Element, _root: Element | Document): RawCandidate[] {
    const id = this.filter.getStableId(element);
    if (!id) return [];
    // Use attribute selector for IDs starting with a digit (CSS #id syntax doesn't allow leading digits reliably)
    if (/^[0-9]/.test(id)) {
      return [createCandidate(`[id="${escapeCSS(id)}"]`, 'id', 0.95)];
    }
    return [createCandidate(`#${escapeCSS(id)}`, 'id', 0.95)];
  }
}
