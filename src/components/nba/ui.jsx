import { useState } from 'react'
import { motion } from 'motion/react'
import { TIMES_POR_ID, POSICOES } from '../../nba/data/times.js'

// ── Logos oficiais vêm do CDN da própria NBA (não ficam no repositório). Se a imagem falhar, cai no emblema próprio. ──
const LOGO_TIME = (nbaId) => `https://cdn.nba.com/logos/nba/${nbaId}/global/L/logo.svg`
const LOGO_LIGA = {
  nba: 'https://cdn.nba.com/logos/leagues/logo-nba.svg',
  gleague: 'https://cdn.nba.com/logos/leagues/logo-gleague.svg',
}

function EmblemaTexto({ id, nome, tamanho }) {
  const t = id ? TIMES_POR_ID[id] : null
  const [c1, c2] = t?.cores ?? ['#3f3f46', '#a1a1aa']
  const sigla = t?.sigla ?? (nome ? nome.slice(0, 3).toUpperCase() : '—')
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-label={t?.nome ?? nome} className="shrink-0">
      <circle cx="24" cy="24" r="22" fill={c1} />
      <circle cx="24" cy="24" r="22" fill="none" stroke={c2} strokeWidth="3" />
      <circle cx="24" cy="24" r="17" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <text x="24" y="29" textAnchor="middle" fontSize={sigla.length > 3 ? 11 : 14} fontWeight="800" fill={c2} fontFamily="Geist, system-ui, sans-serif" letterSpacing="0.5">
        {sigla}
      </text>
    </svg>
  )
}

export function TimeEscudo({ id, nome, tamanho = 40 }) {
  const t = id ? TIMES_POR_ID[id] : null
  const [falhou, setFalhou] = useState(false)
  if (!t?.nbaId || falhou) return <EmblemaTexto id={id} nome={nome} tamanho={tamanho} />
  const miolo = Math.round(tamanho * 0.8)
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/95" style={{ width: tamanho, height: tamanho }}>
      <img src={LOGO_TIME(t.nbaId)} alt={t.nome} width={miolo} height={miolo} loading="lazy" decoding="async" onError={() => setFalhou(true)} className="object-contain" />
    </span>
  )
}

// Logo da liga (NBA / G League) num chip claro pra aparecer bem no tema escuro.
export function SeloLiga({ tipo = 'nba', altura = 18 }) {
  const [falhou, setFalhou] = useState(false)
  const g = tipo === 'gleague'
  if (falhou) {
    return (
      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest ${g ? 'border-emerald-400/40 text-emerald-300' : 'border-accent/50 text-accent'}`}>
        {g ? 'G League' : 'NBA'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md bg-white/95 px-1.5 py-1">
      <img src={LOGO_LIGA[tipo]} alt={g ? 'NBA G League' : 'NBA'} height={altura} style={{ height: altura, width: 'auto' }} loading="lazy" decoding="async" onError={() => setFalhou(true)} />
    </span>
  )
}

export function Barra({ rotulo, valor, max = 100, cor = 'bg-accent', mostrar = true }) {
  const pct = Math.max(0, Math.min(100, (valor / max) * 100))
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[11px] text-secondary">{rotulo}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className={`h-full rounded-full ${cor}`} />
      </div>
      {mostrar && <span className="w-7 text-right text-[11px] font-semibold tabular-nums">{Math.round(valor)}</span>}
    </div>
  )
}

export function Stat({ rotulo, valor, destaque }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-2 py-2.5">
      <span className={`text-lg font-bold tabular-nums leading-none ${destaque ? 'text-accent' : 'text-primary'}`}>{valor}</span>
      <span className="mt-1 text-[10px] uppercase tracking-widest text-muted">{rotulo}</span>
    </div>
  )
}

export function Titulo({ pequeno, children, sub }) {
  return (
    <div>
      {pequeno && <p className="text-[11px] font-medium uppercase tracking-widest text-muted">{pequeno}</p>}
      <h1 className="mt-1 text-2xl font-bold tracking-tight">{children}</h1>
      {sub && <p className="mt-1 text-sm text-secondary">{sub}</p>}
    </div>
  )
}

export function BotaoPrimario({ children, onClick, disabled, secundario }) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl px-6 py-4 text-[16px] font-semibold disabled:opacity-30 ${secundario ? 'border border-border-strong bg-surface text-primary' : 'bg-accent text-black'}`}
    >
      {children}
    </motion.button>
  )
}

