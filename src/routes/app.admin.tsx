import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Loader2, Shield, BookMarked, Video, CalendarDays, Users } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  component: AdminLayout,
});

const tabs = [
  { url: "/app/admin", label: "Visão Geral", icon: Shield, exact: true },
  { url: "/app/admin/subjects", label: "Matérias", icon: BookMarked },
  { url: "/app/admin/lessons", label: "Aulas", icon: Video },
  { url: "/app/admin/schedules", label: "Cronogramas", icon: CalendarDays },
  { url: "/app/admin/users", label: "Usuários", icon: Users },
];

function AdminLayout() {
  const { isAdmin, loading, session } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/auth", replace: true });
    else if (!isAdmin) navigate({ to: "/app", replace: true });
  }, [isAdmin, loading, session, navigate]);

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary shadow-elegant">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Painel Administrativo</h1>
          <p className="text-xs text-muted-foreground">Gerencie matérias, aulas, cronogramas e usuários.</p>
        </div>
      </div>

      <Card className="overflow-x-auto p-1.5">
        <div className="flex min-w-max gap-1">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.url : pathname === t.url || pathname.startsWith(t.url + "/");
            return (
              <Link
                key={t.url}
                to={t.url}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "gradient-primary text-primary-foreground shadow-elegant"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </Card>

      <Outlet />
    </div>
  );
}
