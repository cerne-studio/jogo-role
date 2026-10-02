import { TIMES } from '../data/times.js'
import { clamp } from './rng.js'

// A força de cada time muda todo ano (puxa pra média + sorte + campeão ganha moral).
export function driftLiga(liga, rng, campeaoId) {
  const novo = {}
  for (const t of TIMES) {
    const atual = liga[t.id]
    const puxaMedia = (72 - atual) * 0.12
    let f = atual + puxaMedia + rng.norm(0, 3.4)
    if (t.id === campeaoId) f += 1.5
    novo[t.id] = clamp(Math.round(f * 10) / 10, 50, 95)
  }
  return novo
}

// Força efetiva do time do usuário: o jogador carrega (ou pesa) conforme papel e disponibilidade.
const PESO_PAPEL = { estrela: 0.24, titular: 0.12, rotacao: 0.05, banco: 0.02, g_league: 0 }
export function forcaEfetivaUsuario(forcaTime, ovr, papel, disponibilidade = 1) {
  const rel = ovr - (forcaTime - 6)
  const contribuicao = clamp(rel * (PESO_PAPEL[papel] ?? 0) * disponibilidade, -6, 10)
  return forcaTime + contribuicao
}

// Vitórias de uma temporada regular de 82 jogos.
export function vitoriasEsperadas(forca, rng) {
  return clamp(Math.round(41 + (forca - 72) * 1.35 + rng.norm(0, 3.5)), 12, 72)
}

// Tabela das duas conferências. Se `usuario` for passado, aquele time usa a força efetiva dele.
export function montarTabelas(liga, rng, usuario) {
  const tabelas = { Leste: [], Oeste: [] }
  for (const t of TIMES) {
    const forca = usuario && t.id === usuario.id ? usuario.forca : liga[t.id]
    tabelas[t.conf].push({ id: t.id, forca, vitorias: vitoriasEsperadas(forca, rng) })
  }
  for (const conf of Object.keys(tabelas)) {
    tabelas[conf] = tabelas[conf]
      .sort((a, b) => b.vitorias - a.vitorias || b.forca - a.forca)
      .map((x, i) => ({ ...x, derrotas: 82 - x.vitorias, seed: i + 1 }))
  }
  return tabelas
}
