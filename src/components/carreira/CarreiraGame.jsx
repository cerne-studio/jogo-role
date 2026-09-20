import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Trophy, TrendingUp, Heart, Zap, Star, ChevronRight, AlertTriangle } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import {
  gerarEstadoInicial,
  calcMedia,
  evoluirAtributos,
  simularTemporada,
  selecionarEventos,
  aplicarEfeitos,
  gerarOfertaTransferencia,
  sorteiarLesao,
  avaliarPremios,
  simularCampeonato,
  gerarManchete,
  calcularSalario,
  rand,
  clamp,
  pick,
} from './carreiraEngine.js'
import { LIGAS, POSICOES, ATRIBUTOS } from '../../data/carreiraBank.js'

// ─── helpers de UI ────────────────────────────────────────────
function BarAtributo({ label, valor, max = 99, destaque }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-24 shrink-0 text-xs ${destaque ? 'text-accent font-medium' : 'text-secondary'}`}>
        {label}
      </span>
      <div className="flex-1 overflow-hidden rounded-full bg-elevated h-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${valor}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${destaque ? 'bg-accent' : 'bg-border-strong'}`}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-primary">{valor}</span>
    </div>
  )
}

function StatBadge({ label, valor, cor = 'text-primary' }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-3 py-2.5 text-center">
      <span className={`text-lg font-bold tabular-nums ${cor}`}>{valor}</span>
      <span className="mt-0.5 text-[10px] leading-tight text-secondary">{label}</span>
    </div>
  )
}

