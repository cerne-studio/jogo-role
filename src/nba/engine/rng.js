// Gerador aleatório com semente (mulberry32). Todo o motor recebe um `rng`, assim dá pra simular
// milhares de carreiras de forma reproduzível nos testes e usar Math.random no jogo de verdade.

export function criarRng(semente) {
  let a = semente == null ? null : semente >>> 0
  const base =
    a == null
      ? () => Math.random()
      : () => {
          a = (a + 0x6d2b79f5) >>> 0
          let t = a
          t = Math.imul(t ^ (t >>> 15), t | 1)
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296
        }

  const rng = {
    r: base,
    int: (min, max) => Math.floor(base() * (max - min + 1)) + min,
    uni: (min, max) => min + base() * (max - min),
    chance: (p) => base() < p,
    pick: (arr) => arr[Math.floor(base() * arr.length)],
    // normal (Box-Muller)
    norm: (mu = 0, sd = 1) => {
      let u = 0
      let v = 0
      while (u === 0) u = base()
      while (v === 0) v = base()
      return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
    embaralhar: (arr) => {
      const c = [...arr]
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(base() * (i + 1))
        ;[c[i], c[j]] = [c[j], c[i]]
      }
      return c
    },
    // sorteio ponderado: itens = [{...,peso}]
    ponderado: (itens, getPeso = (x) => x.peso ?? 1) => {
      const total = itens.reduce((s, x) => s + getPeso(x), 0)
      if (total <= 0) return itens[Math.floor(base() * itens.length)]
      let alvo = base() * total
      for (const it of itens) {
        alvo -= getPeso(it)
        if (alvo <= 0) return it
      }
      return itens[itens.length - 1]
    },
  }
  return rng
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
export const arred = (v, casas = 1) => {
  const f = 10 ** casas
  return Math.round(v * f) / f
}
export const sigmoide = (x) => 1 / (1 + Math.exp(-x))
