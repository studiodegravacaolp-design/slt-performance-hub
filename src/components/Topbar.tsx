import { useRouterState } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/organizations": "Empresa e filiais",
  "/athletes": "Atletas",
  "/workouts": "Treinos",
};

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const title = Object.entries(titles).find(([p]) => pathname.startsWith(p))?.[1] ?? "";

  return (
    <div className="flex flex-1 items-center gap-3">
      <h1 className="font-display text-base font-semibold">{title}</h1>
      <div className="relative ml-auto hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." className="h-9 w-64 pl-8" />
      </div>
      <Badge
        variant="outline"
        className="hidden gap-1.5 border-accent/40 bg-accent/10 text-accent sm:inline-flex"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {user?.tenantName}
      </Badge>
      <button className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <Bell className="h-4 w-4" />
      </button>
    </div>
  );
}
