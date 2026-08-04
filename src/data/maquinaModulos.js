// Geradores dos 8 módulos da máquina. Cada módulo tem um "padraoUI" que diz
// qual componente genérico usar pra desenhar a interface do Mecânico:
// 'toggle' | 'keypad' | 'sequencia' | 'stepper' | 'combo'.
// A informação dividida vem de um "valorOculto" que só o Inspetor vê durante
// a inspeção — o gabarito (resposta) já é resolvido na geração, mas o texto
// do manual apresenta como condicional pra forçar o time a repassar a info.

function embaralhar(lista) {
  return [...lista].sort(() => Math.random() - 0.5)
}

function sortearN(lista, n) {
  return embaralhar(lista).slice(0, n)
}

const CORES = ['Vermelha', 'Azul', 'Amarela', 'Verde', 'Roxa']

function gerarValvulas() {
  const cores = sortearN(CORES, 3)
  const pressaoInicial = 30 + Math.floor(Math.random() * 60)
  const [corA, corB] = cores
  const fecharCor = pressaoInicial > 60 ? corA : corB
  const componentes = cores.map((cor, i) => ({
    id: `v${i}`,
    nome: cor,
    valor: cor === fecharCor ? 'fechada' : 'aberta',
  }))
  const resposta = Object.fromEntries(componentes.map((c) => [c.id, c.valor]))

  return {
    tipo: 'valvulas',
    nome: 'Sistema de Pressão',
    padraoUI: 'toggle',
    opcoes: ['aberta', 'fechada'],
    inspetorLinhas: [`Pressão inicial no medidor: ${pressaoInicial}.`, `Válvulas visíveis: ${cores.join(', ')}.`],
    manualLinhas: [
      `Se a pressão inicial observada pelo Inspetor for maior que 60, feche a válvula ${corA}.`,
      `Se a pressão inicial for 60 ou menos, feche a válvula ${corB}.`,
      'Todas as outras válvulas devem ficar abertas.',
    ],
    componentes: componentes.map((c) => ({ id: c.id, nome: c.nome, valorInicial: 'aberta' })),
    resposta,
  }
}

function gerarCabos() {
  const cores = sortearN(CORES, 4)
  const qtdAzuis = Math.floor(Math.random() * 3) + 1
  const [corA, corB] = cores
  const cortarCor = qtdAzuis % 2 === 0 ? corA : corB
  const componentes = cores.map((cor, i) => ({
    id: `c${i}`,
    nome: cor,
    valor: cor === cortarCor ? 'cortado' : 'conectado',
  }))
  const resposta = Object.fromEntries(componentes.map((c) => [c.id, c.valor]))

  return {
    tipo: 'cabos',
    nome: 'Sistema de Cabos',
    padraoUI: 'toggle',
    opcoes: ['conectado', 'cortado'],
    inspetorLinhas: [`Cabos azuis contados no painel: ${qtdAzuis}.`, `Cabos visíveis: ${cores.join(', ')}.`],
    manualLinhas: [
      `Se a quantidade de cabos azuis contada pelo Inspetor for par, corte o cabo ${corA}.`,
      `Se for ímpar, corte o cabo ${corB}.`,
      'Todos os outros cabos devem ficar conectados.',
    ],
    componentes: componentes.map((c) => ({ id: c.id, nome: c.nome, valorInicial: 'conectado' })),
    resposta,
  }
}

