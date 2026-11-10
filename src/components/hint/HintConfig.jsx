import { useEffect, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { EQUIPES, MODS } from './hintUtils.js'

const TEMPOS = [60, 90, 120]
const METAS = [10, 15, 20, 30]
const REGRAS = [
  { id: 'bonus', nome: 'Setores de bônus', desc: '+1 ao jogar carta nos setores dourados.' },
  { id: 'obrigatoria', nome: 'Carta obrigatória', desc: 'Carta no último setor tem que ser jogada.' },
  { id: 'reta_final', nome: 'Reta final', desc: 'Perto da meta, o adversário escolhe sua carta.' },
  { id: 'proibida', nome: 'Resposta proibida', desc: 'Dizer a proibida custa -2 (e dá +2 pro adversário que chutar).' },
  { id: 'adversario', nome: 'Palpite do adversário', desc: 'Uma tentativa no fim de cada rodada.' },
]

function Chip({ ativo, onClick, disabled, children, cor }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition disabled:cursor-default ${
        ativo ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
      }`}
      style={ativo && cor ? { borderColor: cor } : undefined}
    >
      {children}
    </button>
  )
}

// Configuração da partida no lobby: o host muda, todo mundo vê em tempo real.
export default function HintConfig({ salaId, est, jogadores, souHost }) {
  const cfg = est?.config
  const mapa = est?.equipes_manual ?? {}
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function config(parcial) {
    if (enviando) return
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('hint_config', { p_sala_id: salaId, p_config: parcial })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  // As equipes ficam sempre no mapa do host (sorteado ou ajustado à mão); quem sobrar entra na menor ao iniciar.
  useEffect(() => {
    if (souHost && cfg && cfg.equipes_modo !== 'manual') config({ equipes_modo: 'manual' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [souHost, cfg?.equipes_modo])

  async function equipes(novoMapa) {
    setErro('')
    const { error } = await supabase.rpc('hint_equipes', { p_sala_id: salaId, p_mapa: novoMapa })
    if (error) setErro(error.message)
  }
  async function sortear() {
    setErro('')
    const { error } = await supabase.rpc('hint_sortear', { p_sala_id: salaId })
    if (error) setErro(error.message)
  }
  function alternar(userId) {
    const atual = mapa[userId]
    const proximo = atual === 'azul' ? 'vermelha' : atual === 'vermelha' ? null : 'azul'
    const novo = { ...mapa }
    if (proximo) novo[userId] = proximo
    else delete novo[userId]
    equipes(novo)
  }
  function alternarMod(m) {
    const atuais = cfg.modalidades
    const novas = atuais.includes(m) ? atuais.filter((x) => x !== m) : [...atuais, m]
    if (!novas.length) return
    config({ modalidades: novas })
  }
  function alternarRegra(id) {
    config({ personalizado: true, regras: { ...cfg.regras, [id]: !cfg.regras[id] } })
  }

  if (!cfg) return null
  const qtd = { azul: 0, vermelha: 0, sem: 0 }
  for (const j of jogadores) qtd[mapa[j.user_id] ?? 'sem']++

  return (
    <div className="mt-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Equipes</p>
      <ul className="mt-3 flex flex-col gap-2">
        {jogadores.map((j) => {
          const eq = mapa[j.user_id]
          return (
            <li key={j.user_id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5">
              <span className="text-sm font-medium">{j.nome}</span>
              <button
                disabled={!souHost}
                onClick={() => alternar(j.user_id)}
                className="rounded-full border px-3 py-1 text-xs font-semibold disabled:cursor-default"
                style={{
                  borderColor: eq ? EQUIPES[eq].cor : 'rgba(255,255,255,0.18)',
                  color: eq ? EQUIPES[eq].cor : 'rgba(255,255,255,0.5)',
                  background: eq ? `${EQUIPES[eq].cor}1f` : 'transparent',
                }}
              >
                {eq ? EQUIPES[eq].nome : 'Sem equipe'}
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>
          Azul {qtd.azul} · Vermelha {qtd.vermelha}
          {qtd.sem ? ` · ${qtd.sem} sem equipe (entram na menor)` : ''}
        </span>
        {souHost && (
          <button onClick={sortear} className="flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 font-semibold text-secondary">
            <Shuffle className="h-3.5 w-3.5" /> Sortear
          </button>
        )}
      </div>

      <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted">Modalidades</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {Object.entries(MODS).map(([id, m]) => {
          const Icone = m.icon
          const ativo = cfg.modalidades.includes(id)
          return (
            <button
              key={id}
              disabled={!souHost || enviando}
              onClick={() => alternarMod(id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-default ${
                ativo ? 'bg-white/5 text-primary' : 'border-border bg-surface text-muted'
              }`}
              style={ativo ? { borderColor: m.cor } : undefined}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: ativo ? m.cor : 'rgba(255,255,255,0.1)' }}>
                <Icone className="h-4 w-4" color={ativo ? '#0b0b10' : '#aaa'} />
              </span>
              {m.nome}
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Tempo da rodada</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {TEMPOS.map((t) => (
              <Chip key={t} ativo={cfg.tempo === t} disabled={!souHost || enviando} onClick={() => config({ tempo: t })}>
                {t}s
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Pontos pra vencer</p>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {METAS.map((m) => (
              <Chip key={m} ativo={cfg.meta === m} disabled={!souHost || enviando} onClick={() => config({ meta: m })}>
                {m}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-6 rounded-xl border border-border bg-surface px-4 py-3" open={cfg.personalizado}>
        <summary className="cursor-pointer text-sm font-semibold text-secondary">
          Regras {cfg.personalizado ? '(personalizadas)' : '(padrão)'}
        </summary>
        <ul className="mt-3 flex flex-col gap-3">
          {REGRAS.map((r) => {
            const ligada = cfg.personalizado ? cfg.regras[r.id] : true
            return (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold">{r.nome}</span>
                  <span className="block text-[11px] leading-snug text-muted">{r.desc}</span>
                </span>
                <button
                  role="switch"
                  aria-checked={ligada}
                  disabled={!souHost || enviando}
                  onClick={() => alternarRegra(r.id)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${ligada ? 'bg-accent' : 'bg-white/15'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${ligada ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </li>
            )
          })}
        </ul>
        {souHost && cfg.personalizado && (
          <button
            onClick={() => config({ personalizado: false })}
            className="mt-3 text-xs font-semibold text-accent"
          >
            Voltar pras regras padrão
          </button>
        )}
      </details>

      {!souHost && <p className="mt-3 text-xs text-muted">Só o host muda as opções. De 4 a 12 jogadores, 2 por equipe no mínimo.</p>}
      {souHost && <p className="mt-3 text-xs text-muted">Toque no nome pra trocar a equipe. De 4 a 12 jogadores, 2 por equipe no mínimo.</p>}
      {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
    </div>
  )
}
