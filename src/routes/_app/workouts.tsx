import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Dumbbell,
  Sparkles,
  Plus,
  Trash2,
  Waves,
  Footprints,
  Trophy,
  CircleDot,
  Accessibility,
  Loader2,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workouts")({
  component: WorkoutsPage,
});

type Sport =
  | "musculacao"
  | "natacao"
  | "corrida"
  | "futebol"
  | "tenis"
  | "paradesporto";

const SPORTS: Record<
  Sport,
  { label: string; icon: typeof Dumbbell; tone: string }
> = {
  musculacao: {
    label: "Musculação / Crossfit",
    icon: Dumbbell,
    tone: "bg-primary/15 text-primary ring-primary/30",
  },
  natacao: {
    label: "Natação",
    icon: Waves,
    tone: "bg-accent/15 text-accent ring-accent/30",
  },
  corrida: {
    label: "Corrida / Atletismo",
    icon: Footprints,
    tone: "bg-warning/15 text-warning ring-warning/30",
  },
  futebol: {
    label: "Futebol",
    icon: Trophy,
    tone: "bg-success/15 text-success ring-success/30",
  },
  tenis: {
    label: "Tênis",
    icon: CircleDot,
    tone: "bg-chart-5/15 text-chart-5 ring-chart-5/30",
  },
  paradesporto: {
    label: "Paradesporto",
    icon: Accessibility,
    tone: "bg-primary/15 text-primary ring-primary/30",
  },
};

type Block = {
  id: string;
  // shared
  nome?: string;
  // musc/para
  exercicio?: string;
  series?: string;
  reps?: string;
  carga?: string;
  restricao?: string;
  // natação
  distanciaM?: string;
  estilo?: string;
  intervalo?: string;
  // corrida
  distanciaKm?: string;
  tempoAlvo?: string;
  pace?: string;
  // futebol / tênis (genérico)
  duracao?: string;
  intensidade?: string;
  foco?: string;
};

const uid = () => Math.random().toString(36).slice(2, 9);

function emptyBlock(): Block {
  return { id: uid() };
}

