import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Trophy, Star, Medal, Activity, TrendingUp, Wallet, Handshake, ChevronRight } from 'lucide-react'
import { TIMES_POR_ID } from '../../nba/data/times.js'
import { gerarManchete, mancheteDaEscolha } from '../../nba/engine/manchetes.js'
import { papelTexto } from '../../nba/engine/jogador.js'
import { StatusBarras } from './PainelJogador.jsx'
import { BotaoPrimario, CartaoJogador, GraficoOvr, Stat, TimeEscudo, SeloLiga, Titulo, fmtMi, NOMES_PREMIO } from './ui.jsx'

const Pagina = ({ children }) => (
  <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-5 pb-6 pt-14">{children}</div>
)
const entrada = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } }

const ROTULOS = {
  arremesso: 'Arremesso', infiltracao: 'Infiltração', passe: 'Passe', defesa: 'Defesa', fisico: 'Físico', qi: 'QI de jogo',
  moral: 'Moral', fama: 'Fama', tecnico: 'Confiança do técnico', vestiario: 'Vestiário', imagem: 'Imagem', potencial: 'Potencial',
}

// Chips com o que o evento mudou (verde = bom, vermelho = ruim). Desgaste e risco: subir é ruim.
function chipsDeEfeitos(efeitos) {
  const chips = []
  for (const [k, v] of Object.entries(efeitos ?? {})) {
    if (ROTULOS[k]) chips.push({ t: `${v > 0 ? '+' : ''}${v} ${ROTULOS[k]}`, bom: v > 0 })
    else if (k === 'desgaste') chips.push({ t: `${v > 0 ? '+' : ''}${v} Desgaste`, bom: v < 0 })
    else if (k === 'dinheiro') chips.push({ t: `${v > 0 ? '+' : '-'} US$ ${Math.abs(v).toLocaleString('pt-BR')} mi`, bom: v > 0 })
    else if (k === 'patrocinio') chips.push({ t: `${v > 0 ? '+' : '-'} US$ ${Math.abs(v).toLocaleString('pt-BR')} mi/ano em patrocínios`, bom: v > 0 })
    else if (k === 'salarioPct') chips.push({ t: `Salário ${v > 0 ? '+' : ''}${v}%`, bom: v > 0 })
    else if (k === 'risco') chips.push({ t: 'Risco de lesão', bom: v < 0 })
    else if (k === 'foraTemporada') chips.push({ t: 'Fora da temporada (recuperação)', bom: false })
    else if (k === 'minutosBonus') chips.push({ t: 'Mais minutos', bom: true })
    else if (k === 'minutosPenalidade') chips.push({ t: 'Menos minutos', bom: false })
    else if (k === 'gasto') chips.push({ t: `Gastos fixos ${v > 0 ? '+' : ''}${v}`, bom: v < 0 })
  }
  return chips
}

export function Chips({ efeitos }) {
  const chips = chipsDeEfeitos(efeitos)
  if (!chips.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((c, i) => (
        <span key={i} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${c.bom ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
          {c.t}
        </span>
      ))}
    </div>
  )
}

