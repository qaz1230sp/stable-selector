import { useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { GeneralSettings } from '../../components/options/GeneralSettings';
import { BlacklistManager } from '../../components/options/BlacklistManager';
import { ImportExport } from '../../components/options/ImportExport';
import { Settings, Shield, Download, Info } from 'lucide-react';

type Tab = 'general' | 'blacklist' | 'import-export' | 'about';

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'blacklist', label: 'Blacklist', icon: Shield },
  { id: 'import-export', label: 'Import/Export', icon: Download },
  { id: 'about', label: 'About', icon: Info },
];

export function App() {
  const { config, updateConfig, loading } = useConfig();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <nav className="w-56 bg-white border-r min-h-screen p-4">
        <h1 className="text-lg font-bold mb-6 px-3">stable-selector</h1>
        <ul className="space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  activeTab === id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex-1 p-8 max-w-3xl">
        {activeTab === 'general' && (
          <GeneralSettings config={config} onUpdate={updateConfig} />
        )}
        {activeTab === 'blacklist' && (
          <BlacklistManager config={config} onUpdate={updateConfig} />
        )}
        {activeTab === 'import-export' && (
          <ImportExport config={config} onUpdate={updateConfig} />
        )}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info size={20} className="text-blue-500" />
              <h2 className="text-lg font-semibold">About</h2>
            </div>
            <p className="text-sm text-gray-600">
              <strong>stable-selector</strong> v0.1.0
            </p>
            <p className="text-sm text-gray-600">
              Generate unique, stable CSS/XPath/Playwright selectors for any web element.
              Powered by smart 3-layer filtering that handles CSS Modules, Styled Components,
              Emotion, and more.
            </p>
            <a
              href="https://github.com/user/stable-selector"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              GitHub Repository →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
