import { useEffect, useRef, useState } from 'react'
import { Hand, Mic, Music, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'

export const MODS = {
  falar: { nome: 'Falar', icon: Mic, cor: '#ffba38', regra: 'Pode falar à vontade, menos as respostas e a proibida.' },
  desenhar: { nome: 'Desenhar', icon: Pencil, cor: '#38d0ff', regra: 'Só desenho. Sem letras, sem números e sem falar.' },
  mimica: { nome: 'Mímica', icon: Hand, cor: '#ff7ad9', regra: 'Só gestos. Sem falar, sem apontar pra coisas.' },
  cantarolar: { nome: 'Cantarolar', icon: Music, cor: '#7cf29a', regra: 'Só a melodia. Sem letra e sem falar.' },
}

export const EQUIPES = {
  azul: { nome: 'Azul', cor: '#4f8bff' },
  vermelha: { nome: 'Vermelha', cor: '#ff5a5f' },
}

export const outraEquipe = (eq) => (eq === 'azul' ? 'vermelha' : 'azul')

export function equipeDe(est, userId) {
  if (est?.equipes?.azul?.includes(userId)) return 'azul'
  if (est?.equipes?.vermelha?.includes(userId)) return 'vermelha'
  return null
}

export const nomeDe = (jogadores, id) => jogadores.find((j) => j.user_id === id)?.nome ?? '...'

// Relógio alinhado com o do servidor + disparo de hint_avancar quando o prazo da fase vence.
// Qualquer celular dispara; o servidor é idempotente. Repete a cada 2 s até a fase mudar.
export function useHintRelogio(salaId, estado, ativo = true) {
  const offset = useRef(0)
  const [restante, setRestante] = useState(null)

  useEffect(() => {
    let cancelado = false
    const t0 = Date.now()
    supabase.rpc('respostas_agora').then(({ data }) => {
      if (cancelado || !data) return
      offset.current = new Date(data).getTime() - (Date.now() + t0) / 2
    })
    return () => {
      cancelado = true
    }
  }, [salaId])

  const fim = estado?.fim ? new Date(estado.fim).getTime() : null
  const fase = estado?.fase
  const turno = estado?.turno

  useEffect(() => {
    if (!ativo || !fim || fase === 'fim') {
      setRestante(null)
      return
    }
    let ultimo = 0
    const tick = () => {
      const r = Math.max(0, Math.ceil((fim - (Date.now() + offset.current)) / 1000))
      setRestante(r)
      if (r === 0 && Date.now() - ultimo > 2000) {
        ultimo = Date.now()
        // o builder do supabase-js só dispara a requisição com .then()
        supabase.rpc('hint_avancar', { p_sala_id: salaId }).then(() => {})
      }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [fim, fase, turno, salaId, ativo])

  return { restante, offset }
}

// Batimento a cada 15 s: é por ele que os outros sabem se o host ainda está na sala.
export function usePresenca(salaId) {
  useEffect(() => {
    if (!salaId) return
    const ping = () => supabase.rpc('hint_ping', { p_sala_id: salaId }).then(() => {})
    ping()
    const id = setInterval(ping, 15000)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [salaId])
}

// true quando o host está sem batimento há mais de 45 s (aí qualquer jogador pode assumir).
export function useHostAusente(salaId, hostId, souHost, offset) {
  const [ausente, setAusente] = useState(false)
  useEffect(() => {
    if (!salaId || !hostId || souHost) {
      setAusente(false)
      return
    }
    let cancelado = false
    const checar = async () => {
      const { data } = await supabase.from('hint_presenca').select('visto').eq('sala_id', salaId).eq('user_id', hostId).maybeSingle()
      if (cancelado) return
      const agora = Date.now() + (offset?.current ?? 0)
      setAusente(!!data && agora - new Date(data.visto).getTime() > 45000)
    }
    checar()
    const id = setInterval(checar, 10000)
    return () => {
      cancelado = true
      clearInterval(id)
    }
  }, [salaId, hostId, souHost, offset])
  return ausente
}

// A carta completa do responsável (a única cópia que sai do servidor). Só ele consegue ler esta linha.
export function useCartaPrivada(ativo, turno, fase) {
  const [carta, setCarta] = useState(null)
  const [acertos, setAcertos] = useState([])
  const [proibidaDita, setProibidaDita] = useState(false)

  async function recarregar() {
    const { data } = await supabase.from('hint_privado').select('turno,carta,acertos,proibida_dita').maybeSingle()
    if (data && data.turno === turno) {
      setCarta(data.carta)
      setAcertos(data.acertos ?? [])
      setProibidaDita(!!data.proibida_dita)
    } else {
      setCarta(null)
      setAcertos([])
      setProibidaDita(false)
    }
  }

  useEffect(() => {
    if (!ativo) {
      setCarta(null)
      return
    }
    recarregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, turno, fase])

  return { carta, acertos, setAcertos, proibidaDita, setProibidaDita, recarregar }
}
