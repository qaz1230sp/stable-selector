import {
  FilterConfig,
  FilterDetail,
  ResolvedFilterConfig,
  BlacklistOption,
  BlacklistPattern,
  BlacklistConfig,
} from '../types';
import { BUILT_IN_PATTERNS, STATE_CLASS_PATTERNS } from './built-in';
import { isLikelyDynamic } from './heuristic';

/** Framework-specific attribute prefixes to always exclude */
const FRAMEWORK_ATTR_PREFIXES = ['data-v-', '__react', '_ngcontent-', '_nghost-'];

/** Framework binding attributes — contain code/expressions, not stable for selectors */
const FRAMEWORK_BINDING_ATTRS = new Set([
  'data-bind',           // Knockout.js
  'data-ng-',            // AngularJS
  'ng-',                 // AngularJS directives
  'data-reactid',        // React (legacy)
  'data-tabster',        // Fluent UI tabster
  'data-focuszone-id',   // Fluent UI FocusZone
  'data-ktp-target',     // Fluent UI keytip
  'data-is-focusable',   // Fluent UI focusable marker
  'data-is-draggable',   // Fluent UI drag
  'data-selection-index', // Fluent UI selection
  'data-selection-toggle', // Fluent UI selection
  'data-selection-touch-invoke', // Fluent UI selection
  'data-list-index',     // Fluent UI List index (changes with virtualization)
  'data-item-index',     // Fluent UI item index
]);

/** Attributes that are never considered stable */
const EXCLUDED_ATTRS = new Set(['class', 'id', 'style']);

function normalizeBlacklist(opt?: BlacklistOption): BlacklistConfig {
  if (!opt) return {};
  if (Array.isArray(opt)) {
    return { classNames: opt, ids: opt, attributes: opt };
  }
  return opt;
}

function matchesBlacklistPattern(value: string, pattern: BlacklistPattern): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(value);
  }
  // Glob: trailing * means prefix match
  if (pattern.endsWith('*')) {
    return value.startsWith(pattern.slice(0, -1));
  }
  // Exact match
  return value === pattern;
}

function matchesAnyPattern(value: string, patterns: BlacklistPattern[]): boolean {
  return patterns.some((p) => matchesBlacklistPattern(value, p));
}

export class FilterEngine {
  private config: ResolvedFilterConfig;

  constructor(filterConfig?: FilterConfig) {
    this.config = this.resolveConfig(filterConfig);
  }

  /** Resolve and normalize the filter configuration */
  private resolveConfig(config?: FilterConfig): ResolvedFilterConfig {
    const bl = normalizeBlacklist(config?.blacklist);
    return {
      builtInPatterns: BUILT_IN_PATTERNS,
      userPatterns: config?.patterns ?? [],
      whitelist: new Set(config?.whitelist ?? []),
      blacklist: {
        classNames: bl.classNames ?? [],
        ids: bl.ids ?? [],
        attributes: bl.attributes ?? [],
      },
      heuristic: config?.heuristic ?? true,
      heuristicThreshold: config?.heuristicThreshold ?? 0.7,
    };
  }

  /** Check if a class name should be filtered out */
  isClassDynamic(className: string): boolean {
    if (this.config.whitelist.has(className)) return false;
    if (matchesAnyPattern(className, this.config.blacklist.classNames)) return true;
    if (this.config.builtInPatterns.some((p) => p.test(className))) return true;
    if (STATE_CLASS_PATTERNS.some((p) => p.test(className))) return true;
    if (this.config.userPatterns.some((p) => p.test(className))) return true;
    if (this.config.heuristic && isLikelyDynamic(className, this.config.heuristicThreshold)) {
      return true;
    }
    return false;
  }

  /** Check if an ID should be filtered out */
  isIdDynamic(id: string): boolean {
    if (this.config.whitelist.has(id)) return false;
    if (matchesAnyPattern(id, this.config.blacklist.ids)) return true;
    if (this.config.builtInPatterns.some((p) => p.test(id))) return true;
    if (this.config.userPatterns.some((p) => p.test(id))) return true;
    if (this.config.heuristic && isLikelyDynamic(id, this.config.heuristicThreshold)) {
      return true;
    }
    return false;
  }

  /** Check if an attribute name should be filtered out */
  isAttributeDynamic(attrName: string): boolean {
    if (this.config.whitelist.has(attrName)) return false;
    if (matchesAnyPattern(attrName, this.config.blacklist.attributes)) return true;
    if (this.config.builtInPatterns.some((p) => p.test(attrName))) return true;
    if (this.config.userPatterns.some((p) => p.test(attrName))) return true;
    if (this.config.heuristic && isLikelyDynamic(attrName, this.config.heuristicThreshold)) {
      return true;
    }
    return false;
  }

  /** Get stable classes for an element (filter out dynamic ones) */
  getStableClasses(element: Element): string[] {
    const raw = element.className;
    if (!raw || typeof raw !== 'string') return [];
    return raw
      .split(/\s+/)
      .filter((c) => c.length > 0)
      .filter((c) => !this.isClassDynamic(c));
  }

