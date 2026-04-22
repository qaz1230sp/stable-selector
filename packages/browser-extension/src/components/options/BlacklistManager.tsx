import { Shield, Globe, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { BlacklistRuleInput } from './BlacklistRuleInput';
import { SiteBlacklist } from './SiteBlacklist';
import type { ExtensionConfig } from '../../types';
import type { BlacklistConfig } from 'stable-selector';

interface BlacklistManagerProps {
  config: ExtensionConfig;
  onUpdate: (partial: Partial<ExtensionConfig>) => void;
}

export function BlacklistManager({ config, onUpdate }: BlacklistManagerProps) {
  const [newDomain, setNewDomain] = useState('');

  const updateGlobal = (field: keyof BlacklistConfig, values: string[]) => {
    onUpdate({
      globalBlacklist: { ...config.globalBlacklist, [field]: values },
    });
  };

  const addSite = () => {
    const domain = newDomain.trim();
    if (!domain || config.siteBlacklists[domain]) return;
    onUpdate({
      siteBlacklists: {
        ...config.siteBlacklists,
        [domain]: { classNames: [], ids: [], attributes: [] },
      },
    });
    setNewDomain('');
  };

  const updateSite = (domain: string, siteConfig: BlacklistConfig) => {
    onUpdate({
      siteBlacklists: { ...config.siteBlacklists, [domain]: siteConfig },
    });
  };

  const deleteSite = (domain: string) => {
    const { [domain]: _, ...rest } = config.siteBlacklists;
    onUpdate({ siteBlacklists: rest });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={20} className="text-blue-500" />
        <h2 className="text-lg font-semibold">Blacklist Rules</h2>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Globe size={16} className="text-gray-500" />
          <h3 className="text-sm font-medium">Global Blacklist</h3>
          <span className="text-xs text-gray-400">(applies to all sites)</span>
        </div>
        <div className="space-y-3 pl-5">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Classes</label>
            <BlacklistRuleInput
              rules={(config.globalBlacklist.classNames ?? []) as string[]}
              onChange={(v) => updateGlobal('classNames', v)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">IDs</label>
            <BlacklistRuleInput
              rules={(config.globalBlacklist.ids ?? []) as string[]}
              onChange={(v) => updateGlobal('ids', v)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Attributes</label>
            <BlacklistRuleInput
              rules={(config.globalBlacklist.attributes ?? []) as string[]}
              onChange={(v) => updateGlobal('attributes', v)}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={16} className="text-gray-500" />
          <h3 className="text-sm font-medium">Site-Specific Blacklists</h3>
        </div>

        <div className="space-y-3 pl-5">
          {Object.entries(config.siteBlacklists).map(([domain, siteConfig]) => (
            <SiteBlacklist
              key={domain}
              domain={domain}
              config={siteConfig}
              onChange={(c) => updateSite(domain, c)}
              onDelete={() => deleteSite(domain)}
            />
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSite()}
              placeholder="*.example.com"
              className="flex-1 text-sm px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button onClick={addSite} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              <Plus size={14} />
              Add Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
