// Lendas anteriores ao FIFA 15 (que o dataset não cobre), no mesmo formato do pool do draft.
// Notas e perfis são estimativas nossas (a nota "de auge", no espírito dos Icons do FIFA), não dados oficiais.
// Uso: node scripts/montar-lendas.mjs <saida.json>
import { writeFileSync } from 'node:fs'

// [nome, nome completo, posições, nota, perfil, clube, país, agressividade?]
const L = [
  ['Pelé (O Rei)', 'Edson Arantes do Nascimento', ['CAM', 'ST'], 98, 'atacante', 'Santos', 'Brasil'],
  ['Maradona', 'Diego Armando Maradona', ['CAM', 'CF'], 97, 'meia', 'Napoli', 'Argentina', 80],
  ['Zidane', 'Zinedine Zidane', ['CAM', 'CM'], 96, 'meia', 'Real Madrid', 'França', 70],
  ['Ronaldo', 'Ronaldo Luís Nazário de Lima', ['ST'], 96, 'atacante', 'Inter', 'Brasil'],
  ['Cruyff', 'Johan Cruyff', ['CF', 'CAM'], 94, 'meia', 'Ajax', 'Holanda', 70],
  ['Beckenbauer', 'Franz Beckenbauer', ['CB', 'CDM'], 95, 'zag', 'Bayern München', 'Alemanha'],
  ['Yashin', 'Lev Yashin', ['GK'], 94, 'gk', 'Dínamo de Moscou', 'Rússia'],
  ['Maldini', 'Paolo Maldini', ['CB', 'LB'], 94, 'zag', 'Milan', 'Itália'],
  ['Zico', 'Arthur Antunes Coimbra', ['CAM', 'CF'], 94, 'meia', 'Flamengo', 'Brasil', 60],
  ['Eusébio', 'Eusébio da Silva Ferreira', ['ST', 'CF'], 94, 'atacante', 'Benfica', 'Portugal'],
  ['Garrincha', 'Manuel Francisco dos Santos', ['RW'], 94, 'ponta', 'Botafogo', 'Brasil', 55],
  ['Van Basten', 'Marco van Basten', ['ST'], 94, 'atacante', 'Milan', 'Holanda'],
  ['Platini', 'Michel Platini', ['CAM', 'CM'], 93, 'meia', 'Juventus', 'França'],
  ['Puskás', 'Ferenc Puskás', ['ST', 'CF'], 93, 'atacante', 'Real Madrid', 'Hungria'],
  ['Romário', 'Romário de Souza Faria', ['ST'], 93, 'atacante', 'Barcelona', 'Brasil', 58],
  ['Di Stéfano', 'Alfredo Di Stéfano', ['CF', 'ST'], 92, 'atacante', 'Real Madrid', 'Argentina'],
  ['G. Müller', 'Gerd Müller', ['ST'], 92, 'atacante', 'Bayern München', 'Alemanha'],
  ['Baresi', 'Franco Baresi', ['CB'], 92, 'zag', 'Milan', 'Itália'],
  ['Matthäus', 'Lothar Matthäus', ['CM', 'CDM'], 92, 'vol', 'Inter', 'Alemanha', 78],
  ['B. Charlton', 'Bobby Charlton', ['CAM', 'CM'], 92, 'meia', 'Manchester United', 'Inglaterra'],
  ['G. Best', 'George Best', ['RW', 'LW'], 92, 'ponta', 'Manchester United', 'Irlanda do Norte', 70],
  ['Bobby Moore', 'Robert Frederick Moore', ['CB'], 91, 'zag', 'West Ham United', 'Inglaterra'],
  ['Rivaldo', 'Vítor Borba Ferreira', ['CAM', 'LW'], 91, 'meia', 'Barcelona', 'Brasil', 60],
  ['Batistuta', 'Gabriel Omar Batistuta', ['ST'], 91, 'atacante', 'Fiorentina', 'Argentina', 70],
  ['R. Baggio', 'Roberto Baggio', ['CF', 'CAM'], 91, 'meia', 'Juventus', 'Itália'],
  ['Bergkamp', 'Dennis Bergkamp', ['CF', 'CAM'], 91, 'meia', 'Arsenal', 'Holanda'],
  ['Gullit', 'Ruud Gullit', ['CM', 'CAM'], 91, 'meia', 'Milan', 'Holanda'],
  ['Falcão', 'Paulo Roberto Falcão', ['CM', 'CAM'], 91, 'meia', 'Roma', 'Brasil'],
  ['Sócrates', 'Sócrates Brasileiro Sampaio', ['CAM', 'CM'], 90, 'meia', 'Corinthians', 'Brasil'],
  ['Scirea', 'Gaetano Scirea', ['CB'], 90, 'zag', 'Juventus', 'Itália', 35],
  ['Zoff', 'Dino Zoff', ['GK'], 90, 'gk', 'Juventus', 'Itália'],
  ['Cafu', 'Marcos Evangelista de Morais', ['RB', 'RWB'], 90, 'lat', 'Milan', 'Brasil'],
  ['Roberto Carlos', 'Roberto Carlos da Silva', ['LB', 'LWB'], 90, 'lat', 'Real Madrid', 'Brasil'],
  ['Kahn', 'Oliver Kahn', ['GK'], 90, 'gk', 'Bayern München', 'Alemanha'],
  ['Jairzinho', 'Jair Ventura Filho', ['RW', 'ST'], 90, 'ponta', 'Botafogo', 'Brasil'],
  ['Rivelino', 'Roberto Rivellino', ['LW', 'CAM'], 90, 'ponta', 'Corinthians', 'Brasil'],
  ['C. Alberto', 'Carlos Alberto Torres', ['RB'], 90, 'lat', 'Santos', 'Brasil'],
  ['Laudrup', 'Michael Laudrup', ['CAM', 'CF'], 90, 'meia', 'Barcelona', 'Dinamarca'],
  ['Rijkaard', 'Frank Rijkaard', ['CDM', 'CB'], 90, 'vol', 'Milan', 'Holanda'],
  ['Stoichkov', 'Hristo Stoichkov', ['LW', 'ST'], 90, 'ponta', 'Barcelona', 'Bulgária', 82],
  ['Shevchenko', 'Andriy Shevchenko', ['ST'], 90, 'atacante', 'Milan', 'Ucrânia'],
  ['Raúl González', 'Raúl González Blanco', ['ST', 'CF'], 90, 'atacante', 'Real Madrid', 'Espanha'],
  ['Figo', 'Luís Figo', ['RW', 'RM'], 90, 'ponta', 'Real Madrid', 'Portugal'],
  ['Nedvěd', 'Pavel Nedvěd', ['LM', 'CM'], 89, 'ponta', 'Juventus', 'Rep. Tcheca', 70],
  ['Cantona', 'Éric Cantona', ['CF', 'ST'], 89, 'atacante', 'Manchester United', 'França', 85],
  ['Weah', 'George Weah', ['ST', 'LW'], 89, 'atacante', 'Milan', 'Libéria'],
  ['Lineker', 'Gary Lineker', ['ST'], 89, 'atacante', 'Barcelona', 'Inglaterra', 25],
  ['Schmeichel', 'Peter Schmeichel', ['GK'], 89, 'gk', 'Manchester United', 'Dinamarca'],
  ['Banks', 'Gordon Banks', ['GK'], 89, 'gk', 'Stoke City', 'Inglaterra'],
  ['Keane', 'Roy Keane', ['CDM', 'CM'], 89, 'vol', 'Manchester United', 'Irlanda', 95],
  ['Nesta', 'Alessandro Nesta', ['CB'], 89, 'zag', 'Lazio', 'Itália'],
  ['D. Santos', 'Djalma Santos', ['RB'], 89, 'lat', 'Palmeiras', 'Brasil'],
  ['N. Santos', 'Nílton Santos', ['LB'], 89, 'lat', 'Botafogo', 'Brasil'],
  ['Facchetti', 'Giacinto Facchetti', ['LB', 'CB'], 89, 'lat', 'Inter', 'Itália'],
  ['Koeman', 'Ronald Koeman', ['CB', 'CDM'], 88, 'zag', 'Barcelona', 'Holanda'],
  ['Cannavaro', 'Fabio Cannavaro', ['CB'], 88, 'zag', 'Juventus', 'Itália'],
  ['Puyol', 'Carles Puyol', ['CB'], 88, 'zag', 'Barcelona', 'Espanha', 85],
  ['Desailly', 'Marcel Desailly', ['CB', 'CDM'], 88, 'zag', 'Milan', 'França'],
  ['Hierro', 'Fernando Hierro', ['CB', 'CDM'], 88, 'zag', 'Real Madrid', 'Espanha'],
  ['Van der Sar', 'Edwin van der Sar', ['GK'], 88, 'gk', 'Manchester United', 'Holanda'],
  ['Vieira', 'Patrick Vieira', ['CDM', 'CM'], 88, 'vol', 'Arsenal', 'França', 85],
  ['Deco', 'Anderson Luís de Souza', ['CAM', 'CM'], 88, 'meia', 'Porto', 'Portugal'],
  ['Hagi', 'Gheorghe Hagi', ['CAM', 'CM'], 88, 'meia', 'Galatasaray', 'Romênia'],
  ['Vieri', 'Christian Vieri', ['ST'], 88, 'atacante', 'Inter', 'Itália'],
  ['Hugo Sánchez', 'Hugo Sánchez Márquez', ['ST'], 88, 'atacante', 'Real Madrid', 'México'],
  ['Careca', 'Antônio de Oliveira Filho', ['ST'], 88, 'atacante', 'Napoli', 'Brasil'],
  ['Larsson', 'Henrik Larsson', ['ST', 'CF'], 88, 'atacante', 'Celtic', 'Suécia'],
  ['Owen', 'Michael Owen', ['ST'], 88, 'atacante', 'Liverpool', 'Inglaterra', 30],
  ['Giggs', 'Ryan Giggs', ['LW', 'LM'], 88, 'ponta', 'Manchester United', 'País de Gales'],
  ['Stam', 'Jaap Stam', ['CB'], 87, 'zag', 'Manchester United', 'Holanda', 85],
  ['Thuram', 'Lilian Thuram', ['RB', 'CB'], 87, 'lat', 'Juventus', 'França'],
  ['Zanetti', 'Javier Zanetti', ['RB', 'CDM'], 87, 'lat', 'Inter', 'Argentina'],
  ['Brehme', 'Andreas Brehme', ['LB', 'RB'], 87, 'lat', 'Inter', 'Alemanha'],
  ['Seedorf', 'Clarence Seedorf', ['CM', 'CAM'], 87, 'meia', 'Milan', 'Holanda'],
  ['Rui Costa', 'Manuel Rui Costa', ['CAM', 'CM'], 87, 'meia', 'Milan', 'Portugal'],
  ['Litmanen', 'Jari Litmanen', ['CAM', 'CF'], 87, 'meia', 'Ajax', 'Finlândia'],
  ['Beckham', 'David Beckham', ['RM', 'RW'], 87, 'ponta', 'Manchester United', 'Inglaterra'],
  ['Klinsmann', 'Jürgen Klinsmann', ['ST'], 87, 'atacante', 'Tottenham Hotspur', 'Alemanha'],
  ['D. Trezeguet', 'David Trezeguet', ['ST'], 87, 'atacante', 'Juventus', 'França'],
  ['Crespo', 'Hernán Crespo', ['ST'], 87, 'atacante', 'Chelsea', 'Argentina'],
  ['Overmars', 'Marc Overmars', ['LW', 'LM'], 87, 'ponta', 'Arsenal', 'Holanda'],
  ['Davids', 'Edgar Davids', ['CDM', 'CM'], 86, 'vol', 'Juventus', 'Holanda', 90],
  ['Makélélé', 'Claude Makélélé', ['CDM'], 86, 'vol', 'Chelsea', 'França', 70],
  ['Blanc', 'Laurent Blanc', ['CB'], 86, 'zag', 'Manchester United', 'França'],
  ['Okocha', 'Jay-Jay Okocha', ['CAM', 'CM'], 85, 'meia', 'Paris Saint-Germain', 'Nigéria'],
  ['Gattuso', 'Gennaro Gattuso', ['CDM', 'CM'], 85, 'vol', 'Milan', 'Itália', 96],
  ['Inzaghi', 'Filippo Inzaghi', ['ST'], 85, 'atacante', 'Milan', 'Itália'],
]

