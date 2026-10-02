import { useState } from 'react'
import { motion } from 'motion/react'
import { ClipboardList, BedDouble, Check } from 'lucide-react'
import { NOMES_ATRIBUTO_TREINO } from '../../nba/engine/treino.js'
import { BotaoPrimario, Titulo } from './ui.jsx'

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)
const espaco = (folga) => (folga >= 12 ? 'muito espaço pra crescer' : folga >= 5 ? 'espaço pra crescer' : folga >= 1 ? 'perto do teto' : 'no teto')
const COR_CONF = { alta: 'text-emerald-300 border-emerald-400/30', media: 'text-accent border-accent/30', baixa: 'text-red-300 border-red-400/30' }
const TXT_CONF = { alta: 'Técnico confia em você', media: 'Técnico neutro', baixa: 'Técnico desconfia' }

export function TreinoTela({ estado, rec, onConfirmar }) {
  const [escolha, setEscolha] = useState(null)
  const nome = rec.recomendado === 'descanso' ? 'descansar' : NOMES_ATRIBUTO_TREINO[rec.recomendado]
  const seguiu = escolha && escolha === rec.recomendado

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-5 pb-6 pt-14 lg:max-w-2xl">
      <Titulo pequeno={`Temporada ${estado.temporada} · ${estado.ano}`} sub="O que você vai treinar neste ano? O ganho vem na virada da temporada.">Treino da temporada</Titulo>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-border-strong bg-surface p-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-accent" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">O técnico recomenda</p>
          <span className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold ${COR_CONF[rec.confianca]}`}>{TXT_CONF[rec.confianca]}</span>
        </div>
        <p className="mt-2 text-[17px] font-semibold leading-snug">{cap(nome)}</p>
        <p className="mt-1 text-sm leading-snug text-secondary">{rec.motivo}</p>
      </motion.div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {rec.opcoes.map((o) => {
          const sel = escolha === o.id
          const recomendado = rec.recomendado === o.id
          return (
            <motion.button
              key={o.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEscolha(o.id)}
              className={`rounded-2xl border p-3.5 text-left transition-colors ${sel ? 'border-accent bg-accent-glow' : 'border-border bg-surface'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{cap(NOMES_ATRIBUTO_TREINO[o.id])}</span>
                {recomendado && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-black">Técnico</span>}
                <span className="ml-auto text-sm font-bold tabular-nums">{o.atual}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-accent" style={{ width: `${o.atual}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-secondary">Pra sua posição: <b className="text-primary">{o.importancia}</b> · {espaco(o.folga)}</p>
            </motion.button>
          )
        })}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setEscolha('descanso')}
          className={`rounded-2xl border p-3.5 text-left transition-colors sm:col-span-2 ${escolha === 'descanso' ? 'border-accent bg-accent-glow' : 'border-border bg-surface'}`}
        >
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">Descanso e recuperação</span>
            {rec.recomendado === 'descanso' && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-black">Técnico</span>}
            <span className="ml-auto text-[11px] text-secondary">Desgaste {Math.round(estado.desgaste)}</span>
          </div>
          <p className="mt-1.5 text-[11px] text-secondary">Desgaste −10 e moral +3. Nenhum atributo ganha foco.</p>
        </motion.button>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        Treinar um atributo dá +1 no fim da temporada (+2 se você seguir o técnico e ele confiar em você) e custa um pouco de desgaste. Seguir a recomendação aumenta a confiança dele; ignorar um bom conselho gasta a paciência.
      </p>

      <div className="flex-1" />
      <div className="pt-5">
        <BotaoPrimario disabled={!escolha} onClick={() => onConfirmar(escolha)}>
          <span className="inline-flex items-center justify-center gap-2">
            {escolha ? <Check className="h-4 w-4" /> : null}
            {escolha ? (seguiu ? 'Confirmar (como o técnico pediu)' : 'Confirmar treino') : 'Escolha um treino'}
          </span>
        </BotaoPrimario>
      </div>
    </div>
  )
}
