import { motion } from 'motion/react'
import { Skull, Users, Theater, Hash, HelpCircle, Ban, Target, StickyNote, Milk, TrendingUp, Brain, Layers, Trophy, Smartphone, Share2, User } from 'lucide-react'

// secao: 'celulares' (cada um no seu celular), 'passa' (um celular passando de mão em mão), 'solo'
const GAMES = [
  {
    id: 'draft',
    nome: 'Draft FC',
    desc: 'Monte seu time sorteando letras, escolha a tática e dispute o campeonato contra os amigos e clubes reais.',
    icon: Trophy,
    minPlayers: 1,
    multiDispositivo: true,
    secao: 'celulares',
    cor: '#f59e0b',
    tag: '1 a 8 jogadores',
    destaque: true,
  },
  {
    id: 'pdf',
    nome: 'P.D.F',
    desc: 'O juiz lê a pergunta e todo mundo responde com a pior carta que tem.',
    icon: Layers,
    minPlayers: 3,
    multiDispositivo: true,
    secao: 'celulares',
    cor: '#ef4444',
    tag: '18+ · 3 a 20',
  },
  {
    id: 'manada',
    nome: 'Efeito Manada',
    desc: 'Adivinhe o que a maioria vai responder e fuja da Vaca Rosa.',
    icon: Milk,
    minPlayers: 3,
    multiDispositivo: true,
    secao: 'celulares',
    cor: '#ec4899',
    tag: '3+ jogadores',
  },
  {
    id: 'themind',
    nome: 'The Mind',
    desc: 'Cooperativo e sem falar: jogue as cartas em ordem só na sintonia do grupo.',
    icon: Brain,
    minPlayers: 3,
    multiDispositivo: true,
    secao: 'celulares',
    cor: '#8b5cf6',
    tag: '3+ jogadores',
  },
  {
    id: 'impostor',
    nome: 'Impostor',
    desc: 'Todo mundo recebe a mesma palavra, menos o impostor. Descubra quem é.',
    icon: Skull,
    minPlayers: 3,
    secao: 'passa',
    cor: '#f43f5e',
    tag: '3+ jogadores',
  },
  {
    id: 'resistencia',
    nome: 'A Resistência',
    desc: 'Leais contra traidores: missões, votação e sabotagem.',
    icon: Users,
    minPlayers: 5,
    secao: 'passa',
    cor: '#3b82f6',
    tag: '5 a 10',
  },
  {
    id: 'mimica',
    nome: 'Mímica',
    desc: 'Um mimica, o resto adivinha. Cronômetro e centenas de palavras.',
    icon: Theater,
    minPlayers: 3,
    secao: 'passa',
    cor: '#10b981',
    tag: '3+ jogadores',
  },
  {
    id: 'tabu',
    nome: 'Tabu',
    desc: 'Descreva a palavra sem falar as proibidas. Duplas rotativas.',
    icon: Ban,
    minPlayers: 3,
    secao: 'passa',
    cor: '#f97316',
    tag: '3+ jogadores',
  },
  {
    id: 'papelitos',
    nome: 'Papelitos',
    desc: 'Dois times, três rodadas: descrição, uma palavra e mímica com os mesmos papelitos.',
    icon: StickyNote,
    minPlayers: 4,
    secao: 'passa',
    cor: '#eab308',
    tag: '4+ jogadores',
  },
  {
    id: 'quemsoueu',
    nome: 'Quem Sou Eu',
    desc: 'Só você não vê seu personagem. Pergunte e descubra quem é.',
    icon: HelpCircle,
    minPlayers: 3,
    secao: 'passa',
    cor: '#06b6d4',
    tag: '3+ jogadores',
  },
  {
    id: 'nota',
    nome: 'Jogo da Nota',
    desc: 'Cada um recebe uma nota secreta e responde ao tema dela. Os outros tentam adivinhar.',
    icon: Hash,
    minPlayers: 3,
    secao: 'passa',
    cor: '#a3e635',
    tag: '3+ jogadores',
  },
  {
    id: 'palpite',
    nome: 'Palpite',
    desc: 'Perguntas impossíveis de saber. Quem chega mais perto ganha ponto.',
    icon: Target,
    minPlayers: 2,
    secao: 'passa',
    cor: '#14b8a6',
    tag: '2+ jogadores',
  },
  {
    id: 'carreira',
    nome: 'Carreira NBA',
    desc: 'Do college ao Hall da Fama: draft, contratos, playoffs e recordes. Salva sozinho.',
    icon: TrendingUp,
    minPlayers: 1,
    secao: 'solo',
    cor: '#fb923c',
    tag: 'Solo',
  },
]

