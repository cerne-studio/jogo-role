// Embaralhamento de verdade (Fisher–Yates). `sort(() => Math.random() - 0.5)` enviesa o resultado e
// deixa os primeiros itens saírem mais do que deveriam.
export function embaralhar(lista) {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function sortearUm(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}

// Vibra o celular (se o aparelho deixar): fim de tempo, resultado importante.
export function vibrar(padrao = [200, 80, 200]) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(padrao)
  } catch {
    // sem vibração: segue o jogo
  }
}
