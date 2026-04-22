export function formatXPath(selector: string): string {
  // __text__ internal format
  if (selector.startsWith('__text__')) {
    const tagMatch = selector.match(/\[tag="([^"]+)"\]/);
    const textMatch = selector.match(/\[text="([^"]+)"\]/);
    const tag = tagMatch?.[1] || '*';
    const text = textMatch?.[1] || '';
    return `//${tag}[normalize-space(text())="${text}"]`;
  }

  // __role__ internal format
  if (selector.startsWith('__role__')) {
    const roleMatch = selector.match(/\[role="([^"]+)"\]/);
    const nameMatch = selector.match(/\[name="([^"]+)"\]/);
    if (!roleMatch) return '';
    let xpath = `//*[@role="${roleMatch[1]}"]`;
    if (nameMatch) {
      xpath = `//*[@role="${roleMatch[1]}" and @aria-label="${nameMatch[1]}"]`;
    }
    return xpath;
  }

  // Convert standard CSS selector to XPath
  return cssToXPath(selector);
}

function cssToXPath(css: string): string {
  // Handle ID selector: #foo => //*[@id="foo"]
  if (css.startsWith('#')) {
    const id = css.slice(1).replace(/\\/g, '');
    return `//*[@id="${id}"]`;
  }

  // Handle attribute selector: [attr="value"] => //*[@attr="value"]
  const attrMatch = css.match(/^\[([^\]]+)\]$/);
  if (attrMatch) {
    return `//*[@${attrMatch[1]}]`;
  }

  // Tokenize compound selectors respecting quoted strings and brackets
  const segments: Array<{ part: string; combinator: 'child' | 'descendant' }> = [];
  const parts = tokenizeCSSSelector(css);

  for (let i = 0; i < parts.length; i++) {
    const token = parts[i];
    if (token === '>') continue;
    const prevToken = i > 0 ? parts[i - 1] : '';
    const isChild = prevToken === '>';
    segments.push({
      part: token,
      combinator: segments.length === 0 ? 'descendant' : (isChild ? 'child' : 'descendant'),
    });
  }

  let xpath = '';
  for (const seg of segments) {
    const { tag, conditions } = parseCSSPart(seg.part);
    xpath += seg.combinator === 'child' ? `/${tag}` : `//${tag}`;
    if (conditions.length > 0) {
      xpath += `[${conditions.join(' and ')}]`;
    }
  }

  if (xpath.startsWith('//')) return xpath;
  return '/' + xpath;
}

/** Tokenize a CSS selector into parts, respecting brackets and quotes */
function tokenizeCSSSelector(css: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inBrackets = 0;
  let inQuote: string | null = null;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];

    // Track quote state (inside brackets)
    if (inQuote) {
      current += ch;
      if (ch === inQuote && css[i - 1] !== '\\') inQuote = null;
      continue;
    }
    if ((ch === '"' || ch === "'") && inBrackets > 0) {
      inQuote = ch;
      current += ch;
      continue;
    }

    // Track bracket depth
    if (ch === '[' || ch === '(') { inBrackets++; current += ch; continue; }
    if (ch === ']' || ch === ')') { inBrackets--; current += ch; continue; }

    // Inside brackets — don't split
    if (inBrackets > 0) { current += ch; continue; }

    // Outside brackets — split on whitespace and >
    if (ch === '>') {
      if (current.trim()) tokens.push(current.trim());
      tokens.push('>');
      current = '';
    } else if (/\s/.test(ch)) {
      if (current.trim()) tokens.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) tokens.push(current.trim());
  return tokens;
}

function parseCSSPart(part: string): { tag: string; conditions: string[] } {
  let tag = '*';
  const conditions: string[] = [];

  // Extract tag name
  const tagMatch = part.match(/^([a-z][a-z0-9]*)/i);
  if (tagMatch) {
    tag = tagMatch[1];
    part = part.slice(tagMatch[0].length);
  }

  // Extract ID: #id
  const idMatch = part.match(/#([^.:\[\\]+)/);
  if (idMatch) {
    conditions.push(`@id="${idMatch[1].replace(/\\/g, '')}"`);
  }

  // Extract classes: .class
  const classMatches = part.matchAll(/\.([^.:#\[\\]+)/g);
  for (const m of classMatches) {
    const cls = m[1].replace(/\\/g, '');
    conditions.push(`contains(@class, "${cls}")`);
  }

  // Extract nth-of-type / nth-child: :nth-of-type(n) or :nth-child(n)
  const nthMatch = part.match(/:nth-(?:of-type|child)\((\d+)\)/);
  if (nthMatch) {
    conditions.push(`position()=${nthMatch[1]}`);
  }

  // Extract attribute selectors: [attr="value"]
  const attrMatches = part.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g);
  for (const m of attrMatches) {
    if (m[2] !== undefined) {
      conditions.push(`@${m[1]}="${m[2].replace(/\\/g, '')}"`);
    } else {
      conditions.push(`@${m[1]}`);
    }
  }

  return { tag, conditions };
}
