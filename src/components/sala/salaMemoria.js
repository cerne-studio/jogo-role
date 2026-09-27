// Lembra em qual sala cada jogo estava, pra reconectar sozinho depois de um
// reload (celular trava/recarrega no meio de uma partida real é o caso comum,
// não a exceção). Uma chave por jogo, pra não misturar salas de jogos
// diferentes na mesma aba.

function chave(jogo) {
  return `jogo-role:sala:${jogo}`
}

export function salvarSalaAtiva(jogo, { codigo, nome }) {
  try {
    localStorage.setItem(chave(jogo), JSON.stringify({ codigo, nome }))
  } catch {
    // localStorage indisponível (modo privado etc.) — sem reconexão automática, sem problema
  }
}

export function lerSalaAtiva(jogo) {
  try {
    const bruto = localStorage.getItem(chave(jogo))
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

export function limparSalaAtiva(jogo) {
  try {
    localStorage.removeItem(chave(jogo))
  } catch {
    // ignora
  }
}
