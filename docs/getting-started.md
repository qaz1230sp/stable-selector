# Getting Started

## Installation

```bash
# npm
npm install @stable-selector/core

# pnpm
pnpm add @stable-selector/core

# yarn
yarn add @stable-selector/core
```

## Basic Usage

### Generate a Selector

Use `getSelector` to get the best selector for a DOM element:

```ts
import { getSelector } from '@stable-selector/core';

const element = document.querySelector('.my-button');

// Get the best selector in all formats (CSS, XPath, Playwright)
const result = getSelector(element);
// => { css: '#submit-btn', xpath: '//*[@id="submit-btn"]', playwright: '#submit-btn' }
```

You can request specific formats via the generic parameter:

```ts
const result = getSelector<'css'>(element);
// result.css is guaranteed to exist; result.xpath and result.playwright are optional
```

### Get All Candidates

Use `getSelectorAll` to retrieve every candidate selector, scored and sorted:

```ts
import { getSelectorAll } from '@stable-selector/core';

const candidates = getSelectorAll(element);

for (const c of candidates) {
  console.log(c.selector, c.strategy, c.total);
  // e.g. "submit-btn"  "id"  0.92
}
```

Each `ScoredCandidate` includes per-dimension scores (`uniqueness`, `stability`, `brevity`, `readability`) and a weighted `total`.

## Configuration

### Global Configuration

Use `configure` to adjust global settings. Settings are deep-merged with the current configuration:

```ts
import { configure, getConfig, resetConfig } from '@stable-selector/core';

configure({
  formats: ['css', 'playwright'],       // only generate CSS and Playwright selectors
  maxDepth: 3,                           // limit ancestor traversal depth
  priorities: ['id', 'role', 'attribute'], // reorder strategy priority
  weights: {
    uniqueness: 0.5,
    stability: 0.3,
    brevity: 0.1,
    readability: 0.1,
  },
});

// Inspect the active configuration
console.log(getConfig());

// Restore factory defaults
resetConfig();
```

### Blacklist

The blacklist tells the filter engine which class names, IDs, or attributes to reject. There are two ways to specify it.

#### Flat Array

Pass an array of patterns that applies to all names (class names, IDs, attributes):

```ts
configure({
  filters: {
    blacklist: ['css-*', /^_[a-z0-9]{6,}$/i],
  },
});
```

#### Grouped Config

For more control, use the `BlacklistConfig` object to target specific categories:

```ts
configure({
  filters: {
    blacklist: {
      classNames: ['css-*', 'sc-*', /^_[a-z0-9]{6,}$/i],
      ids: ['ember*', ':r*:'],
      attributes: ['data-reactid'],
    },
  },
});
```

#### Supported Pattern Types

| Pattern | Example | Matches |
| --- | --- | --- |
| Exact string | `'data-reactid'` | Only `data-reactid` |
| Glob string | `'css-*'` | `css-abc123`, `css-xyz` |
| RegExp | `/^_[a-z0-9]{6,}$/i` | `_a1b2c3`, `_XyZ789` |

Blacklist is **deep-merged** when you call `configure()`, so multiple calls accumulate patterns rather than replacing them.

### Whitelist

The whitelist overrides the blacklist—any name matching a whitelist pattern is always kept:

```ts
configure({
  filters: {
    whitelist: ['data-testid', 'data-cy', /^qa-/],
  },
});
```

### Heuristic Filtering

By default, the library uses Shannon entropy to detect dynamically-generated names (e.g. `a3f8c2`). You can tune or disable it:

```ts
configure({
  filters: {
    heuristic: true,          // enabled by default
    heuristicThreshold: 0.7,  // lower = stricter (default: 0.7)
  },
});
```

## Per-Call Options

Override formats or add extra blacklist entries for a single call without changing the global configuration:

```ts
import { getSelector } from '@stable-selector/core';

// Only produce a CSS selector for this call
const result = getSelector(element, { formats: ['css'] });

// Add an extra blacklist for this call only
const result2 = getSelector(element, {
  blacklist: ['tmp-*', /^_/],
});
```

## Common Use Cases

### E2E Testing with Playwright

```ts
import { getSelector } from '@stable-selector/core';

const sel = getSelector<'playwright'>(element);
if (sel?.playwright) {
  await page.locator(sel.playwright).click();
}
```

### E2E Testing with Cypress

```ts
const sel = getSelector<'css'>(element);
if (sel?.css) {
  cy.get(sel.css).click();
}
```

### Web Scraping

Generate stable selectors to track elements across page changes:

```ts
import { getSelectorAll } from '@stable-selector/core';

const candidates = getSelectorAll(element);
// Pick the highest-scoring candidate
const best = candidates[0];
console.log(`Best selector: ${best.formats.css} (score: ${best.total})`);
```

### Robotic Process Automation (RPA)

Use XPath selectors for tools that prefer XPath:

```ts
const sel = getSelector<'xpath'>(element);
if (sel?.xpath) {
  // Pass to your RPA framework
  robot.findElementByXPath(sel.xpath);
}
```

## Next Steps

- See the [API Reference](./api-reference.md) for the full function and type documentation.
- See the [Changelog](./CHANGELOG.md) for release history.
