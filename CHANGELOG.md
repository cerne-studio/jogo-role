# Changelog

Registro de alterações. Mais recente no topo.

## Formato
```
## AAAA-MM-DD — [Claude/Codex]
- O que mudou (1-3 linhas diretas)
```

---

## 2026-09-27 — Claude
- Adiciona infraestrutura de sala multiplayer em tempo real (Supabase: sessão anônima, RLS, RPCs `security definer`) e o jogo **Efeito Manada** — times respondem em segredo, revelação simultânea, maioria vira "manada" e pontua, isolado único vira Vaca Rosa
- Arquivos: `db/00{1,2,3,4}_*.sql`, `src/lib/supabase.js`, `src/components/sala/` (sala compartilhada, reaproveitável por outros jogos multi-dispositivo), `src/components/manada/`
- Testado de ponta a ponta com 3 sessões simultâneas (sala, reconexão pós-reload, Realtime ao vivo, maioria, Vaca Rosa)

---

## 2026-09-21 — Claude
- **Bugfix carreira**: corrige dupla subtração de `jogosLesado` em `simularTemporada` (caller já ajustava `liga.jogos`); quando `jogosEfetivos === 0`, stats zeradas em vez de calculadas; tela de resultado mostra "Temporada perdida" ao invés de PTS/REB/AST com zero jogos

---

## 2026-09-20 — Claude
- Adiciona **Simulador de Carreira de Basquete** — novo jogo inspirado no Copero: cria jogador (posição, país, liga), decide eventos por temporada, simula stats (PTS/REB/AST), lesões, transferências, seleção nacional e resumo final com nota de legado
- Arquivos: `src/data/carreiraBank.js`, `src/components/carreira/` (engine, setup, game), `src/App.jsx`, `src/components/Home.jsx`
