import { Check, Clock } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { BotaoPular, Cabecalho, Placar, PretaCard } from './pdfUtils.jsx'

// Quem já jogou (ou o juiz) espera os outros na fase "jogando".
export default function PdfEspera({ salaId, userId, sala, jogadores, juizNome, souJuiz, souHost, onExit }) {
  const est = sala.estado
  const jaJogaram = new Set(est.ja_jogaram ?? [])
  const faltam = est.total_a_jogar - est.jogadas_feitas

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 py-6">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1">
        <Cabecalho rodada={est.rodada} juizNome={juizNome} souJuiz={souJuiz} />
        <div className="mt-3">
          <Placar jogadores={jogadores} pontuacoes={est.pontuacoes} meta={est.meta} userId={userId} juizId={est.juiz_id} />
        </div>
        <div className="mt-5">
          <PretaCard preta={est.preta} />
        </div>

        <p className="mt-6 text-sm text-secondary">
          {souJuiz
            ? 'Você é o juiz. Espera todo mundo responder.'
            : 'Resposta enviada. Espera o resto do pessoal.'}{' '}
          {faltam > 0 ? `Faltam ${faltam}.` : ''}
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {jogadores
            .filter((j) => j.user_id !== est.juiz_id)
            .map((j) => (
              <li
                key={j.user_id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <span className="text-sm font-medium">{j.nome}</span>
                {jaJogaram.has(j.user_id) ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Clock className="h-4 w-4 text-muted" />
                )}
              </li>
            ))}
        </ul>

        <BotaoPular salaId={salaId} souHost={souHost} desde={est.fase_desde} limite={45} />
      </div>
    </div>
  )
}
