import { useState } from 'react'
import { LETRAS_GRUPO, tabelaDoGrupo, timePorId } from '../torneio.js'
import { Abas, Escudo } from './torneioUtils.jsx'

// Tabelas dos grupos (só conta as etapas já reveladas: índice < `ate`). Os 2 primeiros se classificam.
export function TabelasGrupos({ torneio, ate, meuId, grupoInicial = 0 }) {
  const [g, setG] = useState(grupoInicial)
  const tabela = tabelaDoGrupo(torneio, g, ate)
  return (
    <div className="space-y-3">
      <Abas abas={torneio.grupos.map((_, i) => [i, `Grupo ${LETRAS_GRUPO[i]}`])} valor={g} onChange={setG} />
      <div className="rounded-2xl border border-border bg-surface p-3">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted">
              <th className="pb-2">Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th className="text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {tabela.map((l, i) => (
              <tr key={l.id} className={`border-t border-white/5 ${l.id === meuId ? 'bg-accent-glow' : ''}`}>
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <span className={`h-5 w-0.5 rounded ${i < 2 ? 'bg-success' : 'bg-transparent'}`} />
                    <Escudo time={timePorId(torneio, l.id)} tam={26} />
                    <span className="max-w-[92px] truncate font-semibold">{l.nome}</span>
                  </span>
                </td>
                <td>{l.j}</td><td>{l.v}</td><td>{l.e}</td><td>{l.d}</td><td>{l.sg > 0 ? `+${l.sg}` : l.sg}</td>
                <td className="text-right font-extrabold text-accent">{l.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-muted"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-success" />Os 2 primeiros avançam.</p>
      </div>
    </div>
  )
}

function Confronto({ torneio, jogo, revelado, meuId }) {
  const A = timePorId(torneio, jogo.A)
  const B = timePorId(torneio, jogo.B)
  const r = revelado ? torneio.resultados[jogo.id] : null
  const venceuA = r && r.vencedor === 'A'
  const venceuB = r && r.vencedor === 'B'
  const linha = (t, gols, vence) => (
    <div className={`flex items-center gap-2 ${r && !vence ? 'opacity-50' : ''}`}>
      <Escudo time={t} tam={26} destaque={t.id === meuId} />
      <span className="flex-1 truncate text-sm font-semibold">{t.nome}</span>
      <span className="text-base font-extrabold tabular-nums">{r ? gols : '-'}</span>
    </div>
  )
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      {linha(A, r?.golsA, venceuA)}
      <div className="mt-1.5">{linha(B, r?.golsB, venceuB)}</div>
      {r?.penaltis && <p className="mt-1.5 text-[11px] text-accent">nos pênaltis: {r.penaltis.A} x {r.penaltis.B}</p>}
      {r?.prorrogou && !r.penaltis && <p className="mt-1.5 text-[11px] text-accent">na prorrogação</p>}
    </div>
  )
}

// Mata-mata: uma coluna por fase, na ordem. Fases futuras aparecem como "a definir".
export function Chaveamento({ torneio, ate, meuId }) {
  const fases = torneio.tamanho === 8 ? ['semi', 'final'] : ['quartas', 'semi', 'final']
  const nomes = { quartas: 'Quartas de final', semi: 'Semifinais', final: 'Final' }
  const qtd = { quartas: 4, semi: 2, final: 1 }
  return (
    <div className="space-y-5">
      {fases.map((f) => {
        const idx = torneio.etapas.findIndex((e) => e.fase === f)
        const etapa = idx >= 0 ? torneio.etapas[idx] : null
        const revelado = idx >= 0 && idx < ate
        return (
          <div key={f}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{nomes[f]}</p>
            <div className="grid gap-2">
              {etapa
                ? etapa.jogos.map((j) => <Confronto key={j.id} torneio={torneio} jogo={j} revelado={revelado} meuId={meuId} />)
                : Array.from({ length: qtd[f] }, (_, i) => (
                    <div key={i} className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted">a definir</div>
                  ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { Confronto }
