import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: "admin" | "barber" | null;
  barberName: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_ROLES: Record<string, { role: "admin" | "barber"; name: string }> = {
  "franco@alphamens.com.br": { role: "admin", name: "Adriano" },
  "gabriel.santos@alphamens.com.br": { role: "barber", name: "Gabriel Santos" },
  "gabriel.oliveira@alphamens.com.br": { role: "barber", name: "Gabriel Oliveira" },
  "gustavo@alphamens.com.br": { role: "barber", name: "Gustavo" },
  "arthur@alphamens.com.br": { role: "barber", name: "Arthur Fontes" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const userRoleData = user?.email ? USER_ROLES[user.email.toLowerCase()] : null;
  const role = userRoleData?.role ?? null;
  const barberName = userRoleData?.name ?? null;

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, barberName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
