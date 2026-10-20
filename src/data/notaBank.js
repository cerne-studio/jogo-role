// Temas do Jogo da Nota: cada rodada tem uma escala de 0 a 10. Quem recebe a nota secreta responde às
// perguntas do grupo como se a situação fosse "daquele tamanho"; o resto tenta descobrir o número.
import { sortearUm } from '../lib/aleatorio.js'

const t = (tema, zero, dez) => ({ tema, zero, dez })

export const notaBank = [
  t('Você numa festa que está bombando', 'ficaria em casa de pijama', 'seria o último a ir embora'),
  t('Seu nível de preguiça numa segunda-feira', 'acordo antes do despertador', 'só levanto por obrigação divina'),
  t('Quanto você aguenta de pimenta', 'nem pimenta do reino', 'como pimenta sem água'),
  t('O quão bom cozinheiro você é', 'queimo até água', 'merecia um restaurante'),
  t('Seu medo de barata', 'faço amizade', 'pulo na cadeira e grito'),
  t('Seu talento pra dançar', 'dois pés esquerdos', 'dançarino profissional'),
  t('O quão organizado é o seu quarto', 'zona de guerra', 'museu'),
  t('Seu nível de ciúme', 'zen total', 'checo o celular do outro'),
  t('O quanto você chora em filme', 'não me abalo', 'choro até em comercial'),
  t('Sua pontualidade', 'chego depois da festa acabar', 'chego 30 minutos antes'),
  t('Quão bom você é guardando segredo', 'conto tudo em 5 minutos', 'cofre de banco'),
  t('Seu vício em celular', 'esqueço ele em casa', 'durmo abraçado nele'),
  t('Quanto você gosta de acordar cedo', 'prefiro morrer', 'amo ver o sol nascer'),
  t('Seu medo de falar em público', 'faço palestra de olho fechado', 'tremo só de pensar'),
  t('O quão bom motorista você é', 'perigo pra sociedade', 'piloto de Fórmula 1'),
  t('O quanto você mente', 'nunca minto', 'minto até sem precisar'),
  t('Quão bom você é em jogos de tabuleiro', 'perco até de criança', 'campeão da mesa'),
  t('O quanto você gasta com besteira', 'guardo cada centavo', 'o salário some em 2 dias'),
  t('Sua vergonha alheia', 'nenhuma', 'saio da sala quando passa cena vergonhosa'),
  t('O quão bom você é cantando', 'espanto até passarinho', 'cantor profissional'),
  t('Seu apetite num rodízio', 'três garfadas', 'perdi a conta e o rodízio perdeu dinheiro'),
  t('Seu nível de fofoca', 'não sei de nada', 'sei da vida de todo mundo'),
  t('O quão bom você é em decorar nomes', 'esqueço o nome de quem acabei de conhecer', 'lembro de todo mundo'),
  t('Sua coragem em montanha-russa', 'nem chego perto', 'sento na frente e levanto os braços'),
  t('O quanto você é competitivo', 'só quero participar', 'não perco nem no par ou ímpar'),
  t('O quanto você se perde sem GPS', 'conheço a cidade de cor', 'me perco no quarteirão de casa'),
  t('O tamanho do seu sono depois do almoço', 'zero soneca', 'durmo até no banco do ônibus'),
  t('Sua vontade de viajar agora', 'prefiro meu sofá', 'já estou com a mala pronta'),
  t('O quão bom você é em fazer amigos', 'fico no meu canto', 'amigo de todo mundo em 5 minutos'),
  t('Seu nível de teimosia', 'cedo fácil', 'prefiro perder a razão a dar o braço a torcer'),
  t('Quanto você gosta de academia', 'só passo na frente', 'moro lá'),
  t('Seu jeito de dividir a conta', 'pago por todo mundo', 'calculo até a gorjeta no centavo'),
  t('O quanto você é esquecido', 'memória de elefante', 'esqueço até o que vim buscar'),
  t('O quão fofo você fica quando está apaixonado', 'nada muda', 'viro um bobo apaixonado'),
  t('Sua habilidade em videogame', 'só aperto botão aleatório', 'jogador profissional'),
  t('O quão perigoso é te deixar sozinho com uma pizza', 'como uma fatia', 'a pizza não sobrevive'),
  t('Seu nível de bagunça na mesa de trabalho', 'tudo no lugar', 'pilhas de papel e copos'),
  t('O quão fácil é te fazer rir', 'sério como uma estátua', 'rio de tudo, até de silêncio'),
  t('Seu nível de ressaca no dia seguinte', 'acordo inteiro', 'quero ficar de cama a semana toda'),
  t('O quão bom você é em dar conselhos', 'só piora a situação', 'terapeuta do grupo'),
  t('O quanto você se importa com a aparência', 'saio do jeito que acordei', 'horas no espelho'),
  t('O quanto você ama chocolate', 'não faz diferença', 'não vivo sem'),
  t('Quão bom você é em acampar', 'nem fecho o zíper da barraca', 'sobrevivo na selva'),
  t('O quão fácil é te convencer a sair de casa', 'só com convite oficial', 'basta alguém mandar "bora?"'),
  t('O quão cuidadoso você é com seus pertences', 'perco tudo', 'tudo com capa protetora'),
  t('O quão bom você é de pontaria', 'erro até o ponto', 'sniper'),
  t('Sua paciência no trânsito', 'buzino pra todo mundo', 'ouço música e relaxo'),
  t('Seu nível de ansiedade antes de uma prova', 'dormo tranquilo', 'não consigo comer'),
  t('O quão fã de futebol você é', 'nem sei as regras', 'sofro por cada jogo'),
  t('Sua coragem de pedir desconto', 'nunca peço', 'negocio até na farmácia'),
  t('O quão bem você lida com tretas', 'foge da confusão', 'amo uma discussão'),
  t('O quão bom você é de imitação', 'ninguém reconhece', 'viro a pessoa'),
  t('Seu nível de dramatismo', 'discreto', 'novela mexicana ao vivo'),
  t('Quão bom você é em sair de um mico', 'fico vermelho e travo', 'viro piada e ganho a sala'),
  t('O quanto você gosta de ficar em casa no fim de semana', 'não paro quieto', 'o melhor programa é o sofá'),
  t('O quão bom você é em dirigir de ré', 'bato em tudo', 'estaciono no milímetro'),
  t('Seu medo de injeção', 'nem sinto', 'desmaio só de ver a agulha'),
  t('O quão sortudo você acha que é', 'só azar', 'ganho até rifa de bairro'),
  t('Seu interesse em astrologia', 'não acredito em nada', 'não saio de casa em Mercúrio retrógrado'),
  t('O quão bom você é em escolher presente', 'dou meia e cueca', 'sempre acerto em cheio'),
  t('Sua vontade de comer um doce agora', 'nenhuma', 'compraria uma torta inteira'),
]

export function sortearTema(excluirIndices = []) {
  const disponiveis = notaBank.map((_, i) => i).filter((i) => !excluirIndices.includes(i))
  const pool = disponiveis.length > 0 ? disponiveis : notaBank.map((_, i) => i)
  const index = sortearUm(pool)
  return { item: notaBank[index], index }
}
