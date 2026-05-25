import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin";
  tenantId: string;
  tenantName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface UserProfileRow {
  user_id: string;
  tenant_id: string;
  email: string | null;
  display_name: string | null;
}

function baseUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const email = session.user.email ?? "";
  return {
    id: session.user.id,
    email,
    name: email.split("@")[0].replace(/\W/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Usuário",
    role: "admin",
    tenantId: session.user.id,
    tenantName: "Elite Performance Club",
  };
}

function prettifyUserName(email: string) {
  return email.split("@")[0].replace(/\W/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Usuário";
}

export async function getVerifiedUserProfile() {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { user: null, profile: null, error: authError?.message ?? "Sessão inválida." };
    }

    const baseEmail = authData.user.email ?? "";
    const fallbackUser: AuthUser = {
      id: authData.user.id,
      email: baseEmail,
      name: prettifyUserName(baseEmail),
      role: "admin",
      tenantId: authData.user.id,
      tenantName: "Elite Performance Club",
    };

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id, tenant_id, email, display_name")
      .eq("user_id", authData.user.id)
      .maybeSingle<UserProfileRow>();

    if (profileError) {
      return { user: fallbackUser, profile: null, error: profileError.message };
    }

    if (!profile?.tenant_id) {
      return { user: fallbackUser, profile: null, error: "Perfil do utilizador ainda não foi provisionado." };
    }

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("name")
      .eq("owner_id", profile.tenant_id)
      .maybeSingle();

    return {
      user: {
        id: authData.user.id,
        email: profile.email ?? baseEmail,
        name: profile.display_name ?? prettifyUserName(profile.email ?? baseEmail),
        role: "admin",
        tenantId: profile.tenant_id,
        tenantName: orgError ? fallbackUser.tenantName : (orgData?.name ?? fallbackUser.tenantName),
      },
      profile,
      error: orgError?.message ?? null,
    };
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: error instanceof Error ? error.message : "Falha ao validar a autenticação.",
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const apply = async (session: Session | null) => {
      if (!active) return;

      const u = baseUser(session);
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(u);

      const hydrated = await getVerifiedUserProfile();
      if (!active) return;
      setUser(hydrated.user ?? u);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      void apply(session);
    });

    supabase.auth.getSession().then(({ data }) => {
      void apply(data.session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);


  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string) => {
    const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
