// Peças compartilhadas pelos scripts que montam os clubes-bot (FIFA 15–23 e FC26).
import { FORMACOES, ACEITA } from '../src/components/futebol/formacoes.js'

// Escala os 11 melhores numa formação (guloso por vaga, goleiro primeiro). null se faltar gente pra alguma vaga.
export function escalar(jogadores, formacao) {
  const usados = new Set()
  const picks = []
  const slots = FORMACOES[formacao].map((s, i) => ({ ...s, idx: i + 1 }))
  const ordem = [...slots].sort((a, b) => (a.papel === 'G' ? -1 : 0) - (b.papel === 'G' ? -1 : 0))
  for (const s of ordem) {
    const aceitas = ACEITA[s.rotulo]
    const cand = jogadores.filter((j) => !usados.has(j) && j.posicoes.some((p) => aceitas.includes(p))).sort((a, b) => b.overall - a.overall)[0]
    if (!cand) return null
    usados.add(cand)
    picks.push({ slot: s.idx, ...cand })
  }
  picks.sort((a, b) => a.slot - b.slot)
  return picks
}


// Melhor time titular (formação e escalação) de uma lista de jogadores; null se não der pra escalar.
export function melhorTime(jogadores) {
  let melhor = null
  for (const f of Object.keys(FORMACOES)) {
    const picks = escalar(jogadores, f)
    if (!picks) continue
    const media = picks.reduce((s, p) => s + p.overall, 0) / 11
    if (!melhor || media > melhor.media) melhor = { formacao: f, picks, media }
  }
  return melhor
}

// Sigla de 3 letras única pra cada clube (preenche c.sigla).
export function gerarSiglas(clubes) {
const SEM = new Set(['FC', 'CF', 'SC', 'AC', 'AS', 'SSC', 'RCD', 'RC', 'SL', 'SK', 'JK', 'CD', 'UD', 'SV', 'VfL', 'VfB', 'TSG', '1.'])
const usadas = new Set()
for (const c of clubes) {
  const pal = c.nome.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter((p) => !SEM.has(p) && p.length > 1)
  const base = (pal.length >= 2 ? pal[0][0] + pal[1].slice(0, 2) : (pal[0] ?? c.nome).slice(0, 3)).toUpperCase()
  const semAcento = base.normalize('NFD').replace(/[̀-ͯ]/g, '')
  let sig = semAcento
  for (let i = 2; usadas.has(sig); i++) sig = semAcento.slice(0, 2) + i
  usadas.add(sig)
  c.sigla = sig
}

}
