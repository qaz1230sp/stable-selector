import { BarChart3 } from 'lucide-react';
import { CandidateRow } from './CandidateRow';
import type { ScoredCandidate } from '@stable-selector/core';

interface CandidateListProps {
  candidates: ScoredCandidate[];
}

export function CandidateList({ candidates }: CandidateListProps) {
  if (candidates.length <= 1) return null;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 size={14} style={{ color: '#a0a0c0' }} />
        <span className="text-xs font-semibold" style={{ color: '#f0f0f5' }}>
          All Candidates ({candidates.length})
        </span>
      </div>
      <div className="rounded overflow-hidden" style={{ border: '1px solid #454560' }}>
        {candidates.map((c, i) => (
          <CandidateRow key={i} index={i} candidate={c} isBest={i === 0} />
        ))}
      </div>
    </div>
  );
}