const PERFIS = {
  gk: { ritmo: 0, chute: 0, passe: 0, drible: 0, defesa: 0, fisico: 0, agr: 40 },
  zag: { ritmo: -14, chute: -30, passe: -12, drible: -22, defesa: 2, fisico: -4, agr: 72 },
  lat: { ritmo: -4, chute: -25, passe: -8, drible: -10, defesa: -3, fisico: -8, agr: 62 },
  vol: { ritmo: -14, chute: -14, passe: -3, drible: -12, defesa: -2, fisico: -3, agr: 78 },
  meia: { ritmo: -10, chute: -6, passe: 1, drible: 0, defesa: -30, fisico: -14, agr: 55 },
  ponta: { ritmo: 0, chute: -8, passe: -6, drible: 1, defesa: -45, fisico: -16, agr: 48 },
  atacante: { ritmo: -8, chute: 1, passe: -14, drible: -4, defesa: -50, fisico: -10, agr: 52 },
}

function hash(t) {
  let h = 2166136261
  for (const c of t) h = Math.imul(h ^ c.codePointAt(0), 16777619)
  return h >>> 0
}
const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const lim = (x) => Math.max(15, Math.min(98, Math.round(x)))

const saida = process.argv[2]
if (!saida) {
  console.error('uso: node scripts/montar-lendas.mjs <saida.json>')
  process.exit(1)
}

