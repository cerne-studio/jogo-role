import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Play, Plus } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { criarRng } from '../../nba/engine/rng.js'
import { EVENTOS } from '../../nba/data/eventos.js'
import {
  iniciarCarreira, ehBase, podeDeclarar, draftObrigatorio, projetarDraft, realizarDraft, opcoesSemDraft,
  aceitarDuasVias, temContratoVencendo, propostasDeContrato, assinarProposta, simularAno, aposentar, fimForcado, avancarAno,
} from '../../nba/engine/carreira.js'
import { selecionarEventos, resolverEscolha, aplicarEfeitos, registrarVisto } from '../../nba/engine/eventos.js'
import NbaSetup from './NbaSetup.jsx'
import { BotaoPrimario, CartaoJogador, SeloLiga, Titulo } from './ui.jsx'
import { EventoTela, TemporadaTela, PlayoffsTela, PremiosTela, ResumoAnoTela } from './NbaTelasTemporada.jsx'
import { DraftDecisaoTela, DraftNoiteTela, SemDraftTela, ContratoTela, FimTela } from './NbaTelasCarreira.jsx'

const CHAVE_SAVE = 'jogo-role:nba:v2'
const EVENTOS_POR_ID = Object.fromEntries(EVENTOS.map((e) => [e.id, e]))

function lerSave() {
  try {
    const bruto = localStorage.getItem(CHAVE_SAVE)
    if (!bruto) return null
    const s = JSON.parse(bruto)
    return s && s.v === 2 && s.estado && s.fase ? s : null
  } catch {
    return null
  }
}
function gravarSave(j) {
  try {
    localStorage.setItem(CHAVE_SAVE, JSON.stringify({ ...j, v: 2 }))
  } catch {
    // sem localStorage: a carreira funciona, só não sobrevive a recarregar
  }
}
function apagarSave() {
  try {
    localStorage.removeItem(CHAVE_SAVE)
  } catch {
    // ignora
  }
}

