import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Trophy, GraduationCap, Copy, Check, Flag } from 'lucide-react'
import { TIMES_POR_ID } from '../../nba/data/times.js'
import { descreverPick } from '../../nba/engine/draft.js'
import { RANKING_PONTOS, RECORDES_LIGA } from '../../nba/engine/marcos.js'
import { valorMercado } from '../../nba/engine/contrato.js'
import { BotaoPrimario, CartaoJogador, GraficoOvr, Stat, TimeEscudo, Titulo, fmtMi, fmtNum, NOMES_PREMIO, posicaoSigla } from './ui.jsx'

const Pagina = ({ children }) => (
  <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-5 py-6">{children}</div>
)
const entrada = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } }

// ── Decisão: declarar pro draft? ───────────────────────────
export function DraftDecisaoTela({ estado, projecao, obrigatorio, onDeclarar, onFicar }) {
  const faixa = projecao.fora ? 'Fora do draft' : `Escolha ${projecao.minimo} a ${projecao.maximo}`
  const rodada = projecao.fora ? 'Sem draft' : projecao.central <= 30 ? 'Primeira rodada' : 'Segunda rodada'
  return (
    <Pagina>
      <Titulo pequeno={`${estado.equipe} · ${estado.idade} anos`} sub={obrigatorio ? 'Você não pode mais adiar: é a hora de entrar no draft.' : 'A janela de inscrição abriu. Você declara agora ou joga mais um ano?'}>
        {obrigatorio ? 'Draft: sem volta' : 'Declarar para o draft?'}
      </Titulo>
      <motion.div {...entrada} className="mt-5 rounded-2xl border border-border-strong bg-surface p-5">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-accent" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Projeção dos olheiros</p>
            <p className="text-lg font-bold">{faixa}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-secondary">Perfil: {rodada}. Overall {estado.media}, teto {estado.potencial >= 85 ? 'altíssimo' : estado.potencial >= 75 ? 'alto' : estado.potencial >= 68 ? 'razoável' : 'baixo'}.</p>
      </motion.div>
      <p className="mt-4 text-xs leading-relaxed text-secondary">
        A projeção é uma estimativa e pode errar. Ficar mais um ano pode subir sua nota, mas também pode custar fama se a temporada for ruim ou se vier uma lesão.
      </p>
      <div className="flex-1" />
      <div className="flex flex-col gap-2 pt-6">
        <BotaoPrimario onClick={onDeclarar}>{obrigatorio ? 'Ir pro draft' : 'Declarar para o draft'}</BotaoPrimario>
        {!obrigatorio && <BotaoPrimario secundario onClick={onFicar}>Jogar mais um ano</BotaoPrimario>}
      </div>
    </Pagina>
  )
}

