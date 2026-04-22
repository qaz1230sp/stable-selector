import { useState, useCallback, useRef, useEffect } from 'react';

export function useCopyToClipboard(resetDelay = 1500) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const copy = useCallback(
    async (text: string, key: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopiedKey(null), resetDelay);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        setCopiedKey(key);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopiedKey(null), resetDelay);
      }
    },
    [resetDelay],
  );

  return { copy, copiedKey };
}
