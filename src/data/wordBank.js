// Curadoria manual — pares de palavra base + palavra do impostor.
// A palavra do impostor é parecida o bastante pra ele conseguir blefar,
// mas diferente o bastante pra ficar estranha se ele descrever demais.
export const wordBank = [
  { categoria: 'Comida', base: 'Pizza', impostor: 'Lasanha' },
  { categoria: 'Comida', base: 'Feijoada', impostor: 'Churrasco' },
  { categoria: 'Comida', base: 'Sorvete', impostor: 'Picolé' },
  { categoria: 'Comida', base: 'Pão de queijo', impostor: 'Coxinha' },
  { categoria: 'Comida', base: 'Pastel', impostor: 'Empada' },
  { categoria: 'Lugares', base: 'Praia', impostor: 'Piscina' },
  { categoria: 'Lugares', base: 'Shopping', impostor: 'Feira' },
  { categoria: 'Lugares', base: 'Academia', impostor: 'Parque' },
  { categoria: 'Lugares', base: 'Igreja', impostor: 'Templo' },
  { categoria: 'Lugares', base: 'Aeroporto', impostor: 'Rodoviária' },
  { categoria: 'Animais', base: 'Cachorro', impostor: 'Lobo' },
  { categoria: 'Animais', base: 'Gato', impostor: 'Tigre' },
  { categoria: 'Animais', base: 'Papagaio', impostor: 'Arara' },
  { categoria: 'Animais', base: 'Cavalo', impostor: 'Zebra' },
  { categoria: 'Animais', base: 'Jacaré', impostor: 'Crocodilo' },
  { categoria: 'Objetos', base: 'Guarda-chuva', impostor: 'Capa de chuva' },
  { categoria: 'Objetos', base: 'Celular', impostor: 'Tablet' },
  { categoria: 'Objetos', base: 'Fogão', impostor: 'Churrasqueira' },
  { categoria: 'Objetos', base: 'Óculos', impostor: 'Lente de contato' },
  { categoria: 'Objetos', base: 'Mochila', impostor: 'Bolsa' },
  { categoria: 'Profissões', base: 'Médico', impostor: 'Enfermeiro' },
  { categoria: 'Profissões', base: 'Professor', impostor: 'Palestrante' },
  { categoria: 'Profissões', base: 'Bombeiro', impostor: 'Policial' },
  { categoria: 'Profissões', base: 'Cozinheiro', impostor: 'Confeiteiro' },
  { categoria: 'Profissões', base: 'Motorista', impostor: 'Piloto' },
  { categoria: 'Lazer', base: 'Futebol', impostor: 'Vôlei' },
  { categoria: 'Lazer', base: 'Natação', impostor: 'Surf' },
  { categoria: 'Lazer', base: 'Karaokê', impostor: 'Show' },
  { categoria: 'Lazer', base: 'Videogame', impostor: 'Boliche' },
  { categoria: 'Entretenimento', base: 'Netflix', impostor: 'Cinema' },
  { categoria: 'Entretenimento', base: 'Novela', impostor: 'Filme' },
  { categoria: 'Entretenimento', base: 'Festa', impostor: 'Balada' },
  { categoria: 'Entretenimento', base: 'Casamento', impostor: 'Aniversário' },
  { categoria: 'Cotidiano', base: 'Trânsito', impostor: 'Engarrafamento' },
  { categoria: 'Cotidiano', base: 'Supermercado', impostor: 'Feira livre' },
]

export function sortearPalavra(excluirIndices = []) {
  const disponiveis = wordBank
    .map((item, i) => i)
    .filter((i) => !excluirIndices.includes(i))
  const pool = disponiveis.length > 0 ? disponiveis : wordBank.map((_, i) => i)
  const idx = pool[Math.floor(Math.random() * pool.length)]
  return { item: wordBank[idx], index: idx }
}