function WorkoutsPage() {
  const [sport, setSport] = useState<Sport>("musculacao");
  const [blocks, setBlocks] = useState<Block[]>([emptyBlock()]);
  const [aiOpen, setAiOpen] = useState(false);

  const sportMeta = SPORTS[sport];
  const Icon = sportMeta.icon;

  const update = (id: string, patch: Partial<Block>) =>
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const remove = (id: string) =>
    setBlocks((b) => (b.length === 1 ? b : b.filter((x) => x.id !== id)));

  const add = () => setBlocks((b) => [...b, emptyBlock()]);

  const onAiGenerate = (mock: Block[]) => {
    setBlocks(mock);
    toast.success("Periodização sugerida pela IA aplicada à planilha.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Editor de Periodização
          </h2>
          <p className="text-sm text-muted-foreground">
            Multiesporte e inclusivo — prescreva blocos de atividade adaptados ao
            esporte do atleta.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="sport" className="text-xs text-muted-foreground">
              Modalidade
            </Label>
            <Select value={sport} onValueChange={(v) => setSport(v as Sport)}>
              <SelectTrigger id="sport" className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SPORTS) as Sport[]).map((k) => {
                  const S = SPORTS[k];
                  const SI = S.icon;
                  return (
                    <SelectItem key={k} value={k}>
                      <span className="flex items-center gap-2">
                        <SI className="h-4 w-4" /> {S.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setAiOpen(true)}
            className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" /> Sugerir periodização com IA
          </Button>
        </div>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${sportMeta.tone}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="font-display text-lg">
                Planilha — {sportMeta.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {blocks.length} bloco{blocks.length > 1 ? "s" : ""} de atividade
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`gap-1 ${sportMeta.tone}`}>
            <Icon className="h-3 w-3" /> {sportMeta.label}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocks.map((b, i) => (
            <BlockEditor
              key={b.id}
              index={i}
              sport={sport}
              block={b}
              onChange={(patch) => update(b.id, patch)}
              onRemove={() => remove(b.id)}
              canRemove={blocks.length > 1}
            />
          ))}

          <Button
            variant="outline"
            onClick={add}
            className="w-full gap-2 border-dashed border-accent/40 text-accent hover:bg-accent/10 hover:text-accent"
          >
            <Plus className="h-4 w-4" /> Adicionar Atividade
          </Button>
        </CardContent>
      </Card>

      <AiDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        sport={sport}
        onApply={onAiGenerate}
      />
    </div>
  );
}

function BlockEditor({
  index,
  sport,
  block,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  sport: Sport;
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/20 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <Input
            value={block.nome ?? ""}
            placeholder={`Bloco ${index + 1} — ex: aquecimento, série principal...`}
            onChange={(e) => onChange({ nome: e.target.value })}
            className="h-8 w-[260px] border-transparent bg-transparent px-2 text-sm focus-visible:border-border focus-visible:bg-background/60"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <SportFields sport={sport} block={block} onChange={onChange} />
    </div>
  );
}

function SportFields({
  sport,
  block,
  onChange,
}: {
  sport: Sport;
  block: Block;
  onChange: (patch: Partial<Block>) => void;
}) {
  if (sport === "natacao") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Distância (m)">
          <Input
            type="number"
            value={block.distanciaM ?? ""}
            onChange={(e) => onChange({ distanciaM: e.target.value })}
            placeholder="800"
          />
        </Field>
        <Field label="Estilo">
          <Select
            value={block.estilo ?? ""}
            onValueChange={(v) => onChange({ estilo: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {["Livre", "Peito", "Borboleta", "Costas", "Medley"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Intervalo">
          <Input
            value={block.intervalo ?? ""}
            onChange={(e) => onChange({ intervalo: e.target.value })}
            placeholder="00:30"
          />
        </Field>
      </div>
    );
  }

  if (sport === "corrida") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Distância (km)">
          <Input
            type="number"
            value={block.distanciaKm ?? ""}
            onChange={(e) => onChange({ distanciaKm: e.target.value })}
            placeholder="5"
          />
        </Field>
        <Field label="Tempo Alvo">
          <Input
            value={block.tempoAlvo ?? ""}
            onChange={(e) => onChange({ tempoAlvo: e.target.value })}
            placeholder="00:25:00"
          />
        </Field>
        <Field label="Pace Estimado">
          <Input
            value={block.pace ?? ""}
            onChange={(e) => onChange({ pace: e.target.value })}
            placeholder="5:00 /km"
          />
        </Field>
      </div>
    );
  }

  if (sport === "musculacao" || sport === "paradesporto") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field label="Exercício / Movimento" className="sm:col-span-1">
            <Input
              value={block.exercicio ?? ""}
              onChange={(e) => onChange({ exercicio: e.target.value })}
              placeholder="Agachamento"
            />
          </Field>
          <Field label="Séries">
            <Input
              type="number"
              value={block.series ?? ""}
              onChange={(e) => onChange({ series: e.target.value })}
              placeholder="4"
            />
          </Field>
          <Field label="Repetições">
            <Input
              value={block.reps ?? ""}
              onChange={(e) => onChange({ reps: e.target.value })}
              placeholder="8-10"
            />
          </Field>
          <Field label="Carga (kg)">
            <Input
              type="number"
              value={block.carga ?? ""}
              onChange={(e) => onChange({ carga: e.target.value })}
              placeholder="60"
            />
          </Field>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
          <Label className="flex items-center gap-2 text-xs font-semibold text-accent">
            <Accessibility className="h-3.5 w-3.5" />
            Notas de Restrição / Adaptação Motora
          </Label>
          <Textarea
            value={block.restricao ?? ""}
            onChange={(e) => onChange({ restricao: e.target.value })}
            placeholder="Ex.: amputação transtibial direita — usar prótese esportiva; evitar carga axial completa."
            className="mt-2 min-h-[70px] bg-background/40"
          />
        </div>
      </div>
    );
  }

  // futebol / tênis
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Field label="Foco do bloco">
        <Input
          value={block.foco ?? ""}
          onChange={(e) => onChange({ foco: e.target.value })}
          placeholder={sport === "tenis" ? "Saque, fundo de quadra..." : "Posse, finalização..."}
        />
      </Field>
      <Field label="Duração">
        <Input
          value={block.duracao ?? ""}
          onChange={(e) => onChange({ duracao: e.target.value })}
          placeholder="20 min"
        />
      </Field>
      <Field label="Intensidade">
        <Select
          value={block.intensidade ?? ""}
          onValueChange={(v) => onChange({ intensidade: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar" />
          </SelectTrigger>
          <SelectContent>
            {["Baixa", "Moderada", "Alta", "Máxima"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function AiDialog({
  open,
  onOpenChange,
  sport,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sport: Sport;
  onApply: (blocks: Block[]) => void;
}) {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Block[] | null>(null);

  const placeholder = useMemo(() => {
    switch (sport) {
      case "natacao":
        return "Ex.: tiros de 50m para nadador amputado classe S9, foco em explosão.";
      case "corrida":
        return "Ex.: prepara 10km em 50min, atleta intermediário.";
      case "musculacao":
        return "Ex.: hipertrofia membros inferiores, 4 blocos progressivos.";
      case "paradesporto":
        return "Ex.: força para cadeirante T54, foco em propulsão.";
      default:
        return "Descreva o objetivo do treino...";
    }
  }, [sport]);

  const generate = () => {
    if (!goal.trim()) {
      toast.error("Descreva um objetivo para a IA.");
      return;
    }
    setLoading(true);
    setPreview(null);
    setTimeout(() => {
      setPreview(mockPlan(sport));
      setLoading(false);
    }, 900);
  };

  const apply = () => {
    if (preview) {
      onApply(preview);
      onOpenChange(false);
      setGoal("");
      setPreview(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Wand2 className="h-5 w-5 text-accent" />
            Assistente de Periodização IA
          </DialogTitle>
          <DialogDescription>
            Descreva o objetivo e o contexto do atleta. A IA irá sugerir uma
            planilha estruturada para <strong>{SPORTS[sport].label}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Objetivo</Label>
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={placeholder}
            className="min-h-[90px]"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-6 text-sm text-accent">
            <Loader2 className="h-4 w-4 animate-spin" /> Gerando periodização...
          </div>
        )}

        {preview && !loading && (
          <div className="space-y-2 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Sugestão da IA
            </div>
            <ul className="space-y-2">
              {preview.map((b, i) => (
                <li
                  key={b.id}
                  className="flex items-start gap-3 rounded-lg bg-background/40 p-3 text-sm"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/30 text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{b.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {summarize(sport, b)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {preview ? (
            <Button onClick={apply} className="gap-2">
              <Sparkles className="h-4 w-4" /> Aplicar à planilha
            </Button>
          ) : (
            <Button onClick={generate} disabled={loading} className="gap-2">
              <Wand2 className="h-4 w-4" /> Gerar com IA
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function summarize(sport: Sport, b: Block): string {
  if (sport === "natacao")
    return `${b.distanciaM ?? "—"}m • ${b.estilo ?? "—"} • intervalo ${b.intervalo ?? "—"}`;
  if (sport === "corrida")
    return `${b.distanciaKm ?? "—"}km • alvo ${b.tempoAlvo ?? "—"} • pace ${b.pace ?? "—"}`;
  if (sport === "musculacao" || sport === "paradesporto")
    return `${b.exercicio ?? "—"} • ${b.series ?? "—"}x${b.reps ?? "—"} @ ${b.carga ?? "—"}kg${
      b.restricao ? ` • ⚠ ${b.restricao}` : ""
    }`;
  return `${b.foco ?? "—"} • ${b.duracao ?? "—"} • intensidade ${b.intensidade ?? "—"}`;
}

function mockPlan(sport: Sport): Block[] {
  if (sport === "natacao") {
    return [
      { id: uid(), nome: "Aquecimento", distanciaM: "400", estilo: "Livre", intervalo: "00:20" },
      { id: uid(), nome: "Técnica", distanciaM: "200", estilo: "Costas", intervalo: "00:25" },
      { id: uid(), nome: "Série principal — tiros", distanciaM: "8x50", estilo: "Livre", intervalo: "00:45" },
      { id: uid(), nome: "Volta à calma", distanciaM: "200", estilo: "Peito", intervalo: "00:30" },
    ];
  }
  if (sport === "corrida") {
    return [
      { id: uid(), nome: "Aquecimento progressivo", distanciaKm: "2", tempoAlvo: "00:12:00", pace: "6:00" },
      { id: uid(), nome: "Tiros longos", distanciaKm: "5", tempoAlvo: "00:22:30", pace: "4:30" },
      { id: uid(), nome: "Volta à calma", distanciaKm: "1", tempoAlvo: "00:07:00", pace: "7:00" },
    ];
  }
  if (sport === "musculacao" || sport === "paradesporto") {
    return [
      { id: uid(), nome: "Mobilidade", exercicio: "Mobilidade quadril", series: "2", reps: "10", carga: "0", restricao: sport === "paradesporto" ? "Adaptar amplitude conforme prótese." : "" },
      { id: uid(), nome: "Força principal", exercicio: "Agachamento", series: "4", reps: "6", carga: "80", restricao: sport === "paradesporto" ? "Evitar carga axial completa." : "" },
      { id: uid(), nome: "Acessório", exercicio: "Leg press", series: "3", reps: "10", carga: "120" },
      { id: uid(), nome: "Core", exercicio: "Prancha", series: "3", reps: "45s", carga: "0" },
    ];
  }
  return [
    { id: uid(), nome: "Ativação", foco: "Mobilidade e coordenação", duracao: "10 min", intensidade: "Baixa" },
    { id: uid(), nome: "Técnico", foco: sport === "tenis" ? "Saque e devolução" : "Posse e transição", duracao: "25 min", intensidade: "Moderada" },
    { id: uid(), nome: "Jogo reduzido", foco: "Tomada de decisão", duracao: "20 min", intensidade: "Alta" },
    { id: uid(), nome: "Volta à calma", foco: "Alongamento", duracao: "10 min", intensidade: "Baixa" },
  ];
}
