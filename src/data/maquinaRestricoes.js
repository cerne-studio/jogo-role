export const restricoesMecanico = [
  'Não pode fazer perguntas.',
  'Só pode usar uma mão.',
  'Não pode tocar duas vezes seguidas no mesmo componente.',
  'Precisa esperar 3 segundos antes de cada ação.',
  'Não pode falar enquanto toca na tela.',
  'Não pode desfazer uma ação já feita.',
  'Precisa repetir a instrução em voz alta antes de executar.',
  'Precisa fechar um dos olhos.',
  'Só pode agir depois de ouvir a palavra "confirmado".',
  'Não pode olhar pra quem está falando.',
]

export const restricoesEngenheiro = [
  'Só pode responder "sim" ou "não".',
  'Não pode falar cores.',
  'Não pode falar números.',
  'Só pode usar frases de até 5 palavras.',
  'Não pode repetir uma instrução já dada.',
  'Precisa falar bem baixo.',
  'Só pode dar uma instrução por vez.',
  'Não pode falar o nome dos componentes.',
  'Toda frase precisa começar com "atenção".',
  'Só pode consultar o manual de novo 3 vezes na partida.',
]

export const restricoesInspetor = [
  'Não pode usar as palavras "direita" e "esquerda".',
  'Não pode apontar.',
  'Não pode falar números.',
  'Precisa descrever tudo usando comparações.',
  'Só pode responder por gestos.',
  'Só pode falar 3 frases durante toda a partida.',
  'Não pode repetir uma informação já dita.',
  'Não pode falar nomes de cores.',
  'Só pode conversar com o Engenheiro.',
  'Precisa sussurrar.',
]

export const restricoesColetivas = [
  'Ninguém pode falar ao mesmo tempo.',
  'Toda instrução precisa ser confirmada em voz alta antes de executar.',
  'Ninguém pode dizer "não".',
  'Apenas uma pessoa pode falar por vez.',
  'Todos precisam permanecer sentados.',
  'Ninguém pode tocar no Mecânico.',
  'Cada pergunta só pode ser respondida uma vez.',
  'Toda frase precisa terminar com "câmbio".',
  'Depois de cada erro, todos trocam de lugar.',
]

export function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}

export const eventosAleatorios = [
  {
    id: 'vazamento',
    titulo: 'Vazamento!',
    descricao: 'Uma das válvulas do módulo atual foi fechada à força. Reabram o que for preciso.',
  },
  {
    id: 'curto',
    titulo: 'Curto-circuito!',
    descricao: 'Os componentes na tela trocaram de posição. Reorganizem o raciocínio.',
    embaralhar: true,
  },
  {
    id: 'superaquecimento',
    titulo: 'Superaquecimento!',
    descricao: 'O cronômetro vai correr mais rápido pelos próximos segundos.',
    acelerarSegundos: 20,
  },
  {
    id: 'interferencia',
    titulo: 'Interferência!',
    descricao: 'Por 5 segundos, ninguém pode falar. Só gestos.',
    silencioSegundos: 5,
  },
  {
    id: 'travamento',
    titulo: 'Travamento do painel!',
    descricao: 'O Mecânico não pode tocar na tela por 4 segundos.',
    bloqueioSegundos: 4,
  },
]
