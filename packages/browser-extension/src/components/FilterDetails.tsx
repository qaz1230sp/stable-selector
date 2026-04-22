import { Filter, CircleCheck, CircleX, AlertTriangle } from 'lucide-react';
import type { FilterDetail } from 'stable-selector';

interface FilterDetailsProps {
  details: FilterDetail[];
}

const REASON_LABELS: Record<string, string> = {
  'blacklist': 'Blacklist',
  'built-in': 'Built-in pattern',
  'user-pattern': 'User pattern',
  'heuristic': 'Heuristic',
  'framework-prefix': 'Framework',
};

export function FilterDetails({ details }: FilterDetailsProps) {
  if (details.length === 0) return null;

  const kept = details.filter((d) => d.status === 'kept');
  const filtered = details.filter((d) => d.status === 'filtered');

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Filter size={14} style={{ color: '#a0a0c0' }} />
        <span className="text-xs font-semibold" style={{ color: '#f0f0f5' }}>Filtered Attributes</span>
      </div>
      <div className="space-y-0.5 text-xxs">
        {kept.map((d, i) => (
          <div key={`k-${i}`} className="flex items-center gap-1.5">
            <CircleCheck size={11} style={{ color: '#8CC84B' }} className="shrink-0" />
            <span className="font-mono" style={{ color: '#f0f0f5' }}>{d.value}</span>
            <span style={{ color: '#a0a0c0' }}>({d.type})</span>
          </div>
        ))}
        {filtered.map((d, i) => (
          <div key={`f-${i}`} className="flex items-center gap-1.5">
            {d.reason === 'heuristic' ? (
              <AlertTriangle size={11} style={{ color: '#F5A623' }} className="shrink-0" />
            ) : (
              <CircleX size={11} style={{ color: '#E74C3C' }} className="shrink-0" />
            )}
            <span className="font-mono line-through opacity-60" style={{ color: '#f0f0f5' }}>{d.value}</span>
            <span style={{ color: '#a0a0c0' }}>
              ({REASON_LABELS[d.reason ?? ''] ?? d.reason})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
