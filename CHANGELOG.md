# Changelog

Registro de alterações. Mais recente no topo.

## Formato
```
## AAAA-MM-DD — [Claude/Codex]
- O que mudou (1-3 linhas diretas)
```

---

## 2026-09-21 — Claude
- **Bugfix carreira**: corrige dupla subtração de `jogosLesado` em `simularTemporada` (caller já ajustava `liga.jogos`); quando `jogosEfetivos === 0`, stats zeradas em vez de calculadas; tela de resultado mostra "Temporada perdida" ao invés de PTS/REB/AST com zero jogos

---

## 2026-09-20 — Claude
- Adiciona **Simulador de Carreira de Basquete** — novo jogo inspirado no Copero: cria jogador (posição, país, liga), decide eventos por temporada, simula stats (PTS/REB/AST), lesões, transferências, seleção nacional e resumo final com nota de legado
- Arquivos: `src/data/carreiraBank.js`, `src/components/carreira/` (engine, setup, game), `src/App.jsx`, `src/components/Home.jsx`
