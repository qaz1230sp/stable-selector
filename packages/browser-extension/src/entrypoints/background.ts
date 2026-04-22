import { defineBackground } from 'wxt/utils/define-background';

async function sendToggle(tabId: number) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'toggle-inspector' });
  } catch {
    // Content script not available on this page
  }
}

export default defineBackground(() => {
  // Toggle inspector when extension icon is clicked
  // Use chrome.action (MV3) with fallback to browser.action for Edge compat
  const actionApi = chrome.action ?? (globalThis as any).browser?.action;
  if (actionApi?.onClicked) {
    actionApi.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
      if (tab.id) await sendToggle(tab.id);
    });
  }

  // Toggle inspector via keyboard shortcut
  chrome.commands.onCommand.addListener(async (command) => {
    if (command !== 'toggle-inspector') return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await sendToggle(tab.id);
  });
});
