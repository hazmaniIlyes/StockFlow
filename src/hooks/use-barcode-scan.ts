import { useRef, useEffect } from 'react';

/**
 * Listens for keyboard-buffered barcode scanner input.
 * Hardware scanners typically fire a burst of keydown events within ~50 ms
 * followed by an Enter key.  Regular keyboard typing is much slower, so the
 * 50 ms gap threshold reliably distinguishes scanner events from manual input.
 *
 * @param enabled  - When false the listener is detached
 * @param onScan   - Called with the full barcode string once Enter is received
 */
export function useBarcodeScan(enabled: boolean, onScan: (sku: string) => void): void {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const THRESHOLD_MS = 150;

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const now = Date.now();

      // Reset buffer if the gap since the last key exceeds the threshold
      // (i.e. this looks like normal typing, not a scanner burst)
      if (now - lastKeyTimeRef.current > THRESHOLD_MS) {
        bufferRef.current = '';
      }

      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim();
        bufferRef.current = '';
        if (scanned.length > 0) {
          onScan(scanned);
        }
        return;
      }

      // Ignore non-printable / modifier keys
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      bufferRef.current = '';
    };
  }, [enabled, onScan]);
}
