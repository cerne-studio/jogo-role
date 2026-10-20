import { Check, Clock } from 'lucide-react'
import ExitButton from '../../core/ExitButton.jsx'
import MiniCampo from './MiniCampo.jsx'
import { Nota, TOTAL_RODADAS, posPrincipal } from './draftUtils.jsx'

// Depois de escolher (ou do jogo escolher por você): espera os outros fecharem a rodada.
export default function DraftEspera({ userId, est, jogadores, meuTime, onExit }) {
  const feitos = new Set(est.ja_escolheu ?? [])
  const ultima = meuTime?.picks?.find((p) => p.rodada === est.rodada)
  const auto = !!ultima?.auto
  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1">
        <div className="flex flex-col items-center text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${auto ? 'bg-accent-glow text-accent' : 'bg-success/20 text-success'}`}>
            {auto ? <Clock className="h-8 w-8" /> : <Check className="h-8 w-8" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{auto ? 'Tempo! O jogo escolheu por você' : 'Escolha confirmada'}</h1>
          <p className="mt-1 text-sm text-secondary">
            {feitos.size < jogadores.length ? `Aguardando os outros (${feitos.size}/${jogadores.length})` : 'Abrindo a próxima rodada...'}
          </p>
        </div>

        {ultima && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent-glow px-4 py-3">
            <Nota valor={ultima.overall} tam="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{ultima.nome}</p>
              <p className="truncate text-xs text-secondary">{posPrincipal(ultima.posicoes)} · {ultima.clube}</p>
            </div>
            <span className="text-xs font-semibold text-muted">{est.rodada}/{TOTAL_RODADAS}</span>
          </div>
        )}

        <ul className="mt-5 flex flex-col gap-2">
          {jogadores.map((j) => (
            <li key={j.user_id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <span className="text-sm font-medium">{j.nome}{j.user_id === userId ? ' (você)' : ''}</span>
              {feitos.has(j.user_id) ? <Check className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-muted" />}
            </li>
          ))}
        </ul>

        {meuTime && (
          <div className="mt-5">
            <MiniCampo formacao={meuTime.formacao} picks={meuTime.picks} />
          </div>
        )}
      </div>
    </div>
  )
}
