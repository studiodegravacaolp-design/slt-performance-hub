import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/organizations")({ component: OrganizationsPage });

type Company = { id: string; name: string; tenant_mode: string };
type Branch = { id: string; name: string; address: string | null; is_active: boolean };

function OrganizationsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      supabase
        .from("companies")
        .select("id, name, tenant_mode")
        .eq("id", user.tenantId)
        .maybeSingle(),
      supabase.from("branches").select("id, name, address, is_active").order("name"),
    ]).then(([companyResult, branchResult]) => {
      setCompany(companyResult.data);
      setBranches(branchResult.data ?? []);
    });
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Empresa e filiais</h2>
        <p className="text-sm text-muted-foreground">
          Estrutura organizacional autorizada para o tenant atual.
        </p>
      </div>
      {company && (
        <Card className="border-primary/30 bg-card/60">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold">{company.name}</h3>
              <p className="text-sm text-muted-foreground">Modo do tenant: {company.tenant_mode}</p>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id} className="border-border/60 bg-card/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <MapPin className="h-5 w-5 text-primary" />
                <Badge variant="outline">{branch.is_active ? "Ativa" : "Inativa"}</Badge>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{branch.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {branch.address ?? "Endereço não informado"}
              </p>
            </CardContent>
          </Card>
        ))}
        {branches.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma filial acessível.</p>
        )}
      </div>
    </div>
  );
}
