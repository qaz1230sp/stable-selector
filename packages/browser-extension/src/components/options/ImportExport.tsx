import { Download, Upload } from 'lucide-react';
import { useRef } from 'react';
import type { ExtensionConfig } from '../../types';

interface ImportExportProps {
  config: ExtensionConfig;
  onUpdate: (partial: Partial<ExtensionConfig>) => void;
}

export function ImportExport({ config, onUpdate }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stable-selector-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);
        if (!imported || typeof imported !== 'object' || !Array.isArray(imported.formats)) {
          alert('Invalid config file: missing or invalid "formats" field');
          return;
        }
        onUpdate(imported as ExtensionConfig);
      } catch {
        alert('Invalid config file: not valid JSON');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Download size={20} className="text-blue-500" />
        <h2 className="text-lg font-semibold">Import / Export</h2>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          <Download size={16} />
          Export Config
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50 text-sm"
        >
          <Upload size={16} />
          Import Config
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>
    </div>
  );
}
