import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/organizations")({
  component: OrganizationsPage,
});

const ORGS = [
  { id: "1", name: "Elite Performance Club", status: "Ativo", atletas: 284 },
  { id: "2", name: "FitPro Academy", status: "Ativo", atletas: 142 },
  { id: "3", name: "Centro Olímpico SP", status: "Trial", atletas: 38 },
];

function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Organizações</h2>
        <p className="text-sm text-muted-foreground">Tenants conectados ao seu ambiente SLT.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ORGS.map((o) => (
          <Card key={o.id} className="border-border/60 bg-card/60 transition-all hover:border-primary/40 hover:shadow-glow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary-foreground ring-1 ring-primary/30">
                  <Building2 className="h-5 w-5" />
                </div>
                <Badge variant="outline" className={o.status === "Ativo" ? "border-success/30 bg-success/15 text-success" : "border-warning/30 bg-warning/15 text-warning"}>
                  {o.status}
                </Badge>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{o.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{o.atletas} atletas ativos</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
