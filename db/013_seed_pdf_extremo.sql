-- Seed do pacote 'extremo' do P.D.F. Rode depois de db/012_pdf_pacote.sql.
-- Fonte: db/data/pdf-baralho-extremo.txt (mesmo formato do baralho base). Carrega do GitHub raw e é
-- idempotente (unique (tipo, texto) + on conflict do nothing). A extensão http é removida no fim.

create extension if not exists http with schema extensions;

with src as (
  select (extensions.http_get('https://raw.githubusercontent.com/cerne-studio/jogo-role/main/db/data/pdf-baralho-extremo.txt')).content as c
), linhas as (
  select trim(both E'\r' from l) as l from src, regexp_split_to_table(c, E'\n') l
)
insert into pdf_cartas (tipo, lacunas, tema, texto, pacote)
select 'P', split_part(l, '|', 2)::smallint, split_part(l, '|', 3), split_part(l, '|', 4), 'extremo' from linhas where l like 'P|%'
union all
select 'B', 0, split_part(l, '|', 2), split_part(l, '|', 3), 'extremo' from linhas where l like 'B|%'
on conflict (tipo, texto) do nothing;

drop extension if exists http;
