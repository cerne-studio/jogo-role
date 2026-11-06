import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

// Relógio da partida alinhado com o do servidor (o do celular pode estar adiantado ou atrasado) e
// disparo de avancar_respostas quando o prazo da fase vence. Qualquer celular dispara; o servidor
// é idempotente, então vários ao mesmo tempo não atrapalham. Repete a cada 2 s até a fase mudar.
export default function useRespostasRelogio(salaId, estado) {
  const offset = useRef(0)
  const [restante, setRestante] = useState(null)

  useEffect(() => {
    let cancelado = false
    const t0 = Date.now()
    supabase.rpc('respostas_agora').then(({ data }) => {
      if (cancelado || !data) return
      // metade da ida e volta como estimativa da latência
      offset.current = new Date(data).getTime() - (Date.now() + t0) / 2
    })
    return () => {
      cancelado = true
    }
  }, [salaId])

  const fim = estado?.fim ? new Date(estado.fim).getTime() : null
  const fase = estado?.fase
  const n = estado?.n
  const nReveladas = estado?.reveladas ? Object.keys(estado.reveladas).length : 0

  useEffect(() => {
    if (!fim || fase === 'final') {
      setRestante(null)
      return
    }
    let ultimoAvanco = 0
    const tick = () => {
      const r = Math.max(0, Math.ceil((fim - (Date.now() + offset.current)) / 1000))
      setRestante(r)
      if (r === 0 && Date.now() - ultimoAvanco > 2000) {
        ultimoAvanco = Date.now()
        // o builder do supabase-js só dispara a requisição com .then()
        supabase.rpc('avancar_respostas', { p_sala_id: salaId }).then(() => {})
      }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [fim, fase, n, nReveladas, salaId])

  return restante
}
