import { useCallback, useEffect, useRef, useState } from 'react'
import { FORMACOES } from './formacoes.js'
import { CAMPO, bocaDoGol, cantoDoCampo, marcaDoPenalti, posicoesDoTime } from './layoutCampo.js'
import { rotuloMinuto } from './motor.js'

// Reproduz uma partida já decidida pelo motor: relógio, passes entre as peças, finalização, gol e replay.
// Tudo aqui é só encenação: nada do que acontece na tela muda o resultado.

const MS_POR_MINUTO = 500
const MS_PASSE = 480
const MS_CHUTE = 620
const MS_RESULTADO = 900

const MENSAGENS = {
  falta: (e) => `Falta de ${e.jogadorNome}`,
  amarelo: (e) => `Cartão amarelo para ${e.jogadorNome}`,
  vermelho: (e) => `Cartão vermelho para ${e.jogadorNome}${e.motivo === 'segundo amarelo' ? ' (2º amarelo)' : ''}`,
  escanteio: (e) => `Escanteio cobrado por ${e.jogadorNome}`,
  impedimento: (e) => `Impedimento de ${e.jogadorNome}`,
  lesao: (e) => `${e.jogadorNome} se machucou e saiu`,
  penalti: (e) => `Pênalti! ${e.jogadorNome} vai cobrar${e.viaVar ? ' (após o VAR)' : ''}`,
  gol_anulado: (e) => `VAR: gol de ${e.jogadorNome} anulado (${e.motivo})`,
  chute_defendido: (e) => `Defesa de ${e.goleiroNome ?? 'goleiro'}`,
  chute_fora: (e) => `${e.jogadorNome} chuta pra fora`,
  chute_trave: (e) => `${e.jogadorNome} acerta a trave`,
  chute_bloqueado: (e) => `Chute de ${e.jogadorNome} bloqueado`,
  penalti_defendido: (e) => `Defendeu! ${e.goleiroNome ?? 'O goleiro'} pega o pênalti`,
  penalti_fora: (e) => `${e.jogadorNome} chuta o pênalti pra fora`,
}

const TEM_LANCE = ['gol', 'gol_penalti', 'gol_contra', 'gol_anulado', 'chute_defendido', 'chute_fora', 'chute_trave', 'chute_bloqueado', 'penalti_defendido', 'penalti_fora']
const GOLS = ['gol', 'gol_penalti', 'gol_contra']

const visualInicial = {
  dono: 'A', zona: 0.3, by: 0.5, portadorId: null, trilha: [], bolaOverride: null, overrides: {}, camera: null,
  modo: 'normal', dur: 0.9, destaque: null,
}

