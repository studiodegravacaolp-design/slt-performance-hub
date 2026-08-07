import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Dumbbell, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/workouts")({ component: WorkoutsPage });

type Workout = {
  id: string;
  title: string;
  description: string | null;
  athlete_id: string | null;
  branch_id: string | null;
  created_at: string;
};

function WorkoutsPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const result = await supabase
      .from("workouts")
      .select("id, title, description, athlete_id, branch_id, created_at")
      .order("created_at", { ascending: false });
    setError(result.error?.message ?? null);
    setWorkouts(result.data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Treinos prescritos</h2>
          <p className="text-sm text-muted-foreground">Registros autorizados da Fundação P0.</p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workouts.map((workout) => (
          <Card key={workout.id} className="border-border/60 bg-card/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <Dumbbell className="h-5 w-5 text-primary" />
                <Badge variant="outline">P0</Badge>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{workout.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {workout.description ?? "Sem descrição."}
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Intl.DateTimeFormat("pt-BR").format(new Date(workout.created_at))}
              </p>
            </CardContent>
          </Card>
        ))}
        {!error && workouts.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum treino prescrito neste tenant.</p>
        )}
      </div>
    </div>
  );
}
