# Plataforma de Estudos — Plano

Aplicativo web responsivo para estudos privados, com login, cronograma semanal, matérias, player de vídeo, progresso salvo e painel admin.

## Stack e backend
- React + TypeScript + TanStack Start (já configurado)
- Lovable Cloud (Supabase gerenciado) para auth, banco e storage
- Tailwind v4 com design system semântico (branco/preto/azul)
- Tema claro/escuro com toggle

## Identidade visual
- Inspiração: Netflix (cards de aulas com thumbnail), Duolingo (gamificação leve do progresso, badges verdes de concluído), Notion (sidebar limpa, tipografia clara)
- Paleta: branco, preto, azul royal como primary, azul claro como accent
- Sidebar lateral recolhível (ícone-only quando colapsada)
- Tipografia: Inter para UI, fonte display marcante para títulos

## Banco de dados (migration)
```
profiles(id→auth.users, username, full_name, avatar_url)
user_roles(user_id, role)  -- enum: admin, student
subjects(id, name, slug, color, icon, order)
lessons(id, subject_id, title, description, video_url, thumbnail_url, duration_seconds, order)
schedules(id, user_id, day_of_week, lesson_id, order)  -- 0=domingo..6=sábado
lesson_progress(id, user_id, lesson_id, completed_at, watch_seconds)
```
RLS: alunos veem/editam só o próprio progresso e cronograma; admins via `has_role()` security definer.

## Rotas
```
/auth                       login + cadastro
/_authenticated/
  index                     Cronograma (home)
  subjects                  Lista de matérias
  subjects/$slug            Aulas da matéria
  lessons/$id               Player de vídeo
  dashboard                 Estatísticas de estudo
  admin/                    (gate por role admin)
    subjects                CRUD matérias
    lessons                 CRUD aulas
    schedules               Editar cronogramas
    users                   Lista + progresso
```

## Funcionalidades
- **Login/cadastro**: email + senha (username salvo em profiles)
- **Cronograma**: 7 colunas (desktop) / accordion por dia (mobile); cada item mostra matéria, aula, duração, check verde se concluída
- **Matérias**: grid de cards estilo Netflix com cor da matéria; clique abre lista de aulas com thumbnail, título, duração, botão Assistir, badge concluído
- **Player**: `<video>` HTML5 com controles nativos estilizados, botão "Concluir aula", auto-próxima aula opcional (toggle)
- **Progresso**: % por matéria + % geral, persistido em `lesson_progress`
- **Admin**: tabelas com CRUD inline, upload de thumbnail/vídeo para storage Supabase, drag-to-reorder simples
- **Busca**: barra global no header filtra matérias e aulas
- **Dashboard**: aulas concluídas/semana, tempo estimado, matérias em andamento
- **Tema**: toggle claro/escuro persistido em localStorage

## Detalhes técnicos
- Server functions (`*.functions.ts`) para todas leituras/escritas autenticadas com `requireSupabaseAuth`
- Promoção de admin: primeiro usuário ou via seed manual (instrução documentada)
- Painel admin gated por nested layout `/_authenticated/admin` chamando `has_role`
- Página inicial pública `/` redireciona para `/auth` ou `/cronograma`

## Entregáveis nesta primeira versão
1. Design system + tema dark/light
2. Auth (login/cadastro) + sidebar app shell
3. Schema + RLS + seed de matérias
4. Cronograma, lista de matérias, lista de aulas, player com marcação de concluído
5. Dashboard com progresso
6. Admin CRUD de matérias/aulas/cronogramas + lista de usuários
7. Busca global e responsividade mobile

Confirma que posso seguir? Se quiser ajustar escopo (ex: deixar admin para depois, ou começar só com cronograma + player), me diga.