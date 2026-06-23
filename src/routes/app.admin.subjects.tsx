import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/app/admin/subjects")({
  component: AdminSubjects,
});

type Subject = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  display_order: number;
};

const empty: Subject = { name: "", slug: "", description: "", color: "#A855F7", icon: "BookOpen", display_order: 0 };

function AdminSubjects() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Subject>(empty);

  const { data } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("*").order("display_order");
      return data ?? [];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (s: Subject) => {
      const payload = { ...s, description: s.description || null };
      if (s.id) {
        const { error } = await supabase.from("subjects").update(payload).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subjects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Matéria salva");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-subjects"] });
      qc.invalidateQueries({ queryKey: ["subjects-overview"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Matéria removida");
      qc.invalidateQueries({ queryKey: ["admin-subjects"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  function openNew() {
    setForm({ ...empty, display_order: (data?.length ?? 0) + 1 });
    setOpen(true);
  }
  function openEdit(s: any) {
    setForm({ ...s });
    setOpen(true);
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Matérias</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gradient-primary text-primary-foreground">
              <Plus className="mr-1 h-4 w-4" /> Nova
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar matéria" : "Nova matéria"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ex: matematica" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Cor</Label>
                  <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ícone</Label>
                  <Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="BookOpen" />
                </div>
                <div className="space-y-1.5">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                  />
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

      <div className="divide-y divide-border">
        {(data ?? []).map((s: any) => (
          <div key={s.id} className="flex items-center gap-3 py-3">
            <div className="h-8 w-8 shrink-0 rounded-lg" style={{ background: s.color }} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{s.name}</p>
              <p className="truncate text-xs text-muted-foreground">/{s.slug}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(`Excluir "${s.name}"? Todas as aulas também serão removidas.`))
                  delMut.mutate(s.id);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
