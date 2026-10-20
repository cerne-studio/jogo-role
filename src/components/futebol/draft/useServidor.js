import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase.js'

// Relógio alinhado com o servidor. Os prazos do draft são horas do banco, então a contagem regressiva usa a
// diferença entre o relógio do celular e o do servidor (medida com um round trip, metade da ida e volta de folga),
// e não o relógio do celular direto. Reajusta a cada 30 s.
export function useRelogio() {
  const desvio = useRef(0)
  const [pronto, setPronto] = useState(false)
  useEffect(() => {
    let vivo = true
    async function sincronizar() {
      const t0 = Date.now()
      const { data } = await supabase.rpc('fd_agora')
      const t1 = Date.now()
      if (!vivo) return
      if (!data) {
        // sem sessão ainda (login anônimo em andamento): tenta de novo logo
        setTimeout(sincronizar, 700)
        return
      }
      desvio.current = Date.parse(data) - (t0 + t1) / 2
      setPronto(true)
    }
    sincronizar()
    const t = setInterval(sincronizar, 30000)
    return () => {
      vivo = false
      clearInterval(t)
    }
  }, [])
  const agora = useCallback(() => Date.now() + desvio.current, [])
  return { agora, pronto }
}

// Força um novo render a cada `ms` (pra contagens regressivas).
export function useTick(ms = 100) {
  const [, setN] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setN((n) => n + 1), ms)
    return () => clearInterval(t)
  }, [ms])
}

// Quanto passou do prazo da fase atual (ms; negativo = ainda no prazo, null = nada a resolver).
export function atrasoDaFase(est, agora, userId) {
  if (!est) return null
  if (est.fase === 'formacao') return agora - Date.parse(est.formacao_ate)
  if (est.fase === 'tatica') return agora - Date.parse(est.tatica_ate)
  if (est.fase === 'draft') {
    const feitos = new Set(est.ja_escolheu ?? [])
    const prazos = Object.entries(est.prazos ?? {}).filter(([u]) => !feitos.has(u))
    if (prazos.length === 0) return null
    return agora - (Math.min(...prazos.map(([, p]) => Date.parse(p))) + 2000)
  }
  void userId
  return null
}

// Quando o relógio de alguém estoura, qualquer jogador da sala chama fd_avancar (idempotente no servidor).
// Cada celular espera um tempinho aleatório pra não chamar todos de uma vez.
export function useAvancador(salaId, estado, agora, userId) {
  const ultima = useRef(0)
  const espera = useRef(Math.random() * 1200)
  useEffect(() => {
    if (!salaId || !estado) return
    const t = setInterval(() => {
      const atraso = atrasoDaFase(estado, agora(), userId)
      if (atraso == null || atraso < 300 + espera.current) return
      if (Date.now() - ultima.current < 2000) return
      ultima.current = Date.now()
      espera.current = Math.random() * 1200
      supabase.rpc('fd_avancar', { p_sala_id: salaId }).then(({ error }) => {
        if (error) console.warn('fd_avancar:', error.message)
      })
    }, 500)
    return () => clearInterval(t)
  }, [salaId, estado, agora, userId])
}

// Times de todos os humanos (picks completos). Recarrega quando `chave` muda (nova escolha, nova rodada).
export function useTimes(salaId, chave) {
  const [times, setTimes] = useState([])
  useEffect(() => {
    if (!salaId) return
    let vivo = true
    supabase.rpc('fd_times', { p_sala_id: salaId }).then(({ data }) => {
      if (vivo && data) setTimes(data)
    })
    return () => {
      vivo = false
    }
  }, [salaId, chave])
  return times
}
