import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

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
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // 1) Session initial aus Storage laden und auf Auth-Events hören
  useEffect(() => {
    let mounted = true;

    (async () => {
      const minLoadTime = new Promise((resolve) => setTimeout(resolve, 850)); // Minimum 2 seconds loading
      const loadSession = supabase.auth.getSession();

      const [_, { data }] = await Promise.all([minLoadTime, loadSession]);

      if (mounted) {
        setSession(data.session ?? null);
        setBooting(false); // Session ist jetzt initial bekannt (auch wenn null)
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, s: Session |  null) => {
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
    };
  }, []);

  // 2) Profil laden, wenn sich der User ändert
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);

      const userId = session?.user?.id;
      if (!userId) {
        if (active) {
          setProfile(null);
          setLoading(false);
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
        // Optional: console.warn("profiles load error", error);
        setProfile(null);
      } else {
        setProfile(data ?? null);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const value = useMemo<Ctx>(
    () => ({
      booting,
      loading,
      session,
      profile,
      isAdmin: profile?.role === "admin",
      signOut: async () => {
        await supabase.auth.signOut();
        // Navigation machst du am Button (navigate("/login"))
      },
    }),
    [booting, loading, session, profile],
  );

  return (
    <AuthCtx.Provider value={value}>
      {/* Während booting NICHT redirecten → sonst flackern */}
      {booting ? <LoadingScreen /> : children}
    </AuthCtx.Provider>
  );
}
