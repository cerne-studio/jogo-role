// Curadoria manual — cartas de Tabu: palavra secreta + palavras proibidas
// (as dicas óbvias demais, que entregariam a resposta na hora).
export const tabuBank = {
  Esportes: [
    { palavra: 'Beisebol', proibidas: ['Taco', 'Arremessador', 'Rebatida', 'Base', 'Luva'] },
    { palavra: 'Ciclismo', proibidas: ['Bike', 'Bicicleta', 'Pedal', 'Roda', 'Capacete'] },
    { palavra: 'Futebol', proibidas: ['Bola', 'Gol', 'Time', 'Campo', 'Chute'] },
    { palavra: 'Natação', proibidas: ['Piscina', 'Nadador', 'Água', 'Braçada', 'Óculos'] },
    { palavra: 'Boxe', proibidas: ['Luva', 'Soco', 'Ringue', 'Nocaute', 'Lutador'] },
    { palavra: 'Surf', proibidas: ['Prancha', 'Onda', 'Mar', 'Surfista', 'Praia'] },
  ],
  Comida: [
    { palavra: 'Pizza', proibidas: ['Massa', 'Queijo', 'Fatia', 'Molho', 'Italiana'] },
    { palavra: 'Feijoada', proibidas: ['Feijão', 'Carne', 'Arroz', 'Brasileira', 'Panela'] },
    { palavra: 'Sushi', proibidas: ['Peixe', 'Arroz', 'Japonês', 'Wasabi', 'Cru'] },
    { palavra: 'Churrasco', proibidas: ['Carne', 'Fogo', 'Espeto', 'Grelha', 'Carvão'] },
    { palavra: 'Sorvete', proibidas: ['Gelado', 'Casquinha', 'Doce', 'Frio', 'Sabor'] },
    { palavra: 'Pão de queijo', proibidas: ['Queijo', 'Mineiro', 'Forno', 'Redondo', 'Café'] },
  ],
  Lugares: [
    { palavra: 'Praia', proibidas: ['Mar', 'Areia', 'Sol', 'Onda', 'Verão'] },
    { palavra: 'Shopping', proibidas: ['Loja', 'Comprar', 'Escada rolante', 'Praça de alimentação', 'Vitrine'] },
    { palavra: 'Aeroporto', proibidas: ['Avião', 'Voo', 'Mala', 'Embarque', 'Pista'] },
    { palavra: 'Hospital', proibidas: ['Médico', 'Doente', 'Enfermeira', 'Remédio', 'Ambulância'] },
    { palavra: 'Academia', proibidas: ['Musculação', 'Peso', 'Treino', 'Esteira', 'Personal'] },
    { palavra: 'Igreja', proibidas: ['Padre', 'Missa', 'Deus', 'Reza', 'Fé'] },
  ],
  Profissões: [
    { palavra: 'Dentista', proibidas: ['Dente', 'Boca', 'Consultório', 'Cárie', 'Broca'] },
    { palavra: 'Bombeiro', proibidas: ['Fogo', 'Incêndio', 'Mangueira', 'Caminhão', 'Salvar'] },
    { palavra: 'Professor', proibidas: ['Escola', 'Aula', 'Aluno', 'Quadro', 'Ensinar'] },
    { palavra: 'Cozinheiro', proibidas: ['Cozinha', 'Panela', 'Receita', 'Chef', 'Fogão'] },
    { palavra: 'Piloto', proibidas: ['Avião', 'Voar', 'Cabine', 'Aeroporto', 'Comandante'] },
    { palavra: 'Cabeleireiro', proibidas: ['Cabelo', 'Tesoura', 'Salão', 'Corte', 'Escova'] },
  ],
  Entretenimento: [
    { palavra: 'Netflix', proibidas: ['Série', 'Streaming', 'Assistir', 'Filme', 'Assinatura'] },
    { palavra: 'Carnaval', proibidas: ['Fantasia', 'Bloco', 'Samba', 'Bateria', 'Fevereiro'] },
    { palavra: 'Show', proibidas: ['Palco', 'Música', 'Banda', 'Ingresso', 'Plateia'] },
    { palavra: 'Karaokê', proibidas: ['Cantar', 'Microfone', 'Letra', 'Música', 'Voz'] },
    { palavra: 'Cinema', proibidas: ['Filme', 'Pipoca', 'Tela', 'Ingresso', 'Sessão'] },
    { palavra: 'Videogame', proibidas: ['Controle', 'Console', 'Jogar', 'Tela', 'Jogador'] },
  ],
}

export const categoriasTabu = Object.keys(tabuBank)

export function sortearCartas(categoriasAtivas, excluir = [], quantidade = 12) {
  const pool = categoriasAtivas.flatMap((cat) => tabuBank[cat] || [])
  const disponiveis = pool.filter((c) => !excluir.includes(c.palavra))
  const fonte = disponiveis.length >= quantidade ? disponiveis : pool
  const embaralhado = [...fonte].sort(() => Math.random() - 0.5)
  return embaralhado.slice(0, quantidade)
}
