import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BookMarked, Video, Users, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/app/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: subjects }, { count: lessons }, { count: users }, { count: schedules }] =
        await Promise.all([
          supabase.from("subjects").select("*", { count: "exact", head: true }),
          supabase.from("lessons").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("schedules").select("*", { count: "exact", head: true }),
        ]);
      return { subjects, lessons, users, schedules };
    },
  });

  const cards = [
    { label: "Matérias", value: data?.subjects ?? 0, icon: BookMarked, to: "/app/admin/subjects" },
    { label: "Aulas", value: data?.lessons ?? 0, icon: Video, to: "/app/admin/lessons" },
    { label: "Usuários", value: data?.users ?? 0, icon: Users, to: "/app/admin/users" },
    { label: "Itens no cronograma", value: data?.schedules ?? 0, icon: CalendarDays, to: "/app/admin/schedules" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Link key={c.label} to={c.to}>
          <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-elegant">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <c.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-extrabold">{c.value}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
