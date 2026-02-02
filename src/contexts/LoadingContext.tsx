import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

type LoadingCtx = {
  addTask: (id: string) => void;
  removeTask: (id: string) => void;
  isLoading: boolean;
};

const LoadingContext = createContext<LoadingCtx>({
  addTask: () => {},
  removeTask: () => {},
  isLoading: false,
});

export const useLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeTasks, setActiveTasks] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);

  const addTask = useCallback((id: string) => {
    setActiveTasks((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Sofort sichtbar machen, wenn eine Task hinzu kommt
    setIsVisible(true);
  }, []);

  const removeTask = useCallback((id: string) => {
    setActiveTasks((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const hasTasks = activeTasks.size > 0;

  // Debounce logic für das Ausblenden
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (!hasTasks) {
      // Wenn keine Tasks mehr da sind, warten wir kurz, bevor wir ausblenden
      // Das verhindert Flackern, wenn zwischen Tasks kurze Lücken sind.
      timeout = setTimeout(() => {
        setIsVisible(false);
      }, 300); // 300ms Grace Period
    } else {
      // Wenn Tasks da sind, sofort sichtbar lassen/machen
      setIsVisible(true);
    }

    return () => clearTimeout(timeout);
  }, [hasTasks]);

  const value = useMemo(
    () => ({
      addTask,
      removeTask,
      isLoading: isVisible,
    }),
    [addTask, removeTask, isVisible],
  );

  return (
    <LoadingContext.Provider value={value}>
      {isVisible && <LoadingScreen />}
      {children}
    </LoadingContext.Provider>
  );
}