export default function NbaCarreira({ onBack }) {
  const rng = useMemo(() => criarRng(null), [])
  const [save] = useState(() => lerSave())
  const [j, setJ] = useState({ fase: 'inicio' })
  const MENSAGEM_SAIR = 'Sua carreira fica salva neste aparelho. Dá pra continuar depois.'

  // grava depois de cada passo (menos nas telas de início/montagem)
  useEffect(() => {
    if (j.estado && j.fase !== 'inicio' && j.fase !== 'setup') gravarSave(j)
  }, [j])

  // ── fluxo ────────────────────────────────────────────────
  function rodarTemporada(e, pend) {
    const { estado, relatorio } = simularAno(e, rng, pend)
    setJ({ fase: 'temporada', estado, relatorio })
  }

  function abrirTemporada(e) {
    const eventos = selecionarEventos(e, rng, ehBase(e) ? 1 : 2, 'pre')
    if (!eventos.length) return rodarTemporada(e, {})
    setJ({ fase: 'evento', estado: e, fila: eventos.map((x) => x.id), idx: 0, resposta: null, pend: {} })
  }

  function finalizar(e) {
    const { estado, legado } = aposentar(e)
    setJ({ fase: 'fim', estado, extra: { legado } })
  }

  function iniciarAno(e) {
    if (ehBase(e)) {
      if (draftObrigatorio(e) || podeDeclarar(e)) {
        setJ({ fase: 'draft_decisao', estado: e, extra: { projecao: projetarDraft(e, rng), obrigatorio: draftObrigatorio(e) } })
        return
      }
      return abrirTemporada(e)
    }
    if (temContratoVencendo(e)) {
      const propostas = propostasDeContrato(e, rng)
      if (!propostas.length) return finalizar(e)
      setJ({ fase: 'contrato', estado: e, extra: { propostas } })
      return
    }
    abrirTemporada(e)
  }

  function iniciar(config) {
    abrirTemporada(iniciarCarreira(config, rng))
  }

  function escolherEvento(i) {
    const ev = EVENTOS_POR_ID[j.fila[j.idx]]
    const r = resolverEscolha(ev.escolhas[i], rng)
    const ap = aplicarEfeitos(registrarVisto(j.estado, ev), r.efeitos, j.pend)
    setJ({ ...j, estado: ap.estado, pend: ap.pend, resposta: r })
  }

  function proximoEvento() {
    if (j.idx + 1 < j.fila.length) setJ({ ...j, idx: j.idx + 1, resposta: null })
    else rodarTemporada(j.estado, j.pend)
  }

  function depoisDaTemporada() {
    const rel = j.relatorio
    if (rel.kind === 'nba' && rel.playoffs.classificado && rel.playoffs.series.length) {
      setJ({ ...j, fase: 'playoffs' })
    } else {
      depoisDosPlayoffs()
    }
  }

  function depoisDosPlayoffs() {
    const rel = j.relatorio
    const temTroféus = (rel.premios?.length ?? 0) > 0 || (rel.marcos?.length ?? 0) > 0 || rel.campeao
    setJ({ ...j, fase: temTroféus ? 'premios' : 'resumo' })
  }

  function fecharAno() {
    const rel = j.relatorio
    const campeaoId = rel.kind === 'nba' ? rel.playoffs?.campeao : null
    const ne = avancarAno(j.estado, rng, { campeaoId })
    if (fimForcado(ne)) return finalizar(ne)
    iniciarAno(ne)
  }

  function declararDraft() {
    const r = realizarDraft(j.estado, rng)
    setJ({ fase: 'draft_noite', estado: r.estado, extra: { draft: r.draft } })
  }

  function depoisDoDraft() {
    const d = j.extra.draft
    if (d.fora) {
      setJ({ fase: 'sem_draft', estado: j.estado, extra: { ofertas: opcoesSemDraft(j.estado, rng) } })
    } else {
      abrirTemporada(j.estado)
    }
  }

  function recomecar() {
    apagarSave()
    setJ({ fase: 'setup' })
  }

  function sairParaHome() {
    if (j.fase === 'fim') apagarSave()
    onBack()
  }

  // ── telas ────────────────────────────────────────────────
  const sair = <ExitButton onExit={sairParaHome} mensagem={j.fase === 'fim' ? 'Voltar pro início?' : MENSAGEM_SAIR} />

  if (j.fase === 'inicio') {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-5 py-8">
        <ExitButton onExit={onBack} mensagem="Voltar pro início?" />
        <Titulo pequeno="Jogo do Rolê" sub="Do primeiro treino ao Hall da Fama. Draft, contratos, prêmios, playoffs e recordes.">Carreira NBA</Titulo>
        <div className="mt-6 flex items-center gap-2 text-xs text-secondary"><SeloLiga tipo="nba" /><SeloLiga tipo="gleague" /><span>Times reais (só nomes e cores)</span></div>
        {save && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted">Carreira salva</p>
            <CartaoJogador estado={save.estado} compacto />
          </motion.div>
        )}
        <div className="flex-1" />
        <div className="flex flex-col gap-2 pt-8">
          {save && (
            <BotaoPrimario onClick={() => setJ(save)}>
              <span className="inline-flex items-center justify-center gap-2"><Play className="h-4 w-4" /> Continuar carreira</span>
            </BotaoPrimario>
          )}
          <BotaoPrimario secundario={!!save} onClick={() => { if (save) apagarSave(); setJ({ fase: 'setup' }) }}>
            <span className="inline-flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> {save ? 'Nova carreira (apaga a salva)' : 'Começar carreira'}</span>
          </BotaoPrimario>
          <button onClick={onBack} className="py-3 text-sm text-secondary">Voltar</button>
        </div>
      </div>
    )
  }

  if (j.fase === 'setup') return <NbaSetup onStart={iniciar} onBack={onBack} />

  const e = j.estado
  let tela = null

  if (j.fase === 'evento') {
    const ev = EVENTOS_POR_ID[j.fila[j.idx]]
    tela = <EventoTela estado={e} evento={ev} indice={j.idx} total={j.fila.length} resposta={j.resposta} onEscolher={escolherEvento} onContinuar={proximoEvento} />
  } else if (j.fase === 'temporada') {
    tela = <TemporadaTela estado={e} relatorio={j.relatorio} temPlayoffs={j.relatorio.kind === 'nba' && j.relatorio.playoffs.classificado && j.relatorio.playoffs.series.length > 0} onContinuar={depoisDaTemporada} />
  } else if (j.fase === 'playoffs') {
    tela = <PlayoffsTela estado={e} relatorio={j.relatorio} onContinuar={depoisDosPlayoffs} />
  } else if (j.fase === 'premios') {
    tela = <PremiosTela estado={e} relatorio={j.relatorio} onContinuar={() => setJ({ ...j, fase: 'resumo' })} />
  } else if (j.fase === 'resumo') {
    tela = <ResumoAnoTela estado={e} relatorio={j.relatorio} onProximo={fecharAno} onAposentar={() => finalizar(e)} podeAposentar={!ehBase(e) && e.idade >= 33} />
  } else if (j.fase === 'draft_decisao') {
    tela = <DraftDecisaoTela estado={e} projecao={j.extra.projecao} obrigatorio={j.extra.obrigatorio} onDeclarar={declararDraft} onFicar={() => abrirTemporada(e)} />
  } else if (j.fase === 'draft_noite') {
    tela = <DraftNoiteTela estado={e} draft={j.extra.draft} onContinuar={depoisDoDraft} />
  } else if (j.fase === 'sem_draft') {
    tela = (
      <SemDraftTela
        estado={e}
        ofertas={j.extra.ofertas}
        podeVoltar={e.idade < 21}
        onEscolher={(o) => abrirTemporada(aceitarDuasVias({ ...e }, o))}
        onVoltar={() => abrirTemporada({ ...e, draft: null })}
      />
    )
  } else if (j.fase === 'contrato') {
    tela = <ContratoTela estado={e} propostas={j.extra.propostas} onEscolher={(p) => abrirTemporada(assinarProposta(e, p))} onAposentar={() => finalizar(e)} />
  } else if (j.fase === 'fim') {
    tela = <FimTela estado={e} legado={j.extra.legado} onNova={recomecar} onSair={sairParaHome} />
  }

  return (
    <>
      {sair}
      {tela}
    </>
  )
}
