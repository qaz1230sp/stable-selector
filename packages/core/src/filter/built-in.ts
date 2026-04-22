// Built-in patterns for detecting dynamic CSS classes, IDs, and attributes
// from popular frameworks and build tools.

export const BUILT_IN_PATTERNS: RegExp[] = [
  // CSS Modules: styles_header__3xK2a
  /^[a-zA-Z]\w*_[a-zA-Z]\w*__[a-zA-Z0-9]{5,}$/,
  // Styled Components: sc-bdnxRM
  /^sc-[a-zA-Z]{5,}$/,
  // Emotion: css-1a2b3c
  /^css-[a-z0-9]+$/,
  // Webpack chunk hash suffix (must contain at least one a-f letter, not just digits)
  /[_-](?=[a-f0-9]{8,}$)(?=.*[a-f])/i,
  // Tailwind JIT arbitrary values
  /^\[.+\]$/,
  // Vue scoped attribute: data-v-xxxxxxxx
  /^data-v-[a-f0-9]{8}$/,
  // React internal properties
  /^__react/,
  // Angular _ngcontent / _nghost
  /^_ng(content|host)-/,
  // Linaria: l-xxxxxxx
  /^l[a-z]-[a-zA-Z0-9]{5,}$/,
  // Generic hash-like patterns: 8+ hex chars (must contain at least one a-f letter)
  /^(?=.*[a-f])[a-f0-9]{8,}$/,
  // CSS Modules / bundler version-number suffix: name-1-2-25, Component-foo-1-2-82
  /-\d+-\d+-\d+$/,
  // CSS Modules numeric hash suffix: btn-23, Component-82, widget-456
  /[a-zA-Z]-\d{2,}$/,
  // Framework auto-generated counter IDs: Dropdown501, Pivot92, FocusZone93
  /[A-Z][a-zA-Z]+\d{2,}/,
  // Embedded counter segment: radio-group-16-specific, row-657-item
  /-\d{2,}-/,
];

/** State/toggle classes that change with UI interaction — not stable for selectors */
export const STATE_CLASS_PATTERNS: RegExp[] = [
  // Visibility states
  /^(is-)?(visible|hidden|show|hide|shown|collapsed|expanded|open|closed)$/i,
  // Interactive states (is-selected, is-disabled, is-active, etc.)
  /^(is-)?(active|inactive|selected|unselected|disabled|enabled|focused|checked|unchecked|pressed|hover|loading)$/i,
  // Fluent UI / Office Fabric state classes
  /^(is-|link)?[Ii]s[A-Z]\w*$/,  // isSelected, linkIsSelected-224, etc.
  // Common toggle class patterns
  /^(has-|no-|not-|with-|without-)/i,
  // CamelCase toggle suffixes: datePickerShow, menuHide, panelVisible
  /(?:Show|Hide|Visible|Hidden|Collapsed|Expanded|Disabled|Enabled)(?:-\w+)?$/,
  // Compound names starting with visibility/state words: visible-element, active-tab
  /^(visible|hidden|active|inactive|disabled|enabled|selected|collapsed|expanded)-/i,
  // Fluent UI state with color suffix: activeColor-*, disabledColor-*
  /^(active|disabled|selected|focused|hover)(Color|Style|Class)-/i,
];