export function useReprodutor(sim, cfg, { replay = true } = {}) {
  const [visual, setVisual] = useState(visualInicial)
  const [relogio, setRelogio] = useState({ min: 0, acr: 0, rotulo: "0'", tempo: 'T1' })
  const [placar, setPlacar] = useState({ A: 0, B: 0 })
  const [vistos, setVistos] = useState([])
  const [posseVista, setPosseVista] = useState([])
  const [banner, setBanner] = useState(null)
  const [estado, setEstado] = useState('parado')
  const [velocidade, setVelocidadeEstado] = useState(1)
  const [penaltisVistos, setPenaltisVistos] = useState([])

  const ctl = useRef({ token: 0, pausado: false, pular: false, vel: 1, replay })
  const cfgRef = useRef(cfg)
  cfgRef.current = cfg
  ctl.current.replay = replay

  const aguardar = useCallback((ms) => {
    const c = ctl.current
    return new Promise((resolve) => {
      if (c.pular) return resolve()
      const t = setTimeout(resolve, ms / c.vel)
      c.cancelar = () => {
        clearTimeout(t)
        resolve()
      }
    })
  }, [])

  const pausaSePreciso = useCallback(async (token) => {
    const c = ctl.current
    while (c.pausado && c.token === token && !c.pular) await new Promise((r) => setTimeout(r, 80))
  }, [])

  const reiniciar = useCallback(() => {
    const c = ctl.current
    c.token += 1
    c.pausado = false
    c.pular = false
    c.cancelar?.()
    setVisual(visualInicial)
    setRelogio({ min: 0, acr: 0, rotulo: "0'", tempo: 'T1' })
    setPlacar({ A: 0, B: 0 })
    setVistos([])
    setPosseVista([])
    setBanner(null)
    setPenaltisVistos([])
    setEstado('parado')
  }, [])

  useEffect(() => {
    reiniciar()
    return () => {
      ctl.current.token += 1
      ctl.current.cancelar?.()
    }
  }, [sim, reiniciar])

  const indiceDe = useCallback(
    (lado, id) => {
      const i = sim.escalacoes[lado].findIndex((e) => e.id === id)
      if (i >= 0) return i
      const slots = FORMACOES[cfgRef.current[lado].formacao]
      const m = slots.findIndex((s) => s.papel === 'M')
      return m >= 0 ? m : 5
    },
    [sim],
  )

  const posicoes = useCallback((lado, dono, zona, by) => {
    const c = cfgRef.current[lado]
    return posicoesDoTime({ lado, formacao: c.formacao, tatica: c.tatica, temBola: dono === lado, zona: dono === lado ? zona : zona, by })
  }, [])

  const tocarLance = useCallback(
    async (ev, token, devagar = 1, ehReplay = false) => {
      const c = ctl.current
      const lado = ev.time
      const def = lado === 'A' ? 'B' : 'A'
      const ids = ev.cadeia ?? []
      const jaTinha = ehReplay ? [] : []
      let trilha = [...jaTinha]
      const semente = (ev.ordem * 9301 + 49297) % 233280
      const aleat = (k) => ((semente + k * 7919) % 1000) / 1000
      c.dur = 0.55 * devagar

      for (let k = 0; k < ids.length; k++) {
        if (c.token !== token || c.pular) return
        await pausaSePreciso(token)
        const zona = ev.tipoJogada === 'penalti' ? 0.88 : 0.2 + 0.62 * (ids.length === 1 ? 1 : k / (ids.length - 1))
        const by = 0.2 + aleat(k) * 0.6
        const idx = indiceDe(lado, ids[k])
        const pos = posicoes(lado, lado, zona, by)
        let p = pos[idx]
        const overrides = {}
        if (ev.tipo === 'escanteio' || (ev.tipoJogada === 'escanteio' && k === 0)) {
          const canto = cantoDoCampo(def, aleat(9) > 0.5)
          overrides[ids[k]] = canto
          p = canto
        }
        if (ev.tipoJogada === 'penalti' || ev.tipo === 'penalti' || ev.tipo === 'penalti_defendido' || ev.tipo === 'penalti_fora') {
          const marca = marcaDoPenalti(def)
          overrides[ids[k]] = { x: marca.x + (lado === 'A' ? -9 : 9), y: marca.y }
          p = marca
        }
        trilha = [...trilha, { x: p.x, y: p.y }]
        setVisual((v) => ({ ...v, dono: lado, zona, by, portadorId: ids[k], trilha, overrides, bolaOverride: null, modo: ehReplay ? 'replay' : 'normal', dur: c.dur, destaque: ehReplay ? ev.jogadorId : null }))
        await aguardar(MS_PASSE * devagar)
      }

      if (c.token !== token || c.pular) return
      const goleiroIdx = sim.escalacoes[def].findIndex((e) => e.papel === 'G')
      const zonaFinal = ev.tipoJogada === 'penalti' ? 0.88 : 0.84
      const posDef = posicoes(def, lado, zonaFinal, 0.5)
      const boca = bocaDoGol(def, 0)
      const ult = trilha[trilha.length - 1]
      let alvo
      switch (ev.tipo) {
        case 'gol':
        case 'gol_penalti':
        case 'gol_contra':
          alvo = { x: boca.x + (def === 'A' ? -3 : 3), y: CAMPO.h / 2 + (aleat(5) - 0.5) * 30 }
          break
        case 'gol_anulado':
          alvo = { x: boca.x + (def === 'A' ? -3 : 3), y: CAMPO.h / 2 + (aleat(6) - 0.5) * 30 }
          break
        case 'chute_defendido':
        case 'penalti_defendido':
          alvo = { x: posDef[goleiroIdx].x, y: posDef[goleiroIdx].y + (aleat(2) - 0.5) * 8 }
          break
        case 'chute_trave':
          alvo = { x: boca.x, y: CAMPO.h / 2 + (aleat(3) > 0.5 ? 22 : -22) }
          break
        case 'chute_bloqueado': {
          const zag = sim.escalacoes[def].map((e, i) => ({ e, i })).filter((o) => o.e.papel === 'D' || o.e.papel === 'M')
          const melhor = zag.sort((a, b) => Math.hypot(posDef[a.i].x - ult.x, posDef[a.i].y - ult.y) - Math.hypot(posDef[b.i].x - ult.x, posDef[b.i].y - ult.y))[0]
          alvo = { x: posDef[melhor.i].x, y: posDef[melhor.i].y }
          break
        }
        default:
          alvo = { x: boca.x + (def === 'A' ? -14 : 14), y: CAMPO.h / 2 + (aleat(4) > 0.5 ? 40 : -40) }
      }
      c.dur = 0.5 * devagar
      setVisual((v) => ({ ...v, bolaOverride: alvo, trilha: [...trilha, alvo], dur: c.dur }))
      await aguardar(MS_CHUTE * devagar)
      if (!ehReplay) await aguardar(MS_RESULTADO * 0.4 * devagar)
    },
    [aguardar, indiceDe, pausaSePreciso, posicoes, sim],
  )

  const tratarEvento = useCallback(
    async (ev, token) => {
      const c = ctl.current
      if (c.token !== token) return
      setRelogio({ min: ev.min, acr: ev.acr, rotulo: ev.rotulo, tempo: ev.tempo })
      if (ev.tipo === 'inicio' || ev.tipo === 'fim' || ev.tipo === 'fim_tempo_normal' || ev.tipo === 'fim_prorrogacao') {
        setVistos((v) => [...v, ev])
        return
      }
      if (ev.tipo === 'intervalo') {
        setVistos((v) => [...v, ev])
        setBanner({ tipo: 'aviso', texto: 'Intervalo', cor: 'neutro' })
        await aguardar(1100)
        setBanner(null)
        return
      }
      if (ev.tipo === 'prorrogacao') {
        setVistos((v) => [...v, ev])
        setBanner({ tipo: 'aviso', texto: 'Empate! Vai ter prorrogação', cor: 'neutro' })
        await aguardar(1500)
        setBanner(null)
        return
      }
      if (ev.tipo === 'penaltis') {
        setVistos((v) => [...v, ev])
        const cob = sim.resultado.penaltis.cobrancas
        for (let i = 0; i < cob.length; i++) {
          if (c.token !== token || c.pular) break
          await pausaSePreciso(token)
          setPenaltisVistos(cob.slice(0, i + 1))
          setBanner({
            tipo: 'aviso',
            texto: `${cob[i].jogadorNome}: ${cob[i].resultado === 'gol' ? 'gol!' : cob[i].resultado === 'defendido' ? 'defendeu!' : 'pra fora!'}  (${cob[i].parcial.A} x ${cob[i].parcial.B})`,
            cor: cob[i].resultado === 'gol' ? 'sucesso' : 'perigo',
          })
          await aguardar(1100)
        }
        setPenaltisVistos(cob)
        setBanner(null)
        return
      }

      setVistos((v) => [...v, ev])
      if (GOLS.includes(ev.tipo)) setPlacar({ ...ev.placar })

      if (TEM_LANCE.includes(ev.tipo) || ev.tipo === 'penalti' || ev.tipo === 'escanteio') {
        if (ev.tipo === 'penalti') {
          setBanner({ tipo: 'aviso', texto: MENSAGENS.penalti(ev), cor: 'alerta' })
          await aguardar(900)
          setBanner(null)
        }
        if (ev.cadeia || ev.tipo === 'escanteio') {
          const lance = ev.cadeia ? ev : { ...ev, cadeia: [ev.jogadorId], tipoJogada: 'escanteio' }
          await tocarLance(lance, token, 1)
        }
        if (c.token !== token) return
        if (GOLS.includes(ev.tipo)) {
          setBanner({ tipo: 'gol', rotulo: ev.rotulo, jogador: ev.jogadorNome, assistencia: ev.assistenciaNome, contra: ev.tipo === 'gol_contra', penalti: ev.tipo === 'gol_penalti', time: ev.time })
          await aguardar(1800)
          if (ctl.current.replay && !c.pular && c.token === token && ev.cadeia) {
            const cx = ev.time === 'A' ? CAMPO.w * 0.76 : CAMPO.w * 0.24
            setBanner({ tipo: 'replay', time: ev.time })
            setVisual((v) => ({ ...v, camera: { s: 1.7, cx, cy: CAMPO.h / 2 }, modo: 'replay', bolaOverride: null, trilha: [] }))
            await aguardar(700)
            await tocarLance(ev, token, 2.3, true)
            await aguardar(500)
            setVisual((v) => ({ ...v, camera: null, modo: 'normal', trilha: [], destaque: null, bolaOverride: null }))
          }
          setBanner(null)
          if (ev.tipo === 'gol_penalti' || ev.tipo === 'gol_contra' || ev.tipo === 'gol') {
            setVisual((v) => ({ ...v, dono: ev.time === 'A' ? 'B' : 'A', zona: 0.3, by: 0.5, portadorId: null, overrides: {}, bolaOverride: null, trilha: [] }))
          }
        } else if (MENSAGENS[ev.tipo]) {
          setBanner({ tipo: 'aviso', texto: MENSAGENS[ev.tipo](ev), cor: ev.tipo === 'gol_anulado' ? 'alerta' : 'neutro' })
          await aguardar(900)
          setBanner(null)
        }
        setVisual((v) => ({ ...v, overrides: {}, bolaOverride: null, trilha: [] }))
        return
      }

      if (MENSAGENS[ev.tipo]) {
        const cor = ev.tipo === 'vermelho' ? 'perigo' : ev.tipo === 'amarelo' ? 'amarelo' : 'neutro'
        setBanner({ tipo: 'aviso', texto: MENSAGENS[ev.tipo](ev), cor })
        await aguardar(ev.tipo === 'falta' ? 500 : 950)
        setBanner(null)
      }
    },
    [aguardar, pausaSePreciso, sim, tocarLance],
  )

  const finalizar = useCallback(() => {
    const ult = sim.eventos[sim.eventos.length - 1]
    setVistos(sim.eventos)
    setPosseVista(sim.posseMin)
    setPlacar({ A: sim.resultado.golsA, B: sim.resultado.golsB })
    setRelogio({ min: ult.min, acr: ult.acr, rotulo: ult.rotulo, tempo: ult.tempo })
    setPenaltisVistos(sim.resultado.penaltis?.cobrancas ?? [])
    setBanner(null)
    setVisual((v) => ({ ...v, camera: null, modo: 'normal', trilha: [], overrides: {}, bolaOverride: null, portadorId: null, destaque: null }))
    setEstado('fim')
  }, [sim])

  const iniciar = useCallback(async () => {
    const c = ctl.current
    if (estado === 'tocando') return
    if (estado === 'pausado') {
      c.pausado = false
      setEstado('tocando')
      return
    }
    reiniciar()
    await new Promise((r) => setTimeout(r, 0))
    c.token += 1
    const token = c.token
    c.pausado = false
    c.pular = false
    setEstado('tocando')

    const grupos = new Map()
    for (const ev of sim.eventos) {
      const k = `${ev.min}:${ev.acr}`
      if (!grupos.has(k)) grupos.set(k, [])
      grupos.get(k).push(ev)
    }
    const ordemEventos = new Set()
    const inicio = grupos.get('0:0') ?? []
    for (const ev of inicio) {
      await tratarEvento(ev, token)
      ordemEventos.add(ev.ordem)
    }
    const vistosPosse = []
    for (const m of sim.posseMin) {
      if (c.token !== token || c.pular) break
      await pausaSePreciso(token)
      vistosPosse.push(m)
      setPosseVista([...vistosPosse])
      setRelogio((r) => ({ ...r, min: m.min, acr: m.acr, rotulo: rotuloMinuto(m.min, m.acr) }))
      const lado = m.dono
      const zona = Math.max(0.12, Math.min(0.72, 0.3 + (Math.sin(m.min * 1.7 + m.acr) + 1) * 0.18))
      const by = 0.25 + ((m.min * 37) % 50) / 100
      const lista = sim.escalacoes[lado].filter((e) => e.papel !== 'G')
      const quem = lista[(m.min * 5 + m.acr) % lista.length]
      c.dur = 0.9
      setVisual((v) => ({ ...v, dono: lado, zona, by, portadorId: quem.id, trilha: [], bolaOverride: null, overrides: {}, modo: 'normal', dur: 0.9 }))
      await aguardar(MS_POR_MINUTO)
      const k = `${m.min}:${m.acr}`
      for (const ev of grupos.get(k) ?? []) {
        if (ordemEventos.has(ev.ordem)) continue
        if (c.token !== token || c.pular) break
        ordemEventos.add(ev.ordem)
        await tratarEvento(ev, token)
      }
    }
    if (c.token === token) finalizar()
  }, [estado, finalizar, pausaSePreciso, reiniciar, sim, tratarEvento])

  const pausar = useCallback(() => {
    ctl.current.pausado = true
    setEstado('pausado')
  }, [])

  const pularParaFim = useCallback(() => {
    const c = ctl.current
    c.pular = true
    c.pausado = false
    c.cancelar?.()
    setTimeout(() => finalizar(), 30)
  }, [finalizar])

  const setVelocidade = useCallback((v) => {
    ctl.current.vel = v
    setVelocidadeEstado(v)
  }, [])

  return { visual, relogio, placar, vistos, posseVista, banner, estado, velocidade, penaltisVistos, iniciar, pausar, pularParaFim, reiniciar, setVelocidade }
}
