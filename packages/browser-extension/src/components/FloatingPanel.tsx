import { useState, useCallback, useRef, useEffect } from 'react';
import { PanelHeader } from './PanelHeader';
import { ElementSummary } from './ElementSummary';
import { BestSelector } from './BestSelector';
import { CandidateList } from './CandidateList';
import { FilterDetails } from './FilterDetails';
import type { ScoredCandidate, FilterDetail } from '@stable-selector/core';

export interface PanelData {
  element: {
    tagName: string;
    id?: string;
    classNames: string[];
  };
  candidates: ScoredCandidate[];
  filterDetails: FilterDetail[];
}

interface FloatingPanelProps {
  data: PanelData | null;
  onClose: () => void;
}

export function FloatingPanel({ data, onClose }: FloatingPanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    if (!data) return;
    const x = Math.min(window.innerWidth - 380, window.innerWidth * 0.6);
    const y = Math.max(20, window.innerHeight * 0.1);
    setPosition({ x, y });
    setInitialized(true);
  }, [data]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 360, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 40, dragRef.current.origY + dy)),
      });
    };

    const onUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [position]);

  if (!data || !initialized) return null;

  return (
    <div
      ref={panelRef}
      className="fixed w-[360px] max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#1e1e2e',
        borderColor: '#454560',
        borderWidth: '1px',
        borderStyle: 'solid',
        color: '#f0f0f5',
      }}
    >
      <PanelHeader onClose={onClose} onDragStart={onDragStart} />

      <ElementSummary
        tagName={data.element.tagName}
        id={data.element.id}
        classNames={data.element.classNames}
      />

      {data.candidates.length > 0 && (
        <>
          <div className="mx-3" style={{ borderTop: '1px solid #454560' }} />
          <BestSelector candidate={data.candidates[0]} allCandidates={data.candidates} />
        </>
      )}

      {data.candidates.length > 1 && (
        <>
          <div className="mx-3" style={{ borderTop: '1px solid #454560' }} />
          <CandidateList candidates={data.candidates} />
        </>
      )}

      {data.filterDetails.length > 0 && (
        <>
          <div className="mx-3" style={{ borderTop: '1px solid #454560' }} />
          <FilterDetails details={data.filterDetails} />
        </>
      )}

      <div className="h-2" />
    </div>
  );
}
