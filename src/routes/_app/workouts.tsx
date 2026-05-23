import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/workouts")({
  component: WorkoutsPage,
});

function WorkoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Treinos</h2>
        <p className="text-sm text-muted-foreground">Periodização e prescrição inteligente.</p>
      </div>

      <Card className="border-dashed border-border/60 bg-card/40">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold">Editor de periodização em construção</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Em breve você poderá montar blocos de exercícios, mesociclos e prescrever planilhas
            diretamente do prontuário do atleta.
          </p>
          <Button variant="outline" className="mt-5 gap-2 border-accent/40 text-accent hover:bg-accent/10 hover:text-accent">
            <Sparkles className="h-4 w-4" /> Sugerir periodização com IA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