export const posicaoSigla = (id) => POSICOES.find((p) => p.id === id)?.sigla ?? ''
export const posicaoNome = (id) => POSICOES.find((p) => p.id === id)?.nome ?? ''
export const fmtMi = (v, casas = 1) => `US$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })} mi`
export const fmtNum = (n) => Math.round(n).toLocaleString('pt-BR')

// ── Cartão do jogador (estilo carta colecionável) ──
export function CartaoJogador({ estado, compacto }) {
  const t = estado.time ? TIMES_POR_ID[estado.time] : null
  const [c1, c2] = t?.cores ?? ['#2a2a31', '#8b8b9a']
  const ovr = estado.media
  const tier = ovr >= 90 ? 'Lenda' : ovr >= 82 ? 'Superestrela' : ovr >= 75 ? 'All-Star' : ovr >= 68 ? 'Titular' : ovr >= 60 ? 'Rotação' : 'Prospecto'
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10" style={{ background: `linear-gradient(145deg, ${c1}, #0b0b0d 70%)` }}>
      <div className="pointer-events-none absolute -right-6 -top-10 select-none text-[150px] font-black leading-none text-white/[0.06]">{estado.jogador.numero}</div>
      <div className={`relative flex items-center gap-4 ${compacto ? 'p-4' : 'p-5'}`}>
        <div className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 bg-black/40" style={{ borderColor: c2 }}>
          <span className="text-3xl font-extrabold leading-none tabular-nums">{ovr}</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-white/60">OVR</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold leading-tight tracking-tight">{estado.jogador.sobrenome}</p>
          <p className="mt-0.5 text-xs text-white/70">
            #{estado.jogador.numero} · {posicaoNome(estado.jogador.posicao)} · {estado.jogador.altura} cm · {estado.idade} anos
          </p>
          <div className="mt-2 flex items-center gap-2">
            {t ? <TimeEscudo id={t.id} tamanho={22} /> : null}
            <span className="truncate text-xs font-medium text-white/85">{estado.equipe}</span>
          </div>
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/70">{tier}</span>
      </div>
    </div>
  )
}

// ── Gráfico da evolução do overall por temporada ──
export function GraficoOvr({ historico, altura = 90 }) {
  const pts = historico.filter((h) => h.ovr != null)
  if (pts.length < 2) return null
  const w = 320
  const h = altura
  const min = Math.min(...pts.map((p) => p.ovr)) - 3
  const max = Math.max(...pts.map((p) => p.ovr)) + 3
  const x = (i) => 8 + (i / (pts.length - 1)) * (w - 16)
  const y = (v) => h - 8 - ((v - min) / (max - min || 1)) * (h - 16)
  const linha = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.ovr).toFixed(1)}`).join(' ')
  const area = `${linha} L${x(pts.length - 1)},${h - 8} L${x(0)},${h - 8} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Evolução do overall">
      <defs>
        <linearGradient id="ovrArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ovrArea)" />
      <path d={linha} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.ovr)} r={p.campeao ? 4 : 2.4} fill={p.campeao ? '#fbbf24' : '#f59e0b'} stroke={p.campeao ? '#fff' : 'none'} strokeWidth="1" />
        </g>
      ))}
    </svg>
  )
}

export const NOMES_PREMIO = {
  mvp: 'MVP', fmvp: 'MVP das Finais', dpoy: 'Defensor do Ano', roy: 'Novato do Ano', sixth: 'Sexto Homem', mip: 'Mais Evoluiu',
  allstar: 'All-Star', allnba1: 'All-NBA 1º', allnba2: 'All-NBA 2º', allnba3: 'All-NBA 3º', alldef: 'Quinteto Defensivo',
  ptsleader: 'Cestinha', rebleader: 'Líder em rebotes', astleader: 'Líder em assistências', stlleader: 'Líder em roubos', blkleader: 'Líder em tocos',
  allamerican: 'All-American', calouro: 'Calouro do Ano', jogador_ano: 'Jogador do Ano (NCAA)', mvp_liga: 'MVP da liga', selecao_liga: 'Seleção da liga',
}
