import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, Shield } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/app/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }, { data: lessons }, { data: progress }] =
        await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("user_roles").select("user_id, role"),
          supabase.from("lessons").select("id"),
          supabase
            .from("lesson_progress")
            .select("user_id, lesson_id, completed_at"),
        ]);

      const adminSet = new Set(
        (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
      );
      const completedByUser: Record<string, number> = {};
      (progress ?? []).forEach((p) => {
        if (p.completed_at) {
          completedByUser[p.user_id] = (completedByUser[p.user_id] || 0) + 1;
        }
      });
      const totalLessons = lessons?.length ?? 0;
      return { profiles: profiles ?? [], adminSet, completedByUser, totalLessons };
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data?.profiles ?? [];
    return (data?.profiles ?? []).filter(
      (p: any) =>
        p.username?.toLowerCase().includes(term) || p.full_name?.toLowerCase().includes(term),
    );
  }, [q, data]);

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Usuários cadastrados</h2>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar usuário..." className="pl-9" />
        </div>
      </div>

      <div className="divide-y divide-border">
        {filtered.map((u: any) => {
          const done = data?.completedByUser[u.id] ?? 0;
          const pct = data?.totalLessons ? Math.round((done / data.totalLessons) * 100) : 0;
          const isAdmin = data?.adminSet.has(u.id);
          return (
            <div key={u.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-primary text-sm font-bold text-white">
                {(u.username || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{u.full_name || u.username}</p>
                  {isAdmin && (
                    <Badge className="gradient-primary border-0 text-primary-foreground">
                      <Shield className="mr-1 h-3 w-3" /> Admin
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
              </div>
              <div className="w-full max-w-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold">{done}/{data?.totalLessons ?? 0} · {pct}%</span>
                </div>
                <Progress value={pct} className="mt-1.5 h-2" />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
        )}
      </div>
    </Card>
  );
}
