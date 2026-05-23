
# SLT (System Level Tech) — MVP Frontend Scaffold

Build the visual skeleton of the SLT admin panel. This first iteration is **frontend-only with mocked data** (no backend wiring yet) so we can lock the design system, navigation, and key screens. Backend integration (Lovable Cloud / Supabase, real JWT, RLS multi-tenant) will be a separate step once the UI is approved.

## Design system

Update `src/styles.css` tokens (oklch equivalents):
- `--background`: Midnight Blue `#0F172A`
- `--primary`: Electric Blue `#2563EB` (CTAs, links ativos)
- `--accent`: Cyan `#06B6D4` (badges de IA, destaques secundários)
- `--card`, `--muted`, `--border`: tons slate harmonizados, modo escuro como padrão
- Tipografia: Poppins (headings via `font-display`), Inter (body) — carregadas via Google Fonts em `__root.tsx`
- Sombras suaves, raio `0.75rem`, estados hover/focus consistentes

## Rotas (TanStack Router, file-based)

```
src/routes/
  __root.tsx                 // shell + fonts + QueryClient
  index.tsx                  // redireciona para /login ou /dashboard
  login.tsx                  // tela pública
  _app.tsx                   // layout autenticado (Sidebar + Topbar + Outlet)
  _app/dashboard.tsx         // painel executivo
  _app/organizations.tsx     // placeholder (lista mock de companies)
  _app/athletes.tsx          // CRUD de atletas em tabela
  _app/workouts.tsx          // placeholder de treinos
```

Auth mockado: contexto `AuthProvider` em `src/lib/auth.tsx` que guarda `{ user, tenant }` em `localStorage` e expõe `login/logout`. `_app.tsx` redireciona para `/login` se não autenticado (simulação até plugar Supabase).

## Componentes

- `src/components/AppSidebar.tsx` — shadcn Sidebar colapsável, logo SLT, itens: Dashboard, Organizações, Atletas, Treinos; rodapé com avatar + logout.
- `src/components/Topbar.tsx` — `SidebarTrigger`, breadcrumb, badge do tenant atual, botão de notificações.
- `src/components/StatCard.tsx` — card de KPI (ícone, valor, delta, label).
- `src/components/ActivityFeed.tsx` — lista de logs recentes com timestamps relativos.
- `src/components/athletes/AthleteTable.tsx` — tabela shadcn com busca, status badge, ações (Editar, Prescrever Treino).
- `src/components/athletes/AthleteFormDialog.tsx` — dialog para criar/editar atleta (nome, email, plano, dados antropométricos básicos).
- Estados de loading (Skeleton), vazio (empty state ilustrado) e erro (alert) em todas as views.

## Tela: Login (`/login`)

Split-screen: lado esquerdo com gradiente Midnight→Electric e tagline "Performance esportiva orientada por dados". Lado direito card de login: campo email, senha, "Entrar" (primary), link "Esqueci minha senha". Validação com `react-hook-form` + `zod`. No submit, simula JWT (gera token fake, salva tenant mock) e navega para `/dashboard`.

## Tela: Dashboard (`/_app/dashboard`)

Grid de 4 `StatCard`s:
- Alunos ativos
- Taxa de adimplência (%)
- Treinos prescritos no mês
- Sessões concluídas (7d)

Abaixo: grid 2 colunas — gráfico de linha (Recharts) de evolução semanal + `ActivityFeed` com 6 eventos mock.

## Tela: Atletas (`/_app/athletes`)

Header com título, busca e botão "Novo Atleta" (abre `AthleteFormDialog`). Tabela com colunas: Nome, Email, Plano (badge: Ativo/Inadimplente/Pausado), Última avaliação, Ações (Editar, **Prescrever Treino** — botão primário cyan que abre toast "Em breve"). CRUD opera sobre estado local (`useState` com array mock de ~8 atletas).

## Telas placeholder

`Organizações` e `Treinos` recebem layout com header + empty state "Em construção" para manter navegação consistente.

## Detalhes técnicos

- Pacotes já disponíveis: shadcn/ui completo, lucide-react, react-hook-form, zod, recharts, sonner (toasts).
- Sem instalação adicional necessária.
- Mobile: sidebar vira Sheet via `useIsMobile`; tabela de atletas vira lista de cards em <768px.
- Tema dark por padrão (adicionar `class="dark"` no `<html>`); modo claro fora do escopo desta etapa.

## Fora do escopo desta etapa

- Lovable Cloud / Supabase, RLS, JWT real, multi-tenant server-side.
- Editor de periodização / blocos de exercícios.
- Billing / cobrança.

## Pergunta antes de implementar

Confirma o escopo acima frontend-only com dados mockados? Ou prefere já habilitar **Lovable Cloud** nesta primeira etapa para criar as tabelas `companies/users/athletes/workouts` e login real?
