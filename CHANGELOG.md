# Changelog

Registro de alterações. Mais recente no topo.

## Formato
```
## AAAA-MM-DD — [Claude/Codex]
- O que mudou (1-3 linhas diretas)
```

---

## 2026-10-21 — Claude (5)
- **Draft FC — escudos**: todo time do campeonato tem escudo (forma, padrão, símbolo, duas cores e sigla). Os humanos montam o próprio na tela de formação e na de "Times prontos" (forma, padrão, símbolo, cores e sigla) ou tocam em **Sortear**; os bots recebem um escudo gerado a partir do clube, sempre o mesmo em todo celular. Aparece no sorteio dos grupos, tabelas, chaveamento, resumos, campeão e no placar da partida; as peças do campo usam as cores dos escudos (se forem parecidas, o time B troca). `db/023` valida e guarda o escudo (`fd_definir_escudo`) e o leva pro time no campeonato
- Prompts pro ChatGPT gerar as capas dos 8 jogos que faltam: `referencias/prompts-capas-restantes.md` (fora do repo)

## 2026-10-21 — Claude (4)
- **Artes do Rolê (pacote role-assets-v1)**: logo vetorial na Home, banner verde do Draft FC (texto à esquerda, arte à direita), capas do Impostor, Efeito Manada, The Mind e Mímica nos cartões da Home. Os outros jogos ganharam um bloco na cor própria com o ícone grande, na mesma proporção. Capas também nas telas de sala (Manada, The Mind, Draft FC), na configuração da Mímica e na entrada do Draft FC; o personagem do Impostor aparece na revelação e na configuração, e a vaca na vitória do Efeito Manada
- Paleta nova do pacote: fundo `#101114`, superfície `#1b1d22`, texto `#f4f2ed`, primária `#ffba38`
- Imagens recomprimidas em WebP (de ~1,5 MB cada pra 12–24 KB) em `src/assets/role/`; novo `core/CapaJogo.jsx`

