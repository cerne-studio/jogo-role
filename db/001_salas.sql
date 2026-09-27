-- Infraestrutura de sala compartilhada por todos os jogos multiplayer em tempo real
-- (Efeito Manada, The Mind). Rode este arquivo primeiro, no SQL Editor do Supabase,
-- num projeto NOVO e dedicado ao jogo-role.
--
-- Identidade: cada celular usa uma sessão anônima do Supabase Auth (auth.uid() estável
-- por navegador, sem tela de login). RLS de leitura é aberta (é um jogo de festa, o
-- "segredo" real está nas tabelas privadas de cada jogo, não aqui). Todas as escritas
-- passam por funções RPC "security definer" (ver db/003_rpc_salas.sql em diante) —
-- não existe policy de insert/update direto nessas tabelas de propósito.

create extension if not exists pgcrypto;

create table if not exists salas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,               -- código de 6 dígitos, como em "A Bomba"
  jogo text not null check (jogo in ('manada', 'themind')),
  status text not null default 'lobby' check (status in ('lobby', 'em_andamento', 'finalizado')),
  host_id uuid not null,
  estado jsonb not null default '{}'::jsonb, -- todo estado público (não-secreto) do jogo
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create table if not exists sala_jogadores (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references salas(id) on delete cascade,
  user_id uuid not null,
  nome text not null,
  entrou_em timestamptz not null default now(),
  unique (sala_id, user_id)
);

alter table salas enable row level security;
alter table sala_jogadores enable row level security;

drop policy if exists "sala publica" on salas;
create policy "sala publica" on salas for select using (true);

drop policy if exists "roster publico" on sala_jogadores;
create policy "roster publico" on sala_jogadores for select using (true);

-- Sem isso, o Realtime (postgres_changes) nunca dispara pra essas tabelas —
-- é o passo que mais fácil esquecer de fazer, já aconteceu uma vez aqui.
alter publication supabase_realtime add table salas;
alter publication supabase_realtime add table sala_jogadores;
