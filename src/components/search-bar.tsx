import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const [{ data: subs }, { data: less }] = await Promise.all([
        supabase
          .from("subjects")
          .select("id, name, slug")
          .ilike("name", `%${q}%`)
          .limit(5),
        supabase
          .from("lessons")
          .select("id, title, subject:subjects(name, slug)")
          .ilike("title", `%${q}%`)
          .limit(8),
      ]);
      return { subjects: subs ?? [], lessons: less ?? [] };
    },
  });

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar matérias ou aulas..."
          className="pl-9"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && q.trim().length >= 2 && data && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-card">
          {data.subjects.length === 0 && data.lessons.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {data.subjects.length > 0 && (
                <div className="px-2 py-2">
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Matérias
                  </p>
                  {data.subjects.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setOpen(false);
                        setQ("");
                        navigate({ to: "/app/subjects/$slug", params: { slug: s.slug } });
                      }}
                      className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              {data.lessons.length > 0 && (
                <div className="border-t border-border px-2 py-2">
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Aulas
                  </p>
                  {data.lessons.map((l: any) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setOpen(false);
                        setQ("");
                        navigate({ to: "/app/lessons/$id", params: { id: l.id } });
                      }}
                      className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                    >
                      <p className="truncate font-medium">{l.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.subject?.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