  /** Get stable ID for an element (or null if dynamic) */
  getStableId(element: Element): string | null {
    const id = element.id;
    if (!id) return null;
    return this.isIdDynamic(id) ? null : id;
  }

  /** Get stable attributes (excluding class, id, style, and framework-specific) */
  getStableAttributes(element: Element): Array<{ name: string; value: string }> {
    const result: Array<{ name: string; value: string }> = [];
    const attrs = element.attributes;
    if (!attrs) return result;

    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      const name = attr.name;

      if (EXCLUDED_ATTRS.has(name)) continue;
      if (FRAMEWORK_ATTR_PREFIXES.some((prefix) => name.startsWith(prefix))) continue;
      if (FRAMEWORK_BINDING_ATTRS.has(name)) continue;
      // Check whitelist first — whitelisted attribute names always pass
      if (!this.config.whitelist.has(name)) {
        // For attribute names, check blacklist and built-in patterns, NOT heuristic.
        // Attribute names like "data-testid" are well-known stable names.
        if (matchesAnyPattern(name, this.config.blacklist.attributes)) continue;
        if (this.config.builtInPatterns.some((p) => p.test(name))) continue;
        if (this.config.userPatterns.some((p) => p.test(name))) continue;
      }

      result.push({ name, value: attr.value });
    }

    return result;
  }

  /** Classify a single value against the filter chain */
  private classifyValue(
    value: string,
    type: FilterDetail['type'],
    blacklistPatterns: BlacklistPattern[],
  ): FilterDetail {
    if (this.config.whitelist.has(value)) {
      return { value, type, status: 'kept' };
    }
    if (matchesAnyPattern(value, blacklistPatterns)) {
      return { value, type, status: 'filtered', reason: 'blacklist' };
    }
    if (this.config.builtInPatterns.some((p) => p.test(value))) {
      return { value, type, status: 'filtered', reason: 'built-in' };
    }
    if (type === 'class' && STATE_CLASS_PATTERNS.some((p) => p.test(value))) {
      return { value, type, status: 'filtered', reason: 'state-class' };
    }
    if (this.config.userPatterns.some((p) => p.test(value))) {
      return { value, type, status: 'filtered', reason: 'user-pattern' };
    }
    if (this.config.heuristic && isLikelyDynamic(value, this.config.heuristicThreshold)) {
      return { value, type, status: 'filtered', reason: 'heuristic' };
    }
    return { value, type, status: 'kept' };
  }

  /** Get detailed filtering results for all attributes of an element (for debugging/extension UI) */
  getFilterDetails(element: Element): FilterDetail[] {
    const details: FilterDetail[] = [];

    // Check ID
    const id = element.id;
    if (id) {
      details.push(this.classifyValue(id, 'id', this.config.blacklist.ids));
    }

    // Check classes
    const className = element.className;
    if (className && typeof className === 'string') {
      const classes = className.split(/\s+/).filter((c) => c.length > 0);
      for (const cls of classes) {
        details.push(this.classifyValue(cls, 'class', this.config.blacklist.classNames));
      }
    }

    // Check attributes (excluding class, id, style)
    const attrs = element.attributes;
    if (attrs) {
      for (let i = 0; i < attrs.length; i++) {
        const name = attrs[i].name;
        if (EXCLUDED_ATTRS.has(name)) continue;
        if (FRAMEWORK_ATTR_PREFIXES.some((prefix) => name.startsWith(prefix))) {
          details.push({ value: name, type: 'attribute', status: 'filtered', reason: 'framework-prefix' });
        } else if (FRAMEWORK_BINDING_ATTRS.has(name)) {
          details.push({ value: name, type: 'attribute', status: 'filtered', reason: 'framework-prefix' });
        } else if (this.config.whitelist.has(name)) {
          details.push({ value: name, type: 'attribute', status: 'kept' });
        } else if (matchesAnyPattern(name, this.config.blacklist.attributes)) {
          details.push({ value: name, type: 'attribute', status: 'filtered', reason: 'blacklist' });
        } else if (this.config.builtInPatterns.some((p) => p.test(name))) {
          details.push({ value: name, type: 'attribute', status: 'filtered', reason: 'built-in' });
        } else if (this.config.userPatterns.some((p) => p.test(name))) {
          details.push({ value: name, type: 'attribute', status: 'filtered', reason: 'user-pattern' });
        } else {
          details.push({ value: name, type: 'attribute', status: 'kept' });
        }
      }
    }

    return details;
  }

  /** Merge additional blacklist from per-call options */
  withBlacklist(additional: BlacklistOption): FilterEngine {
    const addBl = normalizeBlacklist(additional);
    const merged: FilterConfig = {
      patterns: [...this.config.userPatterns],
      whitelist: [...this.config.whitelist],
      blacklist: {
        classNames: [
          ...this.config.blacklist.classNames,
          ...(addBl.classNames ?? []),
        ],
        ids: [...this.config.blacklist.ids, ...(addBl.ids ?? [])],
        attributes: [
          ...this.config.blacklist.attributes,
          ...(addBl.attributes ?? []),
        ],
      },
      heuristic: this.config.heuristic,
      heuristicThreshold: this.config.heuristicThreshold,
    };
    return new FilterEngine(merged);
  }
}
