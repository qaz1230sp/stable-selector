/**
 * stable-selector
 *
 * Generate unique, stable selectors for web elements
 * with smart dynamic attribute filtering.
 *
 * @packageDocumentation
 */

import type {
  StableSelectorConfig,
  SelectorFormat,
  SelectorResultFor,
  ScoredCandidate,
  CallOptions,
} from './types';
import { FilterEngine } from './filter';
import { StrategyPipeline } from './strategies';
import { ScorerEngine } from './scorer';
import { DEFAULT_WEIGHTS } from './scorer/weights';
import { formatCandidates } from './formatter';

// ----- Global Config -----

const DEFAULT_CONFIG: StableSelectorConfig = {
  filters: {
    heuristic: true,
    heuristicThreshold: 0.7,
  },
  priorities: ['id', 'attribute', 'structural', 'text', 'role'],
  formats: ['css', 'xpath', 'playwright'],
  maxDepth: 5,
  weights: { ...DEFAULT_WEIGHTS },
};

let globalConfig: StableSelectorConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the global settings for stable-selector.
 *
 * @example
 * ```ts
 * configure({
 *   filters: {
 *     blacklist: { classNames: ['ant-*', 'el-*'] },
 *     heuristic: true,
 *   },
 *   formats: ['css', 'playwright'],
 * });
 * ```
 */
export function configure(config: Partial<StableSelectorConfig>): void {
  const newFilters = config.filters ?? {};
  // Deep-merge blacklist within filters to prevent silent overwrites
  const existingBl = globalConfig.filters.blacklist;
  const newBl = newFilters.blacklist;
  let mergedBlacklist = existingBl;
  if (newBl !== undefined) {
    if (existingBl && !Array.isArray(existingBl) && !Array.isArray(newBl)) {
      // Both are BlacklistConfig — deep merge each category
      mergedBlacklist = {
        classNames: [...(existingBl.classNames ?? []), ...(newBl.classNames ?? [])],
        ids: [...(existingBl.ids ?? []), ...(newBl.ids ?? [])],
        attributes: [...(existingBl.attributes ?? []), ...(newBl.attributes ?? [])],
      };
    } else {
      // One or both are flat arrays — replace entirely
      mergedBlacklist = newBl;
    }
  }

  globalConfig = {
    ...globalConfig,
    ...config,
    filters: {
      ...globalConfig.filters,
      ...newFilters,
      blacklist: mergedBlacklist,
    },
    weights: {
      ...globalConfig.weights,
      ...(config.weights ?? {}),
    },
  };
}

/** Reset configuration to defaults */
export function resetConfig(): void {
  globalConfig = { ...DEFAULT_CONFIG };
}

/** Get a copy of current configuration */
export function getConfig(): StableSelectorConfig {
  return { ...globalConfig };
}

// ----- Core Pipeline -----

function buildPipeline(options?: CallOptions) {
  const formats = options?.formats ?? globalConfig.formats;
  let filter = new FilterEngine(globalConfig.filters);

  // Merge per-call blacklist
  if (options?.blacklist) {
    filter = filter.withBlacklist(options.blacklist);
  }

  const pipeline = new StrategyPipeline(
    filter,
    globalConfig.priorities,
    globalConfig.maxDepth,
  );

  const scorer = new ScorerEngine(globalConfig.weights);

  return { filter, pipeline, scorer, formats };
}

/**
 * Get the best selector for an element, output in all configured formats.
 *
 * @param element - The DOM element to generate a selector for
 * @param options - Per-call overrides (formats, additional blacklist)
 * @returns Selector result with requested formats, or null if no stable selector found
 *
 * @example
 * ```ts
 * const result = getSelector(element);
 * // => { css: '#user-card', xpath: '//*[@id="user-card"]', playwright: '#user-card' }
 *
 * const cssOnly = getSelector(element, { formats: ['css'] });
 * // => { css: '#user-card' }
 * ```
 */
export function getSelector<F extends SelectorFormat = SelectorFormat>(
  element: Element,
  options?: CallOptions & { formats?: F[] },
): SelectorResultFor<F> | null {
  const candidates = getSelectorAll(element, options);
  if (candidates.length === 0) return null;
  return candidates[0].formats as SelectorResultFor<F>;
}

/**
 * Get all candidate selectors for an element, scored and sorted.
 *
 * @param element - The DOM element to generate selectors for
 * @param options - Per-call overrides (formats, additional blacklist)
 * @returns Array of scored candidates sorted by total score (highest first)
 *
 * @example
 * ```ts
 * const candidates = getSelectorAll(element);
 * candidates.forEach(c => {
 *   console.log(`${c.strategy}: ${c.formats.css} (score: ${c.total})`);
 * });
 * ```
 */
export function getSelectorAll(
  element: Element,
  options?: CallOptions,
): ScoredCandidate[] {
  const { pipeline, scorer, formats } = buildPipeline(options);

  const root = element.ownerDocument ?? document;
  const rawCandidates = pipeline.generate(element, root);

  if (rawCandidates.length === 0) return [];

  const scored = scorer.score(rawCandidates, element, root);
  return formatCandidates(scored, formats);
}

// ----- Re-exports -----

export type {
  StableSelectorConfig,
  SelectorFormat,
  SelectorResult,
  SelectorResultFor,
  ScoredCandidate,
  CallOptions,
  BlacklistOption,
  BlacklistConfig,
  FilterConfig,
  FilterDetail,
  StrategyType,
  ScoringWeights,
  ScoreBreakdown,
  RawCandidate,
  SelectorStrategy,
} from './types';

export { FilterEngine } from './filter';
export { StrategyPipeline } from './strategies';
export { ScorerEngine } from './scorer';
export { formatCSS, formatXPath, formatPlaywright } from './formatter';
