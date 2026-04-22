import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_EXTENSION_CONFIG, type ExtensionConfig } from '../types';

export function useConfig() {
  const [config, setConfig] = useState<ExtensionConfig>(DEFAULT_EXTENSION_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.sync.get('config').then((stored) => {
      if (stored.config) setConfig(stored.config);
      setLoading(false);
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'sync' && changes.config) {
        setConfig(changes.config.newValue ?? DEFAULT_EXTENSION_CONFIG);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const updateConfig = useCallback(async (partial: Partial<ExtensionConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...partial };
      chrome.storage.sync.set({ config: updated });
      return updated;
    });
  }, []);

  return { config, updateConfig, loading };
}
