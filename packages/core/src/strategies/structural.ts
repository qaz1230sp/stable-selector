import { SelectorStrategy, RawCandidate } from '../types';
import { FilterEngine } from '../filter';
import { escapeCSS, createCandidate } from './base';

export class StructuralStrategy implements SelectorStrategy {
  readonly name = 'structural' as const;
  private static MAX_DEPTH = 10;

  constructor(private filter: FilterEngine, _maxDepth: number = 5) {}

  generate(element: Element, root: Element | Document): RawCandidate[] {
    const queryRoot = 'querySelectorAll' in root ? root : (element.ownerDocument ?? document);

    // Phase 1: Build initial path up to maxDepth
    const allParts = this.buildFullPath(element, root);
    if (allParts.length === 0) return [];

    // Build target element variants from minimal to maximal specificity
    const targetVariants = this.buildPartVariants(element);
    const targetNthChild = this.getNthChildIndex(element);

    // Phase 2: Find shortest unique selector
    // Try each path length × each target variant × with/without nth-child
    for (let len = 1; len <= allParts.length; len++) {
      const ancestorParts = len > 1 ? allParts.slice(allParts.length - len, -1) : [];
      const prefix = ancestorParts.length > 0 ? ancestorParts.join(' > ') + ' > ' : '';

      for (const variant of targetVariants) {
        // Without nth-child
        const clean = prefix + variant;
        if (this.isUnique(clean, element, queryRoot)) {
          return [createCandidate(clean, 'structural', 0.5)];
        }

        // With nth-child on target
        if (targetNthChild > 0) {
          const withNth = prefix + variant + `:nth-of-type(${targetNthChild})`;
          if (this.isUnique(withNth, element, queryRoot)) {
            return [createCandidate(withNth, 'structural', 0.5)];
          }
        }
      }
    }

    // Phase 3: Full path with nth-child on all levels as last resort
    const enrichedParts = this.enrichWithNthChild(allParts, element, root);
    const enrichedSelector = enrichedParts.join(' > ');
    return [createCandidate(enrichedSelector, 'structural', 0.5)];
  }

  /** Check if a selector uniquely matches the target element */
  private isUnique(selector: string, element: Element, root: Element | Document | { querySelectorAll: Function }): boolean {
    try {
      const matches = (root as Document).querySelectorAll(selector);
      return matches.length === 1 && matches[0] === element;
    } catch {
      return false;
    }
  }

  /** Build progressively more specific selector variants for an element */
  private buildPartVariants(element: Element): string[] {
    const tag = element.tagName.toLowerCase();
    const stableClasses = this.filter.getStableClasses(element);
    const attrPart = this.getAttributeQualifier(element);
    const variants: string[] = [];

    // 1. tag + attribute only (e.g., button[role="tab"])
    if (attrPart) {
      variants.push(tag + attrPart);
    }

    // 2. tag + one class + attribute (e.g., button.ms-Button[role="tab"])
    for (let i = 0; i < Math.min(stableClasses.length, 3); i++) {
      const classStr = stableClasses.slice(0, i + 1).map(c => `.${escapeCSS(c)}`).join('');
      if (attrPart) {
        variants.push(tag + classStr + attrPart);
      }
      // Also without attribute
      variants.push(tag + classStr);
    }

    // 3. Full part (tag + up to 3 classes + attribute) — same as old buildPart
    const fullPart = this.buildPart(element);
    if (!variants.includes(fullPart)) {
      variants.push(fullPart);
    }

    // 4. Just the tag (least specific, for when ancestors provide enough context)
    if (!variants.includes(tag)) {
      variants.push(tag);
    }

    return variants;
  }

