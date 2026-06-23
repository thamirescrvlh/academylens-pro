import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, PlayCircle, CalendarDays, Sparkles } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/app/")({
  component: SchedulePage,
});

const DAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function formatDuration(seconds: number) {
  if (!seconds) return "--";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}min` : `${h}h`;
}

function SchedulePage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["schedule", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: schedule }, { data: progress }, { data: lessons }] = await Promise.all([
        supabase
          .from("schedules")
          .select("id, day_of_week, display_order, lesson:lessons(id, title, duration_seconds, subject:subjects(id, name, slug, color))")
          .eq("user_id", user!.id)
          .order("day_of_week")
          .order("display_order"),
        supabase
          .from("lesson_progress")
          .select("lesson_id, completed_at")
          .eq("user_id", user!.id),
        supabase.from("lessons").select("id"),
      ]);
      return { schedule: schedule ?? [], progress: progress ?? [], total: lessons?.length ?? 0 };
    },
  });

  const completedSet = useMemo(
    () => new Set((data?.progress ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id)),
    [data?.progress],
  );

  const todayIdx = new Date().getDay();
  const byDay = useMemo(() => {
    const m = new Map<number, any[]>();
    for (let i = 0; i < 7; i++) m.set(i, []);
    (data?.schedule ?? []).forEach((row: any) => {
      m.get(row.day_of_week)?.push(row);
    });
    return m;
  }, [data?.schedule]);

  const totalLessons = data?.total ?? 0;
  const completedCount = completedSet.size;
  const overall = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
  const hasAnySchedule = (data?.schedule ?? []).length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
        <div className="absolute inset-0 -z-10 gradient-hero opacity-95" />
        <div className="absolute -right-10 -top-10 -z-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        <div className="grid gap-4 p-6 text-white md:grid-cols-[1fr_auto] md:items-end md:p-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Bem-vindo de volta
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              Cronograma de Estudos
            </h1>
            <p className="mt-1 text-sm text-white/85 md:text-base">
              {hasAnySchedule
                ? "Veja as aulas planejadas para cada dia da semana."
                : "Seu cronograma está vazio. Peça ao administrador para configurar."}
            </p>
          </div>
          <div className="min-w-[220px] rounded-2xl bg-white/15 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-white/80">Progresso geral</p>
            <p className="mt-1 text-3xl font-extrabold">{overall}%</p>
            <Progress value={overall} className="mt-2 h-2 bg-white/25" />
            <p className="mt-2 text-xs text-white/85">
              {completedCount} de {totalLessons} aulas concluídas
            </p>
          </div>
        </div>
      </div>

      {/* Days grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
          const items = byDay.get(dayIdx) ?? [];
          const isToday = dayIdx === todayIdx;
          return (
            <Card
              key={dayIdx}
              className={`flex flex-col gap-3 p-5 transition ${
                isToday ? "border-primary/40 shadow-elegant" : "shadow-card"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                  <h3 className="truncate text-base font-bold">{DAYS[dayIdx]}</h3>
                </div>
                {isToday && (
                  <Badge className="shrink-0 gradient-primary text-primary-foreground border-0">
                    Hoje
                  </Badge>
                )}
              </div>

              {items.length === 0 ? (
                <p className="rounded-lg bg-muted px-3 py-6 text-center text-sm text-muted-foreground">
                  Sem aulas neste dia.
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((row: any) => {
                    const done = completedSet.has(row.lesson?.id);
                    const subj = row.lesson?.subject;
                    return (
                      <li key={row.id}>
                        <Link
                          to="/app/lessons/$id"
                          params={{ id: row.lesson.id }}
                          className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/50 hover:bg-accent/40"
                        >
                          <div
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                            style={{ backgroundColor: subj?.color ?? "var(--primary)" }}
                          >
                            {done ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <PlayCircle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {subj?.name} · {row.lesson?.title}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDuration(row.lesson?.duration_seconds)}
                            </p>
                          </div>
                          {done && (
                            <Badge variant="secondary" className="shrink-0 bg-success/10 text-success">
                              Concluída
                            </Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {!hasAnySchedule && !isLoading && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Explore as matérias para começar a estudar enquanto seu cronograma é montado.
          </p>
          <Button asChild className="mt-4 gradient-primary text-primary-foreground">
            <Link to="/app/subjects">Ver matérias</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
