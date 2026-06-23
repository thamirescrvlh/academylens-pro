import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, CheckCircle2, Clock, SkipForward, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/lessons/$id")({
  component: LessonPage,
});

function LessonPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [autoNext, setAutoNext] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["lesson", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("*, subject:subjects(id, name, slug, color)")
        .eq("id", id)
        .maybeSingle();
      if (!lesson) return null;
      const { data: siblings } = await supabase
        .from("lessons")
        .select("id, display_order, title")
        .eq("subject_id", lesson.subject_id)
        .order("display_order");
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("completed_at, watch_seconds")
        .eq("user_id", user!.id)
        .eq("lesson_id", id)
        .maybeSingle();
      return { lesson, siblings: siblings ?? [], progress };
    },
  });

  const completeMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("lesson_progress")
        .upsert(
          {
            user_id: user!.id,
            lesson_id: id,
            completed_at: new Date().toISOString(),
            watch_seconds: Math.round(videoRef.current?.currentTime ?? 0),
          },
          { onConflict: "user_id,lesson_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aula concluída!");
      qc.invalidateQueries({ queryKey: ["lesson", id] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["subject"] });
      qc.invalidateQueries({ queryKey: ["subjects-overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (autoNext && nextLesson) {
        setTimeout(() => navigate({ to: "/app/lessons/$id", params: { id: nextLesson.id } }), 800);
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao concluir"),
  });

  if (isLoading) return <Loader2 className="mx-auto mt-12 h-6 w-6 animate-spin text-primary" />;
  if (!data || !data.lesson) {
    return (
      <Card className="mx-auto max-w-md p-6 text-center">
        <p>Aula não encontrada.</p>
        <Button asChild variant="link"><Link to="/app/subjects">Voltar</Link></Button>
      </Card>
    );
  }

  const { lesson, siblings, progress } = data;
  const idx = siblings.findIndex((s) => s.id === lesson.id);
  const nextLesson = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const isDone = !!progress?.completed_at;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        to="/app/subjects/$slug"
        params={{ slug: lesson.subject.slug }}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {lesson.subject.name}
      </Link>

      <Card className="overflow-hidden p-0 shadow-card">
        <div className="aspect-video w-full bg-black">
          {lesson.video_url ? (
            <video
              ref={videoRef}
              key={lesson.id}
              src={lesson.video_url}
              poster={lesson.thumbnail_url ?? undefined}
              controls
              controlsList="nodownload"
              className="h-full w-full"
              onEnded={() => {
                if (!isDone) completeMut.mutate();
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/70">
              Vídeo ainda não disponível.
            </div>
          )}
        </div>
        <div className="space-y-4 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge style={{ backgroundColor: lesson.subject.color, color: "#fff" }} className="border-0">
                {lesson.subject.name}
              </Badge>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">{lesson.title}</h1>
              {lesson.description && (
                <p className="mt-2 text-sm text-muted-foreground">{lesson.description}</p>
              )}
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {Math.round((lesson.duration_seconds || 0) / 60)} min
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={autoNext} onCheckedChange={setAutoNext} />
                Próxima auto
              </label>
              {isDone ? (
                <Button variant="outline" disabled>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> Concluída
                </Button>
              ) : (
                <Button
                  onClick={() => completeMut.mutate()}
                  disabled={completeMut.isPending}
                  className="gradient-primary text-primary-foreground shadow-elegant"
                >
                  {completeMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Concluir aula
                </Button>
              )}
              {nextLesson && (
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/app/lessons/$id", params: { id: nextLesson.id } })}
                >
                  <SkipForward className="mr-2 h-4 w-4" /> Próxima
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {siblings.length > 1 && (
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold">Outras aulas de {lesson.subject.name}</h3>
          <ul className="divide-y divide-border">
            {siblings.map((s) => (
              <li key={s.id}>
                <Link
                  to="/app/lessons/$id"
                  params={{ id: s.id }}
                  className={`flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-accent ${
                    s.id === lesson.id ? "text-primary font-semibold" : ""
                  }`}
                >
                  <span className="truncate">
                    {String(s.display_order ?? 0).padStart(2, "0")} · {s.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
