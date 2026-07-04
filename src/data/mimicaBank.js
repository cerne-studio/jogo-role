// Curadoria manual — palavras/ações fáceis de mimicar sem falar.
export const mimicaBank = {
  Animais: [
    'Cachorro', 'Gato', 'Macaco', 'Elefante', 'Cobra', 'Sapo', 'Tubarão',
    'Pinguim', 'Canguru', 'Jacaré', 'Girafa', 'Leão', 'Urso', 'Coelho',
    'Tartaruga', 'Borboleta', 'Aranha', 'Abelha', 'Cavalo', 'Vaca',
    'Porco', 'Galinha', 'Pato', 'Coruja', 'Morcego', 'Baleia', 'Polvo',
    'Caranguejo', 'Formiga', 'Dinossauro',
  ],
  Profissões: [
    'Dentista', 'Professor', 'Bombeiro', 'Jogador de futebol', 'Cantor',
    'Dançarino', 'Mergulhador', 'Motorista de ônibus', 'Pescador',
    'Cabeleireiro', 'Palhaço', 'Mágico', 'Astronauta', 'Cozinheiro',
    'Garçom', 'Faxineiro', 'Pintor', 'Fotógrafo', 'DJ', 'Personal trainer',
    'Marceneiro', 'Eletricista', 'Encanador', 'Salva-vidas', 'Jardineiro',
    'Entregador', 'Segurança', 'Recepcionista', 'Veterinário',
    'Apresentador de TV',
  ],
  'Ações do dia a dia': [
    'Escovar os dentes', 'Tomar banho', 'Dirigir', 'Dançar forró',
    'Jogar vôlei', 'Nadar', 'Pescar', 'Tocar violão', 'Andar de bicicleta',
    'Jogar xadrez', 'Cortar cabelo', 'Fazer pipoca', 'Tirar selfie',
    'Jogar boliche', 'Andar de skate', 'Pular corda', 'Fazer churrasco',
    'Lavar louça', 'Passar roupa', 'Jogar baralho',
    'Trocar canal de TV com controle quebrado', 'Tirar uma soneca',
    'Correr atrás do ônibus', 'Tropeçar', 'Espirrar', 'Imitar um robô',
    'Jogar sinuca', 'Fazer malabarismo', 'Andar na chuva sem guarda-chuva',
    'Tocar bateria',
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
