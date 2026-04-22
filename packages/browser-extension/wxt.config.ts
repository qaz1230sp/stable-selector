import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Stable Selector',
    description: 'Generate unique, stable CSS/XPath/Playwright selectors for any web element',
    permissions: ['activeTab', 'storage'],
    icons: { '16': 'icons/icon-16.png', '48': 'icons/icon-48.png', '128': 'icons/icon-128.png' },
    action: {
      default_title: 'Toggle Stable Selector Inspector',
      default_icon: { '16': 'icons/icon-16.png', '48': 'icons/icon-48.png', '128': 'icons/icon-128.png' },
    },
    commands: {
      'toggle-inspector': {
        suggested_key: { default: 'Ctrl+Shift+S', mac: 'Command+Shift+S' },
        description: 'Toggle Inspector Mode',
      },
    },
  },
});
