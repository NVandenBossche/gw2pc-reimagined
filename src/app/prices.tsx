import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fetchBooks, fetchCoinsPerGem } from "../core/api";
import { REFRESH_MS } from "../core/catalog";
import { TRACKED_BOOK_IDS, computeTracked, type Books } from "../core/compute";
import { GEM_PROBE_COINS } from "../core/gems";

type State = {
  books: Books;
  coinsPerGem: number | null;
  tracked: Record<string, number>;
  updatedAt: number | null; // ms
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const Ctx = createContext<State | null>(null);

export function PricesProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Books>(new Map());
  const [coinsPerGem, setCoinsPerGem] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const [b, g] = await Promise.all([fetchBooks(TRACKED_BOOK_IDS), fetchCoinsPerGem(GEM_PROBE_COINS)]);
      setBooks(b);
      setCoinsPerGem(g);
      setUpdatedAt(Date.now());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the GW2 API");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const tracked = useMemo(() => computeTracked(books, coinsPerGem), [books, coinsPerGem]);
  const value = useMemo(
    () => ({ books, coinsPerGem, tracked, updatedAt, loading, error, refresh: () => void refresh() }),
    [books, coinsPerGem, tracked, updatedAt, loading, error, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrices(): State {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrices outside PricesProvider");
  return v;
}

/** Re-renders every `ms` so "updated X min ago" stays true. */
export function useNow(ms = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
