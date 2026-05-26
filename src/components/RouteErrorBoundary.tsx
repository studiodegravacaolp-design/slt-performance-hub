import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  error: Error;
  reset: () => void;
  title?: string;
  backTo?: string;
  backLabel?: string;
}

export function RouteErrorBoundary({
  error,
  reset,
  title = "Algo deu errado ao renderizar esta área.",
  backTo = "/athletes",
  backLabel = "Voltar para atletas",
}: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-destructive/40 bg-card/60">
        <CardContent className="grid min-h-[280px] place-items-center p-6 text-center">
          <div className="max-w-md space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive ring-1 ring-destructive/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="font-display text-xl font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground break-words">
              {error?.message ?? "Erro desconhecido na renderização do componente."}
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button asChild variant="outline">
                <Link to={backTo}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> {backLabel}
                </Link>
              </Button>
              <Button
                onClick={() => {
                  void router.invalidate();
                  reset();
                }}
                className="shadow-glow"
              >
                <RefreshCw className="mr-1.5 h-4 w-4" /> Tentar novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