function Pill({ children, cor = 'bg-elevated text-secondary border-border' }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${cor}`}>
      {children}
    </span>
  )
}

// ─── FASE: evento ─────────────────────────────────────────────
function FaseEvento({ evento, onEscolha }) {
  const [escolhido, setEscolhido] = useState(null)

  if (escolhido !== null) {
    const res = evento.escolhas[escolhido]
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{evento.titulo}</p>
        <p className="mt-4 text-base leading-relaxed text-primary max-w-sm">
          {res.resultado}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onEscolha(escolhido)}
          className="mt-8 w-full max-w-sm rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
        >
          Continuar
        </motion.button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{evento.titulo}</p>
        <p className="mt-3 text-base leading-relaxed text-primary">{evento.texto}</p>
        <div className="mt-6 flex flex-col gap-2">
          {evento.escolhas.map((esc, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEscolhido(i)}
              className="rounded-xl border border-border bg-surface px-5 py-4 text-left text-sm font-medium text-primary"
            >
              {esc.rotulo}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── FASE: oferta de transferência ────────────────────────────
function FaseTransferencia({ oferta, estado, onDecisao }) {
  const ligaAtual = LIGAS[estado.liga]
  const melhor = oferta.prestígio > (ligaAtual?.prestigio ?? 0)

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Janela de transferências</p>
        <h2 className="mt-3 text-xl font-bold">
          {oferta.time} quer você.
        </h2>
        <p className="mt-2 text-sm text-secondary">
          {LIGAS[oferta.liga]?.nome ?? oferta.liga} ·{' '}
          {melhor ? 'Liga mais forte' : 'Proposta lateral'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <StatBadge label="Salário / mês" valor={`$${oferta.salario}M`} cor="text-accent" />
          <StatBadge label="Prestígio" valor={oferta.prestígio} />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onDecisao(true, oferta)}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Aceitar transferência
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onDecisao(false, oferta)}
            className="w-full rounded-xl border border-border bg-surface px-6 py-3 text-sm text-secondary"
          >
            Renovar com {estado.time}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ─── FASE: resultado da temporada ─────────────────────────────
function FaseResultado({ estado, stats, manchete, titulos, premios, selecao, onContinuar }) {
  const mediaAtual = calcMedia(estado.atrs, estado.posicao)

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <ExitButton onExit={() => onContinuar('sair')} />
      <div className="mx-auto w-full max-w-sm flex-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Temporada {estado.temporada} · {estado.idade} anos
        </p>
        <h2 className="mt-1 text-xl font-bold leading-tight">{manchete}</h2>

        {/* conquistas */}
        {(titulos.length > 0 || premios.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {titulos.map((t) => (
              <Pill key={t} cor="bg-accent/15 text-accent border-accent/30">🏆 {t}</Pill>
            ))}
            {premios.map((p) => (
              <Pill key={p} cor="bg-success/15 text-success border-success/30">⭐ {p}</Pill>
            ))}
          </div>
        )}

        {selecao && (
          <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-3">
            <p className="text-xs font-medium text-secondary">Seleção Nacional</p>
            <p className="mt-1 text-sm text-primary">
              {selecao.partidas} jogos · {selecao.pontos} pts{selecao.torneios.length > 0 ? ` · 🥇 ${selecao.torneios.join(', ')}` : ''}
            </p>
          </div>
        )}

        {estado.lesaoAtual && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            <p className="text-xs text-danger">
              Lesão: {estado.lesaoAtual.nome} · ficou fora {estado.jogosLesado} jogos
            </p>
          </div>
        )}

        {/* stats */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <StatBadge label="Média" valor={mediaAtual} cor="text-accent" />
          <StatBadge label="PTS" valor={stats.pontosPorJogo} />
          <StatBadge label="REB" valor={stats.rebotesPorJogo} />
          <StatBadge label="AST" valor={stats.assistenciasPorJogo} />
        </div>
        <p className="mt-1 text-center text-[10px] text-muted">
          {stats.percentualArremesso}% arremesso · {stats.jogos} jogos
        </p>

        {/* atributos */}
        <div className="mt-5 flex flex-col gap-2">
          {ATRIBUTOS.map((at) => (
            <BarAtributo
              key={at.id}
              label={at.nome}
              valor={estado.atrs[at.id]}
            />
          ))}
        </div>

        {/* humor / desgaste */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted">Moral</p>
            <p className="text-sm font-semibold">{estado.moral}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted">Desgaste</p>
            <p className={`text-sm font-semibold ${estado.desgaste > 65 ? 'text-danger' : ''}`}>
              {estado.desgaste}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted">Fama</p>
            <p className="text-sm font-semibold">{estado.fama}</p>
          </div>
        </div>
      </div>

      {/* ações */}
      <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-2">
        {estado.idade >= 34 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onContinuar('aposentar')}
            className="w-full rounded-xl border border-border bg-surface px-6 py-3 text-sm text-secondary"
          >
            Anunciar aposentadoria
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onContinuar('continuar')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
        >
          Próxima temporada <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  )
}

// ─── FASE: resumo final ───────────────────────────────────────
function FaseResumo({ estado, onVoltar }) {
  const totalTitulos = estado.titulos.length
  const totalPremios = estado.premiosIndividuais.length
  const totalStats = estado.estatisticas.reduce(
    (acc, s) => ({
      jogos: acc.jogos + s.jogos,
      pontos: acc.pontos + Math.round(s.pontosPorJogo * s.jogos),
      rebotes: acc.rebotes + Math.round(s.rebotesPorJogo * s.jogos),
      assistencias: acc.assistencias + Math.round(s.assistenciasPorJogo * s.jogos),
    }),
    { jogos: 0, pontos: 0, rebotes: 0, assistencias: 0 }
  )

  const nota = calcularNota(estado, totalTitulos, totalPremios)

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Carreira encerrada</p>
        <h1 className="mt-1 text-3xl font-bold">
          #{estado.numero} {estado.sobrenome}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          {POSICOES.find((p) => p.id === estado.posicao)?.nome} ·{' '}
          {PAISES_MAP[estado.pais] ?? estado.pais} ·{' '}
          {estado.temporada - 1} temporadas
        </p>

        {/* nota */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4">
          <div>
            <p className="text-xs text-secondary">Nota final</p>
            <p className="text-4xl font-bold text-accent">{nota.label}</p>
          </div>
          <p className="max-w-[180px] text-right text-xs leading-relaxed text-secondary">
            {nota.texto}
          </p>
        </div>

        {/* stats acumuladas */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <StatBadge label="Jogos" valor={totalStats.jogos} />
          <StatBadge label="Pontos totais" valor={totalStats.pontos.toLocaleString('pt-BR')} cor="text-accent" />
          <StatBadge label="Rebotes totais" valor={totalStats.rebotes.toLocaleString('pt-BR')} />
          <StatBadge label="Assistências totais" valor={totalStats.assistencias.toLocaleString('pt-BR')} />
        </div>

        {/* seleção */}
        {estado.selecao.partidas > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-surface px-4 py-3">
            <p className="text-xs font-medium text-secondary">Seleção Nacional</p>
            <p className="mt-1 text-sm text-primary">
              {estado.selecao.partidas} partidas · {estado.selecao.pontos} pts
              {estado.selecao.torneios.length > 0 && (
                <span className="ml-2 text-accent">· 🥇 {estado.selecao.torneios.join(', ')}</span>
              )}
            </p>
          </div>
        )}

        {/* títulos e prêmios */}
        {totalTitulos + totalPremios > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-secondary">Conquistas</p>
            <div className="flex flex-wrap gap-1.5">
              {estado.titulos.map((t, i) => (
                <Pill key={i} cor="bg-accent/15 text-accent border-accent/30">🏆 {t}</Pill>
              ))}
              {estado.premiosIndividuais.map((p, i) => (
                <Pill key={i} cor="bg-success/15 text-success border-success/30">⭐ {p}</Pill>
              ))}
            </div>
          </div>
        )}

        {/* clubes */}
        {estado.transferencias.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-secondary">Clubes</p>
            <p className="text-sm text-primary">{[...new Set(estado.transferencias)].join(' → ')}</p>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onVoltar}
          className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
        >
          Nova carreira
        </motion.button>
      </div>
    </div>
  )
}

// ─── mapa de países ───────────────────────────────────────────
const PAISES_MAP = {
  brasil: 'Brasil', eua: 'EUA', argentina: 'Argentina', espanha: 'Espanha',
  servia: 'Sérvia', franca: 'França', grecia: 'Grécia', italia: 'Itália',
  turquia: 'Turquia', lituania: 'Lituânia', canada: 'Canadá',
  australia: 'Austrália', nigeria: 'Nigéria', china: 'China',
}

// ─── nota final ───────────────────────────────────────────────
function calcularNota(estado, titulos, premios) {
  const media = estado.valoresMaximos.media
  const pts = media * 0.4 + titulos * 6 + premios * 4 + estado.fama * 0.3 + estado.selecao.torneios.length * 8
  if (pts >= 105) return { label: 'Lenda', texto: 'Uma carreira que vai definir uma geração.' }
  if (pts >= 82) return { label: 'Estrela', texto: 'Poucos chegaram tão longe.' }
  if (pts >= 62) return { label: 'Sólido', texto: 'Você cumpriu o que prometia.' }
  if (pts >= 42) return { label: 'Regular', texto: 'Mais sorte na próxima vida.' }
  return { label: 'Reserva', texto: 'Nem tudo é pra todo mundo.' }
}

// ─── componente principal ─────────────────────────────────────
export default function CarreiraGame({ config, onBack }) {
  const [estado, setEstado] = useState(() => gerarEstadoInicial(config))
  const [fase, setFase] = useState('pre_eventos') // pre_eventos | evento | pre_simulacao | resultado | transferencia | resumo
  const [eventosRestantes, setEventosRestantes] = useState([])
  const [statsTemporada, setStatsTemporada] = useState(null)
  const [manchete, setManchete] = useState('')
  const [titulosTemp, setTitulosTemp] = useState([])
  const [premiosTemp, setPremiosTemp] = useState([])
  const [selecaoTemp, setSelecaoTemp] = useState(null)
  const [ofertaTransf, setOfertaTransf] = useState(null)
  const [pendingEfeitos, setPendingEfeitos] = useState({})

  // ── iniciar temporada: preparar eventos ──────────────────────
  function iniciarTemporada() {
    const evs = selecionarEventos(estado, 2)
    setEventosRestantes(evs)
    setPendingEfeitos({})
    setFase('evento')
  }

  // ── resolver evento ──────────────────────────────────────────
  function resolverEvento(indexEscolha) {
    const ev = eventosRestantes[0]
    const escolha = ev.escolhas[indexEscolha]
    const ef = escolha.efeitos ?? {}

    // aplicar efeitos imediatos de atributos/moral/fama/etc.
    const novoEstado = aplicarEfeitos(estado, ef)

    // acumular flags especiais pra aplicar no fim da temporada
    const novoPending = { ...pendingEfeitos }
    if (ef.risco) novoPending.risco = (novoPending.risco ?? 0) + ef.risco
    if (ef.foraTemporada) novoPending.foraTemporada = true
    if (ef.chinaBoost) novoPending.chinaBoost = true
    if (ef.selecaoBoost) novoPending.selecaoBoost = (novoPending.selecaoBoost ?? 0) + ef.selecaoBoost
    if (ef.minutosPenalidade) novoPending.minutosPenalidade = (novoPending.minutosPenalidade ?? 0) + 1

    setEstado(novoEstado)
    setPendingEfeitos(novoPending)

    const restantes = eventosRestantes.slice(1)
    setEventosRestantes(restantes)

    if (restantes.length > 0) {
      setFase('evento')
    } else {
      simularEpoca(novoEstado, novoPending)
    }
  }

  // ── simular a temporada após todos os eventos ─────────────────
  function simularEpoca(est, pending) {
    const ligaObj = LIGAS[est.liga]

    // lesão
    const lesao = sorteiarLesao(est.desgaste, pending.risco ?? 0)
    const jogosLesado = lesao ? rand(lesao.jogosFora[0], lesao.jogosFora[1]) : 0
    const sequela = lesao?.sequela ?? 0

    let novoEst = {
      ...est,
      lesaoAtual: lesao,
      jogosLesado,
    }

    if (lesao) {
      novoEst.desgaste = clamp(novoEst.desgaste - 5, 0, 100)
      // sequela permanente
      for (const k of Object.keys(novoEst.atrs)) {
        novoEst.atrs[k] = clamp(novoEst.atrs[k] - Math.floor(sequela / 3), 1, novoEst.potencial)
      }
      novoEst.lesaoHistorico = [...novoEst.lesaoHistorico, lesao.nome]
    }

    // stats
    const stats = simularTemporada(novoEst, { ...ligaObj, jogos: ligaObj.jogos - jogosLesado })

    // evolução de atributos (progressão natural)
    const novosAtrs = evoluirAtributos(novoEst)
    novoEst.atrs = novosAtrs

    // desgaste natural da temporada
    const deltaDes = rand(3, 8) + (pending.foraTemporada ? -20 : 0)
    novoEst.desgaste = clamp(novoEst.desgaste + deltaDes, 0, 100)

    // moral e técnico oscilam
    novoEst.moral = clamp(novoEst.moral + rand(-6, 6), 0, 100)
    if (novoEst.tecnico > 0) novoEst.tecnico = clamp(novoEst.tecnico + rand(-4, 4), 0, 100)

    const media = calcMedia(novosAtrs, est.posicao)
    novoEst.media = media
    if (media > novoEst.valoresMaximos.media) {
      novoEst.valoresMaximos = { ...novoEst.valoresMaximos, media }
    }

    // prêmios e títulos
    const premios = avaliarPremios(novoEst, stats)
    const titulo = simularCampeonato(novoEst, stats)
    const titulosT = titulo ? [titulo] : []

    // seleção
    let selecao = null
    if (media >= 72 && novoEst.fama >= 25) {
      const boost = pending.selecaoBoost ?? 0
      const convocado = Math.random() < 0.45 + boost * 0.01
      if (convocado) {
        const pts = rand(8, 26)
        const partidas = rand(4, 14)
        const torneios = []
        if (media >= 80 && Math.random() < 0.22 + boost * 0.005) torneios.push('EuroBasket / AmeriCup')
        if (media >= 86 && novoEst.fama >= 60 && Math.random() < 0.10) torneios.push('Copa do Mundo')
        selecao = { pontos: pts, partidas, torneios }

        novoEst.selecao = {
          partidas: novoEst.selecao.partidas + partidas,
          pontos: novoEst.selecao.pontos + pts,
          torneios: [...novoEst.selecao.torneios, ...torneios],
        }
      }
    }

    // fama cresce com destaque
    if (stats.desempenho >= 82) novoEst.fama = clamp(novoEst.fama + rand(3, 7), 0, 100)
    if (premios.length > 0) novoEst.fama = clamp(novoEst.fama + 5, 0, 100)
    if (titulosT.length > 0) novoEst.fama = clamp(novoEst.fama + 6, 0, 100)

    // acumular na carreira
    novoEst.estatisticas = [...novoEst.estatisticas, stats]
    novoEst.titulos = [...novoEst.titulos, ...titulosT]
    novoEst.premiosIndividuais = [...novoEst.premiosIndividuais, ...premios]
    novoEst.transferencias = [...novoEst.transferencias, novoEst.time]

    const mancheteStr = gerarManchete(novoEst, stats)

    setEstado(novoEst)
    setStatsTemporada(stats)
    setManchete(mancheteStr)
    setTitulosTemp(titulosT)
    setPremiosTemp(premios)
    setSelecaoTemp(selecao)
    setFase('resultado')
  }

  // ── continuar ou aposentar ────────────────────────────────────
  function handleContinuar(acao) {
    if (acao === 'sair' || acao === 'aposentar' || estado.temporada >= 24 || estado.idade >= 40) {
      setEstado((s) => ({ ...s, aposentado: true }))
      setFase('resumo')
      return
    }

    // avançar temporada
    const novoEst = {
      ...estado,
      temporada: estado.temporada + 1,
      idade: estado.idade + 1,
      lesaoAtual: null,
      jogosLesado: 0,
    }

    // chance de oferta de transferência a cada 2+ temporadas
    if (novoEst.temporada >= 2 && Math.random() < 0.45) {
      const oferta = gerarOfertaTransferencia(novoEst)
      if (oferta) {
        setEstado(novoEst)
        setOfertaTransf(oferta)
        setFase('transferencia')
        return
      }
    }

    setEstado(novoEst)
    iniciarTemporadaComEstado(novoEst)
  }

  function iniciarTemporadaComEstado(est) {
    const evs = selecionarEventos(est, 2)
    setEventosRestantes(evs)
    setPendingEfeitos({})
    setEstado(est)
    setFase('evento')
  }

  function handleTransferencia(aceitou, oferta) {
    let novoEst = { ...estado }
    if (aceitou) {
      novoEst = {
        ...novoEst,
        liga: oferta.liga,
        ligaObj: oferta.ligaObj,
        time: oferta.time,
        timeForca: oferta.timeForca,
        fama: clamp(novoEst.fama + 4, 0, 100),
      }
    }
    setEstado(novoEst)
    setOfertaTransf(null)
    iniciarTemporadaComEstado(novoEst)
  }

  // ─── render ────────────────────────────────────────────────────
  if (fase === 'pre_eventos') {
    // tela de apresentação do jogador
    const mediaInicial = calcMedia(estado.atrs, estado.posicao)
    const posObj = POSICOES.find((p) => p.id === estado.posicao)

    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-10">
        <ExitButton onExit={onBack} />
        <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Seu jogador</p>
          <h1 className="mt-1 text-3xl font-bold">
            #{estado.numero} {estado.sobrenome}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {posObj?.nome} · 18 anos · {PAISES_MAP[estado.pais] ?? estado.pais}
          </p>
          <p className="mt-0.5 text-xs text-muted">{estado.time} · {LIGAS[estado.liga]?.nome}</p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <StatBadge label="Média" valor={mediaInicial} cor="text-accent" />
            <StatBadge label="Potencial" valor={estado.potencial} />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {ATRIBUTOS.map((at) => (
              <BarAtributo key={at.id} label={at.nome} valor={estado.atrs[at.id]} />
            ))}
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-sm">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={iniciarTemporada}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Começar Temporada 1 <ChevronRight className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    )
  }

  if (fase === 'evento' && eventosRestantes.length > 0) {
    return (
      <div className="relative">
        <ExitButton onExit={onBack} />
        <div className="fixed top-4 left-1/2 -translate-x-1/2 text-xs text-muted">
          T{estado.temporada} · {estado.idade} anos
        </div>
        <FaseEvento evento={eventosRestantes[0]} onEscolha={resolverEvento} />
      </div>
    )
  }

  if (fase === 'resultado' && statsTemporada) {
    return (
      <FaseResultado
        estado={estado}
        stats={statsTemporada}
        manchete={manchete}
        titulos={titulosTemp}
        premios={premiosTemp}
        selecao={selecaoTemp}
        onContinuar={handleContinuar}
      />
    )
  }

  if (fase === 'transferencia' && ofertaTransf) {
    return (
      <div className="relative">
        <ExitButton onExit={onBack} />
        <FaseTransferencia
          oferta={ofertaTransf}
          estado={estado}
          onDecisao={handleTransferencia}
        />
      </div>
    )
  }

  if (fase === 'resumo') {
    return <FaseResumo estado={estado} onVoltar={onBack} />
  }

  // fallback: não deveria cair aqui
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <motion.button whileTap={{ scale: 0.97 }} onClick={iniciarTemporada} className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-black">
        Iniciar
      </motion.button>
    </div>
  )
}
