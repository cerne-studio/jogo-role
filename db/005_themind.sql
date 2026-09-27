-- Tabela específica do The Mind. Rode depois de db/001_salas.sql.

-- Mão de cada jogador em cada rodada. Só o dono vê os valores — os outros só
-- sabem quantas cartas cada um tem (isso vive no jsonb público de `salas`).
create table if not exists themind_maos (
  sala_id uuid not null references salas(id) on delete cascade,
  rodada int not null,
  user_id uuid not null,
  cartas int[] not null default '{}',
  primary key (sala_id, rodada, user_id)
);

alter table themind_maos enable row level security;

drop policy if exists "so o dono ve a propria mao" on themind_maos;
create policy "so o dono ve a propria mao" on themind_maos
  for select using (user_id = auth.uid());
