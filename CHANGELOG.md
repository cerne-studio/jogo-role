# Changelog

Registro de alterações. Mais recente no topo.

## Formato
```
## AAAA-MM-DD — [Claude/Codex]
- O que mudou (1-3 linhas diretas)
```

---

## 2026-10-02 — Claude (3)
- **Carreira NBA**: logos oficiais da NBA, da G League e dos 30 times (carregados do CDN da NBA, não ficam no repositório; se a imagem falhar, cai no emblema de texto)
- **Carreira NBA**: carreira não acaba mais cedo. Sem proposta de contrato, passando batido no draft ou por escolha, o jogador vai jogar no exterior (12 ligas: NBB, ACB, Turquia, Itália, China, Japão e outras) com salário, prêmios de liga, títulos e 10 eventos próprios, e pode receber proposta de volta pra NBA. A carreira só termina aos 40 anos (ou 36+ com overall baixo demais), e dá pra se aposentar quando quiser a partir dos 30. Legado conta a carreira fora da NBA; novos títulos "Carreira rodando o mundo" e "Veterano de várias ligas"
- Arquivos: `src/components/nba/*`, `src/nba/engine/{carreira,temporada,legado,eventos,manchetes,contrato}.js`, `src/nba/data/{times,eventosExterior}.js`, `scripts/sim-exterior.mjs`

## 2026-10-02 — Claude (2)
- **Carreira NBA** (substitui a Carreira de Basquete): do college, clube no exterior ou "sem recrutamento" (duas vias/G League) até o Hall da Fama. Draft com projeção e noite do draft, 30 times reais (só nomes e cores; escudos próprios em SVG, sem logos oficiais), contratos (renovação, agência livre, anel), temporada regular com stats por jogo, play-in e playoffs mata-mata com linha do usuário jogo a jogo, prêmios (MVP, DPOY, ROY, 6MOY, MIP, All-Star, All-NBA, All-Defensive, líderes), marcos e ranking histórico (pontos, assistências, rebotes), lesões, patrimônio e patrocínio, rivais reais como adversários neutros, 153 eventos com escolhas e risco, manchetes, gráfico de overall e legado final com texto pra compartilhar. Salva sozinho no aparelho (`jogo-role:nba:v2`) e continua depois de recarregar. Motor puro com semente (`src/nba/engine`), simulador de balanceamento em `scripts/sim-nba.mjs` e validador de eventos em `scripts/valida-eventos.mjs`
- Remove `src/components/carreira/*` e `src/data/carreiraBank.js`; `ExitButton` aceita `mensagem`
- Arquivos: `src/nba/**`, `src/components/nba/**`, `src/App.jsx`, `src/components/Home.jsx`

## 2026-10-02 — Claude
- **P.D.F**: leva de **humor negro** no pacote Sem censura — +27 pretas e +92 brancas (tema `morte`: velório, herança, hospital, doença, IML, inferno/purgatório, apocalipse, execução). Pacote `extremo` agora com 70 pretas + 247 brancas. Sem ódio contra grupo, menor, tragédia com nome ou vítima real. Seed idempotente: `db/013_seed_pdf_extremo.sql`
- Arquivos: `db/data/pdf-baralho-extremo.txt`

## 2026-10-01 — Claude (4)
- **P.D.F**: pacote **Sem censura** — 43 pretas + 155 brancas explícitas, com palavrão, sem filtro (sexo, corpo, rolê, grana, internet; sem ódio contra grupo, menor ou vítima nomeada). Agora o baralho tem dois pacotes: `pesado` (o original) e `extremo`. O host escolhe no lobby; padrão é **Sem censura** (pesado + extremo). O sorteio de pretas e brancas filtra pelo pacote gravado na sala (`pdf_definir_pacote`, `pdf_pacotes_da_sala`)
- Arquivos: `db/012_pdf_pacote.sql`, `db/013_seed_pdf_extremo.sql`, `db/data/pdf-baralho-extremo.txt`, `src/components/pdf/PdfMeta.jsx`

