-- Hora do servidor, pro cliente alinhar o relógio das contagens regressivas do draft (round trip medido no celular).
-- Rode depois de db/016_draft_elegiveis_atributos.sql.

create or replace function fd_agora()
returns timestamptz
language sql
stable
as $$ select now() $$;

revoke all on function fd_agora() from public, anon;
grant execute on function fd_agora() to authenticated;
