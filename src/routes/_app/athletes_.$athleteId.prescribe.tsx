import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Dumbbell, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/athletes_/$athleteId/prescribe")({
  component: PrescribePage,
});

type Athlete = { id: string; full_name: string; birth_date: string | null };
type Branch = { id: string; name: string };

function PrescribePage() {
  const { athleteId } = Route.useParams();
  const { user } = useAuth();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [branchId, setBranchId] = useState("none");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canPrescribe =
    user?.role === "admin_tenant" || user?.role === "manager" || user?.role === "professor";

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      supabase
        .from("athletes")
        .select("id, full_name, birth_date")
        .eq("id", athleteId)
        .maybeSingle(),
      supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    ]).then(([athleteResult, branchResult]) => {
      setAthlete(athleteResult.data);
      setBranches(branchResult.data ?? []);
      if (athleteResult.data) setTitle(`Treino — ${athleteResult.data.full_name}`);
      setLoading(false);
    });
  }, [athleteId, user]);

  const save = async () => {
    if (!user || !athlete || !canPrescribe || !title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("workouts").insert({
      tenant_id: user.tenantId,
      athlete_id: athlete.id,
      branch_id: branchId === "none" ? null : branchId,
      created_by: user.id,
      title: title.trim(),
      description: description.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Treino prescrito com sucesso");
    setDescription("");
  };

  if (loading)
    return (
      <div className="grid min-h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!athlete)
    return (
      <div className="space-y-4">
        <p>Atleta não encontrado ou fora do seu escopo.</p>
        <Button asChild variant="outline">
          <Link to="/athletes">Voltar</Link>
        </Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/athletes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atletas
        </Link>
      </Button>
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Prescrever para {athlete.full_name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Registro enxuto conforme o schema aprovado da Fundação P0.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {!canPrescribe && (
            <p className="text-sm text-destructive">
              Seu papel possui somente permissão de consulta.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="workout-title">Título</Label>
            <Input
              id="workout-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!canPrescribe}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout-description">Descrição</Label>
            <Textarea
              id="workout-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Objetivo, atividades, volume e orientações."
              disabled={!canPrescribe}
            />
          </div>
          <div className="space-y-2">
            <Label>Filial</Label>
            <Select value={branchId} onValueChange={setBranchId} disabled={!canPrescribe}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem filial específica</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => void save()} disabled={!canPrescribe || saving || !title.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar prescrição
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
