// As 30 franquias da NBA, só como NOME e cores (sem logo, sem marca gráfica, sem jogadores).
// `forca` é balanço de jogo, não um ranking oficial de ninguém; ela muda a cada temporada (veja engine/liga.js).

export const TIMES = [
  // ── Conferência Leste ──
  { id: 'bos', nbaId: 1610612738, nome: 'Boston Celtics', cidade: 'Boston', sigla: 'BOS', conf: 'Leste', cores: ['#007A33', '#BA9653'], forca: 84 },
  { id: 'bkn', nbaId: 1610612751, nome: 'Brooklyn Nets', cidade: 'Brooklyn', sigla: 'BKN', conf: 'Leste', cores: ['#111111', '#E5E5E5'], forca: 58 },
  { id: 'nyk', nbaId: 1610612752, nome: 'New York Knicks', cidade: 'Nova York', sigla: 'NYK', conf: 'Leste', cores: ['#006BB6', '#F58426'], forca: 83 },
  { id: 'phi', nbaId: 1610612755, nome: 'Philadelphia 76ers', cidade: 'Filadélfia', sigla: 'PHI', conf: 'Leste', cores: ['#006BB6', '#ED174C'], forca: 74 },
  { id: 'tor', nbaId: 1610612761, nome: 'Toronto Raptors', cidade: 'Toronto', sigla: 'TOR', conf: 'Leste', cores: ['#CE1141', '#1A1A1A'], forca: 66 },
  { id: 'chi', nbaId: 1610612741, nome: 'Chicago Bulls', cidade: 'Chicago', sigla: 'CHI', conf: 'Leste', cores: ['#CE1141', '#111111'], forca: 63 },
  { id: 'cle', nbaId: 1610612739, nome: 'Cleveland Cavaliers', cidade: 'Cleveland', sigla: 'CLE', conf: 'Leste', cores: ['#860038', '#FDBB30'], forca: 86 },
  { id: 'det', nbaId: 1610612765, nome: 'Detroit Pistons', cidade: 'Detroit', sigla: 'DET', conf: 'Leste', cores: ['#C8102E', '#1D42BA'], forca: 77 },
  { id: 'ind', nbaId: 1610612754, nome: 'Indiana Pacers', cidade: 'Indiana', sigla: 'IND', conf: 'Leste', cores: ['#002D62', '#FDBB30'], forca: 79 },
  { id: 'mil', nbaId: 1610612749, nome: 'Milwaukee Bucks', cidade: 'Milwaukee', sigla: 'MIL', conf: 'Leste', cores: ['#00471B', '#EEE1C6'], forca: 76 },
  { id: 'atl', nbaId: 1610612737, nome: 'Atlanta Hawks', cidade: 'Atlanta', sigla: 'ATL', conf: 'Leste', cores: ['#E03A3E', '#C1D32F'], forca: 68 },
  { id: 'cha', nbaId: 1610612766, nome: 'Charlotte Hornets', cidade: 'Charlotte', sigla: 'CHA', conf: 'Leste', cores: ['#1D1160', '#00788C'], forca: 58 },
  { id: 'mia', nbaId: 1610612748, nome: 'Miami Heat', cidade: 'Miami', sigla: 'MIA', conf: 'Leste', cores: ['#98002E', '#F9A01B'], forca: 71 },
  { id: 'orl', nbaId: 1610612753, nome: 'Orlando Magic', cidade: 'Orlando', sigla: 'ORL', conf: 'Leste', cores: ['#0077C0', '#C4CED4'], forca: 77 },
  { id: 'was', nbaId: 1610612764, nome: 'Washington Wizards', cidade: 'Washington', sigla: 'WAS', conf: 'Leste', cores: ['#002B5C', '#E31837'], forca: 54 },
  // ── Conferência Oeste ──
  { id: 'den', nbaId: 1610612743, nome: 'Denver Nuggets', cidade: 'Denver', sigla: 'DEN', conf: 'Oeste', cores: ['#0E2240', '#FEC524'], forca: 84 },
  { id: 'min', nbaId: 1610612750, nome: 'Minnesota Timberwolves', cidade: 'Minnesota', sigla: 'MIN', conf: 'Oeste', cores: ['#0C2340', '#78BE20'], forca: 82 },
  { id: 'okc', nbaId: 1610612760, nome: 'Oklahoma City Thunder', cidade: 'Oklahoma City', sigla: 'OKC', conf: 'Oeste', cores: ['#007AC1', '#EF3B24'], forca: 92 },
  { id: 'por', nbaId: 1610612757, nome: 'Portland Trail Blazers', cidade: 'Portland', sigla: 'POR', conf: 'Oeste', cores: ['#E03A3E', '#1A1A1A'], forca: 62 },
  { id: 'uta', nbaId: 1610612762, nome: 'Utah Jazz', cidade: 'Utah', sigla: 'UTA', conf: 'Oeste', cores: ['#4B2E83', '#F9A01B'], forca: 56 },
  { id: 'gsw', nbaId: 1610612744, nome: 'Golden State Warriors', cidade: 'São Francisco', sigla: 'GSW', conf: 'Oeste', cores: ['#1D428A', '#FFC72C'], forca: 77 },
  { id: 'lac', nbaId: 1610612746, nome: 'Los Angeles Clippers', cidade: 'Los Angeles', sigla: 'LAC', conf: 'Oeste', cores: ['#C8102E', '#1D428A'], forca: 70 },
  { id: 'lal', nbaId: 1610612747, nome: 'Los Angeles Lakers', cidade: 'Los Angeles', sigla: 'LAL', conf: 'Oeste', cores: ['#552583', '#FDB927'], forca: 78 },
  { id: 'phx', nbaId: 1610612756, nome: 'Phoenix Suns', cidade: 'Phoenix', sigla: 'PHX', conf: 'Oeste', cores: ['#1D1160', '#E56020'], forca: 64 },
  { id: 'sac', nbaId: 1610612758, nome: 'Sacramento Kings', cidade: 'Sacramento', sigla: 'SAC', conf: 'Oeste', cores: ['#5A2D81', '#63727A'], forca: 66 },
  { id: 'dal', nbaId: 1610612742, nome: 'Dallas Mavericks', cidade: 'Dallas', sigla: 'DAL', conf: 'Oeste', cores: ['#00538C', '#B8C4CA'], forca: 69 },
  { id: 'hou', nbaId: 1610612745, nome: 'Houston Rockets', cidade: 'Houston', sigla: 'HOU', conf: 'Oeste', cores: ['#CE1141', '#C4CED4'], forca: 83 },
  { id: 'mem', nbaId: 1610612763, nome: 'Memphis Grizzlies', cidade: 'Memphis', sigla: 'MEM', conf: 'Oeste', cores: ['#5D76A9', '#12173F'], forca: 72 },
  { id: 'nop', nbaId: 1610612740, nome: 'New Orleans Pelicans', cidade: 'Nova Orleans', sigla: 'NOP', conf: 'Oeste', cores: ['#0C2340', '#C8102E'], forca: 60 },
  { id: 'sas', nbaId: 1610612759, nome: 'San Antonio Spurs', cidade: 'San Antonio', sigla: 'SAS', conf: 'Oeste', cores: ['#6B7280', '#111111'], forca: 75 },
]

