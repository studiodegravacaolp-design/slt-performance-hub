import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Dumbbell, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ATHLETES, SPORT_LABEL, type Athlete, type PlanStatus, type Sport } from "@/lib/athletes-data";

export const Route = createFileRoute("/_app/athletes")({
  component: AthletesPage,
});

const SEED: Athlete[] = ATHLETES;

const planColors: Record<PlanStatus, string> = {
  Ativo: "bg-success/15 text-success border-success/30",
  Inadimplente: "bg-destructive/15 text-destructive border-destructive/30",
  Pausado: "bg-warning/15 text-warning border-warning/30",
};

type FormData = {
  id?: string;
  nome: string;
  email: string;
  plano: PlanStatus;
  altura: number;
  peso: number;
  modalidade: Sport;
};

function AthletesPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<Athlete[]>(SEED);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Athlete | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => list.filter((a) => a.nome.toLowerCase().includes(q.toLowerCase()) || a.email.includes(q.toLowerCase())),
    [list, q],
  );

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (a: Athlete) => { setEditing(a); setOpen(true); };
  const prescrever = (a: Athlete) =>
    navigate({ to: "/athletes/$athleteId/prescribe", params: { athleteId: a.id } });

  const handleSave = (data: FormData) => {
    if (data.id) {
      setList((l) => l.map((x) => (x.id === data.id ? { ...x, ...data } : x)));
      toast.success("Atleta atualizado");
    } else {
      const novo: Athlete = {
        ...data,
        id: crypto.randomUUID(),
        ultimaAvaliacao: "—",
        telemetria: [
          { label: "Sem 1", valor: 0 },
          { label: "Sem 2", valor: 0 },
        ],
        metricaLabel: "Métrica principal",
        metricaUnidade: "—",
      };
      setList((l) => [novo, ...l]);
      toast.success("Atleta cadastrado");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setList((l) => l.filter((x) => x.id !== id));
    toast.success("Atleta removido");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Gestão de atletas</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} atleta{filtered.length === 1 ? "" : "s"} no tenant atual.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar atleta..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="shadow-glow">
                <Plus className="mr-1.5 h-4 w-4" /> Novo atleta
              </Button>
            </DialogTrigger>
            <AthleteFormDialog editing={editing} onSave={handleSave} />
          </Dialog>
        </div>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Altura / Peso</TableHead>
                  <TableHead>Última avaliação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className="border-border/60">
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{a.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={planColors[a.plano]}>{a.plano}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.altura} cm · {a.peso} kg</TableCell>
                    <TableCell className="text-muted-foreground">{a.ultimaAvaliacao}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-accent hover:bg-accent/10 hover:text-accent"
                          onClick={() => prescrever(a)}
                        >
                          <Dumbbell className="mr-1.5 h-3.5 w-3.5" /> Prescrever
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">Nenhum atleta encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-3 md:hidden">
            {filtered.map((a) => (
              <div key={a.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <Badge variant="outline" className={planColors[a.plano]}>{a.plano}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{a.altura} cm · {a.peso} kg · avaliação {a.ultimaAvaliacao}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => prescrever(a)}>
                    <Dumbbell className="mr-1.5 h-3.5 w-3.5" /> Prescrever
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AthleteFormDialog({
  editing, onSave,
}: {
  editing: Athlete | null;
  onSave: (data: FormData) => void;
}) {
  const [nome, setNome] = useState(editing?.nome ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [plano, setPlano] = useState<PlanStatus>(editing?.plano ?? "Ativo");
  const [altura, setAltura] = useState(editing?.altura?.toString() ?? "175");
  const [peso, setPeso] = useState(editing?.peso?.toString() ?? "70");
  const [modalidade, setModalidade] = useState<Sport>(editing?.modalidade ?? "musculacao");

  useEffect(() => {
    setNome(editing?.nome ?? "");
    setEmail(editing?.email ?? "");
    setPlano(editing?.plano ?? "Ativo");
    setAltura(editing?.altura?.toString() ?? "175");
    setPeso(editing?.peso?.toString() ?? "70");
    setModalidade(editing?.modalidade ?? "musculacao");
  }, [editing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email) {
      toast.error("Preencha nome e e-mail");
      return;
    }
    onSave({
      id: editing?.id,
      nome,
      email,
      plano,
      altura: Number(altura),
      peso: Number(peso),
      modalidade,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editing ? "Editar atleta" : "Novo atleta"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nome completo</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do atleta" />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com" />
        </div>
        <div className="space-y-2">
          <Label>Modalidade</Label>
          <Select value={modalidade} onValueChange={(v) => setModalidade(v as Sport)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SPORT_LABEL) as Sport[]).map((s) => (
                <SelectItem key={s} value={s}>{SPORT_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2 col-span-1">
            <Label>Plano</Label>
            <Select value={plano} onValueChange={(v) => setPlano(v as PlanStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Altura (cm)</Label>
            <Input type="number" value={altura} onChange={(e) => setAltura(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Peso (kg)</Label>
            <Input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" className="shadow-glow">{editing ? "Salvar" : "Cadastrar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

