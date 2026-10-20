import { useMemo, useState } from 'react'
import PartidaAoVivo from './PartidaAoVivo.jsx'
import { simularPartida } from './motor.js'
import { gerarTime } from './amostras.js'
import { LISTA_FORMACOES } from './formacoes.js'
import { simularCampeonatoDemo } from './campeonatoDemo.js'
import { rankings } from './campeonatoStats.js'

const TATICAS = ['ofensiva', 'equilibrada', 'defensiva']

function PainelTime({ rotulo, cfg, setCfg }) {
  return (
    <div className="rounded-2xl bg-[#111113] p-3">
      <div className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#8b8b9a]">{rotulo}</div>
      <div className="flex flex-wrap gap-1.5">
        {LISTA_FORMACOES.map((f) => (
          <button key={f} onClick={() => setCfg({ ...cfg, formacao: f })} className={`rounded-lg px-2 py-1 text-[12px] font-bold ${cfg.formacao === f ? 'bg-[#f59e0b] text-black' : 'bg-[#1a1a1f] text-[#f0f0f2]'}`}>{f}</button>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {TATICAS.map((t) => (
          <button key={t} onClick={() => setCfg({ ...cfg, tatica: t })} className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-bold capitalize ${cfg.tatica === t ? 'bg-[#f59e0b] text-black' : 'bg-[#1a1a1f] text-[#f0f0f2]'}`}>{t}</button>
        ))}
      </div>
      <label className="mt-2 block text-[12px] text-[#8b8b9a]">Nível do time: <b className="text-[#f0f0f2]">{cfg.nivel}</b>
        <input type="range" min="60" max="92" value={cfg.nivel} onChange={(e) => setCfg({ ...cfg, nivel: +e.target.value })} className="mt-1 w-full accent-[#f59e0b]" />
      </label>
      <label className="block text-[12px] text-[#8b8b9a]">Agressividade: <b className="text-[#f0f0f2]">{cfg.agressividade}</b>
        <input type="range" min="15" max="95" value={cfg.agressividade} onChange={(e) => setCfg({ ...cfg, agressividade: +e.target.value })} className="mt-1 w-full accent-[#ef4444]" />
      </label>
    </div>
  )
}

function TabPartida() {
  const [semente, setSemente] = useState(7)
  const [mataMata, setMataMata] = useState(false)
  const [cfgA, setCfgA] = useState({ formacao: '4-3-3', tatica: 'ofensiva', nivel: 80, agressividade: 70 })
  const [cfgB, setCfgB] = useState({ formacao: '4-4-2', tatica: 'defensiva', nivel: 76, agressividade: 45 })

  const { cfg, sim } = useMemo(() => {
    const A = gerarTime({ id: 'a', nome: 'Roxos', ...cfgA, semente })
    const B = gerarTime({ id: 'b', nome: 'Brancos', ...cfgB, semente: semente + 11 })
    return { cfg: { A, B }, sim: simularPartida(A, B, { semente, mataMata }) }
  }, [cfgA, cfgB, semente, mataMata])

  return (
    <PartidaAoVivo
      sim={sim}
      cfg={cfg}
      onOutra={() => setSemente((x) => x + 1)}
      controlesExtras={
        <label className="flex items-center gap-1"><input type="checkbox" checked={mataMata} onChange={(e) => setMataMata(e.target.checked)} className="accent-[#f59e0b]" /> mata-mata</label>
      }
      abaExtra={{
        rotulo: 'Times',
        conteudo: (
          <div className="space-y-3">
            <PainelTime rotulo="Roxos (time A)" cfg={cfgA} setCfg={setCfgA} />
            <PainelTime rotulo="Brancos (time B)" cfg={cfgB} setCfg={setCfgB} />
          </div>
        ),
      }}
    />
  )
}

function Ranking({ titulo, lista, campo, cor }) {
  return (
    <div className="rounded-2xl bg-[#111113] p-3">
      <div className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#8b8b9a]">{titulo}</div>
      {lista.length === 0 && <div className="text-[13px] text-[#8b8b9a]">ninguém</div>}
      {lista.map((p, i) => (
        <div key={p.id} className="flex items-center gap-2 py-1 text-[14px] text-[#f0f0f2]">
          <span className="w-4 text-[#8b8b9a]">{i + 1}</span>
          <span className="flex-1 truncate">{p.nome} <span className="text-[12px] text-[#8b8b9a]">{p.timeNome}</span></span>
          <b className={cor}>{p[campo]}</b>
        </div>
      ))}
    </div>
  )
}

function Premio({ titulo, p, texto }) {
  if (!p) return null
  return (
    <div className="rounded-2xl border border-[#f59e0b]/30 bg-[#1a1408] p-3">
      <div className="text-[11px] font-bold uppercase tracking-widest text-[#f59e0b]">{titulo}</div>
      <div className="mt-1 text-[16px] font-extrabold text-[#f0f0f2]">{p.nome}</div>
      <div className="text-[12px] text-[#8b8b9a]">{p.timeNome ?? ''} {texto ?? `· ${p.valor} ${p.unidade}`}</div>
    </div>
  )
}

function TabCampeonato() {
  const [semente, setSemente] = useState(3)
  const c = useMemo(() => simularCampeonatoDemo({ semente }), [semente])
  const [aba, setAba] = useState('premios')
  const nomeTime = (id) => c.times.find((t) => t.id === id)?.nome
  const p = c.premios
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#f59e0b]/40 bg-[#1a1408] p-4 text-center">
        <div className="text-[12px] font-bold uppercase tracking-widest text-[#f59e0b]">Campeão</div>
        <div className="text-[26px] font-extrabold text-[#fbbf24]">{c.campeao.nome}</div>
        <div className="text-[13px] text-[#8b8b9a]">vice: {c.vice.nome}</div>
      </div>
      <button onClick={() => setSemente((s) => s + 1)} className="w-full rounded-xl bg-[#f59e0b] py-3 text-[15px] font-extrabold text-black">Simular outro campeonato</button>
      <div className="flex gap-1 rounded-xl bg-[#111113] p-1">
        {[['premios', 'Premiação'], ['rank', 'Rankings'], ['tabela', 'Grupos'], ['jogos', 'Jogos']].map(([k, n]) => (
          <button key={k} onClick={() => setAba(k)} className={`flex-1 rounded-lg py-2 text-[13px] font-bold ${aba === k ? 'bg-[#1a1a1f] text-[#f59e0b]' : 'text-[#8b8b9a]'}`}>{n}</button>
        ))}
      </div>

      {aba === 'premios' && (
        <div className="grid grid-cols-2 gap-2">
          <Premio titulo="Artilheiro" p={p.artilheiro} />
          <Premio titulo="Garçom" p={p.garcom} />
          <Premio titulo="Melhor jogador" p={p.melhorJogador} />
          <Premio titulo="Melhor goleiro" p={p.melhorGoleiro} />
          <Premio titulo="Craque das partidas" p={p.craqueDasPartidas} />
          <Premio titulo="Açougueiro (faltas)" p={p.acougueiro} />
          <Premio titulo="Mais amarelos" p={p.maisAmarelos} />
          <Premio titulo="Mais vermelhos" p={p.maisVermelhos} />
          {p.fairPlay && <Premio titulo="Fair play" p={{ nome: p.fairPlay.nome }} texto={`· ${p.fairPlay.amarelos} am · ${p.fairPlay.vermelhos} vm`} />}
          {p.melhorAtaque && <Premio titulo="Melhor ataque" p={{ nome: p.melhorAtaque.nome }} texto={`· ${p.melhorAtaque.gols} gols`} />}
          {p.melhorDefesa && <Premio titulo="Melhor defesa" p={{ nome: p.melhorDefesa.nome }} texto={`· ${p.melhorDefesa.golsSofridos} sofridos`} />}
          <div className="col-span-2 rounded-2xl bg-[#111113] p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#8b8b9a]">Seleção do campeonato</div>
            {p.selecao.map((s, i) => (
              <div key={i} className="flex gap-2 py-0.5 text-[13px] text-[#f0f0f2]">
                <span className="w-9 font-bold text-[#f59e0b]">{s.rotulo}</span>
                <span className="flex-1 truncate">{s.jogador ? s.jogador.nome : '—'} <span className="text-[#8b8b9a]">{s.jogador?.timeNome}</span></span>
                <b>{s.jogador?.nota}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {aba === 'rank' && (
        <div className="space-y-2">
          <Ranking titulo="Artilheiros" lista={rankings.artilheiros(c.est, 5)} campo="gols" cor="text-[#fbbf24]" />
          <Ranking titulo="Assistências" lista={rankings.assistentes(c.est, 5)} campo="assistencias" cor="text-[#10b981]" />
          <Ranking titulo="Faltas cometidas" lista={rankings.faltosos(c.est, 5)} campo="faltas" cor="text-[#f0f0f2]" />
          <Ranking titulo="Cartões amarelos" lista={rankings.amarelos(c.est, 5)} campo="amarelos" cor="text-[#facc15]" />
          <Ranking titulo="Cartões vermelhos" lista={rankings.vermelhos(c.est, 5)} campo="vermelhos" cor="text-[#ef4444]" />
          <Ranking titulo="Goleiros (defesas)" lista={rankings.goleiros(c.est, 3)} campo="defesas" cor="text-[#10b981]" />
        </div>
      )}

      {aba === 'tabela' && c.tabela.map((g, gi) => (
        <div key={gi} className="rounded-2xl bg-[#111113] p-3">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#8b8b9a]">Grupo {'AB'[gi]}</div>
          <table className="w-full text-[13px] text-[#f0f0f2]">
            <thead><tr className="text-left text-[11px] uppercase text-[#8b8b9a]"><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th></tr></thead>
            <tbody>
              {g.map((t, i) => (
                <tr key={t.id} className={`border-t border-white/5 ${i < 2 ? 'text-[#f0f0f2]' : 'text-[#8b8b9a]'}`}>
                  <td className="py-1.5">{i < 2 && <span className="mr-1 text-[#10b981]">●</span>}{t.nome}</td><td className="font-bold">{t.pts}</td><td>{t.j}</td><td>{t.v}</td><td>{t.e}</td><td>{t.d}</td><td>{t.sg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {aba === 'jogos' && (
        <div className="space-y-1">
          {c.jogos.map((j, i) => (
            <div key={i} className="rounded-xl bg-[#111113] px-3 py-2 text-[13px] text-[#f0f0f2]">
              <div className="text-[11px] text-[#8b8b9a]">{j.rotulo}{(j.suspensosA || j.suspensosB) ? ` · suspensos: ${j.suspensosA + j.suspensosB}` : ''}</div>
              <div className="flex justify-between"><span>{j.A.nome}</span><b>{j.resultado.golsA} x {j.resultado.golsB}</b><span>{j.B.nome}</span></div>
              {j.resultado.decididoPor && j.resultado.decididoPor !== 'normal' && <div className="text-[11px] text-[#f59e0b]">{j.resultado.decididoPor}{j.resultado.penaltis ? ` (${j.resultado.penaltis.A} x ${j.resultado.penaltis.B})` : ''} · vencedor {nomeTime(j.resultado.vencedor === 'A' ? j.A.id : j.B.id)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FutebolDemo() {
  const [aba, setAba] = useState('partida')
  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 pb-10 pt-4 text-[#f0f0f2]" style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[480px] space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-extrabold">DRAFT FC <span className="text-[13px] font-medium text-[#8b8b9a]">· demo do motor</span></h1>
        </div>
        <div className="flex gap-1 rounded-xl bg-[#111113] p-1">
          {[['partida', 'Partida ao vivo'], ['campeonato', 'Campeonato']].map(([k, n]) => (
            <button key={k} onClick={() => setAba(k)} className={`flex-1 rounded-lg py-2 text-[14px] font-bold ${aba === k ? 'bg-[#f59e0b] text-black' : 'text-[#8b8b9a]'}`}>{n}</button>
          ))}
        </div>
        {aba === 'partida' ? <TabPartida /> : <TabCampeonato />}
      </div>
    </div>
  )
}
