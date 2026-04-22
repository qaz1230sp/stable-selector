const COLORS = {
  content: 'rgba(74, 144, 210, 0.15)',
  padding: 'rgba(140, 200, 75, 0.15)',
  margin: 'rgba(245, 166, 35, 0.15)',
  border: '#4A90D2',
};

let overlayContainer: HTMLDivElement | null = null;
let contentOverlay: HTMLDivElement | null = null;
let paddingOverlay: HTMLDivElement | null = null;
let marginOverlay: HTMLDivElement | null = null;
let infoLabel: HTMLDivElement | null = null;

function createOverlayElement(bg: string): HTMLDivElement {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483646',
    background: bg,
    transition: 'all 0.05s ease-out',
  });
  return el;
}

function createInfoLabel(): HTMLDivElement {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483647',
    background: '#1e1e2e',
    color: '#e0e0e0',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'SF Mono, Menlo, Consolas, monospace',
    lineHeight: '1.4',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    transition: 'all 0.05s ease-out',
  });
  return el;
}

function ensureOverlays(): void {
  if (overlayContainer) return;
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'stable-selector-highlighter';
  Object.assign(overlayContainer.style, { position: 'fixed', top: '0', left: '0', pointerEvents: 'none', zIndex: '2147483645' });

  marginOverlay = createOverlayElement(COLORS.margin);
  paddingOverlay = createOverlayElement(COLORS.padding);
  contentOverlay = createOverlayElement(COLORS.content);
  contentOverlay.style.border = `2px solid ${COLORS.border}`;
  infoLabel = createInfoLabel();

  overlayContainer.appendChild(marginOverlay);
  overlayContainer.appendChild(paddingOverlay);
  overlayContainer.appendChild(contentOverlay);
  overlayContainer.appendChild(infoLabel);
  document.body.appendChild(overlayContainer);
}

/** Highlight a target element with 3-color box model overlay */
export function highlight(element: Element): void {
  ensureOverlays();
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  const mt = parseFloat(style.marginTop) || 0;
  const mr = parseFloat(style.marginRight) || 0;
  const mb = parseFloat(style.marginBottom) || 0;
  const ml = parseFloat(style.marginLeft) || 0;
  const bt = parseFloat(style.borderTopWidth) || 0;
  const br = parseFloat(style.borderRightWidth) || 0;
  const bb = parseFloat(style.borderBottomWidth) || 0;
  const blw = parseFloat(style.borderLeftWidth) || 0;

  // Margin overlay (outermost)
  if (marginOverlay) {
    Object.assign(marginOverlay.style, {
      top: `${rect.top - mt}px`,
      left: `${rect.left - ml}px`,
      width: `${rect.width + ml + mr}px`,
      height: `${rect.height + mt + mb}px`,
    });
  }

  // Padding overlay (between border and content)
  if (paddingOverlay) {
    Object.assign(paddingOverlay.style, {
      top: `${rect.top + bt}px`,
      left: `${rect.left + blw}px`,
      width: `${rect.width - blw - br}px`,
      height: `${rect.height - bt - bb}px`,
    });
  }

  // Content overlay (innermost)
  if (contentOverlay) {
    Object.assign(contentOverlay.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
  }

  // Info label
  if (infoLabel) {
    const tag = element.tagName.toLowerCase();
    const cls = element.className && typeof element.className === 'string'
      ? '.' + element.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    const dims = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
    infoLabel.textContent = `${tag}${cls}  ${dims}`;

    // Position above element, or below if no space above
    const labelHeight = 22;
    const gap = 4;
    if (rect.top - mt - labelHeight - gap > 0) {
      infoLabel.style.top = `${rect.top - mt - labelHeight - gap}px`;
    } else {
      infoLabel.style.top = `${rect.bottom + mb + gap}px`;
    }
    infoLabel.style.left = `${rect.left - ml}px`;
  }
}

// --- Selected element highlight (persistent after click) ---
let selectedOverlay: HTMLDivElement | null = null;
let selectedElement: Element | null = null;
let scrollHandler: (() => void) | null = null;

function ensureSelectedOverlay(): HTMLDivElement {
  if (selectedOverlay) return selectedOverlay;
  selectedOverlay = document.createElement('div');
  selectedOverlay.id = 'stable-selector-selected';
  Object.assign(selectedOverlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483645',
    border: '2px dashed #FF8C00',
    borderRadius: '3px',
    background: 'rgba(255, 140, 0, 0.12)',
    boxShadow: '0 0 6px rgba(255, 140, 0, 0.4), 0 0 0 1px rgba(255, 140, 0, 0.25)',
    transition: 'all 0.05s ease-out',
  });
  document.body.appendChild(selectedOverlay);
  return selectedOverlay;
}

function updateSelectedPosition(): void {
  if (!selectedOverlay || !selectedElement) return;
  const rect = selectedElement.getBoundingClientRect();
  Object.assign(selectedOverlay.style, {
    top: `${rect.top - 2}px`,
    left: `${rect.left - 2}px`,
    width: `${rect.width + 4}px`,
    height: `${rect.height + 4}px`,
  });
}

/** Show a persistent dashed outline on the selected element */
export function highlightSelected(element: Element): void {
  const overlay = ensureSelectedOverlay();
  selectedElement = element;
  const rect = element.getBoundingClientRect();
  Object.assign(overlay.style, {
    top: `${rect.top - 2}px`,
    left: `${rect.left - 2}px`,
    width: `${rect.width + 4}px`,
    height: `${rect.height + 4}px`,
    display: 'block',
  });

  // Track scroll/resize to keep highlight pinned to element
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler, true);
    window.removeEventListener('resize', scrollHandler);
  }
  scrollHandler = updateSelectedPosition;
  window.addEventListener('scroll', scrollHandler, true); // capture phase for nested scrollable
  window.addEventListener('resize', scrollHandler);
}

/** Remove the selected element highlight */
export function clearSelected(): void {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler, true);
    window.removeEventListener('resize', scrollHandler);
    scrollHandler = null;
  }
  selectedOverlay?.remove();
  selectedOverlay = null;
  selectedElement = null;
}

/** Remove all overlay elements from the DOM */
export function clearHighlight(): void {
  marginOverlay?.remove();
  paddingOverlay?.remove();
  contentOverlay?.remove();
  infoLabel?.remove();
  overlayContainer?.remove();
  marginOverlay = null;
  paddingOverlay = null;
  contentOverlay = null;
  infoLabel = null;
  overlayContainer = null;
  clearSelected();
}
