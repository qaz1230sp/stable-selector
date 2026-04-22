import { useState, useRef, useEffect } from 'react';
import { Copy, Check, CircleCheck, CircleX, ScanSearch } from 'lucide-react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { verifySelector } from '../modules/selector-verifier';

interface SelectorDisplayProps {
  format: string;
  value: string;
  copyKey: string;
}

type VerifyState = 'idle' | 'success' | 'fail';

export function SelectorDisplay({ format, value, copyKey }: SelectorDisplayProps) {
  const { copy, copiedKey } = useCopyToClipboard();
  const isCopied = copiedKey === copyKey;
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [matchCount, setMatchCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleVerify() {
    const result = verifySelector(format, value);
    setMatchCount(result.matchCount);
    setVerifyState(result.success ? 'success' : 'fail');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVerifyState('idle'), 2000);
  }

  return (
    <div className="flex items-center gap-2 group" style={{ minWidth: 0 }}>
      <span className="text-xxs font-medium shrink-0" style={{ color: '#5A9FE6', width: '68px' }}>
        {format}
      </span>
      <code
        className="text-xs font-mono px-2 py-1 rounded"
        style={{
          color: '#f0f0f5',
          backgroundColor: '#1e1e2e',
          flex: '1 1 0',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </code>

      {/* Verify button — only for CSS/XPath (Playwright selectors need Playwright runtime) */}
      {format !== 'Playwright' && (
        <button
          onClick={handleVerify}
          className="p-1 rounded transition-colors shrink-0"
          title={
            verifyState === 'success'
              ? `Matched ${matchCount} element${matchCount > 1 ? 's' : ''}`
              : verifyState === 'fail'
                ? 'No match found'
                : 'Verify selector'
          }
          aria-label="Verify selector"
          style={{ position: 'relative' }}
        >
          {verifyState === 'success' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <CircleCheck size={14} style={{ color: '#4CAF50' }} />
              {matchCount > 1 && (
                <span style={{ fontSize: '10px', color: '#F5A623', fontWeight: 600 }}>
                  {matchCount}
                </span>
              )}
            </span>
          ) : verifyState === 'fail' ? (
            <CircleX size={14} style={{ color: '#F44336' }} />
          ) : (
            <ScanSearch size={14} style={{ color: '#a0a0c0' }} />
          )}
        </button>
      )}

      {/* Copy button */}
      <button
        onClick={() => copy(value, copyKey)}
        className="p-1 rounded transition-colors shrink-0"
        title={isCopied ? 'Copied!' : 'Copy to clipboard'}
        aria-label={isCopied ? 'Copied' : 'Copy to clipboard'}
      >
        {isCopied ? (
          <Check size={14} style={{ color: '#8CC84B' }} />
        ) : (
          <Copy size={14} style={{ color: '#a0a0c0' }} />
        )}
      </button>
    </div>
  );
}
