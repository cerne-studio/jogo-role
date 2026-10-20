import { jogoDoTime, tabelaDoGrupo, timePorId } from '../torneio.js'
import { Escudo } from './torneioUtils.jsx'
import { TabelasGrupos } from './Tabelas.jsx'

function LinhaJogo({ torneio, jogo, meuId }) {
  const A = timePorId(torneio, jogo.A)
  const B = timePorId(torneio, jogo.B)
  const r = torneio.resultados[jogo.id]
  const meu = jogo.A === meuId || jogo.B === meuId
  const golsDe = (lado) => r.gols.filter((g) => g.time === lado)
  return (
    <div className={`rounded-xl border p-3 ${meu ? 'border-accent bg-accent-glow' : 'border-border bg-surface'}`}>
      <div className="flex items-center gap-2">
        <Escudo time={A} tam={28} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{A.nome}</span>
        <span className="text-lg font-black tabular-nums">{r.golsA} <span className="text-muted">x</span> {r.golsB}</span>
        <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold">{B.nome}</span>
        <Escudo time={B} tam={28} />
      </div>
      {(r.penaltis || r.prorrogou) && (
        <p className="mt-1 text-center text-[11px] text-accent">{r.penaltis ? `Pênaltis: ${r.penaltis.A} x ${r.penaltis.B}` : 'Decidido na prorrogação'}</p>
      )}
      {(r.gols.length > 0 || r.cartoes.some((c) => c.tipo === 'vermelho')) && (
        <div className="mt-2 grid grid-cols-2 gap-3 text-[11px] leading-snug text-secondary">
          {['A', 'B'].map((lado, i) => (
            <div key={lado} className={i ? 'text-right' : ''}>
              {golsDe(lado).map((g, k) => (
                <p key={k}>
                  <span className="text-primary">{g.jogadorNome}</span> {g.rotulo}{g.tipo === 'gol_penalti' ? ' (p)' : g.tipo === 'gol_contra' ? ' (gc)' : ''}
                </p>
              ))}
              {r.cartoes.filter((c) => c.time === lado && c.tipo === 'vermelho').map((c, k) => (
                <p key={`v${k}`} className="text-danger">expulso: {c.jogadorNome} {c.rotulo}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Resumo da etapa (depois de assistir o seu jogo): todos os resultados, sua situação e a tabela já com essa rodada.
export default function Resumo({ torneio, etapa, meuId }) {
  const meuJogo = meuId ? jogoDoTime(torneio, meuId, etapa) : null
  const ate = torneio.cursor + 1
  const r = meuJogo ? torneio.resultados[meuJogo.id] : null
  const lado = meuJogo ? (meuJogo.A === meuId ? 'A' : 'B') : null
  const venceu = r && r.vencedor === lado
  const empatou = r && r.vencedor == null
  let situacao = null
  if (meuJogo && etapa.fase !== 'grupos') {
    if (etapa.fase === 'final') situacao = venceu ? { t: 'Campeão!', c: 'text-accent' } : { t: 'Vice-campeão', c: 'text-secondary' }
    else situacao = venceu ? { t: 'Você está na próxima fase!', c: 'text-success' } : { t: 'Você foi eliminado', c: 'text-danger' }
  } else if (meuJogo && etapa.fase === 'grupos') {
    situacao = venceu ? { t: 'Vitória: +3 pontos', c: 'text-success' } : empatou ? { t: 'Empate: +1 ponto', c: 'text-primary' } : { t: 'Derrota', c: 'text-danger' }
    const ultima = torneio.etapas.filter((e) => e.fase === 'grupos').at(-1).id === etapa.id
    if (ultima) {
      const gi = torneio.grupos.findIndex((g) => g.includes(meuId))
      const pos = tabelaDoGrupo(torneio, gi, ate).findIndex((l) => l.id === meuId)
      situacao = pos < 2 ? { t: `Classificado em ${pos + 1}º no grupo!`, c: 'text-success' } : { t: 'Eliminado na fase de grupos', c: 'text-danger' }
    }
  } else if (meuId && etapa.fase === 'grupos') {
    situacao = { t: 'Seu time folgou nessa rodada', c: 'text-secondary' }
  }
  const gi = meuId ? Math.max(0, torneio.grupos.findIndex((g) => g.includes(meuId))) : 0

  return (
    <div className="space-y-4">
      {situacao && <p className={`rounded-2xl border border-border bg-surface p-4 text-center text-lg font-extrabold ${situacao.c}`}>{situacao.t}</p>}
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">{etapa.nome} · resultados</p>
      <div className="space-y-2">
        {etapa.jogos.map((j) => <LinhaJogo key={j.id} torneio={torneio} jogo={j} meuId={meuId} />)}
      </div>
      {etapa.fase === 'grupos' && <TabelasGrupos torneio={torneio} ate={ate} meuId={meuId} grupoInicial={gi} />}
    </div>
  )
}
