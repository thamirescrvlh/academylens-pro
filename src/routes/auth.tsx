import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/app/dashboard", replace: true });
    }
  }, [session, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!email || !password) {
      toast.error("Preencha email e senha.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          toast.error("Não foi possível criar a conta.");
          return;
        }

        toast.success("Conta criada com sucesso!");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Email ou senha incorretos.");
        return;
      }

      toast.success("Bem-vindo(a)!");
      navigate({ to: "/app/dashboard", replace: true });
    } catch {
      toast.error("Algo deu errado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-0 -z-10 gradient-hero opacity-30" />
      <div className="absolute -left-32 top-20 -z-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute -right-20 bottom-10 -z-10 h-72 w-72 rounded-full bg-primary-glow/40 blur-3xl" />

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-elegant">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Estuda<span className="text-gradient">Aí</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua plataforma privada de estudos.
          </p>
        </div>

        <Card className="border-border/60 bg-card/95 p-6 shadow-card backdrop-blur">
          <div className="mb-5 flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full gradient-primary text-primary-foreground shadow-elegant hover:opacity-95"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso privado · <Link to="/" className="underline-offset-2 hover:underline">voltar</Link>
        </p>
      </div>
    </div>
  );
}