const pool = L.map(([nome, completo, posicoes, ovr, perfil, clube, pais, agr], i) => {
  const p = PERFIS[perfil]
  const j = (k) => ((hash(`${nome}:${k}`) % 7) - 3)
  const letras = [...new Set(semAcento(`${nome} ${completo}`).toUpperCase().split(/[^A-Z]+/).filter(Boolean).map((w) => w[0]))].sort().join('')
  const gk = perfil === 'gk'
  return {
    id: 900000 + i, versao: 0, nome, nome_completo: completo, letras, posicoes, overall: ovr,
    ritmo: gk ? null : lim(ovr + p.ritmo + j('r')), chute: gk ? null : lim(ovr + p.chute + j('c')), passe: gk ? null : lim(ovr + p.passe + j('p')),
    drible: gk ? null : lim(ovr + p.drible + j('d')), defesa: gk ? null : lim(ovr + p.defesa + j('f')), fisico: gk ? null : lim(ovr + p.fisico + j('s')),
    agressividade: lim(agr ?? p.agr + j('a') * 2), penaltis: lim(ovr - 12 + j('n') * 2), goleiro: gk ? ovr : 12,
    clube, liga: 'Lendas', pais, idade: null,
  }
})

writeFileSync(saida, JSON.stringify(pool))
console.log(`lendas: ${pool.length} | letras únicas: ${new Set(pool.flatMap((p) => [...p.letras])).size} | goleiros: ${pool.filter((p) => p.posicoes[0] === 'GK').length}`)
