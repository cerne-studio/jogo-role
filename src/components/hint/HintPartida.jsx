import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Crown, Send, TriangleAlert } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'
import HintRoda from './HintRoda.jsx'
import HintPlacar from './HintPlacar.jsx'
import HintQuadro from './HintQuadro.jsx'
import { EQUIPES, MODS, equipeDe, nomeDe, outraEquipe, useCartaPrivada } from './hintUtils.js'

function Relogio({ restante, total }) {
  if (restante === null || restante === undefined) return null
  const pct = Math.max(0, Math.min(1, restante / total)) * 100
  const urgente = restante <= 10
  return (
    <div className="flex items-center gap-3">
      <span className={`w-12 text-right text-2xl font-bold tabular-nums ${urgente ? 'text-danger' : 'text-primary'}`}>{restante}s</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: urgente ? '#ff5a5f' : '#ffba38' }} />
      </div>
    </div>
  )
}

function ChipMod({ modalidade }) {
  const m = MODS[modalidade]
  const Icone = m.icon
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-black" style={{ background: m.cor }}>
      <Icone className="h-3.5 w-3.5" /> {m.nome}
    </span>
  )
}

function Botao({ onClick, children, disabled, cor = 'accent', pequeno }) {
  const bg = cor === 'danger' ? 'bg-danger text-white' : cor === 'ghost' ? 'border border-border-strong bg-surface text-secondary' : 'bg-accent text-black'
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl font-semibold disabled:opacity-40 ${pequeno ? 'px-4 py-2.5 text-sm' : 'px-6 py-4 text-base'} ${bg}`}
    >
      {children}
    </motion.button>
  )
}

function useAcao() {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  async function rodar(fn, args) {
    if (ocupado) return null
    setOcupado(true)
    setErro('')
    const { data, error } = await supabase.rpc(fn, args)
    setOcupado(false)
    if (error) setErro(error.message)
    return error ? null : data
  }
  return { ocupado, erro, rodar }
}

function TituloVez({ est, jogadores, userId }) {
  const eq = EQUIPES[est.vez]
  const resp = nomeDe(jogadores, est.responsavel)
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-secondary">
      <span>
        Turno {est.turno} · vez da equipe <b style={{ color: eq.cor }}>{eq.nome}</b>
      </span>
      <span className="flex items-center gap-1">
        <Crown className="h-3.5 w-3.5 text-accent" />
        {est.responsavel === userId ? 'você' : resp}
      </span>
    </div>
  )
}

// ------------------------------------------------------------------ SELEÇÃO
function Selecao({ salaId, est, jogadores, userId, restante }) {
  const { ocupado, erro, rodar } = useAcao()
  const minhaEq = equipeDe(est, userId)
  const souResp = est.responsavel === userId
  const naVez = est.escolhe === est.vez
  const podeEscolher = naVez ? souResp : minhaEq === est.escolhe
  const ordenadas = [...est.roda].sort((a, b) => a.pos - b.pos)
  const bonusOn = est.regras?.bonus !== false

  let aviso
  if (est.obrigatoria_id) aviso = 'Tem carta no último setor: ela é obrigatória e precisa ser jogada.'
  else if (est.reta_ativa) aviso = `Reta final! A equipe ${EQUIPES[est.escolhe].nome} escolhe a carta da equipe ${EQUIPES[est.vez].nome}.`
  else aviso = null

  return (
    <>
      <HintRoda roda={est.roda} zonas={est.zonas} regras={est.regras} obrigatoriaId={est.obrigatoria_id} />
      <div className="mt-4">
        <Relogio restante={restante} total={60} />
        <p className="mt-2 text-center text-sm text-secondary">
          {podeEscolher
            ? naVez
              ? 'Escolha a carta que seu time vai jogar'
              : 'Escolha a carta que o adversário vai jogar'
            : `Aguardando ${naVez ? nomeDe(jogadores, est.responsavel) : `a equipe ${EQUIPES[est.escolhe].nome}`} escolher a carta...`}
        </p>
        {aviso && (
          <p className="mt-2 flex items-start gap-2 rounded-xl border border-accent/40 bg-accent-glow px-3 py-2 text-xs text-accent">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {aviso}
          </p>
        )}
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {ordenadas.map((c) => {
          const m = MODS[c.modalidade]
          const Icone = m.icon
          const forcada = est.obrigatoria_id === c.id
          const bloqueada = !!est.obrigatoria_id && !forcada
          const bonus = !forcada && bonusOn && est.zonas.bonus.includes(c.pos)
          return (
            <li key={c.id}>
              <button
                disabled={!podeEscolher || ocupado || bloqueada}
                onClick={() => rodar('hint_escolher', { p_sala_id: salaId, p_carta: c.id })}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:cursor-default ${
                  podeEscolher && !bloqueada ? 'border-border-strong bg-elevated active:scale-[0.98]' : 'border-border bg-surface opacity-70'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: m.cor }}>
                  <Icone className="h-5 w-5" color="#0b0b10" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{c.tema}</span>
                  <span className="block text-[11px] text-muted">{m.nome}</span>
                </span>
                {forcada && <span className="rounded-full bg-danger/20 px-2 py-1 text-[10px] font-bold text-danger">OBRIGATÓRIA +1</span>}
                {bonus && <span className="rounded-full bg-accent/20 px-2 py-1 text-[10px] font-bold text-accent">+1</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
    </>
  )
}

// ------------------------------------------------------------------ REVELAÇÃO
function Revelacao({ salaId, est, jogadores, userId, restante }) {
  const { ocupado, erro, rodar } = useAcao()
  const souResp = est.responsavel === userId
  const { carta } = useCartaPrivada(souResp, est.turno, est.fase)
  const m = MODS[est.carta.modalidade]

  return (
    <>
      <div className="rounded-2xl border border-border-strong bg-elevated p-5">
        <div className="flex items-center justify-between">
          <ChipMod modalidade={est.carta.modalidade} />
          {est.carta.bonus > 0 && <span className="rounded-full bg-accent/20 px-2 py-1 text-[10px] font-bold text-accent">{est.carta.forcada ? 'OBRIGATÓRIA' : 'BÔNUS'} +1 já somado</span>}
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight">{est.carta.tema}</h2>
        <p className="mt-1 text-xs text-muted">{m.regra}</p>

        {souResp ? (
          <>
            <ol className="mt-4 flex flex-col gap-2">
              {(carta?.respostas ?? []).map((r, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs tabular-nums text-secondary">{i + 1}</span>
                  {r}
                </li>
              ))}
              {carta && (
                <li className="flex items-center gap-3 rounded-xl border border-danger/50 bg-danger/10 px-3 py-2.5 text-sm font-semibold text-danger">
                  <TriangleAlert className="h-4 w-4" /> Proibida: {carta.proibida}
                </li>
              )}
            </ol>
            {!carta && <p className="mt-4 text-sm text-muted">Abrindo a carta...</p>}
            <p className="mt-3 text-xs text-muted">Só você vê isso. Decore e não mostre pra ninguém.</p>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-white/5 px-3 py-3 text-sm text-secondary">
            {nomeDe(jogadores, est.responsavel)} está lendo a carta. Ninguém mais vê as respostas.
          </p>
        )}
      </div>
      <div className="mt-4">
        <Relogio restante={restante} total={45} />
        {souResp ? (
          <div className="mt-3">
            <Botao disabled={ocupado || !carta} onClick={() => rodar('hint_comecar', { p_sala_id: salaId })}>
              Começar a rodada ({est.tempo}s)
            </Botao>
            <p className="mt-2 text-center text-xs text-muted">Começa sozinho quando o relógio de cima zerar.</p>
          </div>
        ) : (
          <p className="mt-3 text-center text-sm text-secondary">Preparem-se...</p>
        )}
        {erro && <p className="mt-2 text-sm text-danger">{erro}</p>}
      </div>
    </>
  )
}

// ------------------------------------------------------------------ RODADA
function Rodada({ salaId, est, jogadores, userId, restante }) {
  const { ocupado, erro, rodar } = useAcao()
  const minhaEq = equipeDe(est, userId)
  const souResp = est.responsavel === userId
  const { carta, acertos, setAcertos, proibidaDita, setProibidaDita } = useCartaPrivada(souResp, est.turno, est.fase)
  const m = MODS[est.carta.modalidade]
  const desenhar = est.carta.modalidade === 'desenhar'
  const proibidaOn = est.regras?.proibida !== false

  async function alternar(i) {
    const marcar = !acertos.includes(i)
    setAcertos((a) => (marcar ? [...a, i] : a.filter((x) => x !== i))) // otimista
    const r = await rodar('hint_acertar', { p_sala_id: salaId, p_idx: i, p_valor: marcar })
    if (!r) setAcertos((a) => (marcar ? a.filter((x) => x !== i) : [...a, i]))
  }
  async function proibida() {
    const novo = !proibidaDita
    setProibidaDita(novo)
    const r = await rodar('hint_proibida', { p_sala_id: salaId, p_valor: novo })
    if (!r) setProibidaDita(!novo)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <ChipMod modalidade={est.carta.modalidade} />
        <span className="min-w-0 truncate text-sm font-bold">{est.carta.tema}</span>
      </div>
      <div className="mt-3">
        <Relogio restante={restante} total={est.tempo} />
      </div>

      {desenhar && (
        <div className="mt-3">
          <HintQuadro salaId={salaId} turno={est.turno} userId={userId} podeDesenhar={souResp} ativo />
        </div>
      )}

      {souResp ? (
        <div className="mt-4">
          <p className="mb-2 text-xs text-muted">{m.regra} Toque na resposta quando o time acertar.</p>
          <ol className="flex flex-col gap-2">
            {(carta?.respostas ?? []).map((r, i) => {
              const certa = acertos.includes(i)
              return (
                <li key={i}>
                  <button
                    disabled={ocupado}
                    onClick={() => alternar(i)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                      certa ? 'border-success bg-success/15 text-success' : 'border-border bg-surface text-primary'
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${certa ? 'bg-success text-black' : 'bg-white/10 text-secondary'}`}>
                      {certa ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className={certa ? 'line-through opacity-80' : ''}>{r}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          {proibidaOn && carta && (
            <button
              disabled={ocupado}
              onClick={proibida}
              className={`mt-2 flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold ${
                proibidaDita ? 'border-danger bg-danger text-white' : 'border-danger/50 bg-danger/10 text-danger'
              }`}
            >
              <span className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4" /> Proibida: {carta.proibida}
              </span>
              <span className="text-xs">{proibidaDita ? 'Registrada (-2). Toque pra desfazer' : 'Falaram? Toque (-2)'}</span>
            </button>
          )}
          <div className="mt-3">
            <Botao cor="ghost" pequeno disabled={ocupado} onClick={() => rodar('hint_encerrar', { p_sala_id: salaId })}>
              {acertos.length === 5 ? 'Acertaram tudo! Encerrar' : 'Encerrar rodada agora'}
            </Botao>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4 text-center">
          <p className="text-3xl font-bold tabular-nums text-primary">
            {est.acertos}
            <span className="text-lg text-muted"> / 5</span>
          </p>
          <p className="mt-1 text-xs text-muted">respostas acertadas</p>
          {est.proibida_dita && <p className="mt-3 rounded-lg bg-danger/15 px-3 py-2 text-sm font-semibold text-danger">Falaram a proibida! -2 pra equipe {EQUIPES[est.vez].nome}</p>}
          <p className="mt-3 text-sm text-secondary">
            {minhaEq === est.vez
              ? `Adivinhem em voz alta! ${nomeDe(jogadores, est.responsavel)} só pode usar ${m.nome.toLowerCase()}.`
              : 'Quietos! No fim vocês têm uma chance de palpitar.'}
          </p>
        </div>
      )}
      {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
    </>
  )
}

