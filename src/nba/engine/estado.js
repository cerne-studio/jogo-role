import { TIMES, FACULDADES, CLUBES_EUROPA, CLUBES_BRASIL } from '../data/times.js'
import { alturaSorteada, calcMedia, gerarAtributosIniciais, gerarPotencial } from './jogador.js'
import { SALARIO_DUAS_VIAS } from './contrato.js'

export const ANO_INICIAL = 2026

export function ligaInicial() {
  return Object.fromEntries(TIMES.map((t) => [t.id, t.forca]))
}

// config = { sobrenome, numero, posicao, pais, caminho: 'college' | 'internacional' | 'sem_recrutamento' }
export function criarEstado(config, rng) {
  const { sobrenome, numero, posicao, pais, caminho } = config
  const atrs = gerarAtributosIniciais(posicao, rng, caminho)
  const media = calcMedia(atrs, posicao)
  const potencial = gerarPotencial(media, rng, caminho)

  let nivel = 'college'
  let equipe = rng.pick(FACULDADES)
  let idade = 18
  let time = null
  let contrato = null

  if (caminho === 'internacional') {
    nivel = 'pro_exterior'
    equipe = pais === 'brasil' ? rng.pick(CLUBES_BRASIL) : rng.pick(CLUBES_EUROPA)
  } else if (caminho === 'sem_recrutamento') {
    nivel = 'gleague'
    idade = 20
    const t = rng.pick(TIMES)
    time = t.id
    equipe = `${t.nome} (afiliado G League)`
    contrato = { tipo: 'duas_vias', salario: SALARIO_DUAS_VIAS, anos: 2, anosRestantes: 2 }
  }

  return {
    v: 2,
    jogador: { sobrenome, numero, posicao, pais, caminho, altura: alturaSorteada(posicao, rng) },
    nivel, // college | pro_exterior | gleague | nba
    equipe,
    time, // id da franquia NBA (ou null enquanto não chegou)
    idade,
    temporada: 1, // temporada da carreira
    ano: ANO_INICIAL,
    atrs,
    potencial,
    media: calcMedia(atrs, posicao),
    moral: 55,
    fama: 8,
    tecnico: 55,
    vestiario: 50,
    imagem: 50,
    desgaste: 0,
    contrato,
    dinheiro: { patrimonio: 0 },
    patrocinioExtra: 0,
    gastoExtra: 0,
    flags: {},
    liga: ligaInicial(),
    historico: [],
    titulos: [],
    premios: {},
    carreira: {
      jogos: 0, pontos: 0, rebotes: 0, assistencias: 0, roubos: 0, tocos: 0,
      tripleDuplas: 0, jogos30: 0, jogos40: 0, jogos50: 0, maxPontos: 0, maxPontosContra: null,
      jogosPlayoffs: 0, pontosPlayoffs: 0,
    },
    marcos: [],
    linhaDoTempo: [],
    lesaoAtual: null,
    lesoes: [],
    draft: null,
    aposentado: false,
    mediaAnterior: media,
    ultimaTemporadaNba: 0,
  }
}

export function nomeCompleto(estado) {
  return estado.jogador.sobrenome
}

export function adicionarLinha(estado, texto, tipo = 'info') {
  return {
    ...estado,
    linhaDoTempo: [...estado.linhaDoTempo, { ano: estado.ano, idade: estado.idade, texto, tipo }],
  }
}
