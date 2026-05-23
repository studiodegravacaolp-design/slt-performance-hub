import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "success" | "warning";
}

const accentMap = {
  primary: "bg-primary/15 text-primary-foreground ring-primary/30",
  accent: "bg-accent/15 text-accent ring-accent/30",
  success: "bg-success/15 text-success ring-success/30",
  warning: "bg-warning/15 text-warning ring-warning/30",
};

export function StatCard({ label, value, delta, hint, icon: Icon, accent = "primary" }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <div className={cn("grid h-9 w-9 place-items-center rounded-lg ring-1", accentMap[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
              )}
            >
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
