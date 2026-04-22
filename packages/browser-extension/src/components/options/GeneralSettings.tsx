import { Settings } from 'lucide-react';
import type { ExtensionConfig } from '../../types';
import type { SelectorFormat } from 'stable-selector';

interface GeneralSettingsProps {
  config: ExtensionConfig;
  onUpdate: (partial: Partial<ExtensionConfig>) => void;
}

const FORMAT_OPTIONS: { value: SelectorFormat; label: string }[] = [
  { value: 'css', label: 'CSS Selector' },
  { value: 'xpath', label: 'XPath' },
  { value: 'playwright', label: 'Playwright Locator' },
];

export function GeneralSettings({ config, onUpdate }: GeneralSettingsProps) {
  const toggleFormat = (fmt: SelectorFormat) => {
    const current = config.formats;
    const next = current.includes(fmt)
      ? current.filter((f) => f !== fmt)
      : [...current, fmt];
    if (next.length > 0) onUpdate({ formats: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={20} className="text-blue-500" />
        <h2 className="text-lg font-semibold">General Settings</h2>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Output Formats</h3>
        <div className="space-y-2">
          {FORMAT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.formats.includes(opt.value)}
                onChange={() => toggleFormat(opt.value)}
                className="rounded"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Heuristic Detection</h3>
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={config.heuristic}
            onChange={() => onUpdate({ heuristic: !config.heuristic })}
            className="rounded"
          />
          <span className="text-sm">Enable entropy-based detection</span>
        </label>
        {config.heuristic && (
          <div>
            <label className="text-sm text-gray-600">
              Threshold: {config.heuristicThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={config.heuristicThreshold}
              onChange={(e) => onUpdate({ heuristicThreshold: parseFloat(e.target.value) })}
              className="w-full mt-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}
