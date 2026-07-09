import { motion } from 'motion/react'
import { Skull, Users, Theater, Hash, HelpCircle, Ban } from 'lucide-react'

const GAMES = [
  {
    id: 'impostor',
    nome: 'Impostor',
    desc: 'Todo mundo recebe a mesma palavra, menos o impostor. Descubra quem é.',
    icon: Skull,
    minPlayers: 3,
  },
  {
    id: 'resistencia',
    nome: 'A Resistência',
    desc: 'Leais x traidores. Missões, votação e sabotagem.',
    icon: Users,
    minPlayers: 5,
  },
  {
    id: 'mimica',
    nome: 'Mímica',
    desc: 'Um mimica, o resto adivinha. Cronômetro e banco de palavras.',
    icon: Theater,
    minPlayers: 3,
  },
  {
    id: 'nota',
    nome: 'Jogo da Nota',
    desc: 'Um recebe uma nota secreta, o resto pergunta e tenta acertar o número.',
    icon: Hash,
    minPlayers: 3,
  },
  {
    id: 'quemsoueu',
    nome: 'Quem Sou Eu',
    desc: 'Só você não vê seu personagem. Pergunte e descubra quem é.',
    icon: HelpCircle,
    minPlayers: 3,
  },
  {
    id: 'tabu',
    nome: 'Tabu',
    desc: 'Descreva a palavra sem falar as proibidas. Duplas rotativas.',
    icon: Ban,
    minPlayers: 3,
  },
]

export default function Home({ onSelectGame }) {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="mx-auto w-full max-w-sm"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Cerne Studio</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Jogo do Rolê</h1>
        <p className="mt-2 text-sm text-secondary">Escolhe o jogo pra começar.</p>

        <div className="mt-8 flex flex-col gap-3">
          {GAMES.map((game, i) => {
            const Icon = game.icon
            return (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, type: 'spring', stiffness: 300, damping: 26 }}
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -2 }}
                onClick={() => onSelectGame(game)}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-glow">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold tracking-tight">{game.nome}</h2>
                  <p className="mt-0.5 text-xs leading-snug text-secondary">{game.desc}</p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
