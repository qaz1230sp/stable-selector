import { Star } from 'lucide-react';
import { SelectorDisplay } from './SelectorDisplay';
import type { ScoredCandidate } from 'stable-selector';

interface BestSelectorProps {
  candidate: ScoredCandidate;
  allCandidates: ScoredCandidate[];
}

/** Merge formats: use best candidate's formats, fill gaps from other candidates */
function mergeFormats(candidates: ScoredCandidate[]) {
  const merged = { css: '', xpath: '', playwright: '' };
  for (const key of ['css', 'xpath', 'playwright'] as const) {
    for (const c of candidates) {
      if (c.formats[key]) {
        merged[key] = c.formats[key]!;
        break;
      }
    }
  }
  return merged;
}

export function BestSelector({ candidate, allCandidates }: BestSelectorProps) {
  const formats = mergeFormats(allCandidates);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Star size={14} style={{ color: '#F5A623' }} />
        <span className="text-xs font-semibold" style={{ color: '#f0f0f5' }}>Best Selector</span>
        <span className="text-xxs ml-auto" style={{ color: '#a0a0c0' }}>
          score: {candidate.total.toFixed(2)}
        </span>
      </div>
      <div className="space-y-1">
        {formats.css && (
          <SelectorDisplay format="CSS" value={formats.css} copyKey="best-css" />
        )}
        {formats.xpath && (
          <SelectorDisplay format="XPath" value={formats.xpath} copyKey="best-xpath" />
        )}
        {formats.playwright && (
          <SelectorDisplay format="Playwright" value={formats.playwright} copyKey="best-pw" />
        )}
      </div>
    </div>
  );
}
