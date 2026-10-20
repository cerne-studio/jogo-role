import { useMemo, useState } from 'react'
import MatchPitch, { CORES_PADRAO } from './MatchPitch.jsx'
import { useReprodutor } from './useReprodutor.js'
import { estatisticasParciais } from './parciais.js'

// Texto de cada lance da lista (os mesmos tipos que o motor emite).
function textoLance(e) {
  switch (e.tipo) {
    case 'gol': return `GOL de ${e.jogadorNome}${e.assistenciaNome ? ` (assist. ${e.assistenciaNome})` : ''}`
    case 'gol_penalti': return `GOL de pênalti: ${e.jogadorNome}`
    case 'gol_contra': return `Gol contra de ${e.jogadorNome}`
    case 'gol_anulado': return `VAR anula o gol de ${e.jogadorNome} (${e.motivo})`
    case 'chute_defendido': return `${e.jogadorNome} chuta, ${e.goleiroNome ?? 'goleiro'} defende`
    case 'chute_fora': return `${e.jogadorNome} chuta pra fora`
    case 'chute_trave': return `${e.jogadorNome} acerta a trave`
    case 'chute_bloqueado': return `Chute de ${e.jogadorNome} bloqueado`
    case 'penalti': return `Pênalti pra ${e.time === 'A' ? 'o time A' : 'o time B'}: ${e.jogadorNome}${e.viaVar ? ' (VAR)' : ''}`
    case 'penalti_defendido': return `${e.goleiroNome ?? 'Goleiro'} defende o pênalti de ${e.jogadorNome}`
    case 'penalti_fora': return `${e.jogadorNome} isola o pênalti`
    case 'escanteio': return `Escanteio: ${e.jogadorNome}`
    case 'falta': return `Falta de ${e.jogadorNome}`
    case 'amarelo': return `Amarelo: ${e.jogadorNome}`
    case 'vermelho': return `Vermelho: ${e.jogadorNome}${e.motivo === 'segundo amarelo' ? ' (2º amarelo)' : ''}`
    case 'impedimento': return `Impedimento de ${e.jogadorNome}`
    case 'lesao': return `${e.jogadorNome} se machucou e saiu`
    case 'intervalo': return 'Intervalo'
    case 'inicio': return 'Bola rolando'
    case 'fim_tempo_normal': return 'Fim do tempo normal'
    case 'prorrogacao': return 'Prorrogação'
    case 'fim_prorrogacao': return 'Fim da prorrogação'
    case 'penaltis': return 'Disputa de pênaltis'
    case 'fim': return 'Fim de jogo'
    default: return e.tipo
  }
}

const COR_TIPO = {
  gol: 'text-[#fbbf24]', gol_penalti: 'text-[#fbbf24]', gol_contra: 'text-[#fbbf24]', amarelo: 'text-[#facc15]', vermelho: 'text-[#ef4444]',
  gol_anulado: 'text-[#f59e0b]', penalti: 'text-[#f59e0b]', lesao: 'text-[#f87171]',
}
const IMPORTANTES = new Set(['gol', 'gol_penalti', 'gol_contra', 'gol_anulado', 'chute_defendido', 'chute_trave', 'penalti', 'penalti_defendido', 'penalti_fora', 'amarelo', 'vermelho', 'lesao', 'intervalo', 'inicio', 'fim', 'prorrogacao', 'penaltis', 'fim_tempo_normal'])