// ── Noite do draft ─────────────────────────────────────────
export function DraftNoiteTela({ estado, draft, onContinuar }) {
  const [revelado, setRevelado] = useState(false)
  const [contador, setContador] = useState(60)
  useEffect(() => {
    if (revelado) return
    const alvo = Math.min(draft.pick, 60)
    const t = setInterval(() => {
      setContador((c) => {
        if (c <= alvo + 1) {
          clearInterval(t)
          setTimeout(() => setRevelado(true), 450)
          return alvo
        }
        return c - Math.max(1, Math.ceil((c - alvo) / 8))
      })
    }, 90)
    return () => clearInterval(t)
  }, [draft.pick, revelado])

  const t = draft.time ? TIMES_POR_ID[draft.time] : null
  return (
    <Pagina>
      <Titulo pequeno={`Noite do Draft · ${draft.ano}`}>{revelado ? (draft.fora ? 'Não foi dessa vez' : 'Seu nome foi chamado') : 'Aguardando...'}</Titulo>
      <div className="mt-8 flex flex-1 flex-col items-center">
        {!revelado ? (
          <motion.div key="cont" className="mt-10 text-center">
            <p className="text-7xl font-extrabold tabular-nums text-accent">{contador}</p>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted">Escolha</p>
          </motion.div>
        ) : draft.fora ? (
          <motion.div {...entrada} className="mt-6 w-full rounded-2xl border border-border-strong bg-surface p-6 text-center">
            <Flag className="mx-auto h-8 w-8 text-secondary" />
            <p className="mt-3 text-lg font-bold">Passou batido</p>
            <p className="mt-2 text-sm text-secondary">Nenhuma franquia chamou seu nome. Mas ainda tem times dispostos a te dar uma chance.</p>
          </motion.div>
        ) : (
          <motion.div {...entrada} className="mt-4 w-full">
            <div className="rounded-3xl border border-accent/40 bg-accent-glow p-6 text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">{descreverPick(draft.pick)}</p>
              <div className="mt-4 flex justify-center"><TimeEscudo id={t.id} tamanho={84} /></div>
              <p className="mt-4 text-xl font-bold">{t.nome}</p>
              <p className="mt-1 text-sm text-secondary">escolhe {estado.jogador.sobrenome} · {posicaoSigla(estado.jogador.posicao)}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat rotulo="Escolha" valor={`#${draft.pick}`} destaque />
              <Stat rotulo="Contrato" valor={draft.contrato.tipo === 'duas_vias' ? 'Duas vias' : `${draft.contrato.anos} anos`} />
            </div>
            <p className="mt-3 text-center text-sm text-secondary">Salário: {fmtMi(draft.contrato.salario, 1)} por ano{draft.contrato.tipo === 'duas_vias' ? ' (dividido entre NBA e G League)' : ''}.</p>
          </motion.div>
        )}
      </div>
      <div className="pt-6"><BotaoPrimario disabled={!revelado} onClick={onContinuar}>{draft.fora ? 'Ver opções' : 'Assinar e começar na NBA'}</BotaoPrimario></div>
    </Pagina>
  )
}

// ── Sem draft: ofertas de duas vias ────────────────────────
export function SemDraftTela({ estado, ofertas, onEscolher, podeVoltar, onVoltar }) {
  return (
    <Pagina>
      <Titulo pequeno="Depois do draft" sub="Três franquias ligaram com contrato de duas vias: você divide o tempo entre a NBA e a G League.">Sua chance</Titulo>
      <div className="mt-5 flex flex-col gap-2.5">
        {ofertas.map((o) => (
          <motion.button key={o.time} whileTap={{ scale: 0.98 }} onClick={() => onEscolher(o)} className="flex items-center gap-3 rounded-2xl border border-border-strong bg-surface p-4 text-left">
            <TimeEscudo id={o.time} tamanho={44} />
            <div className="flex-1">
              <p className="text-sm font-semibold">{o.nome}</p>
              <p className="text-xs text-secondary">Duas vias · {fmtMi(o.contrato.salario, 1)} · {o.promessa >= 15 ? 'promete minutos' : 'elenco forte'}</p>
            </div>
          </motion.button>
        ))}
      </div>
      <div className="flex-1" />
      {podeVoltar && <div className="pt-6"><BotaoPrimario secundario onClick={onVoltar}>Voltar pra base e tentar de novo no ano que vem</BotaoPrimario></div>}
    </Pagina>
  )
}

// ── Contrato ───────────────────────────────────────────────
export function ContratoTela({ estado, propostas, onEscolher, onAposentar }) {
  const mercado = valorMercado(estado)
  return (
    <Pagina>
      <Titulo pequeno={`Temporada ${estado.temporada} · ${estado.ano}`} sub={`Seu contrato acabou. O mercado avalia você em torno de ${fmtMi(mercado, 1)} por ano.`}>Fim de contrato</Titulo>
      <div className="mt-5 flex flex-col gap-2.5">
        {propostas.map((p) => {
          const t = TIMES_POR_ID[p.time]
          return (
            <motion.button key={p.id} whileTap={{ scale: 0.98 }} onClick={() => onEscolher(p)} className="rounded-2xl border border-border-strong bg-surface p-4 text-left">
              <div className="flex items-center gap-3">
                <TimeEscudo id={p.time} tamanho={44} />
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-accent">{p.rotulo.split(':')[0]}</p>
                  <p className="text-sm font-semibold">{t.nome}</p>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold tabular-nums">{fmtMi(p.salario, 1)}<span className="text-xs font-medium text-muted"> /ano</span></p>
                  <p className="text-xs text-secondary">{p.anos} {p.anos > 1 ? 'anos' : 'ano'} · total {fmtMi(p.salario * p.anos, 1)}</p>
                </div>
                <span className="text-xs text-secondary">Força do time: {Math.round(estado.liga[p.time])}</span>
              </div>
              {p.tipo === 'anel' && <p className="mt-2 text-xs text-secondary">Salário menor, mas é um candidato ao título.</p>}
            </motion.button>
          )
        })}
      </div>
      <div className="flex-1" />
      {estado.idade >= 33 && <div className="pt-6"><BotaoPrimario secundario onClick={onAposentar}>Pendurar as chuteiras</BotaoPrimario></div>}
    </Pagina>
  )
}

