import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Activity,
  Accessibility,
  Dumbbell,
  Waves,
  Footprints,
  Trophy,
  CircleDot,
  Brain,
  TrendingUp,
  Ruler,
  Weight,
  CalendarCheck,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SPORT_LABEL, rowToAthlete, type Sport, type Athlete, type AthleteRow } from "@/lib/athletes-data";
import { supabase } from "@/integrations/supabase/client";
import { getVerifiedUserProfile, useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { withRetry } from "@/lib/retry";


import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export const Route = createFileRoute("/_app/athletes_/$athleteId/prescribe")({
  component: PrescribePage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      title="Não foi possível renderizar a prescrição."
    />
  ),
  notFoundComponent: () => (
    <RouteErrorBoundary
      error={new Error("Atleta não encontrado ou sem permissão de acesso.")}
      reset={() => {}}
      title="Atleta não encontrado."
    />
  ),
});

const SPORT_ICON: Record<Sport, typeof Dumbbell> = {
  musculacao: Dumbbell,
  natacao: Waves,
  corrida: Footprints,
  futebol: Trophy,
  tenis: CircleDot,
  paradesporto: Accessibility,
};
const SPORT_TONE: Record<Sport, string> = {
  musculacao: "bg-primary/15 text-primary ring-primary/30",
  natacao: "bg-accent/15 text-accent ring-accent/30",
  corrida: "bg-warning/15 text-warning ring-warning/30",
  futebol: "bg-success/15 text-success ring-success/30",
  tenis: "bg-chart-5/15 text-chart-5 ring-chart-5/30",
  paradesporto: "bg-primary/15 text-primary ring-primary/30",
};

type Block = {
  id: string;
  nome: string;
  detalhe: string;
};

const uid = () => Math.random().toString(36).slice(2, 9);