// ------------------------------------------------------------------ PALPITE
function Palpite({ salaId, est, jogadores, userId, restante }) {
  const { ocupado, erro, rodar } = useAcao()
  const [texto, setTexto] = useState('')
  const minhaEq = equipeDe(est, userId)
  const adversaria = outraEquipe(est.vez)
  const euPalpito = minhaEq === adversaria
  const desenhar = est.carta.modalidade === 'desenhar'

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <ChipMod modalidade={est.carta.modalidade} />
        <span className="min-w-0 truncate text-sm font-bold">{est.carta.tema}</span>
      </div>
      <div className="mt-3">
        <Relogio restante={restante} total={15} />
      </div>
      {desenhar && (
        <div className="mt-3">
          <HintQuadro salaId={salaId} turno={est.turno} userId={userId} podeDesenhar={est.responsavel === userId} ativo={false} />
        </div>
      )}
      <div className="mt-4 rounded-2xl border border-border-strong bg-elevated p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Vez da equipe <span style={{ color: EQUIPES[adversaria].cor }}>{EQUIPES[adversaria].nome}</span> chutar
        </p>
        <p className="mt-2 text-sm text-secondary">
          Faltavam {5 - est.acertos} resposta{5 - est.acertos === 1 ? '' : 's'}. Uma tentativa só: acerto +1, a proibida +2, erro -1.
        </p>
        {euPalpito ? (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (texto.trim()) rodar('hint_palpite', { p_sala_id: salaId, p_texto: texto })
            }}
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={100}
              autoFocus
              placeholder="Seu palpite"
              className="min-w-0 flex-1 rounded-xl border border-border-strong bg-surface px-4 py-3 text-base text-primary outline-none focus:border-accent"
            />
            <button disabled={ocupado || !texto.trim()} className="flex items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-black disabled:opacity-40">
              <Send className="h-4 w-4" /> Chutar
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-secondary">
            {est.vez === minhaEq ? 'Segurem a ansiedade, o adversário está chutando.' : 'Combinem e mandem o palpite.'}
          </p>
        )}
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
      </div>
    </>
  )
}

