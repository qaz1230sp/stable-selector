interface ElementSummaryProps {
  tagName: string;
  id?: string;
  classNames: string[];
}

export function ElementSummary({ tagName, id, classNames }: ElementSummaryProps) {
  const idPart = id ? `#${id}` : '';
  const classPart = classNames.length > 0
    ? '.' + classNames.slice(0, 3).join('.')
    : '';
  const overflow = classNames.length > 3 ? ` +${classNames.length - 3}` : '';

  return (
    <div className="px-3 py-2 text-xs">
      <span style={{ color: '#a0a0c0' }}>Element: </span>
      <code className="font-mono" style={{ color: '#f0f0f5' }}>
        &lt;{tagName}{idPart}{classPart}{overflow}&gt;
      </code>
    </div>
  );
}