function PrescribePage() {
  const { athleteId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [blocksWarning, setBlocksWarning] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiFocus, setAiFocus] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([
    { id: uid(), nome: "Aquecimento", detalhe: "10 min — mobilidade geral, ativação neural" },
  ]);

  const loadPrescription = useCallback(async () => {
    setLoading(true);
    setLoadingBlocks(true);
    setLoadError(null);
    setBlocksWarning(null);
    setProfileError(null);

    try {
      const verified = await getVerifiedUserProfile();

      if (!verified.user || !verified.profile?.tenant_id) {
        setAthlete(null);
        setProfileError(verified.error ?? "Perfil do utilizador não está disponível.");
        return;
      }

      const tenantId = verified.profile.tenant_id;
      const [athleteRes, workoutRes] = await Promise.all([
        withRetry(
          async () =>
            await supabase
              .from("athletes")
              .select("*")
              .eq("id", athleteId)
              .eq("tenant_id", tenantId)
              .maybeSingle(),
          { onAttempt: (n) => toast.message(`Reconectando (tentativa ${n})...`) },
        ),
        withRetry(
          async () =>
            await supabase
              .from("workouts")
              .select("blocks, title, created_at")
              .eq("athlete_id", athleteId)
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
        ),
      ]);

      const { data: athleteData, error: athleteError } = athleteRes;
      const { data: workoutData, error: workoutError } = workoutRes;

      if (athleteError) {
        setAthlete(null);
        setLoadError(athleteError.message);
        toast.error(`Falha ao carregar atleta: ${athleteError.message}`);
        return;
      }

      const mappedAthlete = athleteData ? rowToAthlete(athleteData as AthleteRow) : null;
      setAthlete(mappedAthlete);

      if (!mappedAthlete) {
        setLoadError("Atleta não encontrado ou sem permissão de acesso.");
        return;
      }

      if (workoutError) {
        setBlocks([{ id: uid(), nome: "Aquecimento", detalhe: "10 min — mobilidade geral, ativação neural" }]);
        setBlocksWarning(`Treino anterior indisponível: ${workoutError.message}`);
        return;
      }

      const safeBlocks = Array.isArray(workoutData?.blocks)
        ? (workoutData?.blocks as Array<Partial<Block>>) : [];

      setBlocks(
        safeBlocks?.map((block, index) => ({
          id: typeof block?.id === "string" ? block.id : uid(),
          nome: typeof block?.nome === "string" && block.nome.trim() ? block.nome : `Bloco ${index + 1}`,
          detalhe: typeof block?.detalhe === "string" ? block.detalhe : "",
        })) ?? [],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível abrir a área de prescrição.";
      setAthlete(null);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingBlocks(false);
    }
  }, [athleteId]);

  useEffect(() => {
    void loadPrescription();
  }, [loadPrescription]);

  const trend = useMemo(() => {
    if (!athlete) return { delta: 0, pct: 0, up: true };
    const first = athlete.telemetria[0]?.valor ?? 0;
    const last = athlete.telemetria.at(-1)?.valor ?? 0;
    const delta = last - first;
    const pct = first ? (delta / first) * 100 : 0;
    return { delta, pct, up: delta >= 0 };
  }, [athlete]);


  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="rounded-2xl border border-border/60 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="space-y-3">
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-4 w-56" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 w-24" />
              <Skeleton className="h-16 w-24" />
              <Skeleton className="h-16 w-24" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[260px] lg:col-span-2" />
          <Skeleton className="h-[260px]" />
        </div>
      </div>
    );
  }

  if (profileError || loadError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/athletes" })}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Atletas
          </Button>
        </div>
        <Card className="border-border/60 bg-card/60">
          <CardContent className="grid min-h-[280px] place-items-center p-6 text-center">
            <div className="max-w-md space-y-2">
              <p className="font-display text-xl font-semibold">Não foi possível abrir a prescrição.</p>
              <p className="text-sm text-muted-foreground">{profileError ?? loadError}</p>
              <div className="flex justify-center gap-2 pt-3">
                <Button variant="outline" onClick={() => navigate({ to: "/athletes" })}>
                  Voltar para atletas
                </Button>
                <Button onClick={() => void loadPrescription()} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Tentar novamente
                </Button>

              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <div>
          <p className="text-muted-foreground">Atleta não encontrado.</p>
          <Button asChild variant="link" className="mt-2">
            <Link to="/athletes">Voltar para Atletas</Link>
          </Button>
        </div>
      </div>
    );
  }

  const Icon = SPORT_ICON[athlete.modalidade];
  const tone = SPORT_TONE[athlete.modalidade];


  const savePrescription = async () => {
    if (!user) {
      toast.error("Você precisa estar autenticado para salvar.");
      return;
    }
    setSaving(true);
    try {
      const verified = await getVerifiedUserProfile();
      if (!verified.user || !verified.profile?.tenant_id) {
        toast.error(verified.error ?? "Perfil do utilizador não está pronto para salvar.");
        return;
      }

      const safeBlocks = blocks?.map((block) => ({
        id: block.id,
        nome: block.nome,
        detalhe: block.detalhe,
      })) ?? [];

      const { error } = await supabase.from("workouts").insert({
        tenant_id: verified.profile.tenant_id,
        athlete_id: athlete.id,
        sport: athlete.modalidade,
        title: `Prescrição — ${athlete.nome}`,
        blocks: safeBlocks as unknown as never,
      });

      if (error) {
        toast.error(`Falha ao salvar: ${error.message}`);
        return;
      }

      toast.success("Prescrição salva no banco de dados");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar a prescrição.");
    } finally {
      setSaving(false);
    }
  };




  const runDiagnosis = () => {
    setAiLoading(true);
    setAiAnalysis(null);
    setTimeout(() => {
      const { analysis, focus, plan } = diagnose(athlete);
      setAiAnalysis(analysis);
      setAiFocus(focus);
      setBlocks(plan);
      setAiLoading(false);
      toast.success("Diagnóstico de evolução concluído pela IA");
    }, 1100);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/athletes" })}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Atletas
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Prontuário de prescrição</span>
      </div>

      {/* Header card */}
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/5 animate-scale-in">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1 ${tone}`}
              >
                <Icon className="h-7 w-7" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  {athlete.nome}
                </h1>
                <p className="text-sm text-muted-foreground">{athlete.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className={tone}>
                    <Icon className="mr-1 h-3 w-3" />
                    {SPORT_LABEL[athlete.modalidade]}
                  </Badge>
                  {athlete.classificacao && (
                    <Badge
                      variant="outline"
                      className="bg-accent/10 text-accent ring-1 ring-accent/30"
                    >
                      <Accessibility className="mr-1 h-3 w-3" />
                      {athlete.classificacao}
                    </Badge>
                  )}
                  <Badge variant="outline">Plano {athlete.plano}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <Stat icon={Ruler} label="Altura" value={`${athlete.altura} cm`} />
              <Stat icon={Weight} label="Peso" value={`${athlete.peso} kg`} />
              <Stat
                icon={CalendarCheck}
                label="Última avaliação"
                value={athlete.ultimaAvaliacao}
              />
            </div>
          </div>

          {athlete.restricoes && (
            <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
                <Accessibility className="h-3.5 w-3.5" />
                Histórico privado — Restrições / Paradesporto
              </div>
              <p className="mt-2 text-sm text-foreground/90">{athlete.restricoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Telemetry + AI */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Activity className="h-4 w-4 text-accent" />
                Evolução técnica recente
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {athlete.metricaLabel} ({athlete.metricaUnidade}) — últimas 6 semanas
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                trend.up
                  ? "bg-success/10 text-success ring-success/30"
                  : "bg-destructive/10 text-destructive ring-destructive/30"
              }
            >
              <TrendingUp
                className={`mr-1 h-3 w-3 ${trend.up ? "" : "rotate-180"}`}
              />
              {trend.up ? "+" : ""}
              {trend.pct.toFixed(1)}%
            </Badge>
          </CardHeader>
          <CardContent className="h-[200px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={athlete.telemetria} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={36} />
                <RTooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(var(--accent))", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-accent/30 bg-gradient-to-br from-primary/10 to-accent/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Brain className="h-4 w-4 text-accent" />
              Diagnóstico IA
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Lê o histórico do atleta e prescreve correções.
            </p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              A IA analisa as últimas semanas de telemetria, restrições e modalidade
              para sugerir blocos focados em pontos fracos.
            </p>
            <Button
              onClick={runDiagnosis}
              disabled={aiLoading}
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow hover:opacity-90"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Diagnóstico de Evolução por IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis box */}
      {aiAnalysis && (
        <Card className="border-accent/40 bg-gradient-to-br from-accent/10 via-card to-primary/10 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base text-accent">
              <Sparkles className="h-4 w-4" /> Análise da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-foreground/90">{aiAnalysis}</p>
            {aiFocus.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aiFocus.map((f) => (
                  <Badge
                    key={f}
                    variant="outline"
                    className="bg-background/60 text-accent ring-1 ring-accent/30"
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Blocks editor */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-base">
              Planilha de prescrição — {SPORT_LABEL[athlete.modalidade]}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {blocks.length} bloco{blocks.length > 1 ? "s" : ""} configurado
              {blocks.length > 1 ? "s" : ""}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {blocksWarning && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              {blocksWarning}
            </div>
          )}
          {loadingBlocks && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <Skeleton className="mb-3 h-8 w-40" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          )}
          {!loadingBlocks && blocks.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-4 text-sm text-muted-foreground">
              Nenhum bloco salvo ainda. Você pode iniciar pelo diagnóstico de IA ou adicionar atividades manualmente.
            </div>
          )}
          {!loadingBlocks && (blocks?.map((b, i) => (
            <div
              key={b.id}
              className="rounded-xl border border-border/60 bg-background/40 p-4 animate-fade-in"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/20 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <Input
                    value={b.nome}
                    onChange={(e) =>
                      setBlocks((arr) =>
                        arr.map((x) => (x.id === b.id ? { ...x, nome: e.target.value } : x)),
                      )
                    }
                    className="h-8 max-w-sm border-transparent bg-transparent px-2 text-sm focus-visible:border-border focus-visible:bg-background/60"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={blocks.length === 1}
                  onClick={() => setBlocks((arr) => arr.filter((x) => x.id !== b.id))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Detalhe da atividade
                </Label>
                <Textarea
                  value={b.detalhe}
                  onChange={(e) =>
                    setBlocks((arr) =>
                      arr.map((x) =>
                        x.id === b.id ? { ...x, detalhe: e.target.value } : x,
                      ),
                    )
                  }
                  className="min-h-[60px] bg-background/40"
                />
              </div>
            </div>
          )) ?? [])}
          <Button
            variant="outline"
            onClick={() =>
              setBlocks((arr) => [
                ...arr,
                { id: uid(), nome: `Bloco ${arr.length + 1}`, detalhe: "" },
              ])
            }
            className="w-full gap-2 border-dashed border-accent/40 text-accent hover:bg-accent/10 hover:text-accent"
          >
            <Plus className="h-4 w-4" /> Adicionar Atividade
          </Button>

          <div className="flex justify-end pt-2">
            <Button
              onClick={savePrescription}
              disabled={saving}
              className="shadow-glow"
            >
              {saving ? "Salvando..." : "Salvar prescrição"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 font-display text-base font-semibold">{value}</div>
    </div>
  );
}

function diagnose(a: Athlete): {
  analysis: string;
  focus: string[];
  plan: Block[];
} {
  const last = a.telemetria.at(-1)?.valor ?? 0;
  const prev = a.telemetria.at(-2)?.valor ?? last;
  const decline = last < prev;

  switch (a.modalidade) {
    case "natacao":
      return {
        analysis: decline
          ? `Identificada queda de rendimento nos metros finais. ${a.nome} mostra perda de pace na parte final dos 100m livre — provável fadiga de tronco e perda de eficiência de virada.`
          : `Evolução técnica consistente em ${a.metricaLabel.toLowerCase()}. Próximo ciclo deve focar em explosão de saída e velocidade pura nos 50m finais.`,
        focus: ["Resistência específica", "Virada e saída", a.classificacao ? "Adaptação paradesporto" : "Pace 50m final"],
        plan: [
          { id: uid(), nome: "Aquecimento técnico", detalhe: "400m livre progressivo + 200m drills de pegada" },
          { id: uid(), nome: "Série de tiros — correção", detalhe: "8x50m livre forte, intervalo 00:45 — foco no acabamento dos últimos 15m" },
          { id: uid(), nome: "Virada e saída", detalhe: "6x25m saída de bloco + virada explosiva, descanso 1min" + (a.classificacao ? " (adaptar saída conforme classe S9)" : "") },
          { id: uid(), nome: "Volta à calma", detalhe: "200m costas suave + respiração 4-tempos" },
        ],
      };
    case "corrida":
      return {
        analysis: decline
          ? `Queda de pace identificada nas últimas semanas. ${a.nome} apresenta sinais de overreaching — necessidade de bloco regenerativo antes de novo aumento de carga.`
          : `Curva de pace em melhora. Foco do próximo microciclo: estabilidade no limiar e economia de corrida.`,
        focus: ["Limiar anaeróbico", "Economia de corrida", "Recuperação ativa"],
        plan: [
          { id: uid(), nome: "Aquecimento progressivo", detalhe: "2km a 6:00/km + 4 educativos 80m" },
          { id: uid(), nome: "Série principal", detalhe: "5x1000m no pace de limiar (~4:30/km), pausa 200m trote" },
          { id: uid(), nome: "Cadência", detalhe: "4x30s em cadência 180spm, trote 2min entre" },
          { id: uid(), nome: "Volta à calma", detalhe: "1km regenerativo + alongamento dinâmico 10min" },
        ],
      };
    case "musculacao":
      return {
        analysis: decline
          ? `Estagnação de carga detectada. Recomendado deload de 1 semana e ajuste de volume.`
          : `Necessidade de fortalecimento na amplitude de movimento. ${a.nome} responde bem a carga progressiva — incluir tempo sob tensão na fase excêntrica.`,
        focus: ["Amplitude completa", "Tempo sob tensão", "Core estabilizador"],
        plan: [
          { id: uid(), nome: "Mobilidade ativa", detalhe: "10 min — quadril, tornozelo e torácica" },
          { id: uid(), nome: "Força principal — Agachamento", detalhe: "5x5 @ 80% 1RM, tempo 3-1-1, descanso 2min" },
          { id: uid(), nome: "Acessório — Stiff", detalhe: "4x8 com foco em amplitude completa, carga moderada" },
          { id: uid(), nome: "Core", detalhe: "3 séries — prancha 45s + dead bug 12 reps" },
        ],
      };
    case "paradesporto":
      return {
        analysis: `Análise do histórico de propulsão de ${a.nome} (${a.classificacao}). Necessidade de fortalecimento da musculatura escapular e melhora da fase de empurre. Atenção às restrições registradas no prontuário.`,
        focus: ["Propulsão escapular", "Resistência específica", "Prevenção de lesão"],
        plan: [
          { id: uid(), nome: "Ativação escapular", detalhe: "3x12 retração + rotação externa com elástico" },
          { id: uid(), nome: "Força específica", detalhe: "4x6 supino fechado @ carga moderada — controle excêntrico" },
          { id: uid(), nome: "Propulsão sprint", detalhe: "6x100m em cadeira de pista, recuperação 3min — foco em fase de empurre" },
          { id: uid(), nome: "Mobilidade e cuidado", detalhe: "Alongamento de peitoral, liberação miofascial. Atenção: " + (a.restricoes ?? "seguir restrições registradas.") },
        ],
      };
    case "tenis":
      return {
        analysis: `Aproveitamento de saque em evolução. Próximo bloco deve consolidar consistência sob pressão e variação de altura de bote.`,
        focus: ["Saque consistente", "Fundo de quadra", "Deslocamento lateral"],
        plan: [
          { id: uid(), nome: "Aquecimento técnico", detalhe: "10 min mini-tênis + mobilidade de ombro" },
          { id: uid(), nome: "Saque foco", detalhe: "30 saques alvo T + 30 alvo abertos — anotar % de acerto" },
          { id: uid(), nome: "Fundo de quadra", detalhe: "20 min troca cruzada profunda, intensidade moderada-alta" },
          { id: uid(), nome: "Jogo simulado", detalhe: "Set curto a 4 games — pressão de placar" },
        ],
      };
    default:
      return {
        analysis: decline
          ? `Queda na presença e engajamento. Recomenda-se conversa de retomada e bloco mais lúdico nas próximas sessões.`
          : `Bom engajamento. Manter rotina e introduzir desafios técnicos novos.`,
        focus: ["Engajamento", "Tomada de decisão", "Condicionamento específico"],
        plan: [
          { id: uid(), nome: "Ativação", detalhe: "10 min mobilidade + coordenação com bola" },
          { id: uid(), nome: "Técnico", detalhe: "25 min — posse e transição em espaço reduzido" },
          { id: uid(), nome: "Jogo reduzido", detalhe: "20 min 4x4 com regras de finalização rápida" },
          { id: uid(), nome: "Volta à calma", detalhe: "10 min alongamento e feedback do treino" },
        ],
      };
  }
}
