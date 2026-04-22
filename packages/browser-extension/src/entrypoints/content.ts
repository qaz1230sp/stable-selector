import { defineContentScript } from 'wxt/utils/define-content-script';
import { initConfig, watchConfigChanges } from '../modules/config-bridge';
import * as inspector from '../modules/inspector';
import * as panelManager from '../modules/panel-manager';
import type { ScoredCandidate, FilterDetail } from 'stable-selector';
import type { PanelData } from '../components/FloatingPanel';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    // Register message listener immediately so we don't miss toggle messages
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'toggle-inspector') {
        inspector.toggleInspector({
          onElementSelected: handleElementSelected,
          onExit: handleInspectorExit,
        });
      }
    });

    // Initialize core library config from storage
    await initConfig();
    watchConfigChanges();
  },
});

function handleElementSelected(
  element: Element,
  candidates: ScoredCandidate[],
  filterDetails: FilterDetail[],
): void {
  const tagName = element.tagName.toLowerCase();
  const id = element.id || undefined;
  const classNames = element.className && typeof element.className === 'string'
    ? element.className.trim().split(/\s+/).filter(Boolean)
    : [];

  const data: PanelData = {
    element: { tagName, id, classNames },
    candidates,
    filterDetails,
  };

  panelManager.showPanel(data, () => {
    inspector.exitInspector();
  });
}

function handleInspectorExit(): void {
  panelManager.hidePanel();
}
