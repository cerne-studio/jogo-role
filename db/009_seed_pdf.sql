-- Seed do baralho do P.D.F. Rode depois de db/008_pdf.sql.
-- Fonte única: db/data/pdf-baralho.txt (linhas `P|lacunas|tema|texto` e `B|tema|texto`).
-- Carrega direto do GitHub (raw) pra não duplicar 500 cartas dentro de um .sql. Idempotente:
-- unique (tipo, texto) + on conflict do nothing, então pode rodar de novo depois de editar o .txt.
-- A extensão http é usada só aqui e removida no fim (não fica exposta no banco).

create extension if not exists http with schema extensions;

with src as (
  select (extensions.http_get('https://raw.githubusercontent.com/cerne-studio/jogo-role/main/db/data/pdf-baralho.txt')).content as c
), linhas as (
  select trim(both E'\r' from l) as l from src, regexp_split_to_table(c, E'\n') l
)
insert into pdf_cartas (tipo, lacunas, tema, texto)
select 'P', split_part(l, '|', 2)::smallint, split_part(l, '|', 3), split_part(l, '|', 4) from linhas where l like 'P|%'
union all
select 'B', 0, split_part(l, '|', 2), split_part(l, '|', 3) from linhas where l like 'B|%'
on conflict (tipo, texto) do nothing;

drop extension if exists http;
