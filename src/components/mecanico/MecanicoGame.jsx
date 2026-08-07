import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Wrench } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import RevealGate from './RevealGate.jsx'
import ModuloUI from './ModuloUI.jsx'
import { gerarModulo, estadoInicialModulo, validarModulo } from '../../data/maquinaModulos.js'
import {
  restricoesMecanico,
  restricoesEngenheiro,
  restricoesInspetor,
  restricoesColetivas,
  eventosAleatorios,
  sortear,
} from '../../data/maquinaRestricoes.js'
import { DIFICULDADE, MODOS } from '../../data/maquinaConfig.js'

const RECORDE_KEY = 'jogo-role-mecanico-recorde'

function embaralharIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i)
  return arr.sort(() => Math.random() - 0.5)
}

export default function MecanicoGame({ players, onBack }) {
  const [dificuldade, setDificuldade] = useState('normal')
  const [modo, setModo] = useState('classico')
  const [fase, setFase] = useState('config')

  const [papeis, setPapeis] = useState(null)
  const [restricoes, setRestricoes] = useState(null)
  const [revealIndex, setRevealIndex] = useState(0)
  const [gateRevelado, setGateRevelado] = useState(false)

  const [defeitoAtual, setDefeitoAtual] = useState(null)
  const [tiposUsados, setTiposUsados] = useState([])
  const [defeitosResolvidos, setDefeitosResolvidos] = useState(0)
  const [defeitosTotal, setDefeitosTotal] = useState(0)

  const [segundosInspecao, setSegundosInspecao] = useState(0)
  const [tempoRestante, setTempoRestante] = useState(0)
  const [tempoTotalPartida, setTempoTotalPartida] = useState(0)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)

  const [contadorErros, setContadorErros] = useState(0)
  const [tentativasModuloAtual, setTentativasModuloAtual] = useState(0)
  const [erroFeedback, setErroFeedback] = useState(null)
  const [estadoModulo, setEstadoModulo] = useState(null)
  const [eventoAtivo, setEventoAtivo] = useState(null)
  const [bloqueadoMecanico, setBloqueadoMecanico] = useState(false)
  const [motivoDerrota, setMotivoDerrota] = useState(null)
  const [recorde, setRecorde] = useState(() => {
    const salvo = localStorage.getItem(RECORDE_KEY)
    return salvo ? Number(salvo) : null
  })

  useEffect(() => {
    setGateRevelado(false)
  }, [fase, revealIndex])

  useEffect(() => {
    if (fase !== 'inspecao' || !gateRevelado) return
    if (segundosInspecao <= 0) {
      setGateRevelado(false)
      setFase('manual')
      return
    }
    const t = setTimeout(() => setSegundosInspecao((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [fase, gateRevelado, segundosInspecao])

  useEffect(() => {
    if (fase !== 'reparo') return
    if (modo === 'contrarrelogio') {
      const t = setTimeout(() => setTempoDecorrido((s) => s + 1), 1000)
      return () => clearTimeout(t)
    }
    if (tempoRestante <= 0) {
      finalizarDerrota('tempo')
      return
    }
    const t = setTimeout(() => setTempoRestante((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, tempoRestante, modo])

  function gerarRestricoes(coletivaAtual) {
    const dif = DIFICULDADE[dificuldade]
    if (!dif.usarRestricoes) return null
    return {
      mecanico: sortear(restricoesMecanico),
      engenheiro: sortear(restricoesEngenheiro),
      inspetor: sortear(restricoesInspetor),
      coletiva: dificuldade === 'caos' ? coletivaAtual ?? sortear(restricoesColetivas) : null,
    }
  }

  function iniciarPartida() {
    const dif = DIFICULDADE[dificuldade]
    const [mecanicoIdx, engenheiroIdx, inspetorIdx] = embaralharIndices(players.length)
    setPapeis({ mecanicoIdx, engenheiroIdx, inspetorIdx })
    setRestricoes(gerarRestricoes(null))

    const primeiroModulo = gerarModulo([])
    setTiposUsados([primeiroModulo.tipo])
    setDefeitoAtual(primeiroModulo)
    setDefeitosTotal(modo === 'sobrevivencia' ? Infinity : dif.qtdDefeitos)
    setDefeitosResolvidos(0)
    setContadorErros(0)
    setTentativasModuloAtual(0)
    setTempoRestante(dif.duracaoSegundos)
    setTempoDecorrido(0)
    setTempoTotalPartida(dif.duracaoSegundos)
    setSegundosInspecao(dif.segundosInspecao)
    setMotivoDerrota(null)
    setRevealIndex(0)
    setFase('revelacao')
  }

  function proximoReveal() {
    setGateRevelado(false)
    if (revealIndex + 1 < 3) {
      setRevealIndex((i) => i + 1)
    } else {
      setFase('inspecao')
    }
  }

  function iniciarReparo() {
    setGateRevelado(false)
    setTentativasModuloAtual(0)
    setEstadoModulo(estadoInicialModulo(defeitoAtual))
    setEventoAtivo(null)
    setBloqueadoMecanico(false)
    setFase('reparo')
    const dif = DIFICULDADE[dificuldade]
    if (Math.random() < dif.chanceEvento) {
      setTimeout(() => dispararEvento(), 2000)
    }
  }

  function dispararEvento() {
    const evento = sortear(eventosAleatorios)
    setEventoAtivo(evento)
    if (evento.acelerarSegundos && modo !== 'contrarrelogio') {
      setTempoRestante((t) => Math.max(0, t - evento.acelerarSegundos))
    }
    if (evento.bloqueioSegundos) {
      setBloqueadoMecanico(true)
      setTimeout(() => setBloqueadoMecanico(false), evento.bloqueioSegundos * 1000)
    }
    if (evento.embaralhar) {
      setDefeitoAtual((prev) =>
        prev && prev.componentes ? { ...prev, componentes: [...prev.componentes].sort(() => Math.random() - 0.5) } : prev,
      )
    }
    setTimeout(() => setEventoAtivo(null), 4000)
  }

  function confirmarModulo() {
    const resultado = validarModulo(defeitoAtual, estadoModulo)
    if (resultado.completo) {
      registrarSucesso()
    } else {
      registrarErro()
    }
  }

  function registrarSucesso() {
    const novoTotal = defeitosResolvidos + 1
    setDefeitosResolvidos(novoTotal)
    setTentativasModuloAtual(0)
    if (modo !== 'sobrevivencia' && novoTotal >= defeitosTotal) {
      finalizarVitoria()
      return
    }
    avancarProximoDefeito(novoTotal)
  }

  function avancarProximoDefeito(novoTotal) {
    const dif = DIFICULDADE[dificuldade]
    const novoModulo = gerarModulo([...tiposUsados, defeitoAtual.tipo])
    setTiposUsados((prev) => [...prev, defeitoAtual.tipo])
    setDefeitoAtual(novoModulo)
    setSegundosInspecao(dif.segundosInspecao)

    if (modo === 'sobrevivencia') {
      const duracaoModulo = Math.max(15, dif.duracaoSegundos - novoTotal * 10)
      setTempoRestante(duracaoModulo)
      setTempoTotalPartida(duracaoModulo)
    }

    if (modo === 'revezamento') {
      setPapeis((prev) => ({
        mecanicoIdx: prev.inspetorIdx,
        engenheiroIdx: prev.mecanicoIdx,
        inspetorIdx: prev.engenheiroIdx,
      }))
      setRestricoes((prev) => gerarRestricoes(prev?.coletiva))
      setRevealIndex(0)
      setFase('revelacao')
      return
    }

    setFase('inspecao')
  }

  function registrarErro() {
    const dif = DIFICULDADE[dificuldade]
    const novasTentativas = tentativasModuloAtual + 1
    setTentativasModuloAtual(novasTentativas)
    const graveTentativa = novasTentativas >= 3
    const critico = graveTentativa && Math.random() < dif.chanceCritico
    const novoContador = contadorErros + 1
    setContadorErros(novoContador)

    if (critico) {
      finalizarDerrota('critico')
      return
    }
    if (graveTentativa && modo === 'umavida') {
      finalizarDerrota('grave-uma-vida')
      return
    }
    if (novoContador >= dif.limiteErros) {
      finalizarDerrota('limite-erros')
      return
    }

    const penalidade = graveTentativa ? 20 : 8
    if (modo !== 'contrarrelogio') {
      setTempoRestante((t) => Math.max(0, t - penalidade))
    }
    setErroFeedback({ tipo: graveTentativa ? 'grave' : 'leve' })
    setTimeout(() => setErroFeedback(null), 1500)
  }

  function finalizarDerrota(motivo) {
    setMotivoDerrota(motivo)
    setFase('derrota')
  }

  function finalizarVitoria() {
    if (modo === 'contrarrelogio' && (recorde === null || tempoDecorrido < recorde)) {
      localStorage.setItem(RECORDE_KEY, String(tempoDecorrido))
      setRecorde(tempoDecorrido)
    }
    setFase('vitoria')
  }

  function calcularEstrelas() {
    const dif = DIFICULDADE[dificuldade]
    const pctErros = contadorErros / dif.limiteErros
    const pctTempo = modo === 'contrarrelogio' ? 1 : tempoRestante / tempoTotalPartida
    if (pctErros <= 0.3 && pctTempo >= 0.5) return 3
    if (pctErros <= 0.6 && pctTempo >= 0.15) return 2
    return 1
  }

  if (fase === 'config') {
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <ExitButton onExit={onBack} />
        <div className="mx-auto w-full max-w-sm flex-1">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-glow">
              <Wrench className="h-7 w-7 text-accent" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">O Mecânico</h1>
            <p className="mt-1 text-sm text-secondary">
              3 jogadores assumem funções (Mecânico, Engenheiro, Inspetor). Com mais gente na
              mesa, o resto ajuda de fora.
            </p>
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">Dificuldade</p>
          <div className="mt-3 flex flex-col gap-2">
            {Object.entries(DIFICULDADE).map(([id, d]) => (
              <button
                key={id}
                onClick={() => setDificuldade(id)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                  dificuldade === id
                    ? 'border-accent bg-accent-glow text-primary'
                    : 'border-border bg-surface text-secondary'
                }`}
              >
                {d.nome}
              </button>
            ))}
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">Modo</p>
          <div className="mt-3 flex flex-col gap-2">
            {Object.entries(MODOS).map(([id, m]) => (
              <button
                key={id}
                onClick={() => setModo(id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  modo === id ? 'border-accent bg-accent-glow' : 'border-border bg-surface'
                }`}
              >
                <span className="text-sm font-medium text-primary">{m.nome}</span>
                <p className="mt-0.5 text-xs text-secondary">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm pt-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={iniciarPartida}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Sortear funções e começar
          </motion.button>
        </div>
      </div>
    )
  }

  if (fase === 'revelacao') {
    const ordem = [
      { nome: 'Mecânico', idx: papeis.mecanicoIdx, restricao: restricoes?.mecanico },
      { nome: 'Engenheiro', idx: papeis.engenheiroIdx, restricao: restricoes?.engenheiro },
      { nome: 'Inspetor', idx: papeis.inspetorIdx, restricao: restricoes?.inspetor },
    ]
    const atual = ordem[revealIndex]
    return (
      <RevealGate
        playerName={players[atual.idx]}
        subtitulo="Sua função nessa partida"
        revelado={gateRevelado}
        onRevelar={() => setGateRevelado(true)}
        onExit={onBack}
      >
        <div className="rounded-2xl border border-border-strong bg-elevated px-8 py-10">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Você é o</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{atual.nome}</h2>
          {atual.restricao && (
            <p className="mt-4 rounded-xl border border-border bg-white/5 px-4 py-3 text-sm text-secondary">
              Restrição: {atual.restricao}
            </p>
          )}
          {restricoes?.coletiva && (
            <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-primary">
              Regra coletiva: {restricoes.coletiva}
            </p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={proximoReveal}
          className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
        >
          Entendi, passar
        </motion.button>
      </RevealGate>
    )
  }

  if (fase === 'inspecao') {
    return (
      <RevealGate
        playerName={players[papeis.inspetorIdx]}
        subtitulo="Você é o Inspetor — observe rápido"
        revelado={gateRevelado}
        onRevelar={() => setGateRevelado(true)}
        onExit={onBack}
      >
        <div className="rounded-2xl border border-border-strong bg-elevated px-8 py-10">
          <p className="text-xs font-medium uppercase tracking-widest text-secondary">{defeitoAtual.nome}</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${segundosInspecao <= 5 ? 'text-danger' : 'text-accent'}`}>
            {segundosInspecao}s
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-left text-sm text-primary">
            {defeitoAtual.inspetorLinhas.map((linha, i) => (
              <li key={i}>{linha}</li>
            ))}
          </ul>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setGateRevelado(false)
            setFase('manual')
          }}
          className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
        >
          Prontos, passar pro Engenheiro
        </motion.button>
      </RevealGate>
    )
  }

  if (fase === 'manual') {
    return (
      <RevealGate
        playerName={players[papeis.engenheiroIdx]}
        subtitulo="Você é o Engenheiro — leia as regras"
        revelado={gateRevelado}
        onRevelar={() => setGateRevelado(true)}
        onExit={onBack}
      >
        <div className="rounded-2xl border border-border-strong bg-elevated px-8 py-10">
          <p className="text-xs font-medium uppercase tracking-widest text-secondary">{defeitoAtual.nome} — manual</p>
          <ul className="mt-4 flex flex-col gap-2 text-left text-sm text-primary">
            {defeitoAtual.manualLinhas.map((linha, i) => (
              <li key={i}>{linha}</li>
            ))}
          </ul>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={iniciarReparo}
          className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
        >
          Prontos, passar pro Mecânico
        </motion.button>
      </RevealGate>
    )
  }

  if (fase === 'reparo') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center px-6 py-8 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>
              Defeito {defeitosResolvidos + 1}
              {modo !== 'sobrevivencia' ? ` de ${defeitosTotal}` : ''}
            </span>
            <span
              className={`font-bold tabular-nums ${
                modo !== 'contrarrelogio' && tempoRestante <= 20 ? 'text-danger' : 'text-primary'
              }`}
            >
              {modo === 'contrarrelogio' ? `${tempoDecorrido}s` : `${tempoRestante}s`}
            </span>
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">{defeitoAtual.nome}</h1>
          <p className="mt-1 text-xs text-secondary">Mecânico: {players[papeis.mecanicoIdx]}</p>

          <AnimatePresence>
            {eventoAtivo && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-left"
              >
                <p className="text-sm font-semibold text-danger">{eventoAtivo.titulo}</p>
                <p className="mt-1 text-xs text-secondary">{eventoAtivo.descricao}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative mt-6">
            {bloqueadoMecanico && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/70 text-sm font-semibold text-white">
                Painel travado...
              </div>
            )}
            <ModuloUI key={defeitoAtual.id} modulo={defeitoAtual} onEstadoMudou={setEstadoModulo} />
          </div>

          {erroFeedback && (
            <p className={`mt-3 text-sm font-semibold ${erroFeedback.tipo === 'grave' ? 'text-danger' : 'text-secondary'}`}>
              {erroFeedback.tipo === 'grave' ? 'Errado — e feio. A máquina reagiu mal.' : 'Ainda não é isso. Tentem de novo.'}
            </p>
          )}

          <motion.button
            whileTap={{ scale: bloqueadoMecanico ? 1 : 0.97 }}
            disabled={bloqueadoMecanico}
            onClick={confirmarModulo}
            className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-40"
          >
            Confirmar
          </motion.button>
        </div>
      </div>
    )
  }

  if (fase === 'vitoria') {
    const estrelas = calcularEstrelas()
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-success">Máquina restaurada!</h1>
          <p className="mt-2 text-sm text-secondary">
            {defeitosResolvidos} defeito(s) corrigido(s) · {contadorErros} erro(s)
            {modo === 'contrarrelogio' ? ` · ${tempoDecorrido}s` : ` · ${tempoRestante}s restantes`}
          </p>
          {modo === 'contrarrelogio' && recorde !== null && (
            <p className="mt-1 text-xs text-muted">Recorde salvo neste aparelho: {recorde}s</p>
          )}
          <div className="mt-4 text-3xl">
            {'⭐'.repeat(estrelas)}
            {'☆'.repeat(3 - estrelas)}
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setFase('config')}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Jogar de novo
            </motion.button>
            <button onClick={onBack} className="w-full rounded-xl px-6 py-3 text-sm text-secondary">
              Encerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (fase === 'derrota') {
    const motivos = {
      tempo: 'O tempo acabou antes de todos os defeitos serem corrigidos.',
      critico: 'Uma ação crítica deu errado — a máquina entrou em colapso.',
      'grave-uma-vida': 'Um erro grave encerrou a partida (modo Uma Vida).',
      'limite-erros': 'A equipe passou do limite de erros permitido.',
    }
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-danger">Pane definitiva</h1>
          <p className="mt-2 text-sm text-secondary">
            {motivos[motivoDerrota] ?? 'A máquina entrou em colapso.'}
          </p>
          <p className="mt-4 text-xs text-muted">{defeitosResolvidos} defeito(s) corrigido(s) antes da falha.</p>
          <div className="mt-8 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setFase('config')}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Tentar de novo
            </motion.button>
            <button onClick={onBack} className="w-full rounded-xl px-6 py-3 text-sm text-secondary">
              Encerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
