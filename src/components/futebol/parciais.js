// Estatísticas "até agora" calculadas a partir dos lances já mostrados, pra aba de estatísticas ao vivo.
// No fim da partida o resultado tem que ser idêntico ao stats do motor (garantido por teste).

const CHUTES = ['chute_bloqueado', 'chute_fora', 'chute_trave', 'chute_defendido', 'gol', 'gol_anulado', 'penalti']
const NO_ALVO = ['chute_defendido', 'gol', 'gol_anulado', 'penalti']

const vazio = () => ({ finalizacoes: 0, noAlvo: 0, escanteios: 0, faltas: 0, amarelos: 0, vermelhos: 0, impedimentos: 0, defesas: 0, posse: 50 })

export function estatisticasParciais(eventos, posseMin) {
  const s = { A: vazio(), B: vazio() }
  for (const e of eventos) {
    const lado = e.time
    if (!lado) continue
    const outro = lado === 'A' ? 'B' : 'A'
    if (CHUTES.includes(e.tipo)) s[lado].finalizacoes += 1
    if (NO_ALVO.includes(e.tipo)) s[lado].noAlvo += 1
    if (e.tipo === 'escanteio') s[lado].escanteios += 1
    if (e.tipo === 'falta') s[lado].faltas += 1
    if (e.tipo === 'amarelo') s[lado].amarelos += 1
    if (e.tipo === 'vermelho') s[lado].vermelhos += 1
    if (e.tipo === 'impedimento') s[lado].impedimentos += 1
    if (e.tipo === 'chute_defendido' || e.tipo === 'penalti_defendido') s[outro].defesas += 1
  }
  const total = posseMin.length
  if (total > 0) {
    const a = posseMin.filter((m) => m.dono === 'A').length
    s.A.posse = Math.round((a / total) * 100)
    s.B.posse = 100 - s.A.posse
  }
  return s
}
