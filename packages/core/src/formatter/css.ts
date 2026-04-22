export function formatCSS(selector: string): string | null {
  // __text__ internal format can't be expressed in pure CSS
  if (selector.startsWith('__text__')) return null;

  // __role__ internal format: convert to attribute selector
  if (selector.startsWith('__role__')) {
    const roleMatch = selector.match(/\[role="([^"]+)"\]/);
    const nameMatch = selector.match(/\[name="([^"]+)"\]/);
    if (!roleMatch) return null;
    let css = `[role="${roleMatch[1]}"]`;
    if (nameMatch) {
      css += `[aria-label="${nameMatch[1]}"]`;
    }
    return css;
  }

  return selector;
}
