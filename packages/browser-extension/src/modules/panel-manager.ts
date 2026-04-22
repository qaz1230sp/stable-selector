import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { FloatingPanel, type PanelData } from '../components/FloatingPanel';
// @ts-expect-error — WXT handles CSS import as string
import panelCSS from '../styles/panel.css?inline';

const PANEL_HOST_ID = 'stable-selector-panel-host';

let shadowRoot: ShadowRoot | null = null;
let reactRoot: Root | null = null;
let hostElement: HTMLDivElement | null = null;

function ensureShadowRoot(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  hostElement = document.createElement('div');
  hostElement.id = PANEL_HOST_ID;
  Object.assign(hostElement.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    overflow: 'visible',
    zIndex: '2147483647',
    pointerEvents: 'none',
  });

  shadowRoot = hostElement.attachShadow({ mode: 'closed' });

  // Inject Tailwind CSS
  const style = document.createElement('style');
  style.textContent = panelCSS;
  shadowRoot.appendChild(style);

  // Allow pointer events inside the panel content
  const wrapper = document.createElement('div');
  wrapper.style.pointerEvents = 'auto';
  wrapper.style.cursor = 'default';
  shadowRoot.appendChild(wrapper);

  reactRoot = createRoot(wrapper);
  document.body.appendChild(hostElement);

  return shadowRoot;
}

/** Show the floating panel with selector results */
export function showPanel(data: PanelData, onClose: () => void): void {
  ensureShadowRoot();
  if (hostElement) hostElement.style.display = '';
  reactRoot?.render(
    createElement(FloatingPanel, { data, onClose }),
  );
}

/** Hide (unmount content but keep shadow root alive) */
export function hidePanel(): void {
  reactRoot?.render(createElement(FloatingPanel, { data: null, onClose: () => {} }));
  if (hostElement) hostElement.style.display = 'none';
}

/** Fully destroy the panel and shadow root */
export function destroyPanel(): void {
  reactRoot?.unmount();
  hostElement?.remove();
  shadowRoot = null;
  reactRoot = null;
  hostElement = null;
}
