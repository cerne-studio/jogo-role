// Curadoria manual — palavras difíceis de mimicar sem falar, mesma pegada
// específica/criativa do banco do Tabu. Nada de "Cachorro" ou "Gato" fácil.
export const mimicaBank = {
  Filmes: [
    'Titanic', 'Jurassic Park', 'Matrix', 'De Volta para o Futuro',
    'O Poderoso Chefão', 'Star Wars', 'O Rei Leão', 'Vingadores',
    'Bacurau', 'Cidade de Deus', 'Coringa', 'La La Land',
  ],
  'Personagens e Artistas': [
    'Michael Jackson', 'Charlie Chaplin', 'Silvio Santos', 'Chaves',
    'Freddie Mercury', 'Batman', 'Darth Vader', 'Zorro',
    'Drácula', 'Sherlock Holmes', 'Ayrton Senna', 'Cristiano Ronaldo',
  ],
  'Emoções e Conceitos': [
    'Ciúme', 'Nostalgia', 'Déjà vu', 'Procrastinação',
    'Paranoia', 'Insônia', 'Timidez', 'Arrependimento',
    'Curiosidade', 'Constrangimento', 'Alívio', 'Impaciência',
  ],
  'Profissões Difíceis': [
    'Arqueólogo', 'Contorcionista', 'Ventríloquo', 'Domador de leões',
    'Legista', 'Apicultor', 'Sommelier', 'Taxidermista',
    'Engenheiro de som', 'Alfaiate',
  ],
  'Ações Específicas': [
    'Fazer origami', 'Tocar bateria em uma banda', 'Pilotar um avião',
    'Costurar um botão', 'Jogar xadrez contra um mestre',
    'Discar um telefone de disco antigo', 'Trocar um pneu furado',
    'Empinar pipa com vento fraco', 'Desentupir uma pia',
    'Fazer malabarismo com tochas de fogo', 'Equilibrar-se numa corda bamba',
    'Pescar com rede',
  ],
}

export const categorias = Object.keys(mimicaBank)

export function sortearPalavras(categoriasAtivas, excluir = []) {
  const pool = categoriasAtivas.flatMap((cat) => mimicaBank[cat] || [])
  const disponiveis = pool.filter((p) => !excluir.includes(p))
  const fonte = disponiveis.length >= 3 ? disponiveis : pool
  const embaralhado = [...fonte].sort(() => Math.random() - 0.5)
  return embaralhado.slice(0, 3)
}
