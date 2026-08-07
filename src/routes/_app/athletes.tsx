import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Dumbbell, Pencil, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { rowToAthlete, type Athlete, type AthleteRow } from "@/lib/athletes-data";
import { useAuth } from "@/lib/auth";
import { withRetry } from "@/lib/retry";

export const Route = createFileRoute("/_app/athletes")({
  component: AthletesPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      title="Falha ao renderizar a gestão de atletas."
      backTo="/dashboard"
      backLabel="Voltar ao dashboard"
    />
  ),
});

type FormData = {
  id?: string;
  nome: string;
  dataNascimento: string;
};

function AthletesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Athlete | null>(null);
  const [open, setOpen] = useState(false);

  const canCreate = user?.role === "admin_tenant" || user?.role === "manager";
  const canEdit = canCreate || user?.role === "professor";
  const canPrescribe = canEdit;

  const loadAthletes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    const { data, error } = await withRetry(() =>
      supabase
        .from("athletes")
        .select("id, full_name, birth_date, user_id")
        .order("created_at", { ascending: false }),
    );

    if (error) {
      setList([]);
      setLoadError(error.message);
    } else {
      setList((data ?? []).map((row) => rowToAthlete(row as AthleteRow)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadAthletes();
  }, [loadAthletes]);

  const filtered = useMemo(
    () => list.filter((athlete) => athlete.nome.toLowerCase().includes(query.toLowerCase())),
    [list, query],
  );

  const save = async (form: FormData) => {
    if (!user) return;
    const birthDate = form.dataNascimento || null;

    if (form.id) {
      const { error } = await supabase
        .from("athletes")
        .update({
          full_name: form.nome,
          birth_date: birthDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.id);
      if (error) return toast.error(error.message);
      toast.success("Atleta atualizado");
    } else {
      const { error } = await supabase.from("athletes").insert({
        tenant_id: user.tenantId,
        full_name: form.nome,
        birth_date: birthDate,
      });
      if (error) return toast.error(error.message);
      toast.success("Atleta cadastrado");
    }

    setOpen(false);
    await loadAthletes();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Gestão de atletas</h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Carregando..."
              : `${filtered.length} atleta${filtered.length === 1 ? "" : "s"} acessível(eis).`}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar atleta..."
              className="pl-8"
            />
          </div>
          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              {canCreate && (
                <DialogTrigger asChild>
                  <Button onClick={() => setEditing(null)} className="shadow-glow">
                    <Plus className="mr-1.5 h-4 w-4" /> Novo atleta
                  </Button>
                </DialogTrigger>
              )}
              <AthleteDialog athlete={editing} onSave={save} />
            </Dialog>
          )}
        </div>
      </div>

      {loadError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" onClick={() => void loadAthletes()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Nascimento</TableHead>
                  <TableHead>Conta vinculada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading &&
                  filtered.map((athlete) => (
                    <TableRow key={athlete.id}>
                      <TableCell className="font-medium">{athlete.nome}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-4 w-4" /> {formatDate(athlete.dataNascimento)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {athlete.userId ? "Vinculada" : "Não vinculada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(athlete);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="mr-1.5 h-4 w-4" /> Editar
                          </Button>
                        )}
                        {canPrescribe && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate({
                                to: "/athletes/$athleteId/prescribe",
                                params: { athleteId: athlete.id },
                              })
                            }
                          >
                            <Dumbbell className="mr-1.5 h-4 w-4" /> Prescrever
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                      Nenhum atleta encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AthleteDialog({
  athlete,
  onSave,
}: {
  athlete: Athlete | null;
  onSave: (data: FormData) => Promise<void>;
}) {
  const [nome, setNome] = useState(athlete?.nome ?? "");
  const [dataNascimento, setDataNascimento] = useState(athlete?.dataNascimento ?? "");
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{athlete ? "Editar atleta" : "Novo atleta"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="athlete-name">Nome completo</Label>
          <Input id="athlete-name" value={nome} onChange={(event) => setNome(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="athlete-birth">Data de nascimento</Label>
          <Input
            id="athlete-birth"
            type="date"
            value={dataNascimento}
            onChange={(event) => setDataNascimento(event.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!nome.trim()}
          onClick={() => void onSave({ id: athlete?.id, nome: nome.trim(), dataNascimento })}
        >
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}
