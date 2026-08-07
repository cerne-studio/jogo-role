// PRNG determinístico (mulberry32) — Defusador e Especialista geram os
// mesmos módulos a partir do mesmo código numérico, sem precisar de servidor.
export function mulberry32(seed) {
  let a = seed
  return function rand() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function criarRand(codigo) {
  const seed = Number(codigo) || 424242
  return mulberry32(seed)
}

function embaralhar(rand, lista) {
  const arr = [...lista]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function inteiro(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1))
}

const CORES_FIO = ['Vermelho', 'Azul', 'Amarelo', 'Branco', 'Preto']

function gerarFios(rand) {
  const cores = Array.from({ length: 5 }, () => CORES_FIO[Math.floor(rand() * CORES_FIO.length)])
  const qtdVermelhos = cores.filter((c) => c === 'Vermelho').length
  const qtdAzuis = cores.filter((c) => c === 'Azul').length
  const temAmarelo = cores.includes('Amarelo')
  const ultimoBranco = cores[cores.length - 1] === 'Branco'

  let indiceCorte
  if (!temAmarelo) {
    indiceCorte = 1
  } else if (ultimoBranco && qtdAzuis > 1) {
    indiceCorte = cores.length - 1
  } else if (qtdVermelhos > 1) {
    indiceCorte = cores.lastIndexOf('Vermelho')
  } else {
    indiceCorte = 1
  }

  return {
    tipo: 'fios',
    nome: 'Módulo de Fios',
    padraoUI: 'fios',
    componentes: cores.map((cor, i) => ({ id: `f${i}`, cor, posicao: i + 1 })),
    manualLinhas: [
      'Se NÃO houver fio amarelo, corte o 2º fio.',
      'Senão, se o ÚLTIMO fio for branco E houver mais de um fio azul, corte o último fio.',
      'Senão, se houver mais de um fio vermelho, corte o último fio vermelho.',
      'Senão, corte o 2º fio.',
    ],
    resposta: `f${indiceCorte}`,
  }
}

function gerarTeclado(rand) {
  const luzes = inteiro(rand, 1, 6)
  const estrelas = inteiro(rand, 1, 5)
  const numeroMotor = inteiro(rand, 1, 9)

  return {
    tipo: 'teclado',
    nome: 'Módulo do Teclado',
    padraoUI: 'teclado',
    tamanhoCodigo: 3,
    componentes: [
      { id: 'luzes', label: 'Luzes acesas no painel', valor: luzes },
      { id: 'estrelas', label: 'Estrelas gravadas ao lado do teclado', valor: estrelas },
      { id: 'motor', label: 'Número gravado perto do motor', valor: numeroMotor },
    ],
    manualLinhas: [
      'O código tem 3 dígitos.',
      '1º dígito: quantidade de luzes acesas no painel.',
      '2º dígito: quantidade de estrelas gravadas ao lado do teclado.',
      '3º dígito: número gravado perto do motor.',
    ],
    resposta: `${luzes}${estrelas}${numeroMotor}`,
  }
}

const SIMBOLOS = ['Estrela', 'Lua', 'Sol', 'Raio']
const SIGNIFICADOS = ['pressionar', 'segurar', 'girar', 'soltar']

function gerarSimbolos(rand) {
  const ordemSignificados = embaralhar(rand, SIGNIFICADOS)
  const ordemSimbolos = ordemSignificados.map((sig) => SIMBOLOS[SIGNIFICADOS.indexOf(sig)])
  const posicoesTela = embaralhar(rand, SIMBOLOS)
  const resposta = ordemSimbolos.map((sym) => `s${posicoesTela.indexOf(sym)}`)

  return {
    tipo: 'simbolos',
    nome: 'Módulo dos Símbolos',
    padraoUI: 'simbolos',
    componentes: posicoesTela.map((s, i) => ({ id: `s${i}`, nome: s })),
    manualLinhas: [
      'Legenda: Estrela = pressionar. Lua = segurar. Sol = girar. Raio = soltar.',
      `Ordem correta das ações: ${ordemSignificados.join(' → ')}.`,
    ],
    resposta,
  }
}

export function gerarModulosBomba(rand) {
  return [gerarFios(rand), gerarTeclado(rand), gerarSimbolos(rand)]
}

export function validarFios(modulo, fioId) {
  return fioId === modulo.resposta
}

export function validarTeclado(modulo, valor) {
  return valor === modulo.resposta
}

export function validarSimbolos(modulo, sequencia) {
  return sequencia.length === modulo.resposta.length && sequencia.every((id, i) => id === modulo.resposta[i])
}
