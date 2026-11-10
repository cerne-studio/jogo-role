import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, Trash2, Undo2 } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'

// Quadro de desenho compartilhado. O desenhista (responsável) manda lotes de operações pro servidor
// (hint_desenhar) e todo mundo da sala lê a mesma lista em ordem (tabela hint_tracos): o realtime só avisa
// "tem novidade" e a busca incremental (id > último) traz os dados, com repetição a cada 1,5 s como rede de
// segurança. Se o celular recarregar, o quadro é reconstruído do zero a partir do servidor.
// Coordenadas normalizadas 0..1, então funciona igual em qualquer tamanho de tela.

export const CORES = ['#111111', '#e5322d', '#2f6fed', '#1f9d55', '#f2b705', '#8a4fff']
const ESPESSURAS = [3, 7, 14]
const BASE = 360

// ops: {t:'s', id, c, w, e, p:[[x,y]...]} traço (ou continuação do traço de mesmo id) · {t:'u'} desfazer · {t:'c'} limpar
export function aplicarOps(lista, ops) {
  let out = lista
  for (const op of ops) {
    if (op.t === 's') {
      const ult = out[out.length - 1]
      if (ult && ult.id === op.id) out = [...out.slice(0, -1), { ...ult, p: [...ult.p, ...op.p] }]
      else out = [...out, { id: op.id, c: op.c, w: op.w, e: !!op.e, p: op.p }]
    } else if (op.t === 'u') out = out.slice(0, -1)
    else if (op.t === 'c') out = []
  }
  return out
}

function pintar(canvas, lista) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const k = w / BASE
  for (const s of lista) {
    const cor = s.e ? '#ffffff' : (CORES[s.c] ?? '#111111')
    ctx.strokeStyle = cor
    ctx.fillStyle = cor
    ctx.lineWidth = s.w * k
    if (s.p.length === 1) {
      ctx.beginPath()
      ctx.arc(s.p[0][0] * w, s.p[0][1] * h, (s.w * k) / 2, 0, Math.PI * 2)
      ctx.fill()
      continue
    }
    ctx.beginPath()
    ctx.moveTo(s.p[0][0] * w, s.p[0][1] * h)
    for (let i = 1; i < s.p.length; i++) ctx.lineTo(s.p[i][0] * w, s.p[i][1] * h)
    ctx.stroke()
  }
}

