import { Trash2 } from 'lucide-react';
import { BlacklistRuleInput } from './BlacklistRuleInput';
import type { BlacklistConfig } from '@stable-selector/core';

interface SiteBlacklistProps {
  domain: string;
  config: BlacklistConfig;
  onChange: (config: BlacklistConfig) => void;
  onDelete: () => void;
}

export function SiteBlacklist({ domain, config, onChange, onDelete }: SiteBlacklistProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <code className="text-sm font-semibold">{domain}</code>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-red-500">
          <Trash2 size={16} />
        </button>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">Classes</label>
        <BlacklistRuleInput
          rules={(config.classNames ?? []) as string[]}
          onChange={(classNames) => onChange({ ...config, classNames })}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">IDs</label>
        <BlacklistRuleInput
          rules={(config.ids ?? []) as string[]}
          onChange={(ids) => onChange({ ...config, ids })}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">Attributes</label>
        <BlacklistRuleInput
          rules={(config.attributes ?? []) as string[]}
          onChange={(attributes) => onChange({ ...config, attributes })}
        />
      </div>
    </div>
  );
}
