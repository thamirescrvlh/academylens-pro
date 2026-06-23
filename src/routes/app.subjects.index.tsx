import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calculator, Landmark, Atom, PenLine, Languages, Globe } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/app/subjects/")({
  component: SubjectsPage,
});

const ICONS: Record<string, any> = {
  BookOpen, Calculator, Landmark, Atom, PenLine, Languages, Globe,
};

function SubjectsPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["subjects-overview", user?.id],
    queryFn: async () => {
      const [{ data: subjects }, { data: lessons }, { data: progress }] = await Promise.all([
        supabase.from("subjects").select("*").order("display_order"),
        supabase.from("lessons").select("id, subject_id"),
        supabase
          .from("lesson_progress")
          .select("lesson_id, completed_at")
          .eq("user_id", user!.id),
      ]);
      return { subjects: subjects ?? [], lessons: lessons ?? [], progress: progress ?? [] };
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const completed = new Set(
      (data?.progress ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id),
    );
    const m: Record<string, { total: number; done: number }> = {};
    (data?.lessons ?? []).forEach((l) => {
      if (!m[l.subject_id]) m[l.subject_id] = { total: 0, done: 0 };
      m[l.subject_id].total += 1;
      if (completed.has(l.id)) m[l.subject_id].done += 1;
    });
    return m;
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Áreas de Estudo</h1>
        <p className="text-sm text-muted-foreground">Escolha uma matéria para ver as aulas.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.subjects ?? []).map((s: any) => {
          const Icon = ICONS[s.icon] ?? BookOpen;
          const st = stats[s.id] ?? { total: 0, done: 0 };
          const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
          return (
            <Link
              key={s.id}
              to="/app/subjects/$slug"
              params={{ slug: s.slug }}
              className="group block"
            >
              <Card className="relative h-full overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-elegant">
                <div
                  className="h-28 w-full"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}, color-mix(in oklab, ${s.color} 60%, white))`,
                  }}
                >
                  <div className="flex h-full items-end justify-between p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 backdrop-blur">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
                      {st.total} aulas
                    </span>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <div>
                    <h3 className="text-lg font-bold">{s.name}</h3>
                    {s.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span className="font-semibold text-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-1.5 h-2" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