// ------------------------------------------------------------------ RESULTADO
function Linha({ nome, ok, destaque }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold ${
        destaque === 'danger' ? 'border-danger/50 bg-danger/10 text-danger' : ok ? 'border-success/50 bg-success/10 text-success' : 'border-border bg-surface text-secondary'
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">{ok ? <Check className="h-3 w-3" /> : null}</span>
      {nome}
    </li>
  )
}

function Resultado({ salaId, est, userId, restante }) {
  const r = est.resultado
  const p = r?.palpite
  if (!r) return null
  const eq = EQUIPES[r.equipe]
  const adv = outraEquipe(r.equipe)
  const desenhar = r.carta.modalidade === 'desenhar'
  return (
    <>
      <div className="rounded-2xl border border-border-strong bg-elevated p-5">
        <div className="flex items-center justify-between">
          <ChipMod modalidade={r.carta.modalidade} />
          <span className="text-xs text-muted">{r.carta.tema}</span>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {r.carta.respostas.map((t, i) => (
            <Linha key={i} nome={t} ok={r.carta.acertadas.includes(i)} />
          ))}
          <Linha nome={`Proibida: ${r.carta.proibida}`} ok={false} destaque={r.proibida_dita ? 'danger' : undefined} />
        </ul>
        {p?.feito ? (
          <p
            className={`mt-4 rounded-xl px-3 py-2.5 text-sm font-semibold ${
              p.tipo === 'errou' ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
            }`}
          >
            Palpite da equipe {EQUIPES[adv].nome}: “{p.texto}” —{' '}
            {p.tipo === 'certo' ? `acertou "${p.alvo}" (+1)` : p.tipo === 'proibida' ? `era a proibida! (+2)` : 'errou (-1)'}
          </p>
        ) : (
          est.regras?.adversario !== false && <p className="mt-4 rounded-xl bg-white/5 px-3 py-2.5 text-sm text-muted">Ninguém chutou a tempo.</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          {['azul', 'vermelha'].map((e2) => {
            const d = r.delta[e2]
            return (
              <div key={e2} className="rounded-xl border border-border bg-surface py-2">
                <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: EQUIPES[e2].cor }}>
                  {EQUIPES[e2].nome}
                </p>
                <p className={`text-xl font-bold tabular-nums ${d > 0 ? 'text-success' : d < 0 ? 'text-danger' : 'text-muted'}`}>
                  {d > 0 ? `+${d}` : d}
                </p>
              </div>
            )
          })}
        </div>
        {est.vencedor_pendente && (
          <p className="mt-4 text-center text-sm font-bold" style={{ color: EQUIPES[est.vencedor_pendente].cor }}>
            A equipe {EQUIPES[est.vencedor_pendente].nome} chegou lá!
          </p>
        )}
        {!est.vencedor_pendente && est.desempate && <p className="mt-4 text-center text-sm font-bold text-accent">Empate na meta! Turnos extras pra desempatar.</p>}
      </div>
      {desenhar && (
        <div className="mt-3">
          <HintQuadro salaId={salaId} turno={est.turno} userId={userId} podeDesenhar={est.responsavel === userId} ativo={false} />
        </div>
      )}
      <div className="mt-4">
        <Relogio restante={restante} total={10} />
        <p className="mt-1 text-center text-xs text-muted">Equipe {eq.nome} jogou. Próximo turno em instantes.</p>
      </div>
    </>
  )
}

