import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/lessons")({
  component: AdminLessons,
});

type Lesson = {
  id?: string;
  subject_id: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  duration_seconds: number;
  display_order: number;
};

const empty: Lesson = {
  subject_id: "",
  title: "",
  description: "",
  video_url: "",
  thumbnail_url: "",
  duration_seconds: 0,
  display_order: 0,
};

function AdminLessons() {
  const qc = useQueryClient();
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Lesson>(empty);
  const [durationMin, setDurationMin] = useState(0);

  const { data: subjects } = useQuery({
    queryKey: ["admin-subjects-list"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("id, name").order("display_order");
      return data ?? [];
    },
  });

  const { data: lessons } = useQuery({
    queryKey: ["admin-lessons", filterSubject],
    queryFn: async () => {
      let q = supabase
        .from("lessons")
        .select("*, subject:subjects(id, name, color)")
        .order("display_order");
      if (filterSubject !== "all") q = q.eq("subject_id", filterSubject);
      const { data } = await q;
      return data ?? [];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (l: Lesson) => {
      const payload = {
        ...l,
        description: l.description || null,
        video_url: l.video_url || null,
        thumbnail_url: l.thumbnail_url || null,
        duration_seconds: Math.max(0, Math.round(durationMin * 60)),
      };
      if (l.id) {
        const { error } = await supabase.from("lessons").update(payload).eq("id", l.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lessons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Aula salva");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aula removida");
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  function openNew() {
    const next = (lessons?.length ?? 0) + 1;
    setForm({ ...empty, display_order: next, subject_id: subjects?.[0]?.id ?? "" });
    setDurationMin(0);
    setOpen(true);
  }
  function openEdit(l: any) {
    setForm({ ...l });
    setDurationMin(Math.round((l.duration_seconds || 0) / 60));
    setOpen(true);
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Aulas</h2>
        <div className="flex items-center gap-2">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar matéria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as matérias</SelectItem>
              {(subjects ?? []).map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gradient-primary text-primary-foreground">
                <Plus className="mr-1 h-4 w-4" /> Nova aula
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{form.id ? "Editar aula" : "Nova aula"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Matéria</Label>
                  <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {(subjects ?? []).map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>URL do vídeo (MP4)</Label>
                  <Input value={form.video_url ?? ""} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label>URL da miniatura</Label>
                  <Input value={form.thumbnail_url ?? ""} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Duração (minutos)</Label>
                    <Input type="number" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ordem</Label>
                    <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} className="gradient-primary text-primary-foreground">
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="divide-y divide-border">
        {(lessons ?? []).map((l: any) => (
          <div key={l.id} className="flex items-center gap-3 py-3">
            <div
              className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
              style={
                l.thumbnail_url
                  ? { backgroundImage: `url(${l.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: l.subject?.color ?? "#A855F7" }
              }
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{l.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {l.subject?.name} · {Math.round((l.duration_seconds || 0) / 60)} min
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => { if (confirm(`Excluir "${l.title}"?`)) delMut.mutate(l.id); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {lessons?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma aula cadastrada.</p>
        )}
      </div>
    </Card>
  );
}
