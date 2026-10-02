import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, GraduationCap, Globe2, Flame, Dices } from 'lucide-react'
import { POSICOES, PAISES, SOBRENOMES } from '../../nba/data/times.js'
import { BotaoPrimario } from './ui.jsx'

const CAMINHOS = [
  {
    id: 'college',
    nome: 'College (NCAA)',
    icon: GraduationCap,
    desc: 'Jogue de 1 a 4 anos na faculdade, brigue pelo March Madness e decida a hora de entrar no draft.',
    dica: 'Equilibrado',
  },
  {
    id: 'internacional',
    nome: 'Clube no exterior',
    icon: Globe2,
    desc: 'Comece num clube profissional (Europa ou Brasil). Mais maturidade, menos holofote antes do draft.',
    dica: 'Mais maduro',
  },
  {
    id: 'sem_recrutamento',
    nome: 'Sem recrutamento',
    icon: Flame,
    desc: 'Ninguém te viu. Contrato de duas vias, G League e a vaga que você precisa arrancar na unha.',
    dica: 'Modo difícil',
  },
]

// Windows não desenha bandeira em emoji (vira "BR"); aqui a gente usa a imagem da bandeira e cai pro código se falhar.
function Bandeira({ emoji }) {
  const [falhou, setFalhou] = useState(false)
  const iso = [...emoji].map((c) => String.fromCharCode(c.codePointAt(0) - 0x1f1e6 + 97)).join('')
  if (falhou) return <span className="text-sm font-bold">{iso.toUpperCase()}</span>
  return <img src={`https://flagcdn.com/w40/${iso}.png`} alt={iso.toUpperCase()} width={28} height={20} loading="lazy" onError={() => setFalhou(true)} className="h-5 w-7 rounded-sm object-cover" />
}

function Cartao({ selecionado, onClick, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${selecionado ? 'border-accent bg-accent-glow' : 'border-border bg-surface'}`}
    >
      {children}
    </motion.button>
  )
}

export default function NbaSetup({ onStart, onBack }) {
  const [passo, setPasso] = useState(0)
  const [sobrenome, setSobrenome] = useState('')
  const [numero, setNumero] = useState('')
  const [posicao, setPosicao] = useState(null)
  const [pais, setPais] = useState(null)
  const [caminho, setCaminho] = useState(null)
  const passos = ['Identidade', 'Posição', 'País', 'Caminho']

  const pode = [
    sobrenome.trim().length > 0 && numero.trim().length > 0,
    posicao !== null,
    pais !== null,
    caminho !== null,
  ][passo]

  function sortear() {
    setSobrenome(SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)])
    setNumero(String(Math.floor(Math.random() * 99) + 1))
  }

  function avancar() {
    if (passo < 3) setPasso((p) => p + 1)
    else onStart({ sobrenome: sobrenome.trim(), numero: numero.trim().slice(0, 2), posicao, pais, caminho })
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full flex-col px-6 py-10 lg:max-w-4xl">
      <button onClick={passo === 0 ? onBack : () => setPasso((p) => p - 1)} className="flex items-center gap-1.5 text-xs text-secondary">
        <ChevronLeft className="h-4 w-4" /> {passo === 0 ? 'Voltar' : passos[passo - 1]}
      </button>

      <div className="mt-6 flex gap-1.5">
        {passos.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= passo ? 'bg-accent' : 'bg-border'}`} />
        ))}
      </div>

      <div className="mt-8 flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={passo} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
            {passo === 0 && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Quem é você?</h1>
                <p className="mt-1 text-sm text-secondary">O nome que vai aparecer nas manchetes e na camisa.</p>
                <input
                  value={sobrenome}
                  onChange={(e) => setSobrenome(e.target.value)}
                  placeholder="Sobrenome"
                  maxLength={18}
                  className="mt-6 w-full rounded-xl border border-border-strong bg-white/5 px-4 py-4 text-lg font-medium outline-none focus:border-accent"
                />
                <input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="Número da camisa"
                  inputMode="numeric"
                  className="mt-3 w-full rounded-xl border border-border-strong bg-white/5 px-4 py-4 text-lg font-medium tabular-nums outline-none focus:border-accent"
                />
                <button onClick={sortear} className="mt-4 flex items-center gap-2 text-sm text-secondary underline underline-offset-4">
                  <Dices className="h-4 w-4" /> Sortear nome e número
                </button>
              </div>
            )}

            {passo === 1 && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Sua posição</h1>
                <p className="mt-1 text-sm text-secondary">Define o jeito de jogar e quais números você vai produzir.</p>
                <div className="mt-6 grid grid-cols-1 gap-2 lg:grid-cols-3">
                  {POSICOES.map((p) => (
                    <Cartao key={p.id} selecionado={posicao === p.id} onClick={() => setPosicao(p.id)}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{p.nome}</span>
                        <span className="text-xs font-bold text-accent">{p.sigla}</span>
                      </div>
                      <p className="mt-1 text-xs text-secondary">{p.alturaMin} a {p.alturaMax} cm</p>
                    </Cartao>
                  ))}
                </div>
              </div>
            )}

            {passo === 2 && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight">De onde você vem?</h1>
                <p className="mt-1 text-sm text-secondary">Seu país entra nas manchetes e na seleção.</p>
                <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {PAISES.map((p) => (
                    <Cartao key={p.id} selecionado={pais === p.id} onClick={() => setPais(p.id)}>
                      <Bandeira emoji={p.bandeira} />
                      <p className="mt-1 text-sm font-medium">{p.nome}</p>
                    </Cartao>
                  ))}
                </div>
              </div>
            )}

            {passo === 3 && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Seu caminho até a NBA</h1>
                <p className="mt-1 text-sm text-secondary">Ninguém nasce na liga. Como você chega lá?</p>
                <div className="mt-6 grid grid-cols-1 gap-2 lg:grid-cols-3">
                  {CAMINHOS.map((c) => {
                    const Icon = c.icon
                    return (
                      <Cartao key={c.id} selecionado={caminho === c.id} onClick={() => setCaminho(c.id)}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-glow">
                            <Icon className="h-5 w-5 text-accent" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{c.nome}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{c.dica}</span>
                            </div>
                            <p className="mt-1 text-xs leading-snug text-secondary">{c.desc}</p>
                          </div>
                        </div>
                      </Cartao>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pt-6">
        <BotaoPrimario disabled={!pode} onClick={avancar}>
          <span className="inline-flex items-center justify-center gap-2">
            {passo < 3 ? 'Continuar' : 'Começar carreira'} <ChevronRight className="h-4 w-4" />
          </span>
        </BotaoPrimario>
      </div>
    </div>
  )
}
