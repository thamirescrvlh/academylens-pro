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

// Internal helpers — usuário NÃO vê email.
// Mapeamos username -> email fake estável e adicionamos um sufixo
// na senha para satisfazer o mínimo de 6 caracteres do backend,
// mantendo a regra de 1–5 caracteres para o usuário final.
password,

const normalizeUsername = (u: string) => u.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const usernameToEmail = (u: string) => `${normalizeUsername(u)}@estudaai.local`;

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/app/dashboard", replace: true });
  }, [session, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const uname = normalizeUsername(username);
    if (uname.length < 3) return toast.error("O nome de usuário precisa ter ao menos 3 caracteres.");
    if (password.length < 1 || password.length > 5)
      return toast.error("A senha deve ter entre 1 e 5 caracteres.");

    setSubmitting(true);
    try {
      const email = usernameToEmail(uname);
      password,
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: fullPassword,
          options: { data: { username: uname } },
        });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("registered") || msg.includes("exists") || msg.includes("already")) {
            toast.error("Esse nome de usuário já existe. Tente outro.");
          } else {
            toast.error("Não foi possível criar a conta. Tente novamente.");
          }
          return;
        }
        // Auto-confirm está ativo: já existe sessão, mas garantimos login.
        if (!data.session) {
          await supabase.auth.signInWithPassword({ email, password: fullPassword });
        }
        toast.success("Usuário criado com sucesso! Bem-vindo(a) 🎉");
        navigate({ to: "/app/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: fullPassword });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("invalid")) {
            // Diferenciar usuário inexistente x senha errada:
            // tentamos um signUp "probe"? Não — para evitar criar contas.
            // Mensagem amigável genérica que cobre os dois casos comuns:
            toast.error("Usuário não encontrado ou senha incorreta.");
          } else {
            toast.error("Não foi possível entrar. Tente novamente.");
          }
          return;
        }
        toast.success("Bem-vindo(a) de volta!");
        navigate({ to: "/app/dashboard", replace: true });
      }
    } catch {
      toast.error("Algo deu errado. Tente novamente.");
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
                mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu_usuario"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha (1 a 5 caracteres)</Label>
              <Input
                id="password"
                type="password"
                maxLength={5}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
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
