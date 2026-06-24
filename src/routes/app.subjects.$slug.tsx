import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, PlayCircle, ChevronLeft } from "lucide-react";
import { useMemo } from "react";
import { LessonCover } from "@/components/lesson-cover";

export const Route = createFileRoute("/app/subjects/$slug")({
  component: SubjectPage,
});

function formatDuration(seconds: number) {
  if (!seconds) return "--";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}min`;
}

function SubjectPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["subject", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: subject } = await supabase
        .from("subjects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!subject) throw notFound();
      const [{ data: lessons }, { data: progress }] = await Promise.all([
        supabase
          .from("lessons")
          .select("*")
          .eq("subject_id", subject.id)
          .order("display_order"),
        supabase
          .from("lesson_progress")
          .select("lesson_id, completed_at")
          .eq("user_id", user!.id),
      ]);
      return { subject, lessons: lessons ?? [], progress: progress ?? [] };
    },
  });

  const completedSet = useMemo(
    () => new Set((data?.progress ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id)),
    [data?.progress],
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>;
  }
  if (!data) return null;

  const total = data.lessons.length;
  const done = data.lessons.filter((l) => completedSet.has(l.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link to="/app/subjects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Matérias
      </Link>

      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-card md:p-8"
        style={{
          background: `linear-gradient(135deg, ${data.subject.color}, color-mix(in oklab, ${data.subject.color} 50%, #8B5CF6))`,
        }}
      >
        <h1 className="text-3xl font-extrabold md:text-4xl">{data.subject.name}</h1>
        {data.subject.description && (
          <p className="mt-1 max-w-2xl text-sm text-white/90 md:text-base">
            {data.subject.description}
          </p>
        )}
        <div className="mt-5 max-w-md rounded-2xl bg-white/15 p-3 backdrop-blur">
          <div className="flex items-center justify-between text-xs">
            <span>Progresso</span>
            <span className="font-semibold">{pct}% · {done}/{total}</span>
          </div>
          <Progress value={pct} className="mt-2 h-2 bg-white/25" />
        </div>
      </div>

      {data.lessons.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma aula cadastrada nesta matéria ainda.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.lessons.map((l) => {
            const isDone = completedSet.has(l.id);
            return (
              <Card key={l.id} className="overflow-hidden p-0 shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant">
                <Link to="/app/lessons/$id" params={{ id: l.id }} className="group block">
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <LessonCover
                      className="absolute inset-0 h-full w-full"
                      subjectName={data.subject.name}
                      subjectColor={data.subject.color}
                      lessonNumber={l.display_order}
                      thumbnailUrl={l.thumbnail_url}
                    />
                    <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                      <PlayCircle className="h-12 w-12 text-white" />
                    </div>
                    {isDone && (
                      <Badge className="absolute right-2 top-2 bg-success text-success-foreground border-0">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Concluída
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 text-sm font-bold">{l.title}</h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(l.duration_seconds)}
                      </span>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-primary">
                        Assistir
                      </Button>
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