const SECOES = [
  { id: 'celulares', titulo: 'Cada um no seu celular', icon: Smartphone, dica: 'Entra com código de sala' },
  { id: 'passa', titulo: 'Um celular, passa de mão em mão', icon: Share2, dica: 'Todo mundo na mesma mesa' },
  { id: 'solo', titulo: 'Pra jogar sozinho', icon: User, dica: 'No seu ritmo' },
]

function IconeJogo({ icon: Icon, cor, tam = 48 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: tam, height: tam, background: `${cor}22`, boxShadow: `inset 0 0 0 1px ${cor}40` }}
    >
      <Icon style={{ color: cor, width: tam * 0.5, height: tam * 0.5 }} />
    </div>
  )
}

function Destaque({ game, onSelect }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(game)}
      className="relative w-full overflow-hidden rounded-3xl border border-accent/40 p-5 text-left"
      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,.22), rgba(245,158,11,.04) 55%, rgba(17,17,19,.9))' }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <IconeJogo icon={game.icon} cor={game.cor} tam={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight">{game.nome}</h2>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-secondary">{game.desc}</p>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-accent">{game.tag}</span>
        <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-black">Jogar</span>
      </div>
    </motion.button>
  )
}

function Cartao({ game, i, onSelect, larga }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * i, type: 'spring', stiffness: 300, damping: 26 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(game)}
      className={`rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong ${
        larga ? 'col-span-2 flex items-center gap-4' : 'flex flex-col'
      }`}
    >
      <IconeJogo icon={game.icon} cor={game.cor} tam={42} />
      <div className={`flex min-w-0 flex-1 flex-col ${larga ? '' : 'mt-3'}`}>
        <h3 className="text-[15px] font-bold leading-tight tracking-tight">{game.nome}</h3>
        <p className={`mt-1 text-[12px] leading-snug text-secondary ${larga ? '' : 'line-clamp-3'}`}>{game.desc}</p>
        <span className="mt-auto pt-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: game.cor }}>
          {game.tag}
        </span>
      </div>
    </motion.button>
  )
}

export default function Home({ onSelectGame }) {
  const destaque = GAMES.find((g) => g.destaque)
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden px-5 pb-14 pt-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.14),transparent_70%)]" />
      <div className="relative mx-auto w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">Cerne Studio</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Jogo do Rolê</h1>
          <p className="mt-2 text-sm text-secondary">Escolhe um jogo e chama a galera. {GAMES.length} jogos pra festa, pra mesa e pra jogar sozinho.</p>
        </motion.div>

        {destaque && (
          <div className="mt-7">
            <Destaque game={destaque} onSelect={onSelectGame} />
          </div>
        )}

        {SECOES.map((s) => {
          const lista = GAMES.filter((g) => g.secao === s.id && !g.destaque)
          if (lista.length === 0) return null
          const Icone = s.icon
          return (
            <section key={s.id} className="mt-9">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
                  <Icone className="h-4 w-4 shrink-0 text-accent" />
                  {s.titulo}
                </h2>
                <span className="text-[11px] text-muted">{s.dica}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {lista.map((g, i) => (
                  <Cartao key={g.id} game={g} i={i} onSelect={onSelectGame} larga={lista.length % 2 === 1 && i === lista.length - 1} />
                ))}
              </div>
            </section>
          )
        })}

        <p className="mt-12 text-center text-[11px] text-muted">Feito pela Cerne Studio</p>
      </div>
    </div>
  )
}
