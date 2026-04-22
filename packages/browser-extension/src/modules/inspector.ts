import { getSelectorAll, getConfig, FilterEngine } from 'stable-selector';
import type { ScoredCandidate, FilterDetail } from 'stable-selector';
import * as highlighter from './highlighter';

const PANEL_HOST_ID = 'stable-selector-panel-host';

export interface InspectorCallbacks {
  onElementSelected: (
    element: Element,
    candidates: ScoredCandidate[],
    filterDetails: FilterDetail[],
  ) => void;
  onExit: () => void;
}

let active = false;
let callbacks: InspectorCallbacks | null = null;
let previousCursor = '';
let shield: HTMLDivElement | null = null;

function isPanelElement(el: Element): boolean {
  let current: Element | null = el;
  while (current) {
    if (current.id === PANEL_HOST_ID) return true;
    if (current.id === 'stable-selector-highlighter') return true;
    if (current.id === 'stable-selector-selected') return true;
    if (current.id === 'stable-selector-shield') return true;
    current = current.parentElement;
  }
  return false;
}

/** Get the real element under the cursor by temporarily hiding the shield */
function getElementAtPoint(x: number, y: number): Element | null {
  if (shield) shield.style.pointerEvents = 'none';
  const el = document.elementFromPoint(x, y);
  if (shield) shield.style.pointerEvents = 'auto';
  return el;
}

function onShieldMouseMove(e: MouseEvent): void {
  const el = getElementAtPoint(e.clientX, e.clientY);
  if (!el || isPanelElement(el)) return;
  highlighter.highlight(el);
}

function onShieldClick(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();

  const el = getElementAtPoint(e.clientX, e.clientY);
  if (!el || isPanelElement(el)) return;

  highlighter.clearHighlight();
  highlighter.highlightSelected(el);

  // Generate selectors using the core library
  const candidates = getSelectorAll(el);

  // Get filter details using a fresh FilterEngine with current config
  const config = getConfig();
  const filter = new FilterEngine(config.filters);
  const filterDetails = filter.getFilterDetails(el);

  callbacks?.onElementSelected(el, candidates, filterDetails);
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    exitInspector();
  }
}

/** Find the nearest scrollable ancestor of an element */
function findScrollableAncestor(el: Element | null, deltaY: number): Element | null {
  let current = el;
  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    const isScrollable = overflowY === 'auto' || overflowY === 'scroll' ||
                         overflowX === 'auto' || overflowX === 'scroll';
    if (isScrollable && current.scrollHeight > current.clientHeight) {
      // Check if it can still scroll in the desired direction
      if (deltaY > 0 && current.scrollTop + current.clientHeight < current.scrollHeight) return current;
      if (deltaY < 0 && current.scrollTop > 0) return current;
    }
    current = current.parentElement;
  }
  // Fall back to documentElement or body
  return document.scrollingElement || document.documentElement;
}

function onShieldWheel(e: WheelEvent): void {
  // Find element under cursor
  if (shield) shield.style.pointerEvents = 'none';
  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (shield) shield.style.pointerEvents = 'auto';

  // Convert delta based on deltaMode (0=pixels, 1=lines, 2=pages)
  let deltaX = e.deltaX;
  let deltaY = e.deltaY;
  if (e.deltaMode === 1) {
    deltaX *= 40;
    deltaY *= 40;
  } else if (e.deltaMode === 2) {
    deltaX *= window.innerHeight;
    deltaY *= window.innerHeight;
  }

  // Directly scroll the nearest scrollable ancestor
  const scrollable = findScrollableAncestor(target, deltaY);
  if (scrollable) {
    scrollable.scrollTop += deltaY;
    scrollable.scrollLeft += deltaX;
  }

  // Update highlight after scroll settles
  requestAnimationFrame(() => {
    const el = getElementAtPoint(e.clientX, e.clientY);
    if (el && !isPanelElement(el)) highlighter.highlight(el);
  });
}

function createShield(): HTMLDivElement {
  const el = document.createElement('div');
  el.id = 'stable-selector-shield';
  Object.assign(el.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '2147483644',
    cursor: 'crosshair',
    background: 'transparent',
  });
  el.addEventListener('mousemove', onShieldMouseMove);
  el.addEventListener('click', onShieldClick);
  el.addEventListener('wheel', onShieldWheel, { passive: true });
  document.body.appendChild(el);
  return el;
}

/** Enter Inspector mode — overlay shield intercepts all clicks */
export function enterInspector(cbs: InspectorCallbacks): void {
  if (active) return;
  active = true;
  callbacks = cbs;

  shield = createShield();
  document.addEventListener('keydown', onKeyDown, true);

  previousCursor = document.body.style.cursor;
  document.body.style.cursor = 'crosshair';
}

/** Exit Inspector mode — remove shield and cleanup */
export function exitInspector(): void {
  if (!active) return;
  active = false;

  shield?.remove();
  shield = null;
  document.removeEventListener('keydown', onKeyDown, true);

  document.body.style.cursor = previousCursor;
  highlighter.clearHighlight();
  callbacks?.onExit();
  callbacks = null;
}

/** Toggle Inspector mode on/off */
export function toggleInspector(cbs: InspectorCallbacks): void {
  if (active) {
    exitInspector();
  } else {
    enterInspector(cbs);
  }
}

/** Check if Inspector mode is currently active */
export function isInspectorActive(): boolean {
  return active;
}
