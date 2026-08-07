import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type AuthorizationRole = "admin_tenant" | "manager" | "professor" | "athlete";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AuthorizationRole;
  tenantId: string;
  tenantName: string;
}

export interface VerifiedProfile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: AuthorizationRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isOperationalRole(role: string): role is AuthorizationRole {
  return ["admin_tenant", "manager", "professor", "athlete"].includes(role);
}

export async function getVerifiedUserProfile() {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { user: null, profile: null, error: authError?.message ?? "Sessão inválida." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, tenant_id, email, full_name, role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return {
        user: null,
        profile: null,
        error: profileError?.message ?? "Usuário ainda não foi provisionado na Fundação P0.",
      };
    }

    if (!isOperationalRole(profile.role)) {
      return { user: null, profile: null, error: "Papel sem acesso operacional à Fundação P0." };
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.tenant_id)
      .maybeSingle();

    if (companyError || !company) {
      return {
        user: null,
        profile: null,
        error: companyError?.message ?? "Empresa do usuário não está disponível.",
      };
    }

    const verifiedProfile = profile as VerifiedProfile;
    return {
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
        tenantId: profile.tenant_id,
        tenantName: company.name,
      } satisfies AuthUser,
      profile: verifiedProfile,
      error: null,
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
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const verified = await getVerifiedUserProfile();
      if (!active) return;
      setUser(verified.user);
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session);
    });

    void supabase.auth.getSession().then(({ data }) => apply(data.session));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const verified = await getVerifiedUserProfile();
    if (!verified.user) {
      await supabase.auth.signOut();
      throw new Error(verified.error ?? "Usuário sem acesso ao P0.");
    }
    setUser(verified.user);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