function gerarAlavancas() {
  const nomes = ['A', 'B', 'C', 'D']
  const luzAcesa = Math.random() < 0.5
  const alvo = nomes.map(() => Math.random() < 0.5)
  if (luzAcesa) alvo[2] = true
  else alvo[2] = false
  const resposta = Object.fromEntries(nomes.map((n, i) => [`a${i}`, alvo[i] ? 'puxada' : 'solta']))

  return {
    tipo: 'alavancas',
    nome: 'Sequência de Alavancas',
    padraoUI: 'toggle',
    opcoes: ['solta', 'puxada'],
    trava: { origem: 'a0', bloqueia: 'a2' },
    inspetorLinhas: [`Luz de segurança da alavanca C: ${luzAcesa ? 'acesa' : 'apagada'}.`],
    manualLinhas: [
      `Se a luz de segurança da alavanca C estiver acesa, ela deve ficar PUXADA.`,
      `Se estiver apagada, ela deve ficar SOLTA.`,
      `Alavanca A: ${alvo[0] ? 'puxada' : 'solta'}. Alavanca B: ${alvo[1] ? 'puxada' : 'solta'}. Alavanca D: ${alvo[3] ? 'puxada' : 'solta'}.`,
      'Atenção: puxar a alavanca A trava a alavanca C — puxem A por último, se ela precisar ficar puxada.',
    ],
    componentes: nomes.map((n, i) => ({ id: `a${i}`, nome: `Alavanca ${n}`, valorInicial: 'solta' })),
    resposta,
  }
}

function gerarCodigo() {
  const luzesAcesas = Math.floor(Math.random() * 6) + 1
  const posicaoValvula = Math.floor(Math.random() * 4) + 1
  const numeroMotor = Math.floor(Math.random() * 9) + 1
  const resposta = `${luzesAcesas}${posicaoValvula}${numeroMotor}`

  return {
    tipo: 'codigo',
    nome: 'Código de Segurança',
    padraoUI: 'keypad',
    tamanhoCodigo: 3,
    inspetorLinhas: [
      `Luzes acesas no painel: ${luzesAcesas}.`,
      `Posição da válvula aberta: ${posicaoValvula}.`,
      `Número escrito perto do motor: ${numeroMotor}.`,
    ],
    manualLinhas: [
      'O primeiro dígito do código é a quantidade de luzes acesas no painel.',
      'O segundo dígito é a posição da válvula aberta.',
      'O terceiro dígito é o número escrito perto do motor.',
    ],
    resposta,
  }
}

function gerarSimbolos() {
  const simbolos = ['Círculo', 'Triângulo', 'Quadrado', 'Estrela']
  const significados = ['ativar', 'inverter', 'bloquear', 'reiniciar']
  const ordemSignificados = embaralhar(significados)
  const ordemSimbolos = ordemSignificados.map(
    (sig) => simbolos[significados.indexOf(sig)],
  )
  const posicoesTela = embaralhar(simbolos)

  return {
    tipo: 'simbolos',
    nome: 'Painel de Símbolos',
    padraoUI: 'sequencia',
    inspetorLinhas: [`Posição dos símbolos na tela, da esquerda pra direita: ${posicoesTela.join(', ')}.`],
    manualLinhas: [
      'Legenda: Círculo = ativar. Triângulo = inverter. Quadrado = bloquear. Estrela = reiniciar.',
      `Ordem correta das ações: ${ordemSignificados.join(' → ')}.`,
    ],
    componentes: posicoesTela.map((s, i) => ({ id: `s${i}`, nome: s })),
    resposta: ordemSimbolos.map(
      (sym) => posicoesTela.map((v, i) => (v === sym ? `s${i}` : null)).find(Boolean),
    ),
  }
}

function gerarEngrenagens() {
  const numeros = [1, 2, 3, 4]
  const ordemCorreta = embaralhar(numeros)
  const disponiveisNaTela = embaralhar(numeros)

  return {
    tipo: 'engrenagens',
    nome: 'Encaixe de Engrenagens',
    padraoUI: 'sequencia',
    inspetorLinhas: [`Engrenagens disponíveis na bandeja, da esquerda pra direita: ${disponiveisNaTela.join(', ')}.`],
    manualLinhas: [`Encaixe as engrenagens nesta ordem: ${ordemCorreta.join(' → ')}.`],
    componentes: disponiveisNaTela.map((n, i) => ({ id: `e${i}`, nome: `Engrenagem ${n}`, numero: n })),
    resposta: ordemCorreta.map((n) => disponiveisNaTela.map((v, i) => (v === n ? `e${i}` : null)).find(Boolean)),
  }
}