// ── Fim da carreira ────────────────────────────────────────
function resumoTexto(estado, legado) {
  const c = estado.carreira
  const p = estado.premios
  const linhas = [
    `Carreira NBA de ${estado.jogador.sobrenome} (#${estado.jogador.numero}, ${posicaoSigla(estado.jogador.posicao)})`,
    `${legado.titulo} · Legado ${legado.score}${legado.hof ? ' · Hall da Fama' : ''}`,
    `${fmtNum(c.jogos)} jogos · ${fmtNum(c.pontos)} pts · ${fmtNum(c.rebotes)} reb · ${fmtNum(c.assistencias)} ast`,
    `${estado.titulos.length} título(s) · ${p.mvp ?? 0} MVP · ${p.allstar ?? 0} All-Star`,
    `Pico de overall: ${Math.max(...estado.historico.map((h) => h.ovr))} · Patrimônio: ${fmtMi(estado.dinheiro.patrimonio, 0)}`,
  ]
  return linhas.join('\n')
}

export function FimTela({ estado, legado, onNova, onSair }) {
  const [copiado, setCopiado] = useState(false)
  const c = estado.carreira
  const p = estado.premios
  const nba = estado.historico.filter((h) => h.time)
  const pico = Math.max(...estado.historico.map((h) => h.ovr))
  const acimaPontos = RANKING_PONTOS.filter((x) => c.pontos < x.valor).length
  const posRanking = RANKING_PONTOS.length - acimaPontos
  const maiorMarco = [...RANKING_PONTOS].reverse().find((x) => c.pontos > x.valor)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resumoTexto(estado, legado))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // sem permissão de clipboard: ignora
    }
  }

  return (
    <Pagina>
      <motion.div {...entrada} className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-glow">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <p className="mt-4 text-[11px] font-medium uppercase tracking-widest text-muted">Carreira encerrada · {estado.jogador.sobrenome}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{legado.titulo}</h1>
        <p className="mt-1 text-sm text-secondary">Nota de legado {legado.score}{legado.hof ? ' · eleito ao Hall da Fama' : ''}</p>
      </motion.div>

      <div className="mt-5"><CartaoJogador estado={estado} compacto /></div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat rotulo="Pontos" valor={fmtNum(c.pontos)} destaque />
        <Stat rotulo="Rebotes" valor={fmtNum(c.rebotes)} />
        <Stat rotulo="Assist." valor={fmtNum(c.assistencias)} />
        <Stat rotulo="Jogos" valor={fmtNum(c.jogos)} />
        <Stat rotulo="Títulos" valor={estado.titulos.length} destaque />
        <Stat rotulo="MVPs" valor={p.mvp ?? 0} />
        <Stat rotulo="All-Star" valor={p.allstar ?? 0} />
        <Stat rotulo="Pico OVR" valor={pico} />
        <Stat rotulo="Patrimônio" valor={`US$ ${Math.round(estado.dinheiro.patrimonio)}mi`} />
      </div>

      <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-muted">Evolução do overall</p>
      <div className="mt-2 rounded-2xl border border-border bg-surface p-3"><GraficoOvr historico={estado.historico} /></div>

      <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-muted">Contra a história</p>
      <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-sm">
        <p>Pontos na carreira: <b>{fmtNum(c.pontos)}</b>{maiorMarco ? <> · passou <b>{maiorMarco.nome}</b></> : ' · fora do top 8 histórico'}</p>
        {c.maxPontos > 0 && <p>Melhor jogo: <b>{c.maxPontos} pontos</b> <span className="text-secondary">(recorde da liga: {RECORDES_LIGA.pontosJogo.valor}, {RECORDES_LIGA.pontosJogo.quem})</span></p>}
        {c.jogos50 > 0 && <p>Jogos de 50+ pontos: <b>{c.jogos50}</b></p>}
        {c.tripleDuplas > 0 && <p>Triplos-duplos: <b>{c.tripleDuplas}</b></p>}
        <p>Títulos: <b>{estado.titulos.length}</b> <span className="text-secondary">(recorde: {RECORDES_LIGA.titulos.valor}, {RECORDES_LIGA.titulos.quem})</span></p>
        {(p.mvp ?? 0) > 0 && <p>MVPs: <b>{p.mvp}</b> <span className="text-secondary">(recorde: {RECORDES_LIGA.mvps.valor}, {RECORDES_LIGA.mvps.quem})</span></p>}
        <p className="text-xs text-muted">Posição histórica em pontos: {posRanking > 0 ? `acima de ${posRanking} das 8 maiores marcas` : 'abaixo das 8 maiores marcas'}.</p>
      </div>

      <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-muted">Temporada por temporada</p>
      <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-2 py-2 text-left font-medium">Ano</th>
              <th className="px-1 py-2 text-left font-medium">Time</th>
              <th className="px-1 py-2 text-right font-medium">OVR</th>
              <th className="px-1 py-2 text-right font-medium">PTS</th>
              <th className="px-1 py-2 text-right font-medium">REB</th>
              <th className="px-2 py-2 text-right font-medium">AST</th>
            </tr>
          </thead>
          <tbody>
            {estado.historico.map((h, i) => (
              <tr key={i} className={`border-b border-border/50 ${h.campeao ? 'bg-accent-glow' : ''}`}>
                <td className="px-2 py-1.5 tabular-nums">{h.idade}{h.campeao ? ' 🏆' : ''}</td>
                <td className="px-1 py-1.5">{h.time ? TIMES_POR_ID[h.time].sigla : (h.equipe ?? '').slice(0, 6)}</td>
                <td className="px-1 py-1.5 text-right tabular-nums">{h.ovr}</td>
                <td className="px-1 py-1.5 text-right tabular-nums">{h.stats.ppg.toFixed(1)}</td>
                <td className="px-1 py-1.5 text-right tabular-nums">{h.stats.rpg.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{h.stats.apg.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {Object.keys(p).length > 0 && (
        <>
          <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-muted">Prêmios</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(p).map(([k, v]) => (
              <span key={k} className="rounded-full border border-border-strong bg-surface px-2.5 py-1 text-[11px] font-semibold">{v}x {NOMES_PREMIO[k] ?? k}</span>
            ))}
          </div>
        </>
      )}

      {estado.linhaDoTempo.length > 0 && (
        <>
          <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-muted">Linha do tempo</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-xs text-secondary">
            {estado.linhaDoTempo.slice(-12).map((l, i) => (
              <li key={i}><span className="tabular-nums text-muted">{l.ano}</span> · {l.texto}</li>
            ))}
          </ul>
        </>
      )}

      {nba.length === 0 && <p className="mt-4 text-sm text-secondary">Você não chegou a jogar uma temporada completa na NBA.</p>}

      <div className="flex flex-col gap-2 pt-6">
        <BotaoPrimario onClick={onNova}>Nova carreira</BotaoPrimario>
        <BotaoPrimario secundario onClick={copiar}>
          <span className="inline-flex items-center justify-center gap-2">{copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copiado ? 'Copiado' : 'Copiar resumo'}</span>
        </BotaoPrimario>
        <button onClick={onSair} className="py-3 text-sm text-secondary">Voltar pro início</button>
      </div>
    </Pagina>
  )
}
