# Contributing to stable-selector

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [pnpm](https://pnpm.io/) 9 or later

### Getting Started

```bash
# Clone the repository
git clone https://github.com/qaz1230sp/stable-selector.git
cd stable-selector

# Install dependencies
pnpm install

# Run tests
pnpm test

# Type-check
pnpm run typecheck

# Build
pnpm run build
```

## Project Structure

```
packages/
  core/                   # stable-selector
    src/
      filter/             # Filter engine (built-in rules, heuristic, types)
      strategies/         # Selector strategies (id, attribute, structural, text, role)
      scorer/             # Scoring engine and weight configuration
      formatter/          # Output formatters (CSS, XPath, Playwright)
      index.ts            # Public API
      types.ts            # Type definitions
    __tests__/            # Test files
```

## How to Add a New Strategy

Strategies live in `packages/core/src/strategies/`. Each strategy implements the `SelectorStrategy` interface.

1. Create a new file in `packages/core/src/strategies/` (e.g., `my-strategy.ts`)
2. Implement the `SelectorStrategy` interface:

   ```typescript
   import type { SelectorStrategy, RawCandidate } from '../types';
   import { FilterEngine } from '../filter';

   export class MyStrategy implements SelectorStrategy {
     name = 'my-strategy' as const;

     generate(element: Element, root: Document | Element): RawCandidate[] {
       // Generate candidate selectors for the element
       // Return an array of RawCandidate objects
       return [];
     }
   }
   ```

3. Register it in `packages/core/src/strategies/index.ts`
4. Add the strategy name to the `StrategyType` union in `packages/core/src/types.ts`
5. Write tests in `packages/core/__tests__/`

## How to Add a New Filter Pattern

Filter patterns are defined in `packages/core/src/filter/built-in.ts`.

1. Add your regex pattern to the `BUILT_IN_PATTERNS` array
2. Add a descriptive comment indicating which framework or tool it matches
3. Write tests to verify the pattern matches expected values and does not false-positive

Example:

```typescript
// My Framework — generates classes like "mf-abc123"
/^mf-[a-z0-9]+$/,
```

## Pull Request Guidelines

### Before Submitting

- Make sure all tests pass: `pnpm test`
- Make sure type-checking passes: `pnpm run typecheck`
- Make sure the project builds: `pnpm run build`
- Add tests for any new functionality
- Update documentation if your change affects the public API

### PR Process

1. Fork the repository and create your branch from `main`
2. Make your changes with clear, descriptive commit messages
3. Ensure your code follows the existing style
4. Submit a pull request with a clear description of what you changed and why
5. The CI pipeline will automatically run tests, type-checking, and build

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add aria-label strategy for better accessibility support
fix: handle elements with no parent in structural strategy
docs: add Puppeteer integration example
test: add edge cases for entropy-based heuristic detection
```

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Questions?

Feel free to open an [issue](https://github.com/qaz1230sp/stable-selector/issues) for questions, bug reports, or feature requests.