function gerarBaterias() {
  const valores = sortearN([10, 15, 20, 25, 30, 35, 40], 4)
  const idxEscolhidos = sortearN([0, 1, 2, 3], 2).sort()
  const alvo = idxEscolhidos.reduce((soma, i) => soma + valores[i], 0)

  return {
    tipo: 'baterias',
    nome: 'Painel de Baterias',
    padraoUI: 'combo',
    inspetorLinhas: [`Valores visíveis nas baterias: ${valores.join(', ')}.`],
    manualLinhas: [
      `A soma final precisa ser exatamente ${alvo}.`,
      'Não é permitido usar duas baterias vizinhas (lado a lado) ao mesmo tempo.',
    ],
    componentes: valores.map((v, i) => ({ id: `b${i}`, nome: `Bateria ${v}`, valor: v })),
    resposta: { alvo, semAdjacentes: true },
  }
}

function gerarTemperatura() {
  const inicial = 20 + Math.floor(Math.random() * 40)
  const min = 45 + Math.floor(Math.random() * 10)
  const max = min + 10 + Math.floor(Math.random() * 10)

  return {
    tipo: 'temperatura',
    nome: 'Controle de Temperatura',
    padraoUI: 'stepper',
    valorInicial: inicial,
    passo: 5,
    inspetorLinhas: [`Temperatura inicial no visor: ${inicial}°.`],
    manualLinhas: [`A temperatura final precisa ficar entre ${min}° e ${max}°.`],
    resposta: { min, max },
  }
}

const GERADORES = {
  valvulas: gerarValvulas,
  cabos: gerarCabos,
  alavancas: gerarAlavancas,
  codigo: gerarCodigo,
  simbolos: gerarSimbolos,
  engrenagens: gerarEngrenagens,
  baterias: gerarBaterias,
  temperatura: gerarTemperatura,
}

export const TIPOS_MODULO = Object.keys(GERADORES)

export function gerarModulo(excluirTipos = []) {
  const disponiveis = TIPOS_MODULO.filter((t) => !excluirTipos.includes(t))
  const pool = disponiveis.length > 0 ? disponiveis : TIPOS_MODULO
  const tipo = pool[Math.floor(Math.random() * pool.length)]
  return { ...GERADORES[tipo](), id: Math.random().toString(36).slice(2) }
}

export function estadoInicialModulo(modulo) {
  if (modulo.padraoUI === 'toggle') {
    return Object.fromEntries(modulo.componentes.map((c) => [c.id, c.valorInicial]))
  }
  if (modulo.padraoUI === 'keypad') return ''
  if (modulo.padraoUI === 'sequencia') return []
  if (modulo.padraoUI === 'stepper') return modulo.valorInicial
  if (modulo.padraoUI === 'combo') return []
  return null
}

export function validarModulo(modulo, estadoAtual) {
  if (modulo.padraoUI === 'toggle') {
    const completo = modulo.componentes.every((c) => estadoAtual[c.id] === modulo.resposta[c.id])
    return { completo }
  }
  if (modulo.padraoUI === 'keypad') {
    const completo = estadoAtual === modulo.resposta
    return { completo }
  }
  if (modulo.padraoUI === 'sequencia') {
    const completo =
      estadoAtual.length === modulo.resposta.length &&
      estadoAtual.every((id, i) => id === modulo.resposta[i])
    return { completo }
  }
  if (modulo.padraoUI === 'stepper') {
    const completo = estadoAtual >= modulo.resposta.min && estadoAtual <= modulo.resposta.max
    return { completo }
  }
  if (modulo.padraoUI === 'combo') {
    const selecionados = modulo.componentes.filter((c) => estadoAtual.includes(c.id))
    const soma = selecionados.reduce((s, c) => s + c.valor, 0)
    const indices = selecionados.map((c) => modulo.componentes.indexOf(c)).sort((a, b) => a - b)
    const temAdjacentes = indices.some((idx, i) => i > 0 && idx - indices[i - 1] === 1)
    const completo = soma === modulo.resposta.alvo && !temAdjacentes
    return { completo, soma, temAdjacentes }
  }
  return { completo: false }
}
