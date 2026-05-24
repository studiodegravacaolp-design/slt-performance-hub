import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, TrendingUp, Dumbbell, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const chartData = [
  { day: "Seg", sessoes: 42, adesao: 78 },
  { day: "Ter", sessoes: 55, adesao: 82 },
  { day: "Qua", sessoes: 48, adesao: 80 },
  { day: "Qui", sessoes: 67, adesao: 88 },
  { day: "Sex", sessoes: 72, adesao: 91 },
  { day: "Sáb", sessoes: 58, adesao: 85 },
  { day: "Dom", sessoes: 33, adesao: 70 },
];

function DashboardPage() {
  const { user } = useAuth();
  const [totalAth, setTotalAth] = useState<number | null>(null);
  const [ativos, setAtivos] = useState<number | null>(null);
  const [inadimplentes, setInadimplentes] = useState<number | null>(null);
  const [totalWk, setTotalWk] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [all, act, ina, wk] = await Promise.all([
        supabase.from("athletes").select("id", { count: "exact", head: true }),
        supabase.from("athletes").select("id", { count: "exact", head: true }).eq("plano", "Ativo"),
        supabase.from("athletes").select("id", { count: "exact", head: true }).eq("plano", "Inadimplente"),
        supabase.from("workouts").select("id", { count: "exact", head: true }),
      ]);
      setTotalAth(all.count ?? 0);
      setAtivos(act.count ?? 0);
      setInadimplentes(ina.count ?? 0);
      setTotalWk(wk.count ?? 0);
    })();
  }, [user]);

  const fmt = (n: number | null) => (n === null ? "…" : n.toLocaleString("pt-BR"));
  const adimplencia = totalAth && totalAth > 0
    ? `${(((totalAth - (inadimplentes ?? 0)) / totalAth) * 100).toFixed(1)}%`
    : "…";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Painel executivo</h2>
        <p className="text-sm text-muted-foreground">Visão geral da operação em tempo real.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Atletas ativos" value={fmt(ativos)} delta={12} hint={`${fmt(totalAth)} no total`} icon={Users} accent="primary" />
        <StatCard label="Taxa de adimplência" value={adimplencia} delta={2.1} hint="planos ativos" icon={TrendingUp} accent="success" />
        <StatCard label="Treinos prescritos" value={fmt(totalWk)} delta={8} hint="histórico do tenant" icon={Dumbbell} accent="accent" />
        <StatCard label="Sessões concluídas" value="3.812" delta={-3} hint="últimos 7 dias" icon={CheckCircle2} accent="warning" />
      </div>


      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução semanal</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.22 264)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.58 0.22 264)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.14 210)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.72 0.14 210)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="oklch(0.72 0.03 255)" />
                <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.72 0.03 255)" />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.245 0.04 264)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="sessoes" stroke="oklch(0.58 0.22 264)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="adesao" stroke="oklch(0.72 0.14 210)" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <ActivityFeed />
      </div>
    </div>
  );
}
