import { premios, rankings } from '../campeonatoStats.js'

function Lista({ titulo, lista, campo, cor }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">{titulo}</p>
      {lista.length === 0 && <p className="text-xs text-muted">ninguém ainda</p>}
      {lista.map((p, i) => (
        <div key={p.id} className="flex items-center gap-2 py-1 text-sm">
          <span className="w-4 text-muted">{i + 1}</span>
          <span className="min-w-0 flex-1 truncate">{p.nome} <span className="text-xs text-secondary">{p.timeNome}</span></span>
          <b className={cor}>{p[campo]}</b>
        </div>
      ))}
    </div>
  )
}

// Artilharia, assistências, faltas e cartões do campeonato (com as etapas reveladas).
export function Rankings({ est }) {
  return (
    <div className="space-y-2">
      <Lista titulo="Artilheiros" lista={rankings.artilheiros(est, 5)} campo="gols" cor="text-accent" />
      <Lista titulo="Assistências" lista={rankings.assistentes(est, 5)} campo="assistencias" cor="text-success" />
      <Lista titulo="Faltas cometidas" lista={rankings.faltosos(est, 5)} campo="faltas" cor="text-primary" />
      <Lista titulo="Cartões amarelos" lista={rankings.amarelos(est, 5)} campo="amarelos" cor="text-[#facc15]" />
      <Lista titulo="Cartões vermelhos" lista={rankings.vermelhos(est, 5)} campo="vermelhos" cor="text-danger" />
      <Lista titulo="Goleiros (defesas)" lista={rankings.goleiros(est, 3)} campo="defesas" cor="text-success" />
    </div>
  )
}

function Premio({ titulo, p, texto }) {
  if (!p) return null
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent-glow p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-accent">{titulo}</p>
      <p className="mt-1 text-[15px] font-extrabold leading-tight">{p.nome}</p>
      <p className="text-xs text-secondary">{p.timeNome ?? ''} {texto ?? `· ${p.valor} ${p.unidade}`}</p>
    </div>
  )
}

// Premiação final: artilheiro, garçom, melhor jogador/goleiro, craque, açougueiro, cartões, fair play, ataque, defesa e seleção.
export function Premiacao({ est }) {
  const p = premios(est)
  return (
    <div className="grid grid-cols-2 gap-2">
      <Premio titulo="Artilheiro" p={p.artilheiro} />
      <Premio titulo="Garçom" p={p.garcom} />
      <Premio titulo="Melhor jogador" p={p.melhorJogador} />
      <Premio titulo="Melhor goleiro" p={p.melhorGoleiro} />
      <Premio titulo="Craque das partidas" p={p.craqueDasPartidas} />
      <Premio titulo="Açougueiro" p={p.acougueiro} />
      <Premio titulo="Mais amarelos" p={p.maisAmarelos} />
      <Premio titulo="Mais vermelhos" p={p.maisVermelhos} />
      {p.fairPlay && <Premio titulo="Fair play" p={{ nome: p.fairPlay.nome }} texto={`· ${p.fairPlay.amarelos} am · ${p.fairPlay.vermelhos} vm`} />}
      {p.melhorAtaque && <Premio titulo="Melhor ataque" p={{ nome: p.melhorAtaque.nome }} texto={`· ${p.melhorAtaque.gols} gols`} />}
      {p.melhorDefesa && <Premio titulo="Melhor defesa" p={{ nome: p.melhorDefesa.nome }} texto={`· ${p.melhorDefesa.golsSofridos} sofridos`} />}
      <div className="col-span-2 rounded-2xl border border-border bg-surface p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">Seleção do campeonato</p>
        {p.selecao.map((s, i) => (
          <div key={i} className="flex gap-2 py-0.5 text-[13px]">
            <span className="w-9 font-bold text-accent">{s.rotulo}</span>
            <span className="min-w-0 flex-1 truncate">{s.jogador ? s.jogador.nome : '—'} <span className="text-secondary">{s.jogador?.timeNome}</span></span>
            <b>{s.jogador?.nota}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
