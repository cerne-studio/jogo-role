import { Wallet } from 'lucide-react'
import { CartaoJogador, fmtMi } from './ui.jsx'
import { StatusBarras, NivelCarreira } from './PainelJogador.jsx'

// Coluna fixa do modo computador: cartão, nível da carreira, status e atalho pro dinheiro.
export function LateralJogador({ estado, onDinheiro }) {
  return (
    <aside className="hidden w-[340px] shrink-0 lg:block">
      <div className="sticky top-0 flex max-h-[100dvh] flex-col gap-4 overflow-y-auto [&>*]:shrink-0 px-1 pb-8 pt-8">
        <CartaoJogador estado={estado} compacto />
        <NivelCarreira estado={estado} />
        <button onClick={onDinheiro} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors hover:border-border-strong">
          <Wallet className="h-5 w-5 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-bold tabular-nums">{fmtMi(estado.dinheiro.patrimonio, 1)}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">Patrimônio · gastos e equipe</p>
          </div>
          <span className="text-xs font-semibold text-accent">Abrir</span>
        </button>
        <StatusBarras estado={estado} />
      </div>
    </aside>
  )
}
