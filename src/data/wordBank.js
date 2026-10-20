// Curadoria manual — pares de palavra base + palavra do impostor.
// A palavra do impostor é parecida o bastante pra ele conseguir blefar,
// mas diferente o bastante pra ficar estranha se ele descrever demais.
import { sortearUm } from '../lib/aleatorio.js'

const par = (categoria, base, impostor) => ({ categoria, base, impostor })

export const wordBank = [
  // Comida
  par('Comida', 'Pizza', 'Lasanha'), par('Comida', 'Feijoada', 'Churrasco'), par('Comida', 'Sorvete', 'Picolé'),
  par('Comida', 'Pão de queijo', 'Coxinha'), par('Comida', 'Pastel', 'Empada'), par('Comida', 'Hambúrguer', 'Cachorro-quente'),
  par('Comida', 'Brigadeiro', 'Beijinho'), par('Comida', 'Sushi', 'Sashimi'), par('Comida', 'Macarrão', 'Nhoque'),
  par('Comida', 'Açaí', 'Sorvete de creme'), par('Comida', 'Tapioca', 'Crepioca'), par('Comida', 'Farofa', 'Pirão'),
  par('Comida', 'Bolo de chocolate', 'Torta de limão'), par('Comida', 'Pipoca', 'Amendoim'), par('Comida', 'Strogonoff', 'Fricassê'),
  par('Comida', 'Churros', 'Sonho'), par('Comida', 'Omelete', 'Ovo mexido'), par('Comida', 'Salada', 'Sopa'),
  par('Comida', 'Moqueca', 'Bobó de camarão'), par('Comida', 'Esfiha', 'Quibe'), par('Comida', 'Taco', 'Burrito'),
  par('Comida', 'Pudim', 'Mousse'), par('Comida', 'Acarajé', 'Abará'), par('Comida', 'Panetone', 'Chocotone'),
  // Bebidas
  par('Bebidas', 'Cerveja', 'Chopp'), par('Bebidas', 'Café', 'Chá'), par('Bebidas', 'Caipirinha', 'Mojito'),
  par('Bebidas', 'Refrigerante', 'Suco de caixinha'), par('Bebidas', 'Vinho', 'Espumante'), par('Bebidas', 'Água de coco', 'Isotônico'),
  par('Bebidas', 'Leite', 'Iogurte'), par('Bebidas', 'Vodka', 'Cachaça'), par('Bebidas', 'Milkshake', 'Vitamina'),
  par('Bebidas', 'Energético', 'Café expresso'),
  // Lugares
  par('Lugares', 'Praia', 'Piscina'), par('Lugares', 'Shopping', 'Feira'), par('Lugares', 'Academia', 'Parque'),
  par('Lugares', 'Igreja', 'Templo'), par('Lugares', 'Aeroporto', 'Rodoviária'), par('Lugares', 'Hospital', 'Farmácia'),
  par('Lugares', 'Biblioteca', 'Livraria'), par('Lugares', 'Cinema', 'Teatro'), par('Lugares', 'Estádio', 'Ginásio'),
  par('Lugares', 'Zoológico', 'Aquário'), par('Lugares', 'Museu', 'Galeria de arte'), par('Lugares', 'Escola', 'Universidade'),
  par('Lugares', 'Hotel', 'Pousada'), par('Lugares', 'Padaria', 'Confeitaria'), par('Lugares', 'Cemitério', 'Capela'),
  par('Lugares', 'Delegacia', 'Fórum'), par('Lugares', 'Quartel', 'Presídio'), par('Lugares', 'Boate', 'Bar'),
  par('Lugares', 'Cachoeira', 'Lagoa'), par('Lugares', 'Montanha', 'Vulcão'), par('Lugares', 'Deserto', 'Savana'),
  par('Lugares', 'Floresta', 'Selva'), par('Lugares', 'Ilha', 'Península'), par('Lugares', 'Castelo', 'Palácio'),
  par('Lugares', 'Circo', 'Parque de diversões'), par('Lugares', 'Mercado', 'Atacadão'), par('Lugares', 'Cozinha', 'Churrasqueira'),
  par('Lugares', 'Banheiro', 'Lavanderia'), par('Lugares', 'Quarto', 'Sótão'),
  // Animais
  par('Animais', 'Cachorro', 'Lobo'), par('Animais', 'Gato', 'Tigre'), par('Animais', 'Papagaio', 'Arara'),
  par('Animais', 'Cavalo', 'Zebra'), par('Animais', 'Jacaré', 'Crocodilo'), par('Animais', 'Golfinho', 'Tubarão'),
  par('Animais', 'Coelho', 'Lebre'), par('Animais', 'Elefante', 'Rinoceronte'), par('Animais', 'Leão', 'Onça'),
  par('Animais', 'Macaco', 'Gorila'), par('Animais', 'Pinguim', 'Pato'), par('Animais', 'Águia', 'Urubu'),
  par('Animais', 'Abelha', 'Vespa'), par('Animais', 'Borboleta', 'Mariposa'), par('Animais', 'Cobra', 'Minhoca'),
  par('Animais', 'Tartaruga', 'Cágado'), par('Animais', 'Vaca', 'Búfalo'), par('Animais', 'Porco', 'Javali'),
  par('Animais', 'Girafa', 'Camelo'), par('Animais', 'Baleia', 'Orca'), par('Animais', 'Camundongo', 'Hamster'),
  par('Animais', 'Galinha', 'Peru'), par('Animais', 'Coruja', 'Morcego'), par('Animais', 'Polvo', 'Lula'),
  par('Animais', 'Formiga', 'Cupim'), par('Animais', 'Canguru', 'Coala'), par('Animais', 'Urso', 'Panda'),
  // Objetos
  par('Objetos', 'Guarda-chuva', 'Capa de chuva'), par('Objetos', 'Celular', 'Tablet'), par('Objetos', 'Fogão', 'Churrasqueira'),
  par('Objetos', 'Óculos', 'Lente de contato'), par('Objetos', 'Mochila', 'Bolsa'), par('Objetos', 'Relógio', 'Pulseira'),
  par('Objetos', 'Geladeira', 'Freezer'), par('Objetos', 'Sofá', 'Poltrona'), par('Objetos', 'Travesseiro', 'Almofada'),
  par('Objetos', 'Espelho', 'Janela'), par('Objetos', 'Tesoura', 'Estilete'), par('Objetos', 'Martelo', 'Marreta'),
  par('Objetos', 'Caneta', 'Lápis'), par('Objetos', 'Caderno', 'Agenda'), par('Objetos', 'Vassoura', 'Rodo'),
  par('Objetos', 'Chuveiro', 'Torneira'), par('Objetos', 'Ventilador', 'Ar-condicionado'), par('Objetos', 'Televisão', 'Projetor'),
  par('Objetos', 'Violão', 'Cavaquinho'), par('Objetos', 'Chave', 'Cadeado'), par('Objetos', 'Carteira', 'Porta-moedas'),
  par('Objetos', 'Panela de pressão', 'Airfryer'), par('Objetos', 'Liquidificador', 'Batedeira'), par('Objetos', 'Colchão', 'Rede'),
  par('Objetos', 'Fone de ouvido', 'Caixa de som'), par('Objetos', 'Skate', 'Patinete'), par('Objetos', 'Lanterna', 'Vela'),
  par('Objetos', 'Colar', 'Brinco'), par('Objetos', 'Perfume', 'Desodorante'), par('Objetos', 'Escova de dentes', 'Fio dental'),
  // Profissões
  par('Profissões', 'Médico', 'Enfermeiro'), par('Profissões', 'Professor', 'Palestrante'), par('Profissões', 'Bombeiro', 'Policial'),
  par('Profissões', 'Cozinheiro', 'Confeiteiro'), par('Profissões', 'Motorista', 'Piloto'), par('Profissões', 'Advogado', 'Juiz'),
  par('Profissões', 'Dentista', 'Veterinário'), par('Profissões', 'Padeiro', 'Açougueiro'), par('Profissões', 'Garçom', 'Barman'),
  par('Profissões', 'Cantor', 'Ator'), par('Profissões', 'Pedreiro', 'Eletricista'), par('Profissões', 'Jornalista', 'Escritor'),
  par('Profissões', 'Arquiteto', 'Engenheiro'), par('Profissões', 'Cabeleireiro', 'Barbeiro'), par('Profissões', 'Padre', 'Pastor'),
  par('Profissões', 'Mecânico', 'Frentista'), par('Profissões', 'Fotógrafo', 'Cinegrafista'), par('Profissões', 'Programador', 'Designer'),
  par('Profissões', 'Segurança', 'Porteiro'), par('Profissões', 'Salva-vidas', 'Instrutor de surf'), par('Profissões', 'Astronauta', 'Aviador'),
  // Lazer e esportes
  par('Lazer', 'Futebol', 'Vôlei'), par('Lazer', 'Natação', 'Surf'), par('Lazer', 'Karaokê', 'Show'),
  par('Lazer', 'Videogame', 'Boliche'), par('Lazer', 'Basquete', 'Handebol'), par('Lazer', 'Tênis', 'Padel'),
  par('Lazer', 'Corrida', 'Caminhada'), par('Lazer', 'Ioga', 'Pilates'), par('Lazer', 'Pescaria', 'Caça'),
  par('Lazer', 'Acampamento', 'Trilha'), par('Lazer', 'Xadrez', 'Damas'), par('Lazer', 'Poker', 'Truco'),
  par('Lazer', 'Pular corda', 'Bambolê'), par('Lazer', 'Pipa', 'Balão'), par('Lazer', 'Dança', 'Ginástica'),
  par('Lazer', 'Luta de boxe', 'Jiu-jitsu'), par('Lazer', 'Montanha-russa', 'Roda-gigante'), par('Lazer', 'Piquenique', 'Churrasco'),
  // Entretenimento
  par('Entretenimento', 'Netflix', 'Cinema'), par('Entretenimento', 'Novela', 'Filme'), par('Entretenimento', 'Festa', 'Balada'),
  par('Entretenimento', 'Casamento', 'Aniversário'), par('Entretenimento', 'Podcast', 'Rádio'), par('Entretenimento', 'Livro', 'Revista'),
  par('Entretenimento', 'Show de stand-up', 'Peça de teatro'), par('Entretenimento', 'Carnaval', 'Réveillon'), par('Entretenimento', 'Rock', 'Heavy metal'),
  par('Entretenimento', 'Sertanejo', 'Forró'), par('Entretenimento', 'Samba', 'Pagode'), par('Entretenimento', 'Anime', 'Desenho animado'),
  par('Entretenimento', 'YouTube', 'TikTok'), par('Entretenimento', 'Festival de música', 'Cavalgada'), par('Entretenimento', 'Documentário', 'Reality show'),
  par('Entretenimento', 'Quadrinhos', 'Mangá'), par('Entretenimento', 'Natal', 'Páscoa'), par('Entretenimento', 'Festa junina', 'Quermesse'),
  // Cotidiano
  par('Cotidiano', 'Trânsito', 'Engarrafamento'), par('Cotidiano', 'Supermercado', 'Feira livre'), par('Cotidiano', 'Fila do banco', 'Fila do SUS'),
  par('Cotidiano', 'Ônibus', 'Metrô'), par('Cotidiano', 'Uber', 'Táxi'), par('Cotidiano', 'Dieta', 'Jejum'),
  par('Cotidiano', 'Reunião', 'Entrevista de emprego'), par('Cotidiano', 'Mudança de casa', 'Reforma'), par('Cotidiano', 'Resfriado', 'Dengue'),
  par('Cotidiano', 'Prova', 'Trabalho escolar'), par('Cotidiano', 'Segunda-feira', 'Domingo à noite'), par('Cotidiano', 'Aluguel', 'Financiamento'),
  par('Cotidiano', 'Churrasco de domingo', 'Almoço de família'), par('Cotidiano', 'Ressaca', 'Insônia'), par('Cotidiano', 'WhatsApp', 'Instagram'),
  par('Cotidiano', 'Selfie', 'Retrato'), par('Cotidiano', 'Banho gelado', 'Sauna'), par('Cotidiano', 'Despertador', 'Soneca'),
  // Natureza e clima
  par('Natureza', 'Chuva', 'Granizo'), par('Natureza', 'Sol', 'Lua'), par('Natureza', 'Raio', 'Trovão'),
  par('Natureza', 'Rio', 'Riacho'), par('Natureza', 'Neve', 'Gelo'), par('Natureza', 'Terremoto', 'Tsunami'),
  par('Natureza', 'Furacão', 'Tornado'), par('Natureza', 'Arco-íris', 'Aurora boreal'), par('Natureza', 'Árvore', 'Arbusto'),
  par('Natureza', 'Rosa', 'Girassol'), par('Natureza', 'Areia', 'Barro'), par('Natureza', 'Nuvem', 'Neblina'),
  // Tecnologia
  par('Tecnologia', 'Computador', 'Notebook'), par('Tecnologia', 'Wi-Fi', 'Bluetooth'), par('Tecnologia', 'Robô', 'Drone'),
  par('Tecnologia', 'Inteligência artificial', 'Calculadora'), par('Tecnologia', 'PlayStation', 'Nintendo'), par('Tecnologia', 'Câmera', 'Filmadora'),
  par('Tecnologia', 'Impressora', 'Scanner'), par('Tecnologia', 'E-mail', 'Carta'), par('Tecnologia', 'Pen drive', 'HD externo'),
  par('Tecnologia', 'Satélite', 'Antena'),
  // Transporte
  par('Transporte', 'Carro', 'Moto'), par('Transporte', 'Avião', 'Helicóptero'), par('Transporte', 'Navio', 'Barco'),
  par('Transporte', 'Trem', 'Bonde'), par('Transporte', 'Bicicleta', 'Patins'), par('Transporte', 'Caminhão', 'Ônibus'),
  par('Transporte', 'Balsa', 'Canoa'), par('Transporte', 'Ambulância', 'Viatura'), par('Transporte', 'Elevador', 'Escada rolante'),
  // Roupas e moda
  par('Roupas', 'Camiseta', 'Regata'), par('Roupas', 'Calça jeans', 'Bermuda'), par('Roupas', 'Tênis', 'Chinelo'),
  par('Roupas', 'Vestido', 'Saia'), par('Roupas', 'Biquíni', 'Maiô'), par('Roupas', 'Chapéu', 'Boné'),
  par('Roupas', 'Casaco', 'Jaqueta'), par('Roupas', 'Gravata', 'Cachecol'), par('Roupas', 'Meia', 'Luva'),
  par('Roupas', 'Fantasia', 'Uniforme'),
  // Corpo e saúde
  par('Corpo e saúde', 'Dor de cabeça', 'Enxaqueca'), par('Corpo e saúde', 'Soluço', 'Espirro'), par('Corpo e saúde', 'Braço', 'Perna'),
  par('Corpo e saúde', 'Barba', 'Bigode'), par('Corpo e saúde', 'Dente', 'Unha'), par('Corpo e saúde', 'Cirurgia', 'Consulta'),
  par('Corpo e saúde', 'Vacina', 'Remédio'), par('Corpo e saúde', 'Tatuagem', 'Piercing'),
  // Escola e trabalho
  par('Escola e trabalho', 'Escritório', 'Home office'), par('Escola e trabalho', 'Chefe', 'Estagiário'), par('Escola e trabalho', 'Férias', 'Feriado'),
  par('Escola e trabalho', 'Faculdade', 'Curso técnico'), par('Escola e trabalho', 'Recreio', 'Aula de educação física'), par('Escola e trabalho', 'Formatura', 'Matrícula'),
]

export function sortearPalavra(excluirIndices = []) {
  const disponiveis = wordBank.map((_, i) => i).filter((i) => !excluirIndices.includes(i))
  const pool = disponiveis.length > 0 ? disponiveis : wordBank.map((_, i) => i)
  const idx = sortearUm(pool)
  return { item: wordBank[idx], index: idx }
}