export default function HintQuadro({ salaId, turno, userId, podeDesenhar, ativo }) {
  const canvasRef = useRef(null)
  const caixaRef = useRef(null)
  const [lista, setLista] = useState([])
  const listaRef = useRef([])
  const ultimoId = useRef(0)
  const [pronto, setPronto] = useState(false)

  const [cor, setCor] = useState(0)
  const [esp, setEsp] = useState(1)
  const [borracha, setBorracha] = useState(false)

  const fila = useRef([]) // ops locais ainda não enviadas
  const enviando = useRef(false)
  const traco = useRef(null) // traço em andamento
  const [erroEnvio, setErroEnvio] = useState('')

  const mudar = useCallback((nova) => {
    listaRef.current = nova
    setLista(nova)
  }, [])

  // reconstrói do servidor (primeira carga, troca de turno, recarregar a página)
  useEffect(() => {
    let cancelado = false
    ultimoId.current = 0
    mudar([])
    setPronto(false)
    ;(async () => {
      const { data } = await supabase.from('hint_tracos').select('id,ops').eq('sala_id', salaId).eq('turno', turno).order('id')
      if (cancelado) return
      let l = []
      for (const r of data ?? []) {
        l = aplicarOps(l, r.ops)
        ultimoId.current = r.id
      }
      mudar(l)
      setPronto(true)
    })()
    return () => {
      cancelado = true
    }
  }, [salaId, turno, mudar])

  // quem só assiste: realtime avisa, busca incremental traz, polling garante
  useEffect(() => {
    if (podeDesenhar || !pronto) return
    let cancelado = false
    let ocupado = false
    async function buscar() {
      if (ocupado) return
      ocupado = true
      const { data } = await supabase
        .from('hint_tracos')
        .select('id,ops')
        .eq('sala_id', salaId)
        .eq('turno', turno)
        .gt('id', ultimoId.current)
        .order('id')
      ocupado = false
      if (cancelado || !data?.length) return
      let l = listaRef.current
      for (const r of data) {
        if (r.id <= ultimoId.current) continue
        l = aplicarOps(l, r.ops)
        ultimoId.current = r.id
      }
      mudar(l)
    }
    const canal = supabase
      .channel(`tracos:${salaId}:${turno}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hint_tracos', filter: `sala_id=eq.${salaId}` }, () => buscar())
      .subscribe()
    const id = setInterval(buscar, 1500)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') buscar()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      cancelado = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', aoVoltar)
      supabase.removeChannel(canal)
    }
  }, [salaId, turno, podeDesenhar, pronto, mudar])

  // redesenha quando a lista ou o tamanho mudam
  useEffect(() => {
    const canvas = canvasRef.current
    const caixa = caixaRef.current
    if (!canvas || !caixa) return
    const ajustar = () => {
      const lado = Math.max(120, Math.round(caixa.clientWidth * (window.devicePixelRatio || 1)))
      if (canvas.width !== lado) {
        canvas.width = lado
        canvas.height = lado
      }
      pintar(canvas, listaRef.current)
    }
    ajustar()
    const ro = new ResizeObserver(ajustar)
    ro.observe(caixa)
    return () => ro.disconnect()
  }, [lista])

  // ---------- envio (só o desenhista) ----------
  const enviar = useCallback(async () => {
    if (enviando.current) return
    enviando.current = true
    try {
      while (fila.current.length) {
        const lote = fila.current.slice(0, 40)
        const { error } = await supabase.rpc('hint_desenhar', { p_sala_id: salaId, p_ops: lote })
        if (error) {
          // sem rede: tenta de novo no próximo ciclo; erro de regra (rodada acabou): descarta
          if (/tempo|fechado|responsavel|desenhar/i.test(error.message)) {
            fila.current = []
            setErroEnvio('')
          } else {
            setErroEnvio('Sem conexão, reenviando...')
          }
          break
        }
        fila.current = fila.current.slice(lote.length)
        setErroEnvio('')
      }
    } finally {
      enviando.current = false
    }
  }, [salaId])

  useEffect(() => {
    if (!podeDesenhar) return
    const id = setInterval(() => {
      if (traco.current && traco.current.pendentes.length) {
        fila.current.push({ t: 's', id: traco.current.id, c: traco.current.c, w: traco.current.w, e: traco.current.e, p: traco.current.pendentes.splice(0) })
      }
      enviar()
    }, 150)
    return () => clearInterval(id)
  }, [podeDesenhar, enviar])

  function ponto(ev) {
    const r = canvasRef.current.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width))
    const y = Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height))
    return [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]
  }

  function descer(ev) {
    if (!podeDesenhar || !ativo || !pronto) return
    ev.currentTarget.setPointerCapture?.(ev.pointerId)
    const p = ponto(ev)
    const id = `${userId.slice(0, 4)}${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
    traco.current = { id, c: cor, w: ESPESSURAS[esp], e: borracha, pendentes: [p] }
    mudar(aplicarOps(listaRef.current, [{ t: 's', id, c: cor, w: ESPESSURAS[esp], e: borracha, p: [p] }]))
  }

  function mover(ev) {
    const t = traco.current
    if (!t) return
    const p = ponto(ev)
    t.pendentes.push(p)
    mudar(aplicarOps(listaRef.current, [{ t: 's', id: t.id, c: t.c, w: t.w, e: t.e, p: [p] }]))
    if (t.pendentes.length >= 100) {
      fila.current.push({ t: 's', id: t.id, c: t.c, w: t.w, e: t.e, p: t.pendentes.splice(0) })
    }
  }

  function subir() {
    const t = traco.current
    if (!t) return
    if (t.pendentes.length) fila.current.push({ t: 's', id: t.id, c: t.c, w: t.w, e: t.e, p: t.pendentes.splice(0) })
    traco.current = null
    enviar()
  }

  function desfazer() {
    if (!ativo || !listaRef.current.length) return
    mudar(aplicarOps(listaRef.current, [{ t: 'u' }]))
    fila.current.push({ t: 'u' })
    enviar()
  }

  function limpar() {
    if (!ativo || !listaRef.current.length) return
    mudar([])
    fila.current.push({ t: 'c' })
    enviar()
  }

  const editavel = podeDesenhar && ativo

  return (
    <div className="w-full">
      <div ref={caixaRef} className="relative w-full overflow-hidden rounded-2xl border border-border-strong bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={descer}
          onPointerMove={mover}
          onPointerUp={subir}
          onPointerCancel={subir}
          className="block aspect-square w-full"
          style={{ touchAction: 'none', cursor: editavel ? 'crosshair' : 'default' }}
          aria-label="Quadro de desenho"
        />
        {!pronto && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs text-neutral-500">Carregando o quadro...</div>
        )}
        {pronto && !lista.length && !editavel && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-neutral-400">
            {podeDesenhar ? 'Quadro vazio' : 'Esperando o desenho...'}
          </div>
        )}
      </div>

      {editavel && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {CORES.map((c, i) => (
                <button
                  key={c}
                  aria-label={`Cor ${i + 1}`}
                  onClick={() => {
                    setCor(i)
                    setBorracha(false)
                  }}
                  className="h-8 w-8 rounded-full border-2"
                  style={{ background: c, borderColor: !borracha && cor === i ? '#ffba38' : 'transparent', boxShadow: '0 0 0 1px rgba(255,255,255,.25)' }}
                />
              ))}
            </div>
            <button
              aria-label="Borracha"
              onClick={() => setBorracha((b) => !b)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${borracha ? 'border-accent bg-accent-glow text-accent' : 'border-border bg-surface text-secondary'}`}
            >
              <Eraser className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {ESPESSURAS.map((w, i) => (
                <button
                  key={w}
                  aria-label={`Espessura ${i + 1}`}
                  onClick={() => setEsp(i)}
                  className={`flex h-9 w-12 items-center justify-center rounded-xl border ${esp === i ? 'border-accent bg-accent-glow' : 'border-border bg-surface'}`}
                >
                  <span className="rounded-full bg-primary" style={{ width: 6 + i * 5, height: 6 + i * 5 }} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Desfazer" onClick={desfazer} className="flex h-9 w-12 items-center justify-center rounded-xl border border-border bg-surface text-secondary">
                <Undo2 className="h-4 w-4" />
              </button>
              <button aria-label="Limpar tudo" onClick={limpar} className="flex h-9 w-12 items-center justify-center rounded-xl border border-border bg-surface text-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {erroEnvio && <p className="text-xs text-danger">{erroEnvio}</p>}
        </div>
      )}
    </div>
  )
}
