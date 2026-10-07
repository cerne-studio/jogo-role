# Como publicar o Jogo do Rolê

## Regra de ouro
**Não publique na branch `gh-pages` na mão** (`npm run deploy`, `gh-pages -d dist` etc.).
Isso apaga o que está no ar e o seu build local sai sem as variáveis do Supabase. Quem publica é o GitHub Actions
(`.github/workflows/deploy.yml`): todo push na `main` builda e atualiza o site em ~2 minutos.

## Fluxo para adicionar um jogo ou mudar algo
1. `git checkout -b feat/nome-da-coisa` e trabalhe nela.
2. `git push origin feat/nome-da-coisa` e abra um PR para a `main` (ou avise o Murilo/Claude para mesclar).
3. Quando entrar na `main`, o deploy roda sozinho. Acompanhe em *Actions → Deploy*.

## Rodar local com o banco
```bash
cp .env.example .env   # já vem com o projeto Supabase certo
npm install
npm run dev            # http://localhost:5188/jogo-role/
```

## Supabase
- Projeto: **jogo-role** (`vvtnjzkbugkkmhujswqq`, região sa-east-1). O antigo (`fmdufjghinashhhymahs`) não é mais usado.
- Login anônimo ligado. Jogos online (Manada, The Mind, P.D.F) usam tabelas com RLS e funções `security definer`.
- Migrações em `db/001…013`. Para um jogo seu que precise de banco, crie `db/014_*.sql` e aplique no SQL Editor do projeto.
  Padrão: tabelas só de leitura pelo dono (RLS) e toda escrita por função RPC.
- As variáveis do deploy ficam em *Settings → Secrets and variables → Actions → Variables*
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## Se o site publicado estiver "antigo"
Alguém publicou na `gh-pages` na mão. Rode *Actions → Deploy → Run workflow* (branch `main`) para restaurar.
Builds antigos ficam guardados em branches `backup/*`.
