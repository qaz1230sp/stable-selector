import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { SelectorDisplay } from './SelectorDisplay';
import { ScoreBar } from './ScoreBar';
import type { ScoredCandidate } from 'stable-selector';

interface CandidateRowProps {
  index: number;
  candidate: ScoredCandidate;
  isBest: boolean;
}

export function CandidateRow({ index, candidate, isBest }: CandidateRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { formats, scores, strategy, total } = candidate;
  const displaySelector = formats.css || formats.xpath || formats.playwright || candidate.selector;

  return (
    <div style={{ borderBottom: '1px solid #454560' }} className={`last:border-b-0 ${isBest ? 'bg-panel-accent/5' : ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left transition-colors"
        style={{ color: '#f0f0f5', minWidth: 0 }}
      >
        {expanded ? (
          <ChevronDown size={12} style={{ color: '#a0a0c0' }} className="shrink-0" />
        ) : (
          <ChevronRight size={12} style={{ color: '#a0a0c0' }} className="shrink-0" />
        )}
        <span className="text-xxs shrink-0" style={{ color: '#a0a0c0', width: '14px' }}>{index + 1}</span>
        <span className="text-xxs shrink-0" style={{ color: '#5A9FE6', width: '52px' }}>{strategy}</span>
        <code className="text-xs font-mono shrink-0" style={{ color: '#a0a0c0', width: '32px', textAlign: 'right' }}>
          {total.toFixed(2)}
        </code>
      </button>

      {/* Selector preview below the header row */}
      <div className="px-3 pb-1.5" style={{ paddingLeft: '2.25rem' }}>
        <code
          className="text-xs font-mono block truncate"
          style={{ color: '#f0f0f5', opacity: expanded ? 0.5 : 1 }}
        >
          {displaySelector}
        </code>
      </div>

      {expanded && (
        <div className="px-3 pb-2 space-y-2">
          <div className="space-y-1 pl-6">
            {formats.css && (
              <SelectorDisplay format="CSS" value={formats.css} copyKey={`c${index}-css`} />
            )}
            {formats.xpath && (
              <SelectorDisplay format="XPath" value={formats.xpath} copyKey={`c${index}-xpath`} />
            )}
            {formats.playwright && (
              <SelectorDisplay format="Playwright" value={formats.playwright} copyKey={`c${index}-pw`} />
            )}
          </div>
          <div className="pl-6 space-y-0.5">
            <ScoreBar label="Unique" value={scores.uniqueness} />
            <ScoreBar label="Stable" value={scores.stability} />
            <ScoreBar label="Brief" value={scores.brevity} />
            <ScoreBar label="Read" value={scores.readability} />
          </div>
        </div>
      )}
    </div>
  );
}
