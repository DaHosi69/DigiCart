 // src/shared/route-history/RouteHistoryProvider.tsx
import { createContext, useContext, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type RouteHistoryContextValue = {
  prevPath: string | null;
  currentPath: string | null;
  // smartBack: geht zur vorherigen /home/lists/:id wenn vorhanden, sonst fallback
  smartBack: (fallback?: string) => void;
};

const RouteHistoryContext = createContext<RouteHistoryContextValue | undefined>(undefined);

export function RouteHistoryProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const prevPathRef = useRef<string | null>(null);
  const currentPathRef = useRef<string | null>(location.pathname);

  useEffect(() => {
    // current → prev, dann current aktualisieren
    prevPathRef.current = currentPathRef.current;
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  const smartBack = (fallback = "/home") => {
    const prev = prevPathRef.current ?? "";
    const isListDetail = /^\/home\/lists\/[^/]+$/i.test(prev);
    if (isListDetail) navigate(prev);
    else navigate(fallback, { replace: true });
  };

  const value = useMemo<RouteHistoryContextValue>(() => ({
    prevPath: prevPathRef.current,
    currentPath: currentPathRef.current,
    smartBack,
  }), [location.pathname]); // re-create when path changes so consumers update

  return (
    <RouteHistoryContext.Provider value={value}>
      {children}
    </RouteHistoryContext.Provider>
  );
}

export function useRouteHistory() {
  const ctx = useContext(RouteHistoryContext);
  if (!ctx) throw new Error("useRouteHistory must be used within RouteHistoryProvider");
  return ctx;
}
