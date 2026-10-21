import { motion } from 'motion/react'
import logoRole from '../assets/role/logo-role.svg'
import capaDraft from '../assets/role/capa-draft.webp'
import capaImpostor from '../assets/role/capa-impostor.webp'
import capaManada from '../assets/role/capa-manada.webp'
import capaTheMind from '../assets/role/capa-themind.webp'
import capaMimica from '../assets/role/capa-mimica.webp'
import { Skull, Users, Theater, Hash, HelpCircle, Ban, Target, StickyNote, Milk, TrendingUp, Brain, Layers, Trophy, Smartphone, Share2, User } from 'lucide-react'

// secao: 'celulares' (cada um no seu celular), 'passa' (um celular passando de mão em mão), 'solo'
const GAMES = [
  {
    id: 'draft',
    capa: capaDraft,
    nome: 'Draft FC',
    desc: 'Monte seu time sorteando letras, escolha a tática e dispute o campeonato contra os amigos e clubes reais.',
    descBanner: 'Sorteie letras, monte o time e dispute o campeonato.',
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
    capa: capaManada,
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
    capa: capaTheMind,
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
    capa: capaImpostor,
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
    capa: capaMimica,
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

// Banner do Draft FC: fundo verde escuro, texto numa coluna à esquerda e a arte à direita (cortada sem deformar)
function Destaque({ game, onSelect }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(game)}
      className="relative flex min-h-[188px] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#04251a] text-left"
    >
      <img
        src={game.capa}
        alt=""
        className="absolute inset-y-0 right-0 h-full w-[72%] object-cover object-[78%_50%]"
        style={{ maskImage: 'linear-gradient(to right, transparent 0%, #000 38%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 38%)' }}
      />
      <div className="relative flex w-[54%] flex-col justify-between p-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">{game.tag}</span>
          <h2 className="mt-3 text-[26px] font-black leading-none tracking-tight">{game.nome}</h2>
          <p className="mt-2 text-[12px] leading-snug text-white/75">{game.descBanner ?? game.desc}</p>
        </div>
        <span className="mt-4 inline-flex w-fit rounded-full bg-accent px-5 py-2 text-xs font-extrabold uppercase tracking-wide text-black">Jogar</span>
      </div>
    </motion.button>
  )
}

// Topo do cartão: a capa do jogo quando existe; senão um bloco na cor do jogo com o ícone grande (mesma proporção 3:2)
function TopoCartao({ game, larga }) {
  const caixa = larga ? 'w-[42%] shrink-0 self-stretch' : 'aspect-[3/2] w-full'
  if (game.capa) {
    return <img src={game.capa} alt="" loading="lazy" decoding="async" className={`${caixa} object-cover`} />
  }
  const Icon = game.icon
  return (
    <div
      className={`relative flex ${caixa} items-center justify-center overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${game.cor}55, ${game.cor}14 70%)` }}
    >
      <Icon className="absolute -bottom-4 -right-3 h-24 w-24 opacity-20" style={{ color: game.cor }} strokeWidth={1.4} />
      <Icon className="relative h-9 w-9" style={{ color: game.cor }} strokeWidth={1.8} />
    </div>
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
      className={`overflow-hidden rounded-2xl border border-border bg-surface text-left transition-colors hover:border-border-strong ${larga ? 'col-span-2 flex' : ''}`}
    >
      <TopoCartao game={game} larga={larga} />
      <div className={`p-3.5 ${larga ? 'flex min-w-0 flex-1 flex-col justify-center' : ''}`}>
        <h3 className="text-[15px] font-bold leading-tight tracking-tight">{game.nome}</h3>
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-secondary">{game.desc}</p>
        <span className="mt-2.5 inline-block text-[10px] font-semibold uppercase tracking-widest" style={{ color: game.cor }}>
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(255,186,56,0.14),transparent_70%)]" />
      <div className="relative mx-auto w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
          <img src={logoRole} alt="Rolê" className="h-auto w-28" />
          <h1 className="sr-only">Jogo do Rolê</h1>
          <p className="mt-3 text-sm text-secondary">Escolhe um jogo e chama a galera. {GAMES.length} jogos pra festa, pra mesa e pra jogar sozinho.</p>
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
              <div className="mt-3 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3">
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
