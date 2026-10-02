import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { POSICOES } from '../../nba/data/times.js'
import { calcularHabilidades, deltasHabilidades, destaques, GRUPOS_HABILIDADE, NOMES_HABILIDADE, notaLetra } from '../../nba/engine/habilidades.js'

const corNota = (v) => (v >= 80 ? 'bg-emerald-400' : v >= 65 ? 'bg-accent' : v >= 50 ? 'bg-zinc-400' : 'bg-red-400')
const textoNota = (v) => (v >= 80 ? 'text-emerald-300' : v >= 65 ? 'text-accent' : v >= 50 ? 'text-zinc-300' : 'text-red-300')

function Linha({ rotulo, valor, delta }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[132px] shrink-0 text-xs text-secondary">{rotulo}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <motion.div initial={{ width: 0 }} animate={{ width: `${valor}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} className={`h-full rounded-full ${corNota(valor)}`} />
      </div>
      <span className={`w-6 text-right text-xs font-bold tabular-nums ${textoNota(valor)}`}>{valor}</span>
      <span className={`w-6 text-left text-[10px] font-semibold tabular-nums ${delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-red-300' : 'text-transparent'}`}>
        {delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : '0'}
      </span>
    </div>
  )
}

const tetoTexto = (p) => (p >= 90 ? 'Lendário' : p >= 85 ? 'Altíssimo' : p >= 75 ? 'Alto' : p >= 68 ? 'Razoável' : 'Baixo')

export function HabilidadesFolha({ estado, onFechar }) {
  const hab = calcularHabilidades(estado.atrs, estado.jogador)
  const delta = deltasHabilidades(estado.atrs, estado.atrsAnterior, estado.jogador)
  const { melhores, piores } = destaques(hab)
  const pos = POSICOES.find((p) => p.id === estado.jogador.posicao)
  const dQi = estado.atrsAnterior ? estado.atrs.qi - estado.atrsAnterior.qi : 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-[#0a0a0b]">
      <div className="mx-auto w-full max-w-sm px-5 pb-10 pt-5">
        <div className="flex items-start gap-4">
          <div className="flex h-[76px] w-[76px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-accent bg-accent-glow">
            <span className="text-3xl font-extrabold leading-none tabular-nums">{estado.media}</span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-secondary">OVR</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-bold tracking-tight">{estado.jogador.sobrenome}</p>
            <p className="mt-0.5 text-xs text-secondary">#{estado.jogador.numero} · {pos?.nome} · {estado.jogador.altura} cm · {estado.idade} anos</p>
            <p className="mt-1 text-xs text-muted">Teto de evolução: <b className="text-primary">{tetoTexto(estado.potencial)}</b></p>
          </div>
          <button onClick={onFechar} aria-label="Fechar habilidades" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface text-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Pontos fortes</p>
            <ul className="mt-1.5 flex flex-col gap-0.5 text-xs">
              {melhores.map(([k, v]) => <li key={k} className="flex justify-between"><span>{NOMES_HABILIDADE[k]}</span><b className="tabular-nums">{v}</b></li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-red-400/25 bg-red-400/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-300">A melhorar</p>
            <ul className="mt-1.5 flex flex-col gap-0.5 text-xs">
              {piores.map(([k, v]) => <li key={k} className="flex justify-between"><span>{NOMES_HABILIDADE[k]}</span><b className="tabular-nums">{v}</b></li>)}
            </ul>
          </div>
        </div>

        {GRUPOS_HABILIDADE.map((g) => {
          const media = Math.round(g.itens.reduce((t, k) => t + hab[k], 0) / g.itens.length)
          return (
            <div key={g.id} className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{g.rotulo}</p>
                <span className={`rounded-md border border-border-strong px-1.5 py-0.5 text-[11px] font-extrabold ${textoNota(media)}`}>{notaLetra(media)}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {g.itens.map((k) => <Linha key={k} rotulo={NOMES_HABILIDADE[k]} valor={hab[k]} delta={delta[k] ?? 0} />)}
              </div>
            </div>
          )
        })}

        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted">Mental</p>
          <Linha rotulo="QI de jogo" valor={estado.atrs.qi} delta={dQi} />
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted">
          As setinhas mostram a mudança em relação à temporada passada. Posição e altura puxam cada habilidade pra cima ou pra baixo: guarda não pega rebote como pivô, e pivô não dribla como armador.
        </p>
      </div>
    </motion.div>
  )
}
