// Valida o banco de eventos da Carreira NBA: ids únicos, estrutura das escolhas e chaves de efeito conhecidas.
import { EVENTOS } from '../src/nba/data/eventos.js'

const ATRS = ['arremesso', 'infiltracao', 'passe', 'defesa', 'fisico', 'qi']
const EFEITOS = new Set([...ATRS, 'moral', 'fama', 'tecnico', 'vestiario', 'imagem', 'desgaste', 'potencial', 'dinheiro', 'patrocinio', 'gasto', 'salarioPct', 'flag', 'semFlag', 'risco', 'foraTemporada', 'minutosBonus', 'minutosPenalidade', 'linha'])
const COND = new Set(['idadeMin','idadeMax','mediaMin','mediaMax','famaMin','famaMax','moralMin','moralMax','desgasteMin','tecnicoMin','tecnicoMax','vestiarioMax','temporadaNbaMin','temporadaNbaMax','titulosMin','patrimonioMin','patrimonioMax','posicao','nivel','papel','flags','semFlags','contratoAnosMax','lesaoRecente','campeaoRecente','mvpRecente','semPlayoffsRecente','pais','caminho'])
let erros = 0
const err = (m) => { console.log('ERRO', m); erros++ }
const ids = new Set()
const porFase = {}
for (const ev of EVENTOS) {
  if (ids.has(ev.id)) err(`id repetido: ${ev.id}`)
  ids.add(ev.id)
  porFase[ev.fase] = (porFase[ev.fase] ?? 0) + 1
  if (!ev.titulo || !ev.texto) err(`${ev.id}: sem título/texto`)
  if (!['base', 'nba'].includes(ev.fase)) err(`${ev.id}: fase inválida ${ev.fase}`)
  for (const k of Object.keys(ev.cond ?? {})) if (!COND.has(k)) err(`${ev.id}: condição desconhecida ${k}`)
  if (!ev.escolhas?.length || ev.escolhas.length > 4) err(`${ev.id}: precisa de 1 a 4 escolhas`)
  for (const [i, c] of (ev.escolhas ?? []).entries()) {
    if (!c.rotulo) err(`${ev.id}[${i}]: sem rótulo`)
    const blocos = c.alea ? [c.alea.sucesso, c.alea.falha] : [c]
    if (c.alea && (typeof c.alea.p !== 'number' || !c.alea.sucesso?.resultado || !c.alea.falha?.resultado)) err(`${ev.id}[${i}]: alea incompleto`)
    for (const b of blocos) {
      if (!b?.resultado) err(`${ev.id}[${i}]: sem resultado`)
      for (const [k, v] of Object.entries(b?.efeitos ?? {})) {
        if (!EFEITOS.has(k)) err(`${ev.id}[${i}]: efeito desconhecido ${k}`)
        if (typeof v === 'number' && ATRS.includes(k) && Math.abs(v) > 4) err(`${ev.id}[${i}]: atributo ${k} ${v} muito forte`)
      }
    }
  }
}
console.log(`${EVENTOS.length} eventos | por fase:`, porFase, '| erros:', erros)
process.exit(erros ? 1 : 0)