// ------------------------------------------------------------------ ROTAÇÃO
function Rotacao({ est }) {
  return (
    <>
      <HintRoda roda={est.roda} zonas={est.zonas} regras={est.regras} />
      <p className="mt-4 text-center text-sm text-secondary">A roda gira... carta nova entrou.</p>
    </>
  )
}

export default function HintPartida({ salaId, sala, jogadores, userId, restante, onExit }) {
  const est = sala.estado
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-5 pb-10 pt-6">
      <ExitButton onExit={onExit} mensagem="Você sai da partida. Dá pra voltar com o mesmo código." />
      <div className="mt-8 flex flex-col gap-3">
        <HintPlacar est={est} />
        <TituloVez est={est} jogadores={jogadores} userId={userId} />
      </div>
      <div className="mt-4">
        {est.fase === 'selecao' && <Selecao salaId={salaId} est={est} jogadores={jogadores} userId={userId} restante={restante} />}
        {est.fase === 'revelacao' && <Revelacao salaId={salaId} est={est} jogadores={jogadores} userId={userId} restante={restante} />}
        {est.fase === 'jogando' && <Rodada salaId={salaId} est={est} jogadores={jogadores} userId={userId} restante={restante} />}
        {est.fase === 'palpite' && <Palpite salaId={salaId} est={est} jogadores={jogadores} userId={userId} restante={restante} />}
        {est.fase === 'resultado' && <Resultado salaId={salaId} est={est} userId={userId} restante={restante} />}
        {est.fase === 'rotacao' && <Rotacao est={est} />}
      </div>
    </div>
  )
}