// ── Evento ──────────────────────────────────────────────────
export function EventoTela({ estado, evento, indice, total, resposta, onEscolher, onContinuar }) {
  return (
    <Pagina>
      <p className="pr-10 text-[11px] font-medium uppercase tracking-widest text-muted">
        Temporada {estado.temporada} · {estado.ano} · Evento {indice + 1} de {total}
      </p>
      <AnimatePresence mode="wait">
        {!resposta ? (
          <motion.div key="pergunta" {...entrada} exit={{ opacity: 0 }} className="mt-4 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{evento.titulo}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-secondary">{evento.texto}</p>
            <div className="mt-6 flex flex-col gap-2.5">
              {evento.escolhas.map((e, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onEscolher(i)}
                  className="rounded-2xl border border-border-strong bg-surface px-4 py-4 text-left"
                >
                  <span className="text-[15px] font-semibold">{e.rotulo}</span>
                  {e.alea && <span className="ml-2 rounded-full bg-accent-glow px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">Arriscado</span>}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="resposta" {...entrada} className="mt-4 flex flex-1 flex-col">
            <h1 className="text-xl font-bold tracking-tight">{evento.titulo}</h1>
            <div className={`mt-4 rounded-2xl border p-5 ${resposta.sorte === 'falha' ? 'border-red-500/30 bg-red-500/5' : resposta.sorte === 'sucesso' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border-strong bg-surface'}`}>
              {resposta.sorte && (
                <p className={`mb-2 text-[11px] font-bold uppercase tracking-widest ${resposta.sorte === 'sucesso' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {resposta.sorte === 'sucesso' ? 'Deu certo' : 'Deu errado'}
                </p>
              )}
              <p className="text-[15px] leading-relaxed">{resposta.resultado}</p>
              <Chips efeitos={resposta.efeitos} />
            </div>
            <div className="flex-1" />
            <div className="pt-6">
              <BotaoPrimario onClick={onContinuar}>{indice + 1 < total ? 'Próximo evento' : 'Começar a temporada'}</BotaoPrimario>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Pagina>
  )
}

// ── Resultado da temporada regular ─────────────────────────
export function TemporadaTela({ estado, relatorio, onContinuar, temPlayoffs }) {
  const rel = relatorio
  const s = rel.stats
  if (rel.kind === 'base') {
    return (
      <Pagina>
        <Titulo pequeno={`Temporada ${estado.temporada} · ${estado.ano}${rel.liga ? ` · ${rel.liga}` : ''}`} sub={rel.fase}>{rel.equipe}</Titulo>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat rotulo="PTS" valor={s.ppg.toFixed(1)} destaque />
          <Stat rotulo="REB" valor={s.rpg.toFixed(1)} />
          <Stat rotulo="AST" valor={s.apg.toFixed(1)} />
          <Stat rotulo="Jogos" valor={s.jogos} />
          <Stat rotulo="Min" valor={s.mpg.toFixed(0)} />
          <Stat rotulo="FG%" valor={`${s.fgp.toFixed(0)}`} />
        </div>
        {rel.exterior && <p className="mt-3 text-xs text-secondary">{rel.trocou ? 'Novo clube neste ano. ' : ''}Salário: {fmtMi(rel.salario, 1)} por ano. Renda líquida: {fmtMi(rel.renda, 1)}.</p>}
        {rel.lesao && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <p className="text-sm">Lesão: <b>{rel.lesao.nome}</b>. Você ficou {rel.lesao.jogosFora} jogos de fora.</p>
          </div>
        )}
        <div className="flex-1" />
        <div className="pt-6"><BotaoPrimario onClick={onContinuar}>Continuar</BotaoPrimario></div>
      </Pagina>
    )
  }
  const t = TIMES_POR_ID[rel.time]
  return (
    <Pagina>
      <Titulo pequeno={`Temporada ${estado.temporada} · ${estado.ano} · Temporada regular`}>Campanha fechada</Titulo>
      <motion.div {...entrada} className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <TimeEscudo id={rel.time} tamanho={46} />
        <div className="flex-1">
          <p className="text-sm font-semibold">{t.nome}</p>
          <p className="text-xs text-secondary">{rel.conf} · {rel.seed}º colocado</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums leading-none">{rel.vitorias}-{rel.derrotas}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted">Campanha</p>
        </div>
      </motion.div>

      <div className="mt-3 flex items-center gap-2 text-xs text-secondary">
        <SeloLiga tipo={rel.papel === 'g_league' ? 'gleague' : 'nba'} />
        <span>Papel: <b className="text-primary">{papelTexto(rel.papel)}</b></span>
        {rel.novato && <span className="rounded-full bg-accent-glow px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">Calouro</span>}
      </div>

      {s.jogos > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat rotulo="PTS" valor={s.ppg.toFixed(1)} destaque />
          <Stat rotulo="REB" valor={s.rpg.toFixed(1)} />
          <Stat rotulo="AST" valor={s.apg.toFixed(1)} />
          <Stat rotulo="ROU" valor={s.spg.toFixed(1)} />
          <Stat rotulo="TOC" valor={s.bpg.toFixed(1)} />
          <Stat rotulo="MIN" valor={s.mpg.toFixed(0)} />
          <Stat rotulo="FG%" valor={s.fgp.toFixed(0)} />
          <Stat rotulo="3P%" valor={s.tpp.toFixed(0)} />
          <Stat rotulo="Jogos" valor={s.jogos} />
        </div>
      )}
      {rel.statsG && (
        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-xs text-secondary">
          <SeloLiga tipo="gleague" /> <span className="ml-2">{rel.statsG.jogos} jogos · {rel.statsG.ppg.toFixed(1)} pts · {rel.statsG.rpg.toFixed(1)} reb · {rel.statsG.apg.toFixed(1)} ast</span>
        </div>
      )}
      {rel.marcas.maxPontos >= 30 && (
        <p className="mt-3 text-xs text-secondary">
          Melhor jogo do ano: <b className="text-primary">{rel.marcas.maxPontos} pontos</b>
          {rel.marcas.jogos40 > 0 ? ` · ${rel.marcas.jogos40} jogo(s) de 40+` : ''}
          {rel.marcas.tripleDuplas > 0 ? ` · ${rel.marcas.tripleDuplas} triplo(s)-duplo(s)` : ''}
        </p>
      )}
      {rel.lesao && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
          <p className="text-sm">Lesão: <b>{rel.lesao.nome}</b>. {rel.lesao.jogosFora} jogos de fora{rel.lesao.sequela >= 3 ? ', com sequela no físico' : ''}.</p>
        </div>
      )}

      <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-muted">Tabela da {rel.conf}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {rel.tabela.slice(0, 10).map((x) => {
          const eu = x.id === rel.time
          return (
            <li key={x.id} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${eu ? 'bg-accent-glow font-semibold' : ''}`}>
              <span className="w-4 text-muted tabular-nums">{x.seed}</span>
              <TimeEscudo id={x.id} tamanho={18} />
              <span className="flex-1 truncate">{TIMES_POR_ID[x.id].nome}</span>
              <span className="tabular-nums text-secondary">{x.vitorias}-{x.derrotas}</span>
            </li>
          )
        })}
      </ul>

      <div className="flex-1" />
      <div className="pt-6">
        <BotaoPrimario onClick={onContinuar}>{temPlayoffs ? 'Ir pros playoffs' : 'Continuar'}</BotaoPrimario>
      </div>
    </Pagina>
  )
}

// ── Playoffs, série a série ────────────────────────────────
function lanceDoJogo(linha, ppg, vitoria) {
  if (!linha) return ''
  if (linha.pontos >= ppg + 12) return 'Noite histórica. Cada bola entrava.'
  if (linha.pontos >= ppg + 5) return vitoria ? 'Jogou como líder nos minutos decisivos.' : 'Fez de tudo, mas não foi suficiente.'
  if (linha.pontos <= Math.max(4, ppg - 8)) return 'Noite apagada. A defesa adversária te travou.'
  return vitoria ? 'Contribuiu no coletivo e levou o jogo.' : 'Jogo duro, decidido nos detalhes.'
}

export function PlayoffsTela({ estado, relatorio, onContinuar }) {
  const p = relatorio.playoffs
  const series = p.series
  const [si, setSi] = useState(0)
  const [gi, setGi] = useState(1) // jogos revelados na série atual

  const serie = series[si]
  const ehFinais = serie?.fase === 'Finais da NBA'
  const reveladosTodos = serie ? gi >= serie.jogos.length : true

  // séries comuns revelam sozinhas; a final é no toque pra dar suspense
  useEffect(() => {
    if (!serie || ehFinais || reveladosTodos) return
    const t = setTimeout(() => setGi((g) => g + 1), 650)
    return () => clearTimeout(t)
  }, [serie, ehFinais, reveladosTodos, gi])

  if (!p.classificado || !serie) {
    return (
      <Pagina>
        <Titulo pequeno="Pós-temporada" sub={p.playIn?.eliminado ? 'Você caiu no play-in.' : 'O time ficou de fora do mata-mata.'}>{p.fase}</Titulo>
        <motion.div {...entrada} className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs text-muted">Campeão da NBA</p>
          <div className="mt-2 flex items-center gap-3">
            <TimeEscudo id={p.campeao} tamanho={44} />
            <p className="text-lg font-bold">{p.nomeCampeao}</p>
          </div>
        </motion.div>
        <div className="flex-1" />
        <div className="pt-6"><BotaoPrimario onClick={onContinuar}>Continuar</BotaoPrimario></div>
      </Pagina>
    )
  }

  const jogos = serie.jogos.slice(0, gi)
  const vitUser = jogos.filter((j) => j.vitoria).length
  const derUser = jogos.length - vitUser
  const ultimo = si === series.length - 1
  const campeao = relatorio.campeao
  const ppg = relatorio.stats.ppg

  function proximo() {
    if (!reveladosTodos) { setGi((g) => g + 1); return }
    if (ultimo) { onContinuar(); return }
    if (!serie.vitoria) { onContinuar(); return }
    setSi((x) => x + 1)
    setGi(1)
  }

  const rotuloBotao = !reveladosTodos
    ? ehFinais ? `Jogo ${gi + 1}` : '…'
    : ultimo || !serie.vitoria ? 'Continuar' : 'Próxima fase'

  return (
    <Pagina>
      <p className="pr-10 text-[11px] font-medium uppercase tracking-widest text-muted">Playoffs · {estado.ano}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">{serie.fase}</h1>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <TimeEscudo id={relatorio.time} tamanho={40} />
          <span className="text-sm font-semibold">{TIMES_POR_ID[relatorio.time].sigla}</span>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold tabular-nums leading-none">{vitUser} - {derUser}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted">{reveladosTodos ? (serie.vitoria ? 'Avançou' : 'Eliminado') : 'Série'}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold">{TIMES_POR_ID[serie.oponente].sigla}</span>
          <TimeEscudo id={serie.oponente} tamanho={40} />
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {jogos.map((j, i) => (
          <motion.li key={j.n} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={`rounded-xl border px-3.5 py-3 ${j.vitoria ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Jogo {j.n} · {j.vitoria ? 'Vitória' : 'Derrota'}</span>
              <span className="tabular-nums text-secondary">{TIMES_POR_ID[j.casa].sigla} {j.pontosCasa} x {j.pontosFora} {TIMES_POR_ID[j.fora].sigla}</span>
            </div>
            {j.linha && (
              <p className="mt-1.5 text-sm">
                <b className="text-accent">{j.linha.pontos} pts</b> · {j.linha.rebotes} reb · {j.linha.assistencias} ast
              </p>
            )}
            {ehFinais && i === jogos.length - 1 && <p className="mt-1 text-xs text-secondary">{lanceDoJogo(j.linha, ppg, j.vitoria)}</p>}
          </motion.li>
        ))}
      </ul>

      {reveladosTodos && ultimo && (
        <motion.div {...entrada} className={`mt-4 flex items-center gap-3 rounded-2xl border p-4 ${campeao ? 'border-accent/50 bg-accent-glow' : 'border-border bg-surface'}`}>
          <Trophy className={`h-6 w-6 ${campeao ? 'text-accent' : 'text-muted'}`} />
          <p className="text-sm font-semibold">{campeao ? `${TIMES_POR_ID[relatorio.time].nome} é campeão da NBA!` : `${p.nomeCampeao} é o campeão.`}</p>
        </motion.div>
      )}
      {reveladosTodos && !ultimo && !serie.vitoria && (
        <p className="mt-4 text-sm text-secondary">Fim da linha. A campanha termina aqui.</p>
      )}

      <div className="flex-1" />
      <div className="pt-6">
        <BotaoPrimario disabled={!reveladosTodos && !ehFinais} onClick={proximo}>{rotuloBotao}</BotaoPrimario>
      </div>
    </Pagina>
  )
}

// ── Prêmios e marcos ───────────────────────────────────────
export function PremiosTela({ estado, relatorio, onContinuar }) {
  const premios = relatorio.premios ?? []
  const marcos = relatorio.marcos ?? []
  const campeao = relatorio.campeao
  const vazio = !premios.length && !marcos.length && !campeao
  return (
    <Pagina>
      <Titulo pequeno={`Temporada ${estado.temporada} · ${estado.ano}`}>{vazio ? 'Sem troféus dessa vez' : 'Noite de premiação'}</Titulo>
      <div className="mt-5 flex flex-col gap-2.5">
        {campeao && (
          <motion.div {...entrada} className="flex items-center gap-3 rounded-2xl border border-accent/50 bg-accent-glow p-4">
            <Trophy className="h-6 w-6 text-accent" />
            <div><p className="text-sm font-bold">{relatorio.exterior ? `Campeão da ${relatorio.liga}` : 'Campeão da NBA'}</p><p className="text-xs text-secondary">{relatorio.exterior ? `${estado.carreiraExterior?.titulos ?? 1}º título fora da NBA` : `${estado.titulos.length}º título da carreira`}</p></div>
          </motion.div>
        )}
        {premios.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * (i + 1) }} className="flex items-center gap-3 rounded-2xl border border-border-strong bg-surface p-4">
            {p.tier <= 2 ? <Trophy className="h-5 w-5 text-accent" /> : p.tier <= 3 ? <Medal className="h-5 w-5 text-amber-300" /> : <Star className="h-5 w-5 text-secondary" />}
            <div className="flex-1"><p className="text-sm font-semibold">{p.nome ?? NOMES_PREMIO[p.id]}</p><p className="text-xs text-muted">{estado.premios[p.id] ?? 1}ª vez na carreira</p></div>
          </motion.div>
        ))}
        {marcos.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * (premios.length + i + 2) }} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
            <TrendingUp className="h-5 w-5 shrink-0 text-emerald-300" />
            <div><p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">Marco histórico</p><p className="text-sm">{m}</p></div>
          </motion.div>
        ))}
        {vazio && <p className="text-sm text-secondary">Sem prêmios individuais, títulos ou marcos nessa temporada. Segue o jogo.</p>}
      </div>
      <div className="flex-1" />
      <div className="pt-6"><BotaoPrimario onClick={onContinuar}>Continuar</BotaoPrimario></div>
    </Pagina>
  )
}

// ── Resumo do ano: dinheiro, contrato, manchete ────────────
export function ResumoAnoTela({ estado, relatorio, onProximo, onAposentar, podeAposentar }) {
  const mancheteBase = gerarManchete(estado, relatorio)
  const mancheteEscolha = mancheteDaEscolha(estado)
  const manchete = mancheteEscolha ?? mancheteBase
  const decisoes = estado.decisoesAno ?? []
  const c = estado.contrato
  return (
    <Pagina>
      <Titulo pequeno={`Fim da temporada ${estado.temporada} · ${estado.ano}`}>Resumo do ano</Titulo>
      <motion.div {...entrada} className="mt-4 rounded-2xl border border-border-strong bg-surface p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Manchete</p>
        <p className="mt-2 text-[17px] font-semibold leading-snug">{manchete}</p>
        {mancheteEscolha && <p className="mt-2 text-xs text-secondary">{mancheteBase}</p>}
      </motion.div>

      {decisoes.length > 0 && (
        <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted">Suas escolhas no ano</p>
          <ul className="mt-2 flex flex-col gap-2">
            {decisoes.map((d, i) => (
              <li key={i} className="text-xs leading-snug">
                <span className="font-semibold text-primary">{d.titulo}</span>
                <span className="text-muted"> · </span>
                <span className="text-secondary">{d.rotulo}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <Wallet className="h-4 w-4 text-accent" />
          <p className="mt-2 text-xl font-bold tabular-nums">{fmtMi(estado.dinheiro.patrimonio, 1)}</p>
          <p className="text-[11px] uppercase tracking-widest text-muted">Patrimônio</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <Handshake className="h-4 w-4 text-accent" />
          <p className="mt-2 text-xl font-bold tabular-nums">{c ? fmtMi(c.salario, 1) : '—'}</p>
          <p className="text-[11px] uppercase tracking-widest text-muted">Salário/ano{c ? ` · ${c.anosRestantes} ano(s)` : ''}</p>
        </div>
      </div>
      {(relatorio.kind === 'nba' || relatorio.exterior) && (
        <p className="mt-2 text-xs text-secondary">
          Renda líquida do ano: {fmtMi(relatorio.renda, 1)}{relatorio.patrocinio > 0 ? ` (inclui US$ ${relatorio.patrocinio.toLocaleString('pt-BR')} mi/ano em patrocínios)` : ''}
        </p>
      )}

      <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-muted">Status do jogador</p>
      <div className="mt-2"><StatusBarras estado={estado} /></div>

      <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-muted">Evolução do overall</p>
      <div className="mt-2 rounded-2xl border border-border bg-surface p-3"><GraficoOvr historico={estado.historico} /></div>

      <div className="mt-4">
        <CartaoJogador estado={estado} compacto />
      </div>

      <div className="flex-1" />
      <div className="flex flex-col gap-2 pt-6">
        <BotaoPrimario onClick={onProximo}>
          <span className="inline-flex items-center justify-center gap-2">Próxima temporada <ChevronRight className="h-4 w-4" /></span>
        </BotaoPrimario>
        {podeAposentar && <BotaoPrimario secundario onClick={onAposentar}>Aposentar agora</BotaoPrimario>}
      </div>
    </Pagina>
  )
}

