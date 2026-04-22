import type { SelectorFormat, BlacklistConfig } from 'stable-selector';

/** Extension configuration stored in chrome.storage.sync */
export interface ExtensionConfig {
  formats: SelectorFormat[];
  heuristic: boolean;
  heuristicThreshold: number;
  globalBlacklist: BlacklistConfig;
  siteBlacklists: Record<string, BlacklistConfig>;
}

export const DEFAULT_EXTENSION_CONFIG: ExtensionConfig = {
  formats: ['css', 'xpath', 'playwright'],
  heuristic: true,
  heuristicThreshold: 0.7,
  globalBlacklist: { classNames: [], ids: [], attributes: [] },
  siteBlacklists: {},
};