export function Banner({ b }) {
  if (!b) return null
  if (b.tipo === 'gol') {
    return (
      <div className="absolute inset-x-3 top-3 rounded-2xl border border-[#f59e0b] bg-[#1a1408]/95 px-4 py-3 text-center shadow-lg">
        <div className="text-[26px] font-extrabold tracking-wide text-[#fbbf24]">{b.contra ? 'GOL CONTRA' : b.penalti ? 'GOL DE PÊNALTI' : 'GOOOOL!'}</div>
        <div className="text-[16px] font-bold text-[#f0f0f2]">{b.jogador} <span className="text-[#8b8b9a]">{b.rotulo}</span></div>
        {b.assistencia && <div className="text-[13px] text-[#8b8b9a]">assistência: {b.assistencia}</div>}
      </div>
    )
  }
  if (b.tipo === 'replay') {
    return <div className="absolute left-3 top-3 rounded-full bg-[#f59e0b] px-3 py-1 text-[12px] font-extrabold tracking-widest text-black">REPLAY · CÂMERA LENTA</div>
  }
  const cor = { sucesso: 'border-[#10b981] text-[#10b981]', perigo: 'border-[#ef4444] text-[#ef4444]', alerta: 'border-[#f59e0b] text-[#f59e0b]', amarelo: 'border-[#facc15] text-[#facc15]', neutro: 'border-white/20 text-[#f0f0f2]' }[b.cor] ?? 'border-white/20 text-[#f0f0f2]'
  return <div className={`absolute inset-x-3 top-3 rounded-xl border bg-[#0a0a0b]/90 px-3 py-2 text-center text-[14px] font-bold ${cor}`}>{b.texto}</div>
}

