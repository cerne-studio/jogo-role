-- Clubes reais que jogam como bots no campeonato do Draft FC. Rode depois de db/017_draft_agora.sql.
-- Cada clube guarda o melhor titular dele numa temporada (picks = os 11, já escalados na formação).
-- Sem policy de select: o cliente só recebe os clubes que entraram no campeonato dele (db/019_torneio.sql).

create table if not exists fd_clubes (
  id serial primary key,
  pool text not null check (pool in ('hist', 'atual')),
  clube_id int not null,
  nome text not null,
  sigla text not null,
  liga text not null,
  versao int,
  formacao text not null,
  overall numeric(4, 1) not null,
  picks jsonb not null,
  unique (pool, clube_id)
);
create index if not exists fd_clubes_pool_liga on fd_clubes (pool, liga);
alter table fd_clubes enable row level security;
