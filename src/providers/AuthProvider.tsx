import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useLoading } from "@/contexts/LoadingContext";

type Role = "user" | "admin";
type Profile = {
  id: string;
  display_name: string;
  role: Role;
  auth_user_id: string;
};

type Ctx = {
  /** true während die Session initial aus Storage geladen wird */
  booting: boolean;
  /** true während das Profil geladen wird */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  booting: true,
  loading: true,
  session: null,
  profile: null,
  isAdmin: false,
  signOut: async () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { addTask, removeTask } = useLoading();
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // 1) Session initial aus Storage laden und auf Auth-Events hören
  useEffect(() => {
    addTask("auth-boot");
    let mounted = true;

    (async () => {
      // Eine künstliche Verzögerung ist hier eigentlich nicht mehr nötig,
      // da der globale Loading Screen das regelt (debounce).
      // Wir lassen sie kurz drin oder entfernen sie, um "schneller" zu sein.
      // Der User hat "warten bis alles fertig geladen ist" gesagt.
      // Wenn es zu schnell geht, greift der debounce.
      const loadSession = supabase.auth.getSession();

      const { data } = await loadSession;

      if (mounted) {
        setSession(data.session ?? null);
        setBooting(false); 
        removeTask("auth-boot");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, s: Session | null) => {
        switch (event) {
          case "INITIAL_SESSION":
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
            setSession(s ?? null);
            break;

          case "SIGNED_OUT":
            setSession(null);
            setProfile(null);
            break;

          case "PASSWORD_RECOVERY":
            // optional: Reset-UI öffnen
            break;

          default:
            // nothing
            break;
        }
      },
    );

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
      // Falls wir unmounten bevor fertig:
      removeTask("auth-boot");
    };
  }, [addTask, removeTask]);

  // 2) Profil laden, wenn sich der User ändert
  useEffect(() => {
    addTask("auth-profile");
    let active = true;
    (async () => {
      setLoading(true);

      const userId = session?.user?.id;
      if (!userId) {
        if (active) {
          setProfile(null);
          setLoading(false);
          removeTask("auth-profile");
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, auth_user_id")
        .eq("auth_user_id", userId)
        .maybeSingle<Profile>();

      if (!active) return;

      if (error) {
        setProfile(null);
      } else {
        setProfile(data ?? null);
      }
      setLoading(false);
      removeTask("auth-profile");
    })();

    return () => {
      active = false;
      removeTask("auth-profile");
    };
  }, [session?.user?.id, addTask, removeTask]);

  const value = useMemo<Ctx>(
    () => ({
      booting,
      loading,
      session,
      profile,
      isAdmin: profile?.role === "admin",
      signOut: async () => {
        // Task hinzufügen, damit man beim Logout kurz den Screen sieht?
        // Geschmacksache. 
        await supabase.auth.signOut();
      },
    }),
    [booting, loading, session, profile],
  );

  return (
    <AuthCtx.Provider value={value}>
      {/* Wir rendern children immer, aber wenn booting true ist, 
          zeigen wir vielleicht nichts an, damit im Hintergrund 
          nicht schon "Login" aufblitzt. */}
      {booting ? null : children}
    </AuthCtx.Provider>
  );
}
