import { X, Plus } from 'lucide-react';
import { useState } from 'react';

interface BlacklistRuleInputProps {
  rules: string[];
  onChange: (rules: string[]) => void;
  placeholder?: string;
}

export function BlacklistRuleInput({ rules, onChange, placeholder }: BlacklistRuleInputProps) {
  const [input, setInput] = useState('');

  const addRule = () => {
    const value = input.trim();
    if (!value || rules.includes(value)) return;
    onChange([...rules, value]);
    setInput('');
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addRule()}
          placeholder={placeholder ?? 'Add pattern (e.g. ant-* or /regex/)'}
          className="flex-1 text-sm px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button onClick={addRule} className="p-1.5 rounded bg-blue-500 text-white hover:bg-blue-600">
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {rules.map((rule, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-sm font-mono"
          >
            {rule}
            <button onClick={() => removeRule(i)} className="hover:text-red-500">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
