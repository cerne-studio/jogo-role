// Equilibra as escolhas dos eventos pra nenhuma ser a resposta óbvia.
// Os eventos são escritos com um lado claramente melhor; aqui a gente mede o valor de cada escolha (pesos em engine/pesos.js)
// e, quando uma domina as outras, cobra um custo dela e dá um alento pra pior. O texto do resultado ganha uma frase curta explicando o custo.
import { PESOS_EFEITO as W, utilidadeEscolha } from '../engine/pesos.js'

const CUSTOS = {
  moral: { dir: -1, textos: [' Mas ficou um peso na cabeça.', ' Só que a cabeça não ficou leve.'] },
  desgaste: { dir: 1, textos: [' Mas o corpo sentiu o esforço.', ' O desgaste veio junto.'] },
  vestiario: { dir: -1, textos: [' Nem todo mundo no vestiário gostou.', ' O vestiário fez cara feia.'] },
  tecnico: { dir: -1, textos: [' O técnico não esqueceu.', ' O técnico anotou a atitude.'] },
  imagem: { dir: -1, textos: [' A imagem ficou um pouco arranhada.', ' Teve gente comentando.'] },
  fama: { dir: -1, textos: [' E você saiu um pouco do radar.'] },
  dinheiro: { dir: -1, unidade: 0.1, max: 5, textos: [' E a conta chegou.', ' Saiu caro.'] },
}
const ALENTOS = {
  moral: { dir: 1, textos: [' Pelo menos ficou a cabeça tranquila.', ' E a moral agradeceu.'] },
  vestiario: { dir: 1, textos: [' Pelo menos o vestiário respeitou.', ' O elenco notou.'] },
  tecnico: { dir: 1, textos: [' O técnico gostou da postura.'] },
  imagem: { dir: 1, textos: [' Pelo menos a imagem saiu ilesa.'] },
  desgaste: { dir: -1, textos: [' E o corpo agradeceu.', ' Pelo menos deu pra descansar.'] },
  fama: { dir: 1, textos: [' E o nome circulou.'] },
}

const ATRS = ['arremesso', 'infiltracao', 'passe', 'defesa', 'fisico', 'qi', 'potencial']
const ORDEM_CUSTO = {
  visibilidade: ['vestiario', 'tecnico', 'desgaste', 'moral'],
  treino: ['desgaste', 'moral', 'tecnico', 'vestiario'],
  bemestar: ['tecnico', 'imagem', 'dinheiro', 'vestiario'],
  grupo: ['moral', 'fama', 'desgaste'],
  padrao: ['moral', 'desgaste', 'vestiario'],
}

function hash(t) {
  let h = 2166136261
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

function efeitosDe(c) {
  return c.alea ? [c.alea.sucesso.efeitos, c.alea.falha.efeitos] : [c.efeitos]
}
const temChave = (c, k) => efeitosDe(c).some((ef) => ef && ef[k] != null)

function tema(c) {
  const pos = { visibilidade: 0, treino: 0, bemestar: 0, grupo: 0 }
  for (const ef of efeitosDe(c)) {
    for (const [k, v] of Object.entries(ef ?? {})) {
      const u = (W[k] ?? 0) * (typeof v === 'number' ? v : 0)
      if (u <= 0) continue
      if (['fama', 'imagem', 'patrocinio', 'dinheiro'].includes(k)) pos.visibilidade += u
      else if (ATRS.includes(k)) pos.treino += u
      else if (k === 'moral' || k === 'desgaste') pos.bemestar += u
      else if (k === 'vestiario' || k === 'tecnico') pos.grupo += u
    }
  }
  const [melhor, valor] = Object.entries(pos).sort((a, b) => b[1] - a[1])[0]
  return valor > 0 ? melhor : 'padrao'
}

// soma `n` de um efeito (e a frase) a uma escolha sem sorteio
function somar(c, k, n, textos, ev) {
  const efeitos = { ...(c.efeitos ?? {}) }
  efeitos[k] = Math.round(((efeitos[k] ?? 0) + n) * 100) / 100
  const frase = textos[hash(ev.id + k) % textos.length]
  return { ...c, efeitos, resultado: `${c.resultado ?? ''}${frase}` }
}

function equilibrarEvento(ev) {
  if (ev.escolhas.length < 2) return ev
  let escolhas = ev.escolhas.map((c) => ({ ...c }))
  const base = ev.fase === 'base'
  const us = () => escolhas.map(utilidadeEscolha)

  // 1) a melhor escolha, se for sem sorteio, paga um custo até sobrar só uma vantagem pequena
  let u = us()
  const ib = u.indexOf(Math.max(...u))
  const segundo = Math.max(...u.filter((_, i) => i !== ib))
  let gap = u[ib] - segundo
  if (gap > 6 && !escolhas[ib].alea) {
    let restante = gap - 4
    let aplicados = 0
    for (const dim of ORDEM_CUSTO[tema(escolhas[ib])]) {
      if (restante < 2 || aplicados >= 2) break
      if (base && dim === 'dinheiro') continue
      if (temChave(escolhas[ib], dim)) continue
      const cfg = CUSTOS[dim]
      const unidade = cfg.unidade ?? 1
      const valorUnidade = Math.abs(W[dim]) * unidade
      const n = Math.min(Math.round(restante / valorUnidade), cfg.max ?? 5)
      if (n < (dim === 'dinheiro' ? 1 : 2)) continue
      escolhas[ib] = somar(escolhas[ib], dim, cfg.dir * n * unidade, cfg.textos, ev)
      restante -= n * valorUnidade
      aplicados++
    }
  }

  // 1b) se ainda sobrou muita vantagem, os ganhos da melhor escolha encolhem
  for (let t = 0; t < 3; t++) {
    u = us()
    const m = Math.max(...u)
    const i = u.indexOf(m)
    const outro = Math.max(...u.filter((_, j) => j !== i))
    if (m - outro <= 8 || escolhas[i].alea) break
    const efeitos = {}
    for (const [k, v] of Object.entries(escolhas[i].efeitos ?? {})) {
      efeitos[k] = typeof v === 'number' && (W[k] ?? 0) * v > 0 ? Math.round(v * 0.65 * 100) / 100 : v
    }
    escolhas[i] = { ...escolhas[i], efeitos }
  }

  // 2) quem ficou muito atrás ganha um alento
  u = us()
  const topo = Math.max(...u)
  escolhas = escolhas.map((c, i) => {
    if (c.alea || topo - u[i] <= 9) return c
    let faltam = topo - u[i] - 6
    let atual = c
    for (const dim of ['moral', 'vestiario', 'tecnico', 'imagem', 'desgaste', 'fama']) {
      if (faltam < 2) break
      if (temChave(atual, dim)) continue
      const cfg = ALENTOS[dim]
      const n = Math.min(Math.round(faltam / Math.abs(W[dim])), 5)
      if (n < 2) continue
      atual = somar(atual, dim, cfg.dir * n, cfg.textos, ev)
      break
    }
    return atual
  })

  return { ...ev, escolhas }
}

export function equilibrarEventos(lista) {
  return lista.map(equilibrarEvento)
}
