// Gerador pseudoaleatório com semente (mulberry32). A mesma semente sempre produz a mesma partida,
// então o servidor simula uma vez e todos os celulares reproduzem exatamente o mesmo jogo.

export function criarRng(semente) {
  let a = semente >>> 0

  function proximo() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    proximo,
    chance: (p) => proximo() < p,
    inteiro: (min, max) => min + Math.floor(proximo() * (max - min + 1)),
    escolher: (lista) => lista[Math.floor(proximo() * lista.length)],
    // Sorteio ponderado: pesos[i] é o peso do item i.
    ponderado(lista, pesos) {
      const total = pesos.reduce((s, p) => s + p, 0)
      if (total <= 0) return lista[Math.floor(proximo() * lista.length)]
      let r = proximo() * total
      for (let i = 0; i < lista.length; i++) {
        r -= pesos[i]
        if (r <= 0) return lista[i]
      }
      return lista[lista.length - 1]
    },
  }
}

export function limitar(v, min, max) {
  return Math.max(min, Math.min(max, v))
}
