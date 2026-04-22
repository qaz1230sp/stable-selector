import { configure, resetConfig } from '@stable-selector/core';
import type { BlacklistConfig } from '@stable-selector/core';
import { DEFAULT_EXTENSION_CONFIG, type ExtensionConfig } from '../types';

/** Match a URL hostname against a domain pattern (supports leading *.) */
function matchesDomain(hostname: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(1); // ".example.com"
    return hostname.endsWith(suffix) || hostname === pattern.slice(2);
  }
  return hostname === pattern;
}

/** Merge two BlacklistConfig objects (concatenate arrays) */
function mergeBlacklists(a: BlacklistConfig, b: BlacklistConfig): BlacklistConfig {
  return {
    classNames: [...(a.classNames ?? []), ...(b.classNames ?? [])],
    ids: [...(a.ids ?? []), ...(b.ids ?? [])],
    attributes: [...(a.attributes ?? []), ...(b.attributes ?? [])],
  };
}

/** Apply extension config to the core library */
function applyConfig(config: ExtensionConfig): void {
  resetConfig();

  // Find matching site blacklists for current hostname
  const hostname = window.location.hostname;
  let mergedBlacklist = config.globalBlacklist;

  for (const [pattern, siteBlacklist] of Object.entries(config.siteBlacklists)) {
    if (matchesDomain(hostname, pattern)) {
      mergedBlacklist = mergeBlacklists(mergedBlacklist, siteBlacklist);
    }
  }

  configure({
    filters: {
      blacklist: mergedBlacklist,
      heuristic: config.heuristic,
      heuristicThreshold: config.heuristicThreshold,
    },
    formats: config.formats,
  });
}

/** Load config from storage and apply. Returns the loaded config. */
export async function initConfig(): Promise<ExtensionConfig> {
  const stored = await chrome.storage.sync.get('config');
  const config: ExtensionConfig = stored.config ?? DEFAULT_EXTENSION_CONFIG;
  applyConfig(config);
  return config;
}

/** Listen for config changes and re-apply. Returns cleanup function. */
export function watchConfigChanges(onChanged?: (config: ExtensionConfig) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'sync' || !changes.config) return;
    const config: ExtensionConfig = changes.config.newValue ?? DEFAULT_EXTENSION_CONFIG;
    applyConfig(config);
    onChanged?.(config);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

/** Save config to storage */
export async function saveConfig(config: ExtensionConfig): Promise<void> {
  await chrome.storage.sync.set({ config });
}
