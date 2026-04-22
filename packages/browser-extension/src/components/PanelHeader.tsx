import { Crosshair, X } from 'lucide-react';

interface PanelHeaderProps {
  onClose: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export function PanelHeader({ onClose, onDragStart }: PanelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 cursor-move select-none rounded-t-lg"
      style={{ backgroundColor: '#282842', borderBottom: '1px solid #454560' }}
      onMouseDown={onDragStart}
    >
      <div className="flex items-center gap-2">
        <Crosshair size={16} style={{ color: '#5A9FE6' }} />
        <span className="text-sm font-semibold" style={{ color: '#f0f0f5' }}>stable-selector</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1 rounded hover:bg-panel-border transition-colors"
        title="Close (Esc)"
        aria-label="Close panel"
      >
        <X size={14} style={{ color: '#a0a0c0' }} />
      </button>
    </div>
  );
}
