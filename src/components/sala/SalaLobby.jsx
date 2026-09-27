import { motion } from 'motion/react'
import { Users } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'

export default function SalaLobby({ codigo, jogadores, souHost, minimo = 3, erro, iniciando, onIniciar, onExit }) {
  const podeIniciar = jogadores.length >= minimo

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1">
        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Código da sala</p>
          <h1 className="mt-2 text-5xl font-bold tracking-tight tabular-nums text-accent">{codigo}</h1>
          <p className="mt-3 text-sm text-secondary">
            Mostre esse código pros outros jogadores digitarem no celular deles.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted">
          <Users className="h-3.5 w-3.5" />
          {jogadores.length} jogador{jogadores.length === 1 ? '' : 'es'} na sala
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {jogadores.map((j) => (
            <li
              key={j.user_id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span className="text-sm font-medium">{j.nome}</span>
            </li>
          ))}
        </ul>

        {!podeIniciar && (
          <p className="mt-4 text-xs text-muted">Faltam {minimo - jogadores.length} jogador(es) pra começar.</p>
        )}
      </div>

      <div className="mx-auto w-full max-w-sm pt-6">
        {souHost ? (
          <>
            {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}
            <motion.button
              whileTap={{ scale: podeIniciar ? 0.97 : 1 }}
              disabled={!podeIniciar || iniciando}
              onClick={onIniciar}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
            >
              {iniciando ? 'Iniciando...' : 'Iniciar partida'}
            </motion.button>
          </>
        ) : (
          <p className="text-center text-sm text-secondary">Aguardando o host iniciar a partida...</p>
        )}
      </div>
    </div>
  )
}
