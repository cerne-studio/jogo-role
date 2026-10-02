import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X, Smile, Star, ClipboardList, Users, Sparkles, HeartPulse, Wallet, Check } from 'lucide-react'
import {
  modificadores, confortoFinanceiro, podeGastar, custoServicos, jaUsouNoAno,
  SERVICOS, BENS, ACOES, NOMES_ATRIBUTO, alternarServico, comprarBem, usarAcao,
} from '../../nba/engine/status.js'
import { rendaLiquidaAno } from '../../nba/engine/contrato.js'
import { fmtMi } from './ui.jsx'

const sg = (v, c = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(c).replace('.', ',')}`

function nivelTexto(v, faixas) {
  return faixas.find(([max]) => v < max)?.[1] ?? faixas[faixas.length - 1][1]
}

// Cada linha diz o valor, como mudou na temporada e o que isso faz de verdade na simulação.
function linhas(e) {
  const m = modificadores(e)
  const risco = Math.round(m.riscoLesao * 100)
  return [
    {
      k: 'moral', rotulo: 'Moral', Icon: Smile,
      nivel: nivelTexto(e.moral, [[25, 'Abalado'], [45, 'Baixa'], [65, 'Estável'], [85, 'Alta'], [101, 'Voando']]),
      efeito: `${sg(m.forma)} de overall em quadra. Sobe com vitórias, título e bons eventos.`,
      bom: m.forma >= 0.3, ruim: m.forma <= -0.3,
    },
    {
      k: 'fama', rotulo: 'Fama', Icon: Star,
      nivel: nivelTexto(e.fama, [[20, 'Desconhecido'], [40, 'Conhecido'], [60, 'Popular'], [80, 'Astro'], [101, 'Ícone']]),
      efeito: `Contrato ${sg(m.valorFama, 0)}% no valor de mercado. Abre patrocínio, pesa nos votos de prêmio e no draft.`,
      bom: e.fama >= 55, ruim: e.fama < 25,
    },
    {
      k: 'tecnico', rotulo: 'Técnico', Icon: ClipboardList,
      nivel: nivelTexto(e.tecnico, [[25, 'Não confia'], [45, 'Desconfiado'], [65, 'Normal'], [85, 'Confia'], [101, 'Fã de você']]),
      efeito: `${sg(m.minutos)} no seu papel no time (minutos e posição na rotação). Também pesa na renovação.`,
      bom: m.minutos >= 0.3, ruim: m.minutos <= -0.3,
    },
    {
      k: 'vestiario', rotulo: 'Vestiário', Icon: Users,
      nivel: nivelTexto(e.vestiario, [[25, 'Racha'], [45, 'Tenso'], [65, 'Normal'], [85, 'Unido'], [101, 'Família']]),
      efeito: `${sg(m.quimica)} na força do time (mais vitórias). Também pesa na lealdade da renovação.`,
      bom: m.quimica >= 0.3, ruim: m.quimica <= -0.3,
    },
    {
      k: 'imagem', rotulo: 'Imagem', Icon: Sparkles,
      nivel: nivelTexto(e.imagem, [[25, 'Queimada'], [45, 'Arranhada'], [65, 'Neutra'], [85, 'Boa'], [101, 'Exemplar']]),
      efeito: `Patrocínios ×${m.patroImagem.toFixed(2).replace('.', ',')}. Marcas fogem de quem tem imagem ruim.`,
      bom: e.imagem >= 60, ruim: e.imagem < 35,
    },
    {
      k: 'desgaste', rotulo: 'Desgaste', Icon: HeartPulse, invertida: true,
      nivel: nivelTexto(e.desgaste, [[25, 'Fresco'], [50, 'Cansado'], [70, 'Castigado'], [101, 'No limite']]),
      efeito: `Risco de lesão de ${risco}% na temporada.${m.perdeAtributo ? ' Acima de 65 você perde atributo no fim do ano.' : ' Sobe com jogos e playoffs; cai a cada virada de ano.'}`,
      bom: e.desgaste < 35, ruim: e.desgaste >= 60,
    },
  ]
}

export function StatusBarras({ estado }) {
  const ini = estado.statusInicio
  return (
    <div className="flex flex-col gap-3">
      {linhas(estado).map(({ k, rotulo, Icon, nivel, efeito, bom, ruim, invertida }) => {
        const v = Math.round(estado[k])
        const d = ini ? v - ini[k] : 0
        const bomDelta = invertida ? d < 0 : d > 0
        const cor = bom ? 'bg-emerald-400' : ruim ? 'bg-red-400' : 'bg-accent'
        return (
          <div key={k} className="rounded-2xl border border-border bg-surface p-3.5">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold">{rotulo}</span>
              <span className="text-[11px] text-muted">{nivel}</span>
              <span className="ml-auto flex items-baseline gap-1.5">
                {d !== 0 && <span className={`text-[11px] font-semibold tabular-nums ${bomDelta ? 'text-emerald-300' : 'text-red-300'}`}>{d > 0 ? '+' : '−'}{Math.abs(d)}</span>}
                <span className="text-sm font-bold tabular-nums">{v}</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} className={`h-full rounded-full ${cor}`} />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-secondary">{efeito}</p>
          </div>
        )
      })}
    </div>
  )
}

function Linha({ titulo, efeito, custo, rotuloCusto, children }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{titulo}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-secondary">{efeito}</p>
          <p className="mt-1 text-[11px] font-medium text-accent">{rotuloCusto ?? `${fmtMi(custo, 2)}`}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function Botao({ onClick, disabled, secundario, children }) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-30 ${secundario ? 'border border-border-strong text-primary' : 'bg-accent text-black'}`}
    >
      {children}
    </motion.button>
  )
}