export function BarraStat({ rotulo, a, b, pct }) {
  const total = a + b
  const pa = pct ? a : total ? (a / total) * 100 : 50
  return (
    <div className="py-1.5">
      <div className="flex justify-between text-[14px] font-bold text-[#f0f0f2]">
        <span>{a}{pct ? '%' : ''}</span>
        <span className="text-[12px] font-medium text-[#8b8b9a]">{rotulo}</span>
        <span>{b}{pct ? '%' : ''}</span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-[#1a1a1f]">
        <div className="bg-[#7c3aed] transition-all" style={{ width: `${pa}%` }} />
        <div className="bg-[#d1d5db] transition-all" style={{ width: `${100 - pa}%` }} />
      </div>
    </div>
  )
}

// Partida ao vivo: placar, campo com as peças, controles e abas (lances, estatísticas, jogadores).
// `sim` vem de simularPartida(cfg.A, cfg.B); aqui só se reproduz o resultado já decidido.
export default function PartidaAoVivo({ sim, cfg, abaExtra, controlesExtras, onOutra, replayInicial = true }) {
  const [aba, setAba] = useState('lances')
  const [replay, setReplay] = useState(replayInicial)

  const r = useReprodutor(sim, cfg, { replay })
  const nomes = useMemo(() => Object.fromEntries(Object.values(sim.jogadores).map((j) => [j.id, j.nome.split(' ').slice(-1)[0]])), [sim])
  const numeros = useMemo(() => Object.fromEntries(Object.values(sim.jogadores).map((j) => [j.id, j.num])), [sim])
  const parciais = useMemo(() => estatisticasParciais(r.vistos, r.posseVista), [r.vistos, r.posseVista])
  const duracao = sim.resultado.prorrogou ? 120 : 90
  const progresso = Math.min(100, ((r.relogio.min ?? 0) / duracao) * 100)
  const lances = useMemo(() => [...r.vistos].filter((e) => IMPORTANTES.has(e.tipo)).reverse(), [r.vistos])
  const tally = useMemo(() => {
    const t = {}
    const get = (id, nome, time) => (t[id] ??= { id, nome, time, gols: 0, ass: 0, faltas: 0, am: 0, vm: 0 })
    for (const e of r.vistos) {
      if (!e.jogadorId) continue
      if (e.tipo === 'gol' || e.tipo === 'gol_penalti') get(e.jogadorId, e.jogadorNome, e.time).gols += 1
      if (e.assistenciaId) get(e.assistenciaId, e.assistenciaNome, e.time).ass += 1
      if (e.tipo === 'falta') get(e.jogadorId, e.jogadorNome, e.time).faltas += 1
      if (e.tipo === 'amarelo') get(e.jogadorId, e.jogadorNome, e.time).am += 1
      if (e.tipo === 'vermelho') get(e.jogadorId, e.jogadorNome, e.time).vm += 1
    }
    return Object.values(t).sort((a, b) => b.gols - a.gols || b.vm - a.vm || b.am - a.am || b.faltas - a.faltas)
  }, [r.vistos])
  const pen = r.penaltisVistos

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-[#111113] p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="mx-auto mb-1 h-8 w-8 rounded-full border-2 border-[#4c1d95] bg-[#7c3aed]" />
            <div className="text-[13px] font-bold text-[#f0f0f2]">{cfg.A.nome}</div>
          </div>
          <div className="px-3 text-center">
            <div className="text-[34px] font-extrabold leading-none text-[#f0f0f2]">{r.placar.A} <span className="text-[#8b8b9a]">x</span> {r.placar.B}</div>
            <div className="mt-1 text-[13px] font-bold text-[#f59e0b]">{r.estado === 'fim' ? 'Fim de jogo' : r.relogio.rotulo}</div>
            {pen.length > 0 && <div className="text-[12px] text-[#8b8b9a]">pênaltis {pen[pen.length - 1].parcial.A} x {pen[pen.length - 1].parcial.B}</div>}
          </div>
          <div className="flex-1 text-center">
            <div className="mx-auto mb-1 h-8 w-8 rounded-full border-2 border-[#9ca3af] bg-[#f3f4f6]" />
            <div className="text-[13px] font-bold text-[#f0f0f2]">{cfg.B.nome}</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1a1a1f]">
          <div className="h-full bg-[#f59e0b] transition-all" style={{ width: `${progresso}%` }} />
        </div>
      </div>

      <div className="relative">
        <MatchPitch sim={sim} cfg={cfg} visual={r.visual} nomes={nomes} numeros={numeros} cores={CORES_PADRAO} />
        <Banner b={r.banner} />
      </div>

      <div className="flex flex-wrap gap-2">
        {r.estado === 'tocando' ? (
          <button onClick={r.pausar} className="flex-1 rounded-xl bg-[#1a1a1f] py-3 text-[15px] font-bold text-[#f0f0f2]">Pausar</button>
        ) : (
          <button onClick={r.iniciar} className="flex-1 rounded-xl bg-[#f59e0b] py-3 text-[15px] font-extrabold text-black">{r.estado === 'pausado' ? 'Continuar' : r.estado === 'fim' ? 'Ver de novo' : 'Começar jogo'}</button>
        )}
        <button onClick={r.pularParaFim} disabled={r.estado !== 'tocando' && r.estado !== 'pausado'} className="rounded-xl bg-[#1a1a1f] px-4 py-3 text-[14px] font-bold text-[#f0f0f2] disabled:opacity-40">Pular pro fim</button>
        {onOutra && <button onClick={onOutra} className="rounded-xl bg-[#1a1a1f] px-4 py-3 text-[14px] font-bold text-[#f0f0f2]">Outra partida</button>}
      </div>
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b9a]">
        Velocidade
        {[1, 2, 4].map((v) => (
          <button key={v} onClick={() => r.setVelocidade(v)} className={`rounded-lg px-2.5 py-1 font-bold ${r.velocidade === v ? 'bg-[#f59e0b] text-black' : 'bg-[#1a1a1f] text-[#f0f0f2]'}`}>{v}x</button>
        ))}
        <label className="ml-auto flex items-center gap-1"><input type="checkbox" checked={replay} onChange={(e) => setReplay(e.target.checked)} className="accent-[#f59e0b]" /> replay</label>
        {controlesExtras}
      </div>

      <div className="flex gap-1 rounded-xl bg-[#111113] p-1">
        {[['lances', 'Lances'], ['stats', 'Estatísticas'], ['jogadores', 'Jogadores'], ...(abaExtra ? [['extra', abaExtra.rotulo]] : [])].map(([k, n]) => (
          <button key={k} onClick={() => setAba(k)} className={`flex-1 rounded-lg py-2 text-[13px] font-bold ${aba === k ? 'bg-[#1a1a1f] text-[#f59e0b]' : 'text-[#8b8b9a]'}`}>{n}</button>
        ))}
      </div>

      {aba === 'lances' && (
        <ul className="space-y-1">
          {lances.length === 0 && <li className="rounded-xl bg-[#111113] p-3 text-[14px] text-[#8b8b9a]">Aperte "Começar jogo".</li>}
          {lances.slice(0, 60).map((e) => (
            <li key={e.ordem} className={`flex gap-3 rounded-xl bg-[#111113] px-3 py-2 text-[14px] ${COR_TIPO[e.tipo] ?? 'text-[#f0f0f2]'}`}>
              <span className="w-12 shrink-0 font-bold text-[#8b8b9a]">{e.rotulo}</span>
              <span className={e.time === 'A' ? 'border-l-2 border-[#7c3aed] pl-2' : e.time === 'B' ? 'border-l-2 border-[#d1d5db] pl-2' : 'pl-2'}>{textoLance(e)}</span>
            </li>
          ))}
        </ul>
      )}

      {aba === 'stats' && (
        <div className="rounded-2xl bg-[#111113] px-4 py-2">
          <BarraStat rotulo="Posse de bola" a={parciais.A.posse} b={parciais.B.posse} pct />
          <BarraStat rotulo="Finalizações" a={parciais.A.finalizacoes} b={parciais.B.finalizacoes} />
          <BarraStat rotulo="No alvo" a={parciais.A.noAlvo} b={parciais.B.noAlvo} />
          <BarraStat rotulo="Defesas" a={parciais.A.defesas} b={parciais.B.defesas} />
          <BarraStat rotulo="Escanteios" a={parciais.A.escanteios} b={parciais.B.escanteios} />
          <BarraStat rotulo="Faltas" a={parciais.A.faltas} b={parciais.B.faltas} />
          <BarraStat rotulo="Impedimentos" a={parciais.A.impedimentos} b={parciais.B.impedimentos} />
          <BarraStat rotulo="Cartões amarelos" a={parciais.A.amarelos} b={parciais.B.amarelos} />
          <BarraStat rotulo="Cartões vermelhos" a={parciais.A.vermelhos} b={parciais.B.vermelhos} />
        </div>
      )}

      {aba === 'jogadores' && (
        <div className="rounded-2xl bg-[#111113] p-3">
          {tally.length === 0 && <div className="text-[14px] text-[#8b8b9a]">Ninguém apareceu ainda.</div>}
          {tally.length > 0 && (
            <table className="w-full text-[13px] text-[#f0f0f2]">
              <thead><tr className="text-left text-[11px] uppercase text-[#8b8b9a]"><th className="py-1">Jogador</th><th>G</th><th>A</th><th>Falt</th><th>Am</th><th>Vm</th></tr></thead>
              <tbody>
                {tally.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="py-1.5"><span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${p.time === 'A' ? 'bg-[#7c3aed]' : 'bg-[#d1d5db]'}`} />{p.nome}</td>
                    <td className="font-bold text-[#fbbf24]">{p.gols || '-'}</td><td>{p.ass || '-'}</td><td>{p.faltas || '-'}</td>
                    <td className="text-[#facc15]">{p.am || '-'}</td><td className="text-[#ef4444]">{p.vm || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {r.estado === 'fim' && sim.melhorEmCampo && <div className="mt-3 text-[13px] text-[#8b8b9a]">Melhor em campo: <b className="text-[#f59e0b]">{sim.melhorEmCampo.nome}</b> (nota {sim.melhorEmCampo.nota})</div>}
        </div>
      )}

      {aba === 'extra' && abaExtra?.conteudo}
    </div>
  )
}

