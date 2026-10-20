// Curadoria manual — palavras difíceis de mimicar sem falar, mesma pegada
// específica/criativa do banco do Tabu. Nada de "Cachorro" ou "Gato" fácil.
import { embaralhar } from '../lib/aleatorio.js'

export const mimicaBank = {
  'Filmes e séries': [
    'Titanic', 'Jurassic Park', 'Matrix', 'De Volta para o Futuro', 'O Poderoso Chefão', 'Star Wars', 'O Rei Leão',
    'Vingadores', 'Bacurau', 'Cidade de Deus', 'Coringa', 'La La Land', 'Tubarão', 'E.T.', 'Esqueceram de Mim',
    'Harry Potter', 'O Senhor dos Anéis', 'Procurando Nemo', 'Toy Story', 'Shrek', 'Frozen',
    'Tropa de Elite', 'Central do Brasil', 'O Auto da Compadecida', 'Round 6', 'Stranger Things', 'Breaking Bad',
    'Game of Thrones', 'La Casa de Papel', 'Friends', 'The Office', 'Chaves', 'Todo Mundo Odeia o Chris',
    'Os Simpsons', 'Bob Esponja', 'Homem-Aranha', 'Batman', 'Mad Max', 'Gladiador', 'O Exterminador do Futuro', 'Kung Fu Panda',
  ],
  'Personagens e artistas': [
    'Michael Jackson', 'Charlie Chaplin', 'Silvio Santos', 'Chaves', 'Freddie Mercury', 'Batman', 'Darth Vader', 'Zorro',
    'Drácula', 'Sherlock Holmes', 'Ayrton Senna', 'Cristiano Ronaldo', 'Neymar', 'Pelé', 'Elvis Presley', 'Shakira',
    'Anitta', 'Gisele Bündchen', 'Pinóquio', 'Peter Pan', 'Tarzan', 'Capitão América',
    'Hulk', 'Super Mario', 'Pikachu', 'Sonic', 'Chapolin', 'Seu Madruga', 'Mônica', 'Cebolinha', 'Jack Sparrow',
    'Michael Phelps', 'Usain Bolt', 'Naruto', 'Goku', 'Papai Noel', 'Saci-Pererê', 'Curupira', 'Lampião',
  ],
  'Emoções e conceitos': [
    'Ciúme', 'Nostalgia', 'Déjà vu', 'Procrastinação', 'Paranoia', 'Insônia', 'Timidez', 'Arrependimento', 'Curiosidade',
    'Constrangimento', 'Alívio', 'Impaciência', 'Vergonha alheia', 'Saudade', 'Ansiedade', 'Euforia', 'Preguiça',
    'Desconfiança', 'Orgulho', 'Inveja', 'Solidão', 'Raiva', 'Tédio', 'Surpresa', 'Medo de altura', 'Claustrofobia',
    'Ressaca', 'Culpa', 'Esperança', 'Frustração', 'Pânico', 'Gratidão', 'Teimosia', 'Distração', 'Esquecimento', 'Sorte',
  ],
  'Profissões difíceis': [
    'Arqueólogo', 'Contorcionista', 'Ventríloquo', 'Domador de leões', 'Legista', 'Apicultor', 'Sommelier', 'Taxidermista',
    'Engenheiro de som', 'Alfaiate', 'Astronauta', 'Mergulhador', 'Cirurgião', 'Bombeiro', 'Faxineiro de janelas de prédio',
    'Maestro', 'DJ', 'Lutador de sumô', 'Mágico', 'Palhaço', 'Torneiro mecânico', 'Barista', 'Entregador de pizza',
    'Salva-vidas', 'Piloto de Fórmula 1', 'Guarda de trânsito', 'Jardineiro', 'Pescador', 'Soldador', 'Pintor de parede',
    'Detetive particular', 'Locutor de futebol', 'Caixa de supermercado', 'Personal trainer',
  ],
  'Ações específicas': [
    'Fazer origami', 'Tocar bateria em uma banda', 'Pilotar um avião', 'Costurar um botão', 'Jogar xadrez contra um mestre',
    'Discar um telefone de disco antigo', 'Trocar um pneu furado', 'Empinar pipa com vento fraco', 'Desentupir uma pia',
    'Fazer malabarismo com tochas de fogo', 'Equilibrar-se numa corda bamba', 'Pescar com rede', 'Passar roupa',
    'Cortar cebola chorando', 'Dar banho num gato', 'Montar uma barraca de camping', 'Tirar uma selfie em grupo',
    'Abrir um pote emperrado', 'Fugir de uma abelha', 'Tentar acordar de manhã', 'Esperar o ônibus na chuva',
    'Dirigir no trânsito parado', 'Dançar forró', 'Lavar um carro', 'Plantar uma árvore', 'Tomar banho gelado',
    'Passar por um corredor escuro', 'Equilibrar pratos', 'Fazer uma massagem', 'Esculpir uma estátua',
    'Atravessar um rio de pedra em pedra', 'Remar numa canoa', 'Montar um móvel sem o manual', 'Procurar o celular que está na mão',
  ],
  'Animais (difícil)': [
    'Preguiça', 'Camaleão', 'Polvo', 'Flamingo', 'Pavão', 'Canguru', 'Tatu-bola', 'Pinguim escorregando', 'Cobra se enrolando',
    'Tartaruga virada de costas', 'Louva-a-deus', 'Morcego', 'Gorila batendo no peito', 'Foca aplaudindo', 'Águia caçando',
    'Cavalo-marinho', 'Aranha tecendo', 'Caranguejo', 'Beija-flor', 'Elefante bebendo água', 'Girafa bebendo água', 'Leão-marinho',
    "Peixe fora d'água", 'Coruja', 'Lagarta virando borboleta', 'Hipopótamo bocejando', 'Tamanduá', 'Ornitorrinco',
  ],
  'Esportes e movimentos': [
    'Salto com vara', 'Arremesso de peso', 'Esgrima', 'Hipismo', 'Ginástica rítmica', 'Remo', 'Golfe', 'Surfe', 'Skate',
    'Judô', 'Tiro com arco', 'Patinação no gelo', 'Levantamento de peso', 'Slackline', 'Escalada', 'Mergulho', 'Boliche',
    'Pingue-pongue', 'Sinuca', 'Corrida de obstáculos', 'Natação sincronizada', 'Cabo de guerra', 'Handebol', 'Rugby',
    'Hóquei', 'Maratona', 'Capoeira', 'Bobsled', 'Parkour', 'Pular amarelinha',
  ],
  'Música e dança': [
    'Tocar violino', 'Tocar guitarra elétrica', 'Cantar ópera', 'Dançar balé', 'Dançar valsa', 'Dançar break', 'Fazer rap',
    'Tocar sanfona', 'Reger uma orquestra', 'Tocar flauta', 'Tocar pandeiro', 'Fazer beatbox', 'Dançar macarena',
    'Dançar tango', 'Dançar axé', 'Dançar funk', 'Dançar quadrilha', 'Karaokê desafinado', 'Tocar trompete', 'Tocar harpa',
    'Tocar tambor', 'Cantar no chuveiro', 'Dançar lambada', 'Cantar no coral da igreja',
  ],
  'Games e internet': [
    'Fortnite', 'Minecraft', 'Pac-Man', 'Tetris', 'Mario Kart', 'FIFA', 'Free Fire', 'Among Us', 'Pokémon GO', 'Flappy Bird',
    'Candy Crush', 'Angry Birds', 'Just Dance', 'Guitar Hero', 'Zelda', 'GTA', 'League of Legends', 'Street Fighter',
    'Mortal Kombat', 'Subway Surfers', 'Tela azul do computador', 'Internet lenta', 'Meme', 'Live no Instagram',
    'Vídeo que viralizou', 'Notificação do celular', 'Ligação de vídeo travando', 'Bateria acabando',
  ],
}

export const categorias = Object.keys(mimicaBank)

// Quantas palavras saem de uma vez pra uma rodada: o jogo corre até o tempo acabar, então tem que sobrar.
export const PALAVRAS_POR_RODADA = 30

export function sortearPalavras(categoriasAtivas, excluir = [], quantidade = PALAVRAS_POR_RODADA) {
  const pool = [...new Set(categoriasAtivas.flatMap((cat) => mimicaBank[cat] || []))]
  const disponiveis = pool.filter((p) => !excluir.includes(p))
  const fonte = disponiveis.length >= quantidade ? disponiveis : pool
  return embaralhar(fonte).slice(0, quantidade)
}
