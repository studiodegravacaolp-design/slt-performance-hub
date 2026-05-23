import { CheckCircle2, UserPlus, Dumbbell, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Activity = {
  id: string;
  type: "signup" | "workout" | "payment" | "alert" | "report";
  text: string;
  time: string;
};

const ICONS = {
  signup: UserPlus,
  workout: Dumbbell,
  payment: CheckCircle2,
  alert: AlertCircle,
  report: FileText,
};

const COLORS: Record<Activity["type"], string> = {
  signup: "bg-primary/15 text-primary-foreground",
  workout: "bg-accent/15 text-accent",
  payment: "bg-success/15 text-success",
  alert: "bg-destructive/15 text-destructive",
  report: "bg-warning/15 text-warning",
};

const MOCK: Activity[] = [
  { id: "1", type: "signup", text: "Novo atleta cadastrado: Maria Souza", time: "há 4 min" },
  { id: "2", type: "workout", text: "Treino 'Força Máxima — Semana 3' prescrito para 12 atletas", time: "há 22 min" },
  { id: "3", type: "payment", text: "Pagamento confirmado: João Pereira (Plano Pro)", time: "há 1 h" },
  { id: "4", type: "alert", text: "3 atletas com avaliação física pendente", time: "há 2 h" },
  { id: "5", type: "report", text: "Relatório mensal de performance gerado", time: "há 5 h" },
  { id: "6", type: "workout", text: "Bloco de hipertrofia atualizado pelo gestor Pedro", time: "ontem" },
];

export function ActivityFeed() {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle className="text-base">Atividades recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {MOCK.map((a) => {
          const Icon = ICONS[a.type];
          return (
            <div key={a.id} className="flex items-start gap-3">
              <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${COLORS[a.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm leading-snug">{a.text}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
