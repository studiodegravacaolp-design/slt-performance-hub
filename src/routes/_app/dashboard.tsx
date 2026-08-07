import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Dumbbell, MapPin, Users } from "lucide-react";

import { ActivityFeed } from "@/components/ActivityFeed";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/dashboard")({ component: DashboardPage });

type Totals = { athletes: number; workouts: number; branches: number; users: number };

function DashboardPage() {
  const { user } = useAuth();
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [athletes, workouts, branches, users] = await Promise.all([
        supabase.from("athletes").select("id", { count: "exact", head: true }),
        supabase.from("workouts").select("id", { count: "exact", head: true }),
        supabase
          .from("branches")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase.from("users").select("id", { count: "exact", head: true }),
      ]);
      setTotals({
        athletes: athletes.count ?? 0,
        workouts: workouts.count ?? 0,
        branches: branches.count ?? 0,
        users: users.count ?? 0,
      });
    })();
  }, [user]);

  const fmt = (value?: number) => (value === undefined ? "…" : value.toLocaleString("pt-BR"));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Fundação operacional</h2>
        <p className="text-sm text-muted-foreground">Visão do tenant autenticado no núcleo P0.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Atletas"
          value={fmt(totals?.athletes)}
          hint="cadastros acessíveis"
          icon={Users}
          accent="primary"
        />
        <StatCard
          label="Treinos"
          value={fmt(totals?.workouts)}
          hint="prescrições registradas"
          icon={Dumbbell}
          accent="accent"
        />
        <StatCard
          label="Filiais ativas"
          value={fmt(totals?.branches)}
          hint="escopo operacional"
          icon={MapPin}
          accent="success"
        />
        <StatCard
          label="Usuários"
          value={fmt(totals?.users)}
          hint="equipe e atletas"
          icon={Building2}
          accent="warning"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ambiente P0</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Empresa: <span className="font-medium text-foreground">{user?.tenantName}</span>
            </p>
            <p>
              Perfil: <span className="font-medium text-foreground">{user?.role}</span>
            </p>
            <p>Somente as sete entidades aprovadas da Fundação estão em operação.</p>
          </CardContent>
        </Card>
        <ActivityFeed />
      </div>
    </div>
  );
}