export const TIMES_POR_ID = Object.fromEntries(TIMES.map((t) => [t.id, t]))

// ── Caminhos até a NBA: onde o jogador começa (nomes de instituições, só texto) ──
export const FACULDADES = [
  'Duke', 'Kentucky', 'North Carolina', 'Kansas', 'UConn', 'Gonzaga', 'Arizona', 'UCLA',
  'Michigan State', 'Houston', 'Baylor', 'Purdue', 'Tennessee', 'Alabama', 'Auburn', 'Villanova',
]

export const CLUBES_EUROPA = [
  'Real Madrid', 'Barcelona', 'Olympiacos', 'Panathinaikos', 'Partizan', 'Estrela Vermelha',
  'Fenerbahçe', 'Anadolu Efes', 'Žalgiris', 'Mónaco', 'Bayern de Munique', 'Olimpia Milano',
]

export const CLUBES_BRASIL = ['Flamengo', 'Franca', 'Minas', 'Paulistano', 'Bauru', 'Brasília', 'Pinheiros', 'Corinthians']

// Ligas fora da NBA pra onde a carreira segue quando não rola (ou quando o jogador prefere).
export const LIGAS_EXTERIOR = [
  { liga: 'NBB (Brasil)', pais: 'brasil', clubes: CLUBES_BRASIL },
  { liga: 'Liga ACB (Espanha)', clubes: ['Real Madrid', 'Barcelona', 'Baskonia', 'Valencia', 'Unicaja', 'Joventut'] },
  { liga: 'Euroliga / Grécia', clubes: ['Olympiacos', 'Panathinaikos', 'AEK Atenas', 'PAOK'] },
  { liga: 'Liga Turca', clubes: ['Fenerbahçe', 'Anadolu Efes', 'Beşiktaş', 'Bursaspor'] },
  { liga: 'Liga Italiana', clubes: ['Olimpia Milano', 'Virtus Bolonha', 'Reggio Emilia', 'Trento'] },
  { liga: 'Liga Francesa', clubes: ['Mónaco', 'ASVEL', 'Limoges', 'Nanterre'] },
  { liga: 'Bundesliga (Alemanha)', clubes: ['Bayern de Munique', 'Alba Berlim', 'Ratiopharm Ulm', 'Bamberg'] },
  { liga: 'Liga Adriática', clubes: ['Estrela Vermelha', 'Partizan', 'Cedevita Olimpija', 'Budućnost'] },
  { liga: 'CBA (China)', clubes: ['Guangdong', 'Liaoning', 'Pequim', 'Xangai'] },
  { liga: 'NBL (Austrália)', clubes: ['Sydney Kings', 'Melbourne United', 'Perth Wildcats', 'Illawarra Hawks'] },
  { liga: 'B.League (Japão)', clubes: ['Chiba Jets', 'Alvark Tóquio', 'Ryukyu Golden Kings', 'Utsunomiya Brex'] },
  { liga: 'Liga Argentina', clubes: ['Boca Juniors', 'Obras Sanitarias', 'Quimsa', 'Instituto'] },
]

