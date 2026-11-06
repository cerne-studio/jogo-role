import { motion } from 'motion/react'
import { Check, X } from 'lucide-react'
import Confete from '../core/Confete.jsx'

// Fim da pergunta: todo mundo vê o mesmo resultado, a pergunta inteira e as respostas erradas (que ficavam secretas).
export default function RespostasResultado({ est, nomes, userId, restante }) {
  const r = est.resultado
  const acertou = r.tipo === 'acertou'
  const nome = acertou ? (r.uid === userId ? 'Você' : nomes[r.uid]) : null

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-4">
      {acertou && r.uid === userId && <Confete quantidade={30} />}
      <div
        className={`rounded-2xl border px-5 py-5 text-center ${
          acertou ? 'border-success/40 bg-success/10' : 'border-border-strong bg-surface'
        }`}
      >
        {acertou ? (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-success">Resposta correta!</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">{nome} acertou!</h2>
            <motion.p
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.15 }}
              className="mt-2 text-4xl font-black text-accent"
            >
              +{r.pontos} {r.pontos === 1 ? 'ponto' : 'pontos'}
            </motion.p>
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Ninguém acertou</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">Ninguém pontuou!</h2>
          </>
        )}
        <p className="mt-3 text-xs uppercase tracking-widest text-muted">Resposta</p>
        <p className="text-xl font-bold">{r.resposta}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">A pergunta era</p>
        <p className="mt-1.5 text-[15px] leading-snug">{r.pergunta}</p>
      </div>

      {r.tentativas?.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Tentativas</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {r.tentativas.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-secondary">
                <X className="h-3.5 w-3.5 shrink-0 text-danger" />
                <span>
                  <b className="text-primary">{t.uid === userId ? 'Você' : nomes[t.uid]}</b>:{' '}
                  {t.texto ? `"${t.texto}"` : 'ficou sem tempo'}
                  <span className="text-muted"> · com {t.palavras} {t.palavras === 1 ? 'palavra' : 'palavras'}</span>
                </span>
              </li>
            ))}
            {acertou && (
              <li className="flex items-center gap-2 text-success">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <b>{nome}</b> acertou com {Object.keys(est.reveladas).length} {Object.keys(est.reveladas).length === 1 ? 'palavra' : 'palavras'}
              </li>
            )}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-muted">
        {est.n < est.total ? `Próxima pergunta em ${restante ?? '--'}s` : `Resultado final em ${restante ?? '--'}s`}
      </p>
    </motion.div>
  )
}
