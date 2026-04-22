/**
 * Selector verification — runs a selector against the live DOM
 * and flashes matched elements to give visual confirmation.
 */

export interface VerifyResult {
  matchCount: number;
  success: boolean;
}

/** Query the DOM using the appropriate engine for each format */
function queryBySelector(format: string, value: string): Element[] {
  try {
    if (format === 'CSS') {
      return Array.from(document.querySelectorAll(value));
    }

    if (format === 'XPath') {
      const result = document.evaluate(
        value,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null,
      );
      const elements: Element[] = [];
      for (let i = 0; i < result.snapshotLength; i++) {
        const node = result.snapshotItem(i);
        if (node instanceof Element) elements.push(node);
      }
      return elements;
    }

    // Playwright selectors require Playwright runtime — not verifiable in browser
    return [];
  } catch {
    return [];
  }
}

// Track active flash overlays for cleanup
let flashOverlays: HTMLDivElement[] = [];
let flashTimer: ReturnType<typeof setTimeout> | null = null;

function clearFlash(): void {
  for (const overlay of flashOverlays) overlay.remove();
  flashOverlays = [];
  if (flashTimer) {
    clearTimeout(flashTimer);
    flashTimer = null;
  }
}

/** Flash highlight on elements: green = found, red = none found */
function flashElements(elements: Element[], success: boolean): void {
  clearFlash();

  const color = success ? 'rgba(100, 255, 100, 0.35)' : 'rgba(244, 67, 54, 0.35)';
  const borderColor = success ? '#66FF66' : '#F44336';

  for (const el of elements.slice(0, 20)) {
    const rect = el.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'stable-selector-flash';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      background: color,
      border: `2px solid ${borderColor}`,
      borderRadius: '2px',
      pointerEvents: 'none',
      zIndex: '2147483644',
      transition: 'opacity 0.5s ease-out',
      opacity: '1',
    });
    document.body.appendChild(overlay);
    flashOverlays.push(overlay);
  }

  // Fade out after 2s, remove after 2.6s
  flashTimer = setTimeout(() => {
    for (const overlay of flashOverlays) {
      overlay.style.opacity = '0';
    }
    flashTimer = setTimeout(() => clearFlash(), 600);
  }, 2000);
}

/** Verify a selector and flash the matched elements */
export function verifySelector(format: string, value: string): VerifyResult {
  const elements = queryBySelector(format, value);
  const matchCount = elements.length;
  const success = matchCount > 0;
  flashElements(elements, success);
  return { matchCount, success };
}
