// ============================================================
// stable-selector — Type Definitions
// ============================================================

/** Supported output formats */
export type SelectorFormat = 'css' | 'xpath' | 'playwright';

/** Strategy types in priority order */
export type StrategyType = 'id' | 'attribute' | 'structural' | 'text' | 'role';

// ----- Blacklist / Filter Config -----

/** A blacklist pattern: glob-style string (supports `*`) or RegExp */
export type BlacklistPattern = string | RegExp;

/** Grouped blacklist — per attribute type */
export interface BlacklistConfig {
  classNames?: BlacklistPattern[];
  ids?: BlacklistPattern[];
  attributes?: BlacklistPattern[];
}

/** Blacklist accepts either a flat array (applies to all types) or grouped config */
export type BlacklistOption = BlacklistPattern[] | BlacklistConfig;

export interface FilterConfig {
  /** Additional regex patterns to detect dynamic attributes */
  patterns?: RegExp[];
  /** Values that should always be kept, even if matched by other rules */
  whitelist?: string[];
  /** Values that should always be excluded */
  blacklist?: BlacklistOption;
  /** Enable heuristic (entropy-based) detection. Default: true */
  heuristic?: boolean;
  /** Shannon entropy threshold for heuristic detection. Default: 0.7 */
  heuristicThreshold?: number;
}

// ----- Scoring -----

export interface ScoringWeights {
  uniqueness: number;
  stability: number;
  brevity: number;
  readability: number;
}

export interface ScoreBreakdown {
  uniqueness: number;
  stability: number;
  brevity: number;
  readability: number;
}

// ----- Selector Result -----

/** Base result type — all format keys optional (used internally) */
export type SelectorResult = {
  [K in SelectorFormat]?: string;
};

/**
 * Conditional result type — selected format keys are guaranteed present.
 * When calling getSelector/getSelectorAll with specific formats,
 * those keys are required in the result.
 */
export type SelectorResultFor<F extends SelectorFormat = SelectorFormat> = {
  [K in F]: string;
} & {
  [K in Exclude<SelectorFormat, F>]?: string;
};

export interface ScoredCandidate {
  /** Internal selector representation (CSS-like) */
  selector: string;
  /** Which strategy generated this candidate */
  strategy: StrategyType;
  /** Individual dimension scores (0–1) */
  scores: ScoreBreakdown;
  /** Weighted total score (0–1) */
  total: number;
  /** Formatted output in requested formats */
  formats: SelectorResult;
}

// ----- Per-call Options -----

export interface CallOptions {
  /** Override output formats for this call */
  formats?: SelectorFormat[];
  /** Additional blacklist entries (merged with global config) */
  blacklist?: BlacklistOption;
}

// ----- Global Config -----

export interface StableSelectorConfig {
  filters: FilterConfig;
  /** Strategy priority order (first = highest priority) */
  priorities: StrategyType[];
  /** Which formats to output. Default: all three */
  formats: SelectorFormat[];
  /** Maximum DOM depth to traverse when building structural selectors */
  maxDepth: number;
  /** Scoring weights (must sum to 1.0) */
  weights: ScoringWeights;
}

// ----- Strategy Interface -----

/** A single selector candidate produced by a strategy (before scoring) */
export interface RawCandidate {
  /** CSS selector string */
  selector: string;
  /** Which strategy produced it */
  strategy: StrategyType;
  /** Base stability score hint from the strategy (0–1) */
  stabilityHint: number;
}

/** Interface that all strategies must implement */
export interface SelectorStrategy {
  readonly name: StrategyType;
  /** Generate candidate selectors for the given element */
  generate(element: Element, root: Element | Document): RawCandidate[];
}

// ----- Filter Interface -----

export interface AttributeInfo {
  name: string;
  value: string;
}

export interface FilterResult {
  /** Whether this attribute/class/id should be excluded */
  isDynamic: boolean;
  /** Which filter rule matched (for debugging) */
  matchedRule?: string;
}

/** Resolved (normalized) filter configuration used at runtime */
export interface ResolvedFilterConfig {
  builtInPatterns: RegExp[];
  userPatterns: RegExp[];
  whitelist: Set<string>;
  blacklist: {
    classNames: BlacklistPattern[];
    ids: BlacklistPattern[];
    attributes: BlacklistPattern[];
  };
  heuristic: boolean;
  heuristicThreshold: number;
}

// ----- Filter Detail (debugging / extension UI) -----

export interface FilterDetail {
  /** The value being checked (class name, ID, or attribute name) */
  value: string;
  /** What type of value this is */
  type: 'class' | 'id' | 'attribute';
  /** Whether it was kept or filtered out */
  status: 'kept' | 'filtered';
  /** Why it was filtered (only present when status is 'filtered') */
  reason?: 'blacklist' | 'built-in' | 'user-pattern' | 'heuristic' | 'framework-prefix' | 'state-class';
}
