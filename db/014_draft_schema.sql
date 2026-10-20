-- DRAFT FC (jogo de futebol com draft por letra). Rode depois de db/013_seed_pdf_extremo.sql.
--
-- fd_jogadores (pool de jogadores) e fd_formacoes NÃO têm policy de select: o cliente nunca lê o pool inteiro,
-- só pede as opções da rodada via RPC (db/015_draft_rpc.sql). fd_escolhas é pública dentro do jogo
-- (a regra "Pego por X" exige que todo mundo veja quem pegou quem).
-- Estado público em salas.estado (jogo 'draft'): ver cabeçalho de db/015_draft_rpc.sql.

alter table salas drop constraint if exists salas_jogo_check;
alter table salas add constraint salas_jogo_check check (jogo in ('manada', 'themind', 'pdf', 'draft'));

create table if not exists fd_jogadores (
  pid serial primary key,
  pool text not null check (pool in ('hist', 'atual')),
  id_fonte int not null,
  versao int,
  nome text not null,
  nome_completo text not null,
  letras text not null,                 -- iniciais (A-Z, sem acento) de cada palavra de nome + nome completo
  posicoes text[] not null,
  overall smallint not null,
  ritmo smallint, chute smallint, passe smallint, drible smallint, defesa smallint, fisico smallint,
  agressividade smallint, penaltis smallint, goleiro smallint,
  clube text, liga text, pais text, idade smallint,
  unique (pool, id_fonte)
);
create index if not exists fd_jogadores_pool_liga on fd_jogadores (pool, liga);
alter table fd_jogadores enable row level security;

create table if not exists fd_formacoes (
  nome text primary key,
  slots text[] not null
);
alter table fd_formacoes enable row level security;

create table if not exists fd_escolhas (
  sala_id uuid not null references salas(id) on delete cascade,
  user_id uuid not null,
  slot smallint not null,               -- 1..11, posição na formação do jogador
  jogador_pid int not null references fd_jogadores(pid),
  rodada smallint not null,
  auto boolean not null default false,
  escolhida_em timestamptz not null default now(),
  primary key (sala_id, user_id, slot)
);
create unique index if not exists fd_escolhas_sala_jogador on fd_escolhas (sala_id, jogador_pid);
alter table fd_escolhas enable row level security;
drop policy if exists "escolhas publicas draft" on fd_escolhas;
create policy "escolhas publicas draft" on fd_escolhas for select using (true);

do $$ begin
  alter publication supabase_realtime add table fd_escolhas;
exception when duplicate_object then null;
end $$;

create or replace function fd_aceita(r text)
returns text[]
language sql
immutable
as $$
  select case r
    when 'GOL' then array['GK']
    when 'ZAG' then array['CB']
    when 'LE' then array['LB', 'LWB']
    when 'LD' then array['RB', 'RWB']
    when 'VOL' then array['CDM', 'CM']
    when 'MC' then array['CM', 'CDM', 'CAM']
    when 'MEI' then array['CAM', 'CM', 'CF']
    when 'ME' then array['LM', 'LW', 'LWB']
    when 'MD' then array['RM', 'RW', 'RWB']
    when 'PE' then array['LW', 'LM', 'ST']
    when 'PD' then array['RW', 'RM', 'ST']
    when 'ATA' then array['ST', 'CF', 'LW', 'RW']
    else array[]::text[] end
$$;

insert into fd_formacoes (nome, slots) values
  ('4-3-3', array['GOL', 'LE', 'ZAG', 'ZAG', 'LD', 'MC', 'VOL', 'MC', 'PE', 'ATA', 'PD']),
  ('4-4-2', array['GOL', 'LE', 'ZAG', 'ZAG', 'LD', 'ME', 'MC', 'MC', 'MD', 'ATA', 'ATA']),
  ('4-2-3-1', array['GOL', 'LE', 'ZAG', 'ZAG', 'LD', 'VOL', 'VOL', 'ME', 'MEI', 'MD', 'ATA']),
  ('3-5-2', array['GOL', 'ZAG', 'ZAG', 'ZAG', 'LE', 'MC', 'VOL', 'MC', 'LD', 'ATA', 'ATA']),
  ('4-5-1', array['GOL', 'LE', 'ZAG', 'ZAG', 'LD', 'ME', 'MC', 'VOL', 'MC', 'MD', 'ATA']),
  ('5-3-2', array['GOL', 'LE', 'ZAG', 'ZAG', 'ZAG', 'LD', 'MC', 'VOL', 'MC', 'ATA', 'ATA']),
  ('3-4-3', array['GOL', 'ZAG', 'ZAG', 'ZAG', 'ME', 'MC', 'MC', 'MD', 'PE', 'ATA', 'PD'])
on conflict (nome) do update set slots = excluded.slots;
