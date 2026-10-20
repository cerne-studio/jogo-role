-- Tempo de escolha do draft: 30 s (era 7). Rode depois de db/020_torneio_preparar_fix.sql.
-- A rodada continua fechando assim que todos os humanos escolhem; o relógio só vale quando alguém demora.
create or replace function fd_segundos_escolha() returns int language sql immutable as $$ select 30 $$;