  /** Build selector parts for each ancestor up to MAX_DEPTH */
  private buildFullPath(element: Element, root: Element | Document): string[] {
    const parts: string[] = [];
    let current: Element | null = element;
    let depth = 0;

    while (current && current !== root && depth < StructuralStrategy.MAX_DEPTH) {
      const tag = current.tagName.toLowerCase();
      if (tag === 'html' || tag === 'body') break;

      const stableId = this.filter.getStableId(current);
      if (stableId) {
        if (/^[0-9]/.test(stableId)) {
          parts.unshift(`[id="${escapeCSS(stableId)}"]`);
        } else {
          parts.unshift(`#${escapeCSS(stableId)}`);
        }
        break; // ID is unique anchor
      }

      // Use aria-label/aria-labelledby on ancestors as anchor — but only if unique.
      let foundAnchor = false;
      for (const attrName of ['aria-label', 'aria-labelledby'] as const) {
        const attrVal = current.getAttribute(attrName);
        if (attrVal && attrVal.trim() && depth > 0) {
          // For aria-labelledby, verify the referenced ID is stable (not dynamic)
          if (attrName === 'aria-labelledby' && this.filter.isIdDynamic(attrVal)) continue;
          const anchorSelector = `${tag}[${attrName}="${escapeCSS(attrVal)}"]`;
          const doc = current.ownerDocument ?? document;
          try {
            const matches = doc.querySelectorAll(anchorSelector);
            if (matches.length === 1) {
              parts.unshift(anchorSelector);
              foundAnchor = true;
              break;
            }
          } catch { /* not valid selector, skip */ }
        }
      }
      if (foundAnchor) break;

      const part = this.buildPart(current);
      parts.unshift(part);
      current = current.parentElement;
      depth++;
    }

    return parts;
  }

  /** Build the selector part for a single element */
  private buildPart(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const stableClasses = this.filter.getStableClasses(element);
    let part = tag;

    // Add all stable classes (not just the first) for better specificity
    if (stableClasses.length > 0) {
      const classStr = stableClasses
        .slice(0, 3) // limit to 3 classes for readability
        .map(c => `.${escapeCSS(c)}`)
        .join('');
      part += classStr;
    }

    // Also add attribute qualifiers for extra specificity
    const attrPart = this.getAttributeQualifier(element);
    if (attrPart) {
      part += attrPart;
    }

    return part;
  }

  /** Re-process path parts, adding :nth-child where needed for disambiguation */
  private enrichWithNthChild(
    parts: string[],
    element: Element,
    _root: Element | Document,
  ): string[] {
    const enriched = [...parts];
    let current: Element | null = element;

    // Walk from target element backwards, matching parts array from end
    for (let i = enriched.length - 1; i >= 0 && current; i--) {
      const index = this.getNthChildIndex(current);
      if (index > 0) {
        enriched[i] += `:nth-of-type(${index})`;
      }
      current = current.parentElement;
    }

    return enriched;
  }

  /** Try to find meaningful attribute qualifiers for an element */
  private getAttributeQualifier(element: Element): string | null {
    const parts: string[] = [];

    const role = element.getAttribute('role');
    if (role && role.trim()) parts.push(`[role="${escapeCSS(role)}"]`);

    // Grid/table positional attributes — combine with role for uniqueness
    const rowIndex = element.getAttribute('aria-rowindex');
    if (rowIndex && rowIndex.trim()) parts.push(`[aria-rowindex="${escapeCSS(rowIndex)}"]`);
    const colIndex = element.getAttribute('aria-colindex');
    if (colIndex && colIndex.trim()) parts.push(`[aria-colindex="${escapeCSS(colIndex)}"]`);

    // Return early if we have role + positional (strong combination)
    if (parts.length >= 2) return parts.join('');

    const type = element.getAttribute('type');
    if (type && type.trim()) parts.push(`[type="${escapeCSS(type)}"]`);

    const name = element.getAttribute('name');
    if (name && name.trim()) parts.push(`[name="${escapeCSS(name)}"]`);

    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) parts.push(`[aria-label="${escapeCSS(ariaLabel)}"]`);

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy && ariaLabelledBy.trim() && !this.filter.isIdDynamic(ariaLabelledBy)) {
      parts.push(`[aria-labelledby="${escapeCSS(ariaLabelledBy)}"]`);
    }

    if (parts.length > 0) return parts.join('');

    // Automation/test attributes
    const automationKey = element.getAttribute('data-automation-key');
    if (automationKey && automationKey.trim()) return `[data-automation-key="${escapeCSS(automationKey)}"]`;
    const automationId = element.getAttribute('data-automationid');
    if (automationId && automationId.trim()) return `[data-automationid="${escapeCSS(automationId)}"]`;

    const stableAttrs = this.filter.getStableAttributes(element);
    for (const attr of stableAttrs) {
      if (attr.name.startsWith('data-') && attr.value && attr.value.trim()) {
        return `[${attr.name}="${escapeCSS(attr.value)}"]`;
      }
    }

    return null;
  }

  private getNthChildIndex(element: Element): number {
    const parent = element.parentElement;
    if (!parent) return 0;
    const siblings = Array.from(parent.children);
    const sameTag = siblings.filter(s => s.tagName === element.tagName);
    if (sameTag.length === 1) return 0;
    return sameTag.indexOf(element) + 1;
  }
}