## 2026-10-21 — Claude (3)
- **P.D.F**: carta preta com cara de carta (marca d'água P.D.F), cartas brancas entram em cascata e sobem quando escolhidas, placar com barra de progresso até a meta, revelação do resultado em sequência com coroa e confete pro vencedor, pódio e confete no fim
- **A Resistência**: trilha das 5 missões (verde = sucesso, vermelho = sabotada, âmbar = a da vez), contador de propostas rejeitadas, lista de jogadores com avatar e coroa do líder, aviso quando a missão precisa de 2 sabotagens, cartas de voto viradas uma a uma no resultado, fim com a lista de quem era leal ou traidor. Sorteio de traidores com embaralhamento justo
- **Carreira NBA**: tela inicial nova (recursos, mosaico dos 30 times, carreira salva em destaque), escudos próprios no lugar dos logos do CDN da NBA (que falhavam em silêncio e deixavam círculos brancos vazios), texto do emblema sempre legível, e a temporada universitária agora mostra o cartão do jogador
- Novo `core/Confete.jsx`

## 2026-10-21 — Claude (2)
- **Salas multiplayer (todos os jogos de sala)**: a tela agora se atualiza sozinha a cada 3 s e quando a aba volta a ficar visível, além do realtime. Antes, se o realtime caísse em silêncio o jogador ficava preso em "Abrindo a próxima rodada..." até recarregar (pego no Draft FC, modo Por liga)
- Home: tirado o selo "Novo" do Draft FC

## 2026-10-21 — Claude
- **Draft FC**: tempo de escolha de 7 s para **30 s** (a rodada fecha assim que todos escolhem). `db/021`
- **Home nova**: Draft FC em destaque, jogos separados em "cada um no seu celular", "um celular, passa de mão em mão" e "solo", cartões com cor própria. Site carrega só o jogo que for usado (de 1 MB pra 280 KB na Home) e o botão voltar do celular volta pra Home
- **Bug do texto invisível corrigido**: a cor `base` do Tailwind colidia com `text-base` e deixava textos quase pretos em vários botões (ex.: "Esconder e passar"). Renomeada pra `canvas`
- **Jogos antigos**: Impostor (categoria visível, quem começa, cronômetro opcional, 250 pares de palavras), Mímica (30 palavras por rodada até o tempo acabar, 294 palavras, corrigido estado travado quando o tempo estoura), Tabu (botão "falou proibida" tira 1 ponto), Quem Sou Eu (não repete personagem na volta seguinte, 200 personagens), Jogo da Nota (agora tem tema e escala 0–10, 61 temas), Palpite e Jogo da Nota (tempo esgotado não vale mais como palpite "0"/"5"), Papelitos e Tabu (embaralhamento justo). Nomes repetidos na lista de jogadores são recusados e o app lembra a última turma
- **Efeito Manada**: 25 → 182 perguntas. `db/022`

## 2026-10-20 — Claude
- **Draft FC (novo jogo, solo ou com amigos)**: monte um time de futebol sorteando uma letra por rodada (11 rodadas, 7 s por escolha), cada jogador deve ter uma palavra do nome começando com a letra e jogar na posição da vaga. Jogador pego por um humano fica travado pros outros ("Pego por X"), disputa dá +3 s ao perdedor e tempo esgotado escolhe o melhor disponível. 7 formações, tática escolhida depois do draft
- **Campeonato de 8, 16 ou 20 times**: grupos + mata-mata com bots de clubes reais (Fácil/Normal/Difícil), partida ao vivo em campo de futebol de botão com passes, câmera lenta nos gols, faltas, cartões por agressividade, VAR, pênaltis, estatísticas por jogador e premiação final (artilheiro, garçom, melhor jogador/goleiro, seleção)
- **Modos**: Histórico (FIFA 15–23 + 87 lendas), Atual (EA FC 26) e Por liga. Dados dos jogadores ficam no Supabase sem leitura direta pelo cliente
- Arquivos: `src/components/futebol/**`, `db/014`–`020`, `scripts/{e2e-draft,e2e-torneio,bots-draft,montar-*}.mjs`. Testes: `npm run test:futebol`

## 2026-10-06 — Claude
- **Carreira NBA — modo rápido**: novo passo "Como você quer jogar?" na criação. No modo rápido não tem treino, eventos, status nem gastos: o técnico treina por você, o draft é declarado quando faz sentido (obrigatório aos 22), contratos e volta do exterior são automáticos (aceita a melhor proposta) e playoffs não param em tela. Sobram 2 a 3 toques por ano (temporada, prêmios se houver, resumo) e o botão **Simular até a aposentadoria** no resumo do ano
- **Carreira NBA — dificuldade**: escolha Fácil (padrão) ou Normal. Fácil começa com atributos e potencial maiores, evolui um pouco mais e o corte de contrato é mais brando. No simulador: Fácil termina com ~32% All-Star, 16% Superestrela e ~18% Hall da Fama; Normal segue como antes (pico médio de overall ~73 contra ~77 no Fácil)
- Arquivos: `src/components/nba/{NbaSetup,NbaCarreira,NbaTelasTemporada}.jsx`, `src/nba/engine/{estado,jogador,contrato,carreira}.js`, `scripts/sim-nba.mjs` (agora aceita a dificuldade)

## 2026-10-02 — Claude (6)
- **Carreira NBA — modo computador**: em tela larga (≥1024px) o jogo ganha uma coluna fixa à esquerda com o cartão do jogador (clicável pras habilidades), nível da carreira, patrimônio (abre gastos e equipe) e as barras de status, e a ação principal fica numa coluna mais larga à direita. No celular continua igual, com o botão Status
- **Carreira NBA — treino**: toda temporada começa com a tela de treino. O técnico recomenda um foco com base na posição e no espaço de evolução de cada atributo; técnico que confia em você acerta mais, técnico desconfiado dá palpite. Treinar um atributo dá +1 na virada do ano (+2 se seguir o técnico e ele confiar), custa um pouco de desgaste e seguir a recomendação sobe a confiança dele. Também dá pra descansar (desgaste −10)
- **Carreira NBA — níveis e dificuldade**: carreira mais generosa (atributos iniciais e potencial maiores, corte de contrato menos duro, moral alta e técnico confiante ajudam a evoluir). Novos níveis: Aspirante, Role player, Bom jogador, All-Star, Superestrela, Hall da Fama, Lenda da NBA e Entre os maiores de todos os tempos. No simulador cerca de 29% ficam em Role player, 28% em Bom jogador, 19% All-Star, 9% Superestrela, 8% Hall da Fama, 3% Lenda e 1% no topo. Fama e imagem entram na nota de legado, então as escolhas pesam no nível final. Barra de progresso do nível aparece durante a carreira, e a tela final mostra a escada de níveis e as escolhas que mais marcaram
- Arquivos: `src/nba/engine/{treino,legado,jogador,contrato,carreira,temporada}.js`, `src/components/nba/{NbaTreino,LateralJogador,PainelJogador,NbaCarreira}.jsx`

## 2026-10-02 — Claude (5)
- **Carreira NBA**: tocar no cartão do jogador abre a tela de **habilidades** (bola de 3, arremesso de média, finalização, lance livre, ball handling, passe, visão de jogo, defesa de perímetro e de garrafão, roubo de bola, toco, rebote, velocidade, força, salto e QI), com pontos fortes, pontos a melhorar, nota por grupo e a variação desde a temporada passada. Derivadas dos 6 atributos base, da posição e da altura, com um "jeito" fixo por jogador
- **Carreira NBA**: escolhas dos eventos deixaram de ter resposta óbvia. `equilibrio.js` mede o valor de cada opção e cobra um custo da melhor (e dá um alento à pior); a vantagem mediana da melhor escolha caiu e quase nenhum evento tem opção dominante (`scripts/audita-escolhas.mjs`)
- **Carreira NBA**: a manchete do resumo do ano agora vem da decisão que mais pesou na temporada (com a manchete de desempenho logo abaixo), e o resumo lista as escolhas feitas no ano
- Arquivos: `src/nba/engine/{habilidades,pesos,manchetes,eventos,temporada}.js`, `src/nba/data/equilibrio.js`, `src/components/nba/HabilidadesFolha.jsx`

## 2026-10-02 — Claude (4)
- **Carreira NBA**: botão **Status** em toda tela abre um painel com barras de moral, fama, técnico, vestiário, imagem e desgaste, a variação desde o começo da temporada e o efeito real de cada uma na simulação (moral mexe no overall em quadra, vestiário na força do time, técnico nos minutos, fama no valor de contrato, imagem nos patrocínios, desgaste no risco de lesão). As barras também aparecem no resumo do ano
- **Carreira NBA**: aba **Dinheiro** com o que o patrimônio compra: equipe pessoal cobrada todo ano (preparador, nutricionista, equipe médica, psicólogo, agente, assessoria de imagem), gastos da temporada (férias, doação, treino individual de um atributo, investimento com risco) e academia em casa. Conforto financeiro: patrimônio abaixo de US$ 0,3 mi pesa na moral, acima de US$ 25 mi ajuda. Sem dinheiro pra manter a equipe, ela é cortada
- Arquivos: `src/nba/engine/status.js` (novo), `src/components/nba/PainelJogador.jsx` (novo), `contrato.js`, `temporada.js`, `estado.js`

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
