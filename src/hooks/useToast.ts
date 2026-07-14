import { useCallback, useEffect, useRef, useState } from "react";

/** Ephemeral status line ("count is now in scope"), auto-clears after 2.4s. */
export function useToast(ms = 2400) {
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const say = useCallback((m: string) => {
    setNote(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(null), ms);
  }, [ms]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { note, say };
}