function Chips({ opcoes, valor, onEscolher }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {opcoes.map(([v, rotulo]) => (
        <button key={v} onClick={() => onEscolher(v)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${valor === v ? 'border-accent bg-accent-glow text-accent' : 'border-border-strong text-secondary'}`}>
          {rotulo}
        </button>
      ))}
    </div>
  )
}

function AbaDinheiro({ estado, rng, onMudar }) {
  const [msg, setMsg] = useState(null)
  const [atr, setAtr] = useState('arremesso')
  const [valor, setValor] = useState(1)
  const liberado = podeGastar(estado)
  const conforto = confortoFinanceiro(estado)
  const patrimonio = estado.dinheiro.patrimonio

  function aplicar(r) {
    if (r.erro) {
      setMsg({ erro: true, t: r.erro })
      return
    }
    onMudar(r.estado)
    setMsg({ t: r.mensagem })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border bg-surface p-3.5">
          <Wallet className="h-4 w-4 text-accent" />
          <p className="mt-1.5 text-lg font-bold tabular-nums">{fmtMi(patrimonio, 1)}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted">Patrimônio</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3.5">
          <p className="text-lg font-bold tabular-nums">{liberado ? fmtMi(rendaLiquidaAno(estado), 1) : '—'}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted">Renda líquida/ano</p>
          {custoServicos(estado) > 0 && <p className="mt-1 text-[10px] text-secondary">já descontando {fmtMi(custoServicos(estado), 2)} de equipe</p>}
        </div>
      </div>

      <p className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[11px] leading-snug text-secondary">
        <b className="text-primary">Conforto financeiro:</b>{' '}
        {conforto < 0 ? 'patrimônio abaixo de US$ 0,3 mi: a preocupação pesa (moral −3 por temporada).' : conforto > 0 ? 'patrimônio acima de US$ 25 mi: cabeça tranquila (moral +2 por temporada).' : 'entre US$ 0,3 e 25 mi: sem efeito. Abaixo disso a moral sofre, acima ela ganha.'}
      </p>

      {!liberado && (
        <p className="rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-secondary">Dinheiro de verdade só depois que você virar profissional (G League, NBA ou exterior). Na base o foco é jogo.</p>
      )}

      <AnimatePresence>
        {msg && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`rounded-xl border px-3.5 py-2.5 text-xs ${msg.erro ? 'border-red-500/30 bg-red-500/5 text-red-200' : 'border-emerald-400/30 bg-emerald-400/5 text-emerald-200'}`}>
            {msg.t}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-muted">Equipe pessoal · cobrada todo ano</p>
      {SERVICOS.map((s) => {
        const ativo = !!estado.servicos?.[s.id]
        return (
          <Linha key={s.id} titulo={s.nome} efeito={s.efeito} custo={s.custo} rotuloCusto={`${fmtMi(s.custo, 2)} por ano`}>
            <Botao secundario={ativo} disabled={!liberado} onClick={() => aplicar(alternarServico(estado, s.id))}>
              {ativo ? <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Ativo</span> : 'Contratar'}
            </Botao>
          </Linha>
        )
      })}

      <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted">Gastos da temporada</p>
      {ACOES.map((a) => {
        const usou = jaUsouNoAno(estado, a.id)
        const custo = a.id === 'investir' ? valor : a.custo
        const param = a.id === 'treino' ? atr : a.id === 'investir' ? valor : undefined
        return (
          <div key={a.id}>
            <Linha titulo={a.nome} efeito={a.efeito} custo={custo} rotuloCusto={fmtMi(custo, a.id === 'investir' ? 0 : 2)}>
              <Botao disabled={!liberado || usou || patrimonio < custo} onClick={() => aplicar(usarAcao(estado, a.id, rng, param))}>
                {usou ? 'Feito' : a.id === 'investir' ? 'Investir' : 'Fazer'}
              </Botao>
            </Linha>
            {a.escolhe === 'atributo' && <Chips opcoes={Object.entries(NOMES_ATRIBUTO)} valor={atr} onEscolher={setAtr} />}
            {a.escolhe === 'valor' && <Chips opcoes={a.valores.map((v) => [v, `US$ ${v} mi`])} valor={valor} onEscolher={setValor} />}
          </div>
        )
      })}

      <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted">Bens</p>
      {BENS.map((b) => {
        const tem = !!estado.bens?.[b.id]
        return (
          <Linha key={b.id} titulo={b.nome} efeito={b.efeito} custo={b.custo}>
            <Botao disabled={!liberado || tem || patrimonio < b.custo} onClick={() => aplicar(comprarBem(estado, b.id))}>{tem ? 'Comprado' : 'Comprar'}</Botao>
          </Linha>
        )
      })}
      <p className="pb-4 text-[11px] leading-relaxed text-muted">Dinheiro não compra título: ele deixa o corpo e a cabeça no melhor estado possível. O resto continua com você em quadra.</p>
    </div>
  )
}

// Folha em tela cheia com status (barras + efeito) e a aba de dinheiro.
export function PainelJogador({ estado, rng, onMudar, onFechar }) {
  const [aba, setAba] = useState('status')
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-[#0a0a0b]">
      <div className="mx-auto w-full max-w-sm px-5 pb-8 pt-5">
        <div className="sticky top-0 z-10 -mx-5 flex items-center gap-2 bg-[#0a0a0b]/95 px-5 pb-3 pt-1 backdrop-blur">
          {[['status', 'Status'], ['dinheiro', 'Dinheiro']].map(([id, rotulo]) => (
            <button key={id} onClick={() => setAba(id)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${aba === id ? 'border-accent bg-accent-glow text-accent' : 'border-border-strong text-secondary'}`}>
              {rotulo}
            </button>
          ))}
          <button onClick={onFechar} aria-label="Fechar painel" className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface text-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        {aba === 'status' ? (
          <>
            <p className="mb-3 text-xs leading-relaxed text-secondary">Esses números mexem de verdade na simulação. A mudança ao lado de cada barra é desde o começo da temporada.</p>
            <StatusBarras estado={estado} />
          </>
        ) : (
          <AbaDinheiro estado={estado} rng={rng} onMudar={onMudar} />
        )}
      </div>
    </motion.div>
  )
}
