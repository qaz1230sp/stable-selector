# stable-selector

> Generate unique, stable selectors for web elements

[![npm version](https://img.shields.io/npm/v/@stable-selector/core)](https://www.npmjs.com/package/@stable-selector/core)
[![CI](https://github.com/user/stable-selector/actions/workflows/ci.yml/badge.svg)](https://github.com/user/stable-selector/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/user/stable-selector)](https://codecov.io/gh/user/stable-selector)
[![license](https://img.shields.io/npm/l/@stable-selector/core)](./LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@stable-selector/core)](https://bundlephobia.com/package/@stable-selector/core)

[中文文档](./README.zh-CN.md)

---

## Why stable-selector?

Modern front-end toolchains — CSS Modules, Styled Components, Emotion, Vue scoped styles — generate **dynamic class names and attributes** that change on every build. If your automated tests or web scrapers rely on these values, they break constantly.

**stable-selector** solves this by intelligently filtering out dynamic attributes and generating selectors based only on stable, meaningful properties. It understands the patterns used by popular frameworks and applies heuristic entropy analysis to catch unknown dynamic patterns.

## Features

- 🧠 **Smart 3-layer filtering** — Built-in rules for CSS Modules, Styled Components, Emotion, Webpack hashes, Vue scoped, React internals, Tailwind JIT; heuristic entropy detection; user-defined patterns
- 📦 **Multi-format output** — CSS Selector, XPath, and Playwright Locator in a single call
- 🔌 **Extensible strategy pipeline** — ID → Attribute → Structural → Text → Role, with configurable priority
- 🚫 **Configurable blacklist** — Exclude class names, IDs, or attributes by exact match, wildcard, or regex
- 🪶 **Zero dependencies** — Lightweight core with tree-shakeable ESM output

## Quick Start

```bash
npm install @stable-selector/core
```

```typescript
import { getSelector } from '@stable-selector/core';

const result = getSelector(element);
// => { css: 'div[data-testid="user-card"]',
//      xpath: '//div[@data-testid="user-card"]',
//      playwright: '[data-testid="user-card"]' }
```

## Output Formats

**CSS Selector:**

```typescript
const result = getSelector(element, { formats: ['css'] });
// => { css: '#user-card' }
```

**XPath:**

```typescript
const result = getSelector(element, { formats: ['xpath'] });
// => { xpath: '//*[@id="user-card"]' }
```

**Playwright Locator:**

```typescript
const result = getSelector(element, { formats: ['playwright'] });
// => { playwright: '[data-testid="user-card"]' }
```

## Configuration

Use `configure()` to set global options:

```typescript
import { configure } from '@stable-selector/core';

configure({
  filters: {
    blacklist: {
      classNames: ['ant-*', 'el-*', /^myapp-theme-/],
      ids: ['J_*', /^auto-id-/],
      attributes: ['data-spm*', 'data-bizid'],
    },
    heuristic: true,
    heuristicThreshold: 0.7,
  },
  priorities: ['id', 'attribute', 'structural', 'text', 'role'],
  formats: ['css', 'playwright'],
  maxDepth: 5,
});
```

## Per-call Options

Override global settings for individual calls:

```typescript
// Only get Playwright format for this call
const result = getSelector(element, {
  formats: ['playwright'],
});

// Add extra blacklist patterns for this call
const result = getSelector(element, {
  blacklist: { classNames: ['tmp-*'] },
});
```

## How It Works

stable-selector uses a four-stage pipeline:

```
Element → Filter Engine → Strategy Pipeline → Scorer Engine → Formatter
              ↓                   ↓                  ↓             ↓
      Remove dynamic        Generate candidates   Score by      Output as
      attributes            via multiple           uniqueness,   CSS/XPath/
                            strategies             stability,    Playwright
                                                   brevity,
                                                   readability
```

1. **Filter Engine** removes unstable attributes using built-in patterns, entropy-based heuristic detection, and user-defined rules
2. **Strategy Pipeline** generates candidate selectors via ID, Attribute, Structural, Text, and Role strategies
3. **Scorer Engine** ranks candidates on 4 weighted dimensions: uniqueness (0.4), stability (0.35), brevity (0.15), readability (0.1)
4. **Formatter** converts the best candidate into the requested output format(s)

## Comparison

| Feature | stable-selector | finder | css-selector-generator | optimal-select |
|---|---|---|---|---|
| Dynamic attribute filtering | ✅ 3-layer | ❌ | ❌ | ❌ |
| Heuristic detection | ✅ Entropy | ❌ | ❌ | ❌ |
| Multi-format output | ✅ CSS+XPath+PW | CSS only | CSS only | CSS only |
| Scored ranking | ✅ 4-dimension | ❌ | Partial | ❌ |
| Extensible strategies | ✅ Plugin-based | ❌ | Partial | ❌ |
| TypeScript | ✅ Native | ❌ | ✅ | ❌ |
| Browser + Node | ✅ | ✅ | ✅ | ✅ |

## API Reference

See the full [API documentation](./docs/api-reference.md).

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting a pull request.

## License

[MIT](./LICENSE)
