import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { POSICOES, PAISES, LIGAS_LISTA, SOBRENOMES } from '../../data/carreiraBank.js'

// ─── helpers ──────────────────────────────────────────────────
function Chip({ label, selected, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
        selected
          ? 'border-accent bg-accent text-black'
          : 'border-border bg-surface text-secondary'
      }`}
    >
      {label}
    </motion.button>
  )
}

export default function CarreiraSetup({ onStart, onBack }) {
  const [step, setStep] = useState(0) // 0 nome/nº, 1 posição, 2 país, 3 liga
  const [sobrenome, setSobrenome] = useState('')
  const [numero, setNumero] = useState('')
  const [posicao, setPosicao] = useState(null)
  const [pais, setPais] = useState(null)
  const [liga, setLiga] = useState(null)

  function nomeSorteado() {
    setSobrenome(SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)])
    setNumero(String(Math.floor(Math.random() * 34) + 1))
  }

  function canNext() {
    if (step === 0) return sobrenome.trim().length > 0 && numero.trim().length > 0
    if (step === 1) return posicao !== null
    if (step === 2) return pais !== null
    return liga !== null
  }

  function handleNext() {
    if (step < 3) { setStep((s) => s + 1); return }
    onStart({ sobrenome: sobrenome.trim(), numero: numero.trim(), posicao, pais, liga })
  }

  const paisSelecionado = PAISES.find((p) => p.id === pais)
  const ligasDisponiveis = paisSelecionado
    ? LIGAS_LISTA.filter(
        (l) => l.id === paisSelecionado.liga || l.prestígio >= 64
      ).slice(0, 8)
    : LIGAS_LISTA

  const steps = ['Identidade', 'Posição', 'País', 'Liga']

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-10">
      {/* back */}
      <button
        onClick={step === 0 ? onBack : () => setStep((s) => s - 1)}
        className="flex items-center gap-1.5 text-xs text-secondary"
      >
        <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Voltar' : steps[step - 1]}
      </button>

      {/* progress dots */}
      <div className="mt-6 flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-accent' : 'bg-border'
            }`}
          />
        ))}
      </div>

      <div className="mt-8 flex-1">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-muted">Passo 1</p>
              <h2 className="mt-1 text-2xl font-bold">Como te chamam?</h2>
              <p className="mt-2 text-sm text-secondary">
                Nome que vai aparecer nas manchetes e no placar.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <div>
                  <label className="mb-1.5 block text-xs text-secondary">Sobrenome</label>
                  <input
                    type="text"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    maxLength={20}
                    placeholder="Ex: Almeida"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-secondary">Número da camisa</label>
                  <input
                    type="number"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    min={1}
                    max={99}
                    placeholder="Ex: 23"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-primary outline-none focus:border-accent"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={nomeSorteado}
                  className="text-xs text-secondary underline underline-offset-2"
                >
                  Sortear nome e número
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-muted">Passo 2</p>
              <h2 className="mt-1 text-2xl font-bold">Qual sua posição?</h2>
              <p className="mt-2 text-sm text-secondary">
                Define o estilo de jogo e os atributos que importam mais.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                {POSICOES.map((p) => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPosicao(p.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors ${
                      posicao === p.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{p.nome}</p>
                      <p className="mt-0.5 text-xs text-secondary">
                        {p.alturaMin}–{p.alturaMax} cm · {p.sigla}
                      </p>
                    </div>
                    {posicao === p.id && (
                      <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-muted">Passo 3</p>
              <h2 className="mt-1 text-2xl font-bold">De onde você é?</h2>
              <p className="mt-2 text-sm text-secondary">
                Define sua seleção nacional.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                {PAISES.map((p) => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setPais(p.id); setLiga(null) }}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors ${
                      pais === p.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <span className="text-lg">{p.bandeira}</span>
                    <span className="text-xs font-medium leading-tight">{p.nome}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-muted">Passo 4</p>
              <h2 className="mt-1 text-2xl font-bold">Qual liga começa?</h2>
              <p className="mt-2 text-sm text-secondary">
                Você pode se transferir depois. Difícil não é ruim.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                {LIGAS_LISTA.map((l) => (
                  <motion.button
                    key={l.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLiga(l.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                      liga === l.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{l.nome}</p>
                      <p className="mt-0.5 text-xs text-secondary">{l.pais}</p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div
                        className="h-1.5 w-12 rounded-full bg-border overflow-hidden"
                        title={`Prestígio ${l.prestigio}`}
                      >
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${l.prestigio}%` }}
                        />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="pt-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={!canNext()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
        >
          {step === 3 ? 'Começar carreira' : 'Continuar'}
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  )
}
