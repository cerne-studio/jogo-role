import { sigmoide } from './rng.js'

// Referências "do resto da liga" (o usuário compete contra um campo que o motor não simula jogador a jogador).
function campoDaLiga(rng) {
  return {
    barraMvp: rng.norm(89.2, 2.0),
    pontos: rng.norm(30.2, 1.8),
    rebotes: rng.norm(12.8, 0.9),
    assistencias: rng.norm(10.6, 1.0),
    roubos: rng.norm(2.1, 0.2),
    tocos: rng.norm(3.0, 0.4),
    barraNovato: rng.norm(71, 5),
  }
}

// ctx = { estado, stats, papel, vitorias, seed, novato, delta, quinteto }
// Retorna lista de { id, nome, tier } ordenada por prestígio.
export function avaliarPremios(ctx, rng) {
  const { estado, stats, papel, vitorias, seed, novato, delta } = ctx
  const ovr = estado.media
  const campo = campoDaLiga(rng)
  const premios = []
  const jogos = stats.jogos
  const add = (id, nome, tier) => premios.push({ id, nome, tier })

  const elegivel58 = jogos >= 58
  const efetivo = ovr + (estado.fama - 50) * 0.05

  // MVP
  const notaMvp = ovr + (vitorias - 45) * 0.12 + (stats.ppg - 24) * 0.12
  if (elegivel58 && papel === 'estrela' && seed <= 6 && rng.chance(sigmoide((notaMvp - campo.barraMvp) / 1.4))) {
    add('mvp', 'MVP da Temporada', 1)
  }

  // Defensor do Ano
  if (elegivel58 && estado.atrs.defesa >= 82) {
    const p = sigmoide((estado.atrs.defesa - 91) / 2.4 + (stats.bpg + stats.spg - 3.2) * 0.5)
    if (rng.chance(p)) add('dpoy', 'Defensor do Ano', 2)
  }

  // Novato do Ano
  if (novato && jogos >= 40) {
    const p = sigmoide((ovr + (stats.ppg - 9) * 0.35 - campo.barraNovato) / 2.2)
    if (rng.chance(p)) add('roy', 'Novato do Ano', 3)
  }

  // Sexto Homem
  if (elegivel58 && (papel === 'rotacao' || papel === 'banco') && stats.ppg >= 15) {
    if (rng.chance(sigmoide((stats.ppg - 18.5) / 1.8))) add('sixth', 'Sexto Homem do Ano', 3)
  }

  // Jogador que Mais Evoluiu
  if (delta >= 6 && ovr < 86 && jogos >= 50 && rng.chance(0.55)) add('mip', 'Jogador que Mais Evoluiu', 3)

  // All-Star
  if (jogos >= 35 && rng.chance(sigmoide((efetivo - 79) / 1.8))) add('allstar', 'All-Star', 5)

  // Times da temporada
  if (jogos >= 55) {
    const nota = ovr + rng.norm(0, 1.4)
    if (nota >= 90.5) add('allnba1', 'Quinteto Ideal da NBA (1º time)', 2)
    else if (nota >= 86.5) add('allnba2', 'Quinteto Ideal da NBA (2º time)', 4)
    else if (nota >= 82.5) add('allnba3', 'Quinteto Ideal da NBA (3º time)', 5)
  }
  if (jogos >= 55 && estado.atrs.defesa >= 80 && rng.chance(sigmoide((estado.atrs.defesa - 83) / 2))) {
    add('alldef', 'Quinteto Defensivo', 5)
  }

  // Líderes estatísticos
  if (elegivel58 && stats.ppg > campo.pontos) add('ptsleader', 'Cestinha da NBA', 4)
  if (elegivel58 && stats.rpg > campo.rebotes) add('rebleader', 'Líder em rebotes', 4)
  if (elegivel58 && stats.apg > campo.assistencias) add('astleader', 'Líder em assistências', 4)
  if (elegivel58 && stats.spg > campo.roubos) add('stlleader', 'Líder em roubos de bola', 5)
  if (elegivel58 && stats.bpg > campo.tocos) add('blkleader', 'Líder em tocos', 5)

  // Remove prêmios repetidos de time (fica o melhor)
  const times = premios.filter((p) => p.id.startsWith('allnba')).sort((a, b) => a.tier - b.tier)
  const final = premios.filter((p) => !p.id.startsWith('allnba'))
  if (times[0]) final.push(times[0])
  return final.sort((a, b) => a.tier - b.tier)
}

// MVP das Finais: o usuário precisa ter sido o melhor do time campeão.
export function sorteiaMvpFinais(papel, ovr, forcaTime, rng) {
  const rel = ovr - (forcaTime - 6)
  const p = papel === 'estrela' ? 0.82 : papel === 'titular' ? Math.max(0.05, 0.25 + rel * 0.01) : papel === 'rotacao' ? 0.02 : 0
  return rng.chance(p)
}