// Pessoas que podem aparecer como rivais ou comparações, só pelo nome (nunca com fala ou acusação).
export const ESTRELAS_ATUAIS = [
  'Nikola Jokić', 'Shai Gilgeous-Alexander', 'Giannis Antetokounmpo', 'Luka Dončić', 'Stephen Curry',
  'Kevin Durant', 'LeBron James', 'Jayson Tatum', 'Victor Wembanyama', 'Anthony Edwards',
  'Joel Embiid', 'Devin Booker', 'Jalen Brunson', 'Donovan Mitchell',
]

export const LENDAS = [
  'Michael Jordan', 'Kobe Bryant', 'Magic Johnson', 'Larry Bird', 'Kareem Abdul-Jabbar',
  'Shaquille O\'Neal', 'Tim Duncan', 'Hakeem Olajuwon', 'Dirk Nowitzki', 'Wilt Chamberlain', 'Bill Russell',
]

export const POSICOES = [
  { id: 'armador', nome: 'Armador', sigla: 'PG', alturaMin: 178, alturaMax: 193 },
  { id: 'ala_armador', nome: 'Ala-armador', sigla: 'SG', alturaMin: 188, alturaMax: 200 },
  { id: 'ala', nome: 'Ala', sigla: 'SF', alturaMin: 196, alturaMax: 206 },
  { id: 'ala_pivo', nome: 'Ala-pivô', sigla: 'PF', alturaMin: 202, alturaMax: 211 },
  { id: 'pivo', nome: 'Pivô', sigla: 'C', alturaMin: 206, alturaMax: 221 },
]

export const PESOS_POSICAO = {
  armador: { arremesso: 0.22, infiltracao: 0.16, passe: 0.28, defesa: 0.14, fisico: 0.08, qi: 0.12 },
  ala_armador: { arremesso: 0.3, infiltracao: 0.22, passe: 0.14, defesa: 0.16, fisico: 0.08, qi: 0.1 },
  ala: { arremesso: 0.24, infiltracao: 0.24, passe: 0.12, defesa: 0.2, fisico: 0.1, qi: 0.1 },
  ala_pivo: { arremesso: 0.18, infiltracao: 0.24, passe: 0.08, defesa: 0.22, fisico: 0.18, qi: 0.1 },
  pivo: { arremesso: 0.1, infiltracao: 0.28, passe: 0.06, defesa: 0.24, fisico: 0.22, qi: 0.1 },
}

export const ATRIBUTOS = [
  { id: 'arremesso', nome: 'Arremesso' },
  { id: 'infiltracao', nome: 'Infiltração' },
  { id: 'passe', nome: 'Passe' },
  { id: 'defesa', nome: 'Defesa' },
  { id: 'fisico', nome: 'Físico' },
  { id: 'qi', nome: 'QI de jogo' },
]

export const PAISES = [
  { id: 'brasil', nome: 'Brasil', bandeira: '🇧🇷' },
  { id: 'eua', nome: 'Estados Unidos', bandeira: '🇺🇸' },
  { id: 'canada', nome: 'Canadá', bandeira: '🇨🇦' },
  { id: 'franca', nome: 'França', bandeira: '🇫🇷' },
  { id: 'espanha', nome: 'Espanha', bandeira: '🇪🇸' },
  { id: 'servia', nome: 'Sérvia', bandeira: '🇷🇸' },
  { id: 'grecia', nome: 'Grécia', bandeira: '🇬🇷' },
  { id: 'argentina', nome: 'Argentina', bandeira: '🇦🇷' },
  { id: 'nigeria', nome: 'Nigéria', bandeira: '🇳🇬' },
  { id: 'australia', nome: 'Austrália', bandeira: '🇦🇺' },
  { id: 'alemanha', nome: 'Alemanha', bandeira: '🇩🇪' },
  { id: 'lituania', nome: 'Lituânia', bandeira: '🇱🇹' },
  { id: 'japao', nome: 'Japão', bandeira: '🇯🇵' },
  { id: 'camaroes', nome: 'Camarões', bandeira: '🇨🇲' },
]

export const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Almeida', 'Carvalho', 'Moreira', 'Barros',
  'Johnson', 'Williams', 'Brown', 'Jackson', 'Davis', 'Harris', 'Thompson', 'Walker', 'Young', 'Carter',
  'Petrović', 'Novak', 'Dimitrov', 'Lopez', 'Garcia', 'Martin', 'Dubois', 'Okafor', 'Mbeki', 'Tanaka',
]
