# API Reference

## Functions

### `getSelector<F>(element, options?)`

Get the best selector for a DOM element.

```ts
function getSelector<F extends SelectorFormat = SelectorFormat>(
  element: Element,
  options?: CallOptions,
): SelectorResultFor<F> | null;
```

**Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `element` | `Element` | The DOM element to generate a selector for. |
| `options` | `CallOptions` | _(optional)_ Per-call overrides for formats and blacklist. |

**Returns:** `SelectorResultFor<F> | null` — An object containing selectors keyed by format, or `null` if no stable selector was found.

**Example:**

```ts
import { getSelector } from 'stable-selector';

// All formats
const result = getSelector(element);
// => { css: '#submit-btn', xpath: '//*[@id="submit-btn"]', playwright: '#submit-btn' }

// Type-safe single format
const cssResult = getSelector<'css'>(element);
// cssResult.css is guaranteed; cssResult.xpath is optional
```

---

### `getSelectorAll(element, options?)`

Get all candidate selectors for a DOM element, scored and sorted by total score (descending).

```ts
function getSelectorAll(
  element: Element,
  options?: CallOptions,
): ScoredCandidate[];
```

**Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `element` | `Element` | The DOM element to generate selectors for. |
| `options` | `CallOptions` | _(optional)_ Per-call overrides for formats and blacklist. |

**Returns:** `ScoredCandidate[]` — All candidate selectors sorted by descending total score.

**Example:**

```ts
import { getSelectorAll } from 'stable-selector';

const candidates = getSelectorAll(element);
for (const c of candidates) {
  console.log(c.selector, c.strategy, c.total, c.formats);
}
```

---

### `configure(config)`

Set global configuration. Values are deep-merged with the current configuration.

```ts
function configure(config: Partial<StableSelectorConfig>): void;
```

**Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `config` | `Partial<StableSelectorConfig>` | Configuration object to merge into the current settings. Blacklist entries are accumulated, not replaced. |

**Example:**

```ts
import { configure } from 'stable-selector';

configure({
  formats: ['css'],
  maxDepth: 3,
  filters: {
    blacklist: { classNames: ['css-*'] },
  },
});
```

---

### `resetConfig()`

Reset the global configuration to factory defaults.

```ts
function resetConfig(): void;
```

**Example:**

```ts
import { resetConfig } from 'stable-selector';
resetConfig();
```

---

### `getConfig()`

Get a deep copy of the current global configuration.

```ts
function getConfig(): StableSelectorConfig;
```

**Returns:** `StableSelectorConfig` — A copy of the active configuration.

**Example:**

```ts
import { getConfig } from 'stable-selector';
const config = getConfig();
console.log(config.formats); // ['css', 'xpath', 'playwright']
```

---

## Types

### `SelectorFormat`

```ts
type SelectorFormat = 'css' | 'xpath' | 'playwright';
```

The output formats supported by the library.

---

### `StrategyType`

```ts
type StrategyType = 'id' | 'attribute' | 'structural' | 'text' | 'role';
```

The five built-in selector generation strategies.

---

### `BlacklistPattern`

```ts
type BlacklistPattern = string | RegExp;
```

A single pattern for matching names. Strings support glob syntax (`*` wildcard).

---

### `BlacklistConfig`

```ts
interface BlacklistConfig {
  classNames?: BlacklistPattern[];
  ids?: BlacklistPattern[];
  attributes?: BlacklistPattern[];
}
```

Grouped blacklist targeting specific name categories.

---

### `BlacklistOption`

```ts
type BlacklistOption = BlacklistPattern[] | BlacklistConfig;
```

Accepts either a flat array (applies to all categories) or a grouped `BlacklistConfig`.

---

### `FilterConfig`

```ts
interface FilterConfig {
  patterns?: BlacklistPattern[];
  whitelist?: BlacklistPattern[];
  blacklist?: BlacklistOption;
  heuristic?: boolean;
  heuristicThreshold?: number;
}
```

Configuration for the filter engine.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `patterns` | `BlacklistPattern[]` | Built-in patterns for 10+ frameworks | Additional filter patterns. |
| `whitelist` | `BlacklistPattern[]` | `[]` | Patterns that override the blacklist—matching names are always kept. |
| `blacklist` | `BlacklistOption` | `{}` | User-defined blacklist (flat array or grouped config). |
| `heuristic` | `boolean` | `true` | Enable Shannon entropy heuristic for detecting generated names. |
| `heuristicThreshold` | `number` | `0.7` | Entropy threshold (0–1). Lower values are stricter. |

---

### `ScoringWeights`

```ts
interface ScoringWeights {
  uniqueness: number;
  stability: number;
  brevity: number;
  readability: number;
}
```

Weights used to compute the final score. Must sum to 1.

