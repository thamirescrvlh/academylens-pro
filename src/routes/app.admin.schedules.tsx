import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/schedules")({
  component: AdminSchedules,
});

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function AdminSchedules() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string>("");
  const [addDay, setAddDay] = useState<string>("1");
  const [addLesson, setAddLesson] = useState<string>("");

  const { data: users } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, username, full_name").order("username");
      return data ?? [];
    },
  });

  const { data: lessons } = useQuery({
    queryKey: ["admin-lessons-flat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lessons")
        .select("id, title, subject:subjects(name)")
        .order("title");
      return data ?? [];
    },
  });

  const { data: schedule } = useQuery({
    queryKey: ["admin-schedule", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("schedules")
        .select("id, day_of_week, display_order, lesson:lessons(id, title, subject:subjects(name, color))")
        .eq("user_id", userId)
        .order("day_of_week")
        .order("display_order");
      return data ?? [];
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      if (!userId || !addLesson) throw new Error("Selecione aluno e aula");
      const day = Number(addDay);
      const order = (schedule?.filter((s: any) => s.day_of_week === day).length ?? 0) + 1;
      const { error } = await supabase
        .from("schedules")
        .insert({ user_id: userId, day_of_week: day, lesson_id: addLesson, display_order: order });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Adicionado ao cronograma");
      qc.invalidateQueries({ queryKey: ["admin-schedule", userId] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-schedule", userId] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Selecione o aluno</Label>
        <div className="mt-2 max-w-md">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger><SelectValue placeholder="Escolher aluno..." /></SelectTrigger>
            <SelectContent>
              {(users ?? []).map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name ? `${u.full_name} (${u.username})` : u.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {userId && (
        <>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold">Adicionar aula</h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <Select value={addDay} onValueChange={setAddDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={addLesson} onValueChange={setAddLesson}>
                <SelectTrigger><SelectValue placeholder="Escolher aula..." /></SelectTrigger>
                <SelectContent>
                  {(lessons ?? []).map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.subject?.name} · {l.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => addMut.mutate()} disabled={addMut.isPending} className="gradient-primary text-primary-foreground">
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const items = (schedule ?? []).filter((s: any) => s.day_of_week === day);
              return (
                <Card key={day} className="p-4">
                  <h3 className="mb-2 font-bold">{DAYS[day]}</h3>
                  {items.length === 0 ? (
                    <p className="rounded bg-muted px-3 py-4 text-center text-xs text-muted-foreground">Vazio</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((s: any) => (
                        <li key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.lesson?.subject?.color }} />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {s.lesson?.subject?.name} · {s.lesson?.title}
                          </span>
                          <Button size="icon" variant="ghost" onClick={() => delMut.mutate(s.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
