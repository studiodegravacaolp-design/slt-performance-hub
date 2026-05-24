import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Activity, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signup(data.email, data.password);
        toast.success("Conta criada. Faça login para continuar.");
        setMode("login");
      } else {
        await login(data.email, data.password);
        toast.success("Autenticado com sucesso");
        navigate({ to: "/dashboard" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na autenticação");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-brand p-12 lg:flex">
        <div className="flex items-center gap-2 text-primary-foreground">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-foreground/10 backdrop-blur">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">SLT</span>
        </div>
        <div className="space-y-6 text-primary-foreground">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Performance esportiva<br />
            <span className="text-gradient-brand bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
              orientada por dados.
            </span>
          </h1>
          <p className="max-w-md text-base text-primary-foreground/80">
            Gerencie organizações, atletas e ciclos de periodização em uma plataforma multi-tenant segura.
          </p>
          <div className="grid gap-3 pt-4">
            <Feature icon={<ShieldCheck className="h-4 w-4" />} text="Isolamento por tenant via RLS" />
            <Feature icon={<Sparkles className="h-4 w-4" />} text="Insights de performance com IA" />
            <Feature icon={<Activity className="h-4 w-4" />} text="Periodização e prescrição inteligente" />
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} System Level Tech</p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-semibold">Acesse sua conta</h2>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais corporativas para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input id="email" type="email" placeholder="voce@empresa.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button type="button" className="text-xs text-accent hover:underline">
                  Esqueci minha senha
                </button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full shadow-glow" disabled={submitting}>
              {submitting ? "Processando..." : mode === "signup" ? "Criar conta" : "Entrar"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {mode === "signup" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                className="text-accent hover:underline"
              >
                {mode === "signup" ? "Entrar" : "Criar conta"}
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-primary-foreground/90">
      <div className="grid h-7 w-7 place-items-center rounded-md bg-primary-foreground/10">{icon}</div>
      {text}
    </div>
  );
}
