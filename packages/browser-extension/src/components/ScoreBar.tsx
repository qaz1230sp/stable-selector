interface ScoreBarProps {
  label: string;
  value: number;
}

export function ScoreBar({ label, value }: ScoreBarProps) {
  const pct = Math.round(value * 100);
  const hue = value > 0.7 ? 140 : value > 0.4 ? 45 : 0;

  return (
    <div className="flex items-center gap-2 text-xxs">
      <span className="w-16 shrink-0" style={{ color: '#a0a0c0' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#454560' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: `hsl(${hue}, 60%, 55%)`,
          }}
        />
      </div>
      <span className="w-8 text-right" style={{ color: '#a0a0c0' }}>{pct}%</span>
    </div>
  );
}
