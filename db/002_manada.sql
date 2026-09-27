-- Tabelas específicas do Efeito Manada. Rode depois de db/001_salas.sql.

create extension if not exists unaccent with schema extensions;

-- Resposta de cada jogador em cada rodada. Fica invisível pros outros jogadores até
-- a revelação simultânea — é por isso que não vive dentro do jsonb público de `salas`
-- (RLS é por linha/tabela, não por campo dentro de um jsonb).
create table if not exists manada_respostas (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references salas(id) on delete cascade,
  rodada int not null,
  user_id uuid not null,
  resposta_texto text,
  resposta_normalizada text,
  confirmada boolean not null default false,
  unique (sala_id, rodada, user_id)
);

alter table manada_respostas enable row level security;

drop policy if exists "so o dono ve a propria resposta" on manada_respostas;
create policy "so o dono ve a propria resposta" on manada_respostas
  for select using (user_id = auth.uid());

-- Banco de perguntas — sorteado no servidor (nunca client-supplied), pra ninguém
-- adulterar qual pergunta aparece.
create table if not exists manada_perguntas (
  id serial primary key,
  texto text not null unique
);

insert into manada_perguntas (texto) values
  ('Qual é o melhor sabor de pizza?'),
  ('Qual animal você não gostaria de encontrar dentro da sua casa?'),
  ('Qual é a coisa mais importante para levar para uma ilha deserta?'),
  ('Qual super-herói é o mais famoso?'),
  ('Qual comida combina mais com domingo?'),
  ('Qual profissão parece mais estressante?'),
  ('Qual é o pior lugar para ficar preso?'),
  ('Qual é o pior sabor de sorvete?'),
  ('Qual eletrodoméstico você levaria pra ilha deserta?'),
  ('Qual é o filme mais assistido de todos os tempos?'),
  ('Qual é a pior parte de uma viagem de avião?'),
  ('Qual é o animal mais fofo que existe?'),
  ('Qual é a melhor época do ano?'),
  ('Qual é o pior trânsito do Brasil?'),
  ('Qual é o esporte mais chato de assistir?'),
  ('Qual é a bebida mais consumida numa festa?'),
  ('Qual é o pior dia da semana?'),
  ('Qual é a rede social mais usada hoje em dia?'),
  ('Qual é o maior medo das pessoas?'),
  ('Qual é o melhor lugar pra um encontro romântico?'),
  ('Qual é a fruta mais consumida no Brasil?'),
  ('Qual é o pior tipo de vizinho?'),
  ('Qual é o programa de TV mais famoso?'),
  ('Qual é a melhor desculpa pra chegar atrasado?'),
  ('Qual é o cheiro mais gostoso do mundo?')
on conflict (texto) do nothing;