## 2026-10-01 — Claude (3)
- **P.D.F**: limite de jogadores sobe de 10 pra **20**. O número vive em `pdf_max_jogadores()` (`db/011_pdf_max_jogadores.sql`); mudar de novo é recriar essa função. Agora `entrar_sala` barra na entrada ("sala cheia"), em vez de deixar encher o lobby e só reclamar ao iniciar; quem já está na sala reconecta normalmente mesmo cheia. Testado no banco com 20 jogadores: 200 cartas em mão no início, partida completa até vencedor, baralho (400 brancas) quase esgotado e reembaralhado sem travar, 21º jogador recusado
- Arquivos: `db/011_pdf_max_jogadores.sql`, `src/components/pdf/PdfMeta.jsx`

## 2026-10-01 — Claude (2)
- **P.D.F**: meta de pontos escolhida no lobby (3 rápido, 5 normal, 7 longo; padrão 5). Só o host muda e só antes de começar; os outros veem o valor em tempo real. RPC `pdf_definir_meta` e `iniciar_partida_pdf` respeitando a meta gravada (`db/010_pdf_meta.sql`); `SalaLobby` ganhou slot `children` pra jogos acrescentarem opções; e2e cobre meta (host, não-host, valor inválido, mudança após começar)
- Arquivos: `db/010_pdf_meta.sql`, `src/components/pdf/PdfMeta.jsx`, `src/components/sala/SalaLobby.jsx`

## 2026-10-01 — Claude
- Adiciona o jogo **P.D.F** (18+) — cartas de humor ácido, cada um no seu celular. Juiz rotativo lê a pergunta, todo mundo responde com uma carta da própria mão (10 privadas; perguntas com 0, 1 ou 2 lacunas), respostas viram anônimas e embaralhadas, o juiz escolhe a melhor, o dono leva o ponto. Primeiro a 5 pontos vence. Host destrava a rodada se alguém sumir (45s/60s). Baralho original com 500 cartas (100 pretas + 400 brancas) em `db/data/pdf-baralho.txt`, carregado no banco por `db/009_seed_pdf.sql`; `{JOGADOR}` vira nome sorteado da sala
- Segurança: mão e jogadas só o dono lê (RLS); baralho (`pdf_cartas`) e cartas usadas sem acesso pelo cliente; RPCs internas revogadas; escritas só via RPC `security definer` com trava na sala. `db/007_hardening.sql` também fecha `manada_perguntas` (estava sem RLS) e as funções internas do Manada/The Mind
- Remove os jogos **O Mecânico** e **A Bomba** e o selo "Novo" da Carreira de Basquete
- Banco migrado pra um projeto Supabase novo (migrations `db/001`–`009`); precisa ligar *Anonymous Sign-Ins* no painel (Authentication → Sign In / Providers)
- Deploy: `.github/workflows/deploy.yml` builda e publica no `gh-pages` a cada push em `main` (Actions variables `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
- Testes: `node scripts/e2e-pdf.mjs` (4 sessões simultâneas, partida completa, casos negativos e RLS; 44 checagens) e `scripts/bots-pdf.mjs <codigo>` pra jogar sozinho com bots
- Arquivos: `db/007`–`009`, `db/data/pdf-baralho.txt`, `src/components/pdf/`, `scripts/`, `.github/workflows/deploy.yml`

## 2026-09-27 — Claude (2)
- Adiciona o jogo **The Mind** — cooperativo, joga as cartas 1-100 em ordem crescente sem combinar nada, na sintonia do grupo; descarte forçado revela cartas menores e custa 1 vida por evento; shuriken descarta a menor carta de cada jogador sem custar vida
- Corrige corrida de sessão anônima (StrictMode roda `ensureAnonSession()` duas vezes e podia criar 2 usuários diferentes na mesma aba, fazendo o host não se reconhecer como host) — fix em `src/lib/supabase.js`, beneficia o Efeito Manada também
- Arquivos: `db/005_themind.sql`, `db/006_rpc_themind.sql`, `src/components/themind/`

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
