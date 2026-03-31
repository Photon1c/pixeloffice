-- Supabase Phase 1 Schema for Pixel Office
-- This is Postgres-compatible SQL designed to run in Supabase.

-- 1. agents
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  role text not null,
  avatar text null,
  metadata jsonb null
);

-- 2. sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kind text not null,
  title text null,
  status text not null,
  context jsonb null
);

create index if not exists sessions_kind_idx on public.sessions(kind);
create index if not exists sessions_status_idx on public.sessions(status);

-- 3. events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  agent_id uuid null references public.agents(id) on delete set null,
  type text not null,
  payload jsonb not null
);

create index if not exists events_session_id_created_at_idx
  on public.events(session_id, created_at);
create index if not exists events_type_idx on public.events(type);

-- 4. tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_session_id uuid null references public.sessions(id) on delete set null,
  title text not null,
  description text not null,
  status text not null,
  priority text null,
  tags text[] null,
  assignee_id uuid null references public.agents(id) on delete set null
);

create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_assignee_id_idx on public.tasks(assignee_id);
create index if not exists tasks_source_session_id_idx on public.tasks(source_session_id);

-- 5. cooler_sessions (1–1 with sessions)
create table if not exists public.cooler_sessions (
  id uuid primary key references public.sessions(id) on delete cascade,
  topic text null,
  relevance_score numeric null,
  is_scrum_candidate boolean not null default false
);

create index if not exists cooler_sessions_is_scrum_candidate_idx
  on public.cooler_sessions(is_scrum_candidate);

-- 6. cooler_messages
create table if not exists public.cooler_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  cooler_session_id uuid not null references public.cooler_sessions(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  content text not null,
  sentiment text null,
  tags text[] null
);

create index if not exists cooler_messages_cooler_session_id_created_at_idx
  on public.cooler_messages(cooler_session_id, created_at);

-- 7. scrum_runs
create table if not exists public.scrum_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_cooler_session_id uuid null references public.cooler_sessions(id) on delete set null,
  source_session_id uuid null references public.sessions(id) on delete set null,
  title text not null,
  status text not null,
  summary text null
);

create index if not exists scrum_runs_status_idx on public.scrum_runs(status);

-- 8. scrum_stage_events
create table if not exists public.scrum_stage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  scrum_run_id uuid not null references public.scrum_runs(id) on delete cascade,
  stage text not null,
  payload jsonb not null
);

create index if not exists scrum_stage_events_scrum_run_id_created_at_idx
  on public.scrum_stage_events(scrum_run_id, created_at);
create index if not exists scrum_stage_events_stage_idx on public.scrum_stage_events(stage);

-- 9. artifacts
create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid null references public.sessions(id) on delete set null,
  scrum_run_id uuid null references public.scrum_runs(id) on delete set null,
  task_id uuid null references public.tasks(id) on delete set null,
  kind text not null,
  storage_path text not null,
  metadata jsonb null
);

create index if not exists artifacts_session_id_idx on public.artifacts(session_id);
create index if not exists artifacts_scrum_run_id_idx on public.artifacts(scrum_run_id);
create index if not exists artifacts_task_id_idx on public.artifacts(task_id);
create index if not exists artifacts_kind_idx on public.artifacts(kind);

