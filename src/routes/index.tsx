import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate({ to: session ? "/app" : "/auth", replace: true });
  }, [session, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero">
      <div className="text-center text-white">
        <Loader2 className="mx-auto h-10 w-10 animate-spin" />
        <p className="mt-4 text-sm opacity-90">Carregando EstudaAí…</p>
      </div>
    </div>
  );
}
