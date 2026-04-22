export function formatPlaywright(selector: string): string {
  // __text__ internal format => text= locator
  if (selector.startsWith('__text__')) {
    const textMatch = selector.match(/\[text="([^"]+)"\]/);
    const tagMatch = selector.match(/\[tag="([^"]+)"\]/);
    const text = textMatch?.[1] || '';
    const tag = tagMatch?.[1];

    if (tag) {
      return `${tag}:has-text("${text}")`;
    }
    return `text="${text}"`;
  }

  // __role__ internal format => role= locator
  if (selector.startsWith('__role__')) {
    const roleMatch = selector.match(/\[role="([^"]+)"\]/);
    const nameMatch = selector.match(/\[name="([^"]+)"\]/);
    if (!roleMatch) return selector;
    const role = roleMatch[1];
    if (nameMatch) {
      return `role=${role}[name="${nameMatch[1]}"]`;
    }
    return `role=${role}`;
  }

  // data-testid shorthand
  const testIdMatch = selector.match(/^\[data-testid="([^"]+)"\]$/);
  if (testIdMatch) {
    return `[data-testid="${testIdMatch[1]}"]`;
  }

  // Default: return CSS selector (Playwright accepts CSS)
  return selector;
}