**Defaults:** `uniqueness: 0.4`, `stability: 0.35`, `brevity: 0.15`, `readability: 0.1`

---

### `ScoreBreakdown`

```ts
interface ScoreBreakdown {
  uniqueness: number;
  stability: number;
  brevity: number;
  readability: number;
}
```

Per-dimension scores (each 0–1) for a single candidate.

---

### `SelectorResult`

```ts
interface SelectorResult {
  css?: string;
  xpath?: string;
  playwright?: string;
}
```

A selector result with optional keys for each format.

---

### `SelectorResultFor<F>`

```ts
type SelectorResultFor<F extends SelectorFormat> = Required<Pick<SelectorResult, F>> &
  Partial<Omit<SelectorResult, F>>;
```

A selector result where keys in `F` are **guaranteed** to exist and the rest are optional. This enables type-safe access when you request specific formats.

**Example:**

```ts
const result = getSelector<'css'>(element);
if (result) {
  result.css;        // string (guaranteed)
  result.xpath;      // string | undefined
  result.playwright; // string | undefined
}
```

---

### `ScoredCandidate`

```ts
interface ScoredCandidate {
  selector: string;
  strategy: StrategyType;
  scores: ScoreBreakdown;
  total: number;
  formats: SelectorResult;
}
```

A fully scored candidate selector with per-dimension scores, weighted total, and formatted output.

---

### `CallOptions`

```ts
interface CallOptions {
  formats?: SelectorFormat[];
  blacklist?: BlacklistOption;
}
```

Per-call overrides passed to `getSelector` or `getSelectorAll`.

| Property | Type | Description |
| --- | --- | --- |
| `formats` | `SelectorFormat[]` | Override the global format list for this call. |
| `blacklist` | `BlacklistOption` | Additional blacklist entries for this call only. |

---

### `StableSelectorConfig`

```ts
interface StableSelectorConfig {
  filters: FilterConfig;
  priorities: StrategyType[];
  formats: SelectorFormat[];
  maxDepth: number;
  weights: ScoringWeights;
}
```

The full global configuration object.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `filters` | `FilterConfig` | See `FilterConfig` | Filter engine settings. |
| `priorities` | `StrategyType[]` | `['id', 'attribute', 'structural', 'text', 'role']` | Strategy execution order. |
| `formats` | `SelectorFormat[]` | `['css', 'xpath', 'playwright']` | Output formats to generate. |
| `maxDepth` | `number` | `5` | Maximum ancestor traversal depth. |
| `weights` | `ScoringWeights` | See `ScoringWeights` | Scoring weights. |

---

### `RawCandidate`

```ts
interface RawCandidate {
  selector: string;
  strategy: StrategyType;
  stabilityHint: number;
}
```

An unscored candidate produced by a strategy before scoring.

---

### `SelectorStrategy`

```ts
interface SelectorStrategy {
  name: StrategyType;
  generate(element: Element, root: Element | Document): RawCandidate[];
}
```

Interface for implementing custom selector strategies.

---

## Classes

### `FilterEngine`

Filters candidate names using three layers: built-in patterns (covering 10+ CSS-in-JS and UI frameworks), Shannon entropy heuristic, and user-defined blacklist/whitelist.

```ts
class FilterEngine {
  constructor(config: FilterConfig);
  isStable(name: string): boolean;
}
```

**Example:**

```ts
import { FilterEngine } from 'stable-selector';

const filter = new FilterEngine({
  blacklist: { classNames: ['css-*'] },
  whitelist: ['data-testid'],
  heuristic: true,
  heuristicThreshold: 0.7,
});

filter.isStable('nav-header');  // true
filter.isStable('css-1a2b3c');  // false
```

---

### `StrategyPipeline`

Runs selector generation strategies in priority order, producing raw candidates.

```ts
class StrategyPipeline {
  constructor(priorities: StrategyType[]);
  run(element: Element, root: Element | Document): RawCandidate[];
}
```

---

### `ScorerEngine`

Scores raw candidates across four dimensions (uniqueness, stability, brevity, readability) and computes a weighted total.

```ts
class ScorerEngine {
  constructor(weights: ScoringWeights);
  score(candidates: RawCandidate[], element: Element): ScoredCandidate[];
}
```

---

## Formatters

### `formatCSS(selector: string): string`

Format a raw selector string as a CSS selector.

### `formatXPath(selector: string): string`

Format a raw selector string as an XPath expression.

### `formatPlaywright(selector: string): string`

Format a raw selector string as a Playwright locator.

**Example:**

```ts
import { formatCSS, formatXPath, formatPlaywright } from 'stable-selector';

formatCSS('submit-btn');       // '#submit-btn'
formatXPath('submit-btn');     // '//*[@id="submit-btn"]'
formatPlaywright('submit-btn'); // '#submit-btn'
```
