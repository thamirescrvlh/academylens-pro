import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ListChecks, Clock, Flame, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: lessons }, { data: progress }, { data: subjects }] = await Promise.all([
        supabase.from("lessons").select("id, subject_id, duration_seconds"),
        supabase
          .from("lesson_progress")
          .select("lesson_id, completed_at, updated_at")
          .eq("user_id", user!.id),
        supabase.from("subjects").select("id, name, color").order("display_order"),
      ]);
      return { lessons: lessons ?? [], progress: progress ?? [], subjects: subjects ?? [] };
    },
  });

  const stats = useMemo(() => {
    const completed = (data?.progress ?? []).filter((p) => p.completed_at);
    const completedSet = new Set(completed.map((p) => p.lesson_id));
    const totalLessons = data?.lessons.length ?? 0;
    const completedCount = completedSet.size;
    const remaining = totalLessons - completedCount;

    // hours studied — sum duration of completed lessons
    const durMap: Record<string, number> = {};
    data?.lessons.forEach((l) => (durMap[l.id] = l.duration_seconds || 0));
    const secondsStudied = [...completedSet].reduce((acc, lid) => acc + (durMap[lid] || 0), 0);
    const hours = Math.round((secondsStudied / 3600) * 10) / 10;

    // streak — unique days in completed_at, consecutive ending today
    const days = new Set(
      completed
        .filter((p) => !!p.completed_at)
        .map((p) => new Date(p.completed_at as string).toISOString().slice(0, 10)),
    );
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (days.has(key)) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else break;
    }

    const overall = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

    // per subject
    const bySubject = (data?.subjects ?? []).map((s) => {
      const total = data!.lessons.filter((l) => l.subject_id === s.id).length;
      const done = data!.lessons.filter((l) => l.subject_id === s.id && completedSet.has(l.id)).length;
      return {
        ...s,
        total,
        done,
        pct: total ? Math.round((done / total) * 100) : 0,
      };
    });

    return { totalLessons, completedCount, remaining, hours, streak, overall, bySubject };
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seu desempenho nos estudos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aulas concluídas" value={stats.completedCount} icon={CheckCircle2} accent="text-success" />
        <StatCard label="Aulas restantes" value={stats.remaining} icon={ListChecks} />
        <StatCard label="Horas estudadas" value={`${stats.hours}h`} icon={Clock} />
        <StatCard label="Sequência de dias" value={`${stats.streak}🔥`} icon={Flame} accent="text-orange-500" />
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold">Progresso geral</h2>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-4xl font-extrabold text-gradient">{stats.overall}%</span>
          <span className="text-sm text-muted-foreground">
            {stats.completedCount} de {stats.totalLessons} aulas
          </span>
        </div>
        <Progress value={stats.overall} className="mt-3 h-3" />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">Progresso por matéria</h2>
        <div className="space-y-4">
          {stats.bySubject.map((s) => (
            <div key={s.id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="text-muted-foreground">
                  {s.done}/{s.total} · <span className="font-semibold text-foreground">{s.pct}%</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${s.pct}%`,
                    background: `linear-gradient(90deg, ${s.color}, #C8B6FF)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: any;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accent ?? "text-primary"}`} />
      </div>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </Card>
  );
}
