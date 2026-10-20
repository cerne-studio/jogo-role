// Curadoria manual — personagens conhecidos, fáceis de adivinhar com
// perguntas sim/não. Mistura de famosos globais e referências BR.
import { embaralhar } from '../lib/aleatorio.js'

export const personagensBank = [
  // Super-heróis e vilões
  'Batman', 'Superman', 'Mulher Maravilha', 'Homem-Aranha', 'Hulk', 'Homem de Ferro', 'Capitão América', 'Thor', 'Pantera Negra',
  'Coringa', 'Darth Vader', 'Thanos', 'Lex Luthor', 'Magneto', 'Wolverine', 'Deadpool', 'Flash', 'Aquaman', 'Viúva Negra', 'Groot',
  // Desenhos e games
  'Homer Simpson', 'Bob Esponja', 'Patrick Estrela', 'Scooby-Doo', 'Mickey Mouse', 'Pato Donald', 'Pluto', 'Pernalonga', 'Tom (Tom e Jerry)',
  'Mario (Super Mario)', 'Luigi', 'Sonic', 'Pikachu', 'Link (Zelda)', 'Donkey Kong', 'Pac-Man', 'Naruto', 'Goku', 'Vegeta', 'Luffy',
  'Shrek', 'Burro (Shrek)', 'Buzz Lightyear', 'Woody', 'Nemo', 'Dory', 'Elsa (Frozen)', 'Olaf', 'Simba', 'Mufasa', 'Timão e Pumba',
  'Cinderela', 'Branca de Neve', 'Bela (A Bela e a Fera)', 'Aladdin', 'Moana', 'Mulan', 'Peppa Pig', 'Mônica', 'Cebolinha', 'Cascão',
  'Magali', 'Chico Bento', 'Gasparzinho', 'Garfield', 'Snoopy', 'Pinóquio', 'Peter Pan', 'Capitão Gancho', 'Hello Kitty', 'Minion',
  // Cinema, séries, literatura
  'Harry Potter', 'Hermione', 'Dumbledore', 'Voldemort', 'Gandalf', 'Frodo', 'Sherlock Holmes', 'Jack Sparrow', 'James Bond',
  'Indiana Jones', 'Rocky Balboa', 'Forrest Gump', 'Rambo', 'Terminator', 'Neo (Matrix)', 'Yoda', 'Chewbacca', 'Luke Skywalker',
  'Jon Snow', 'Daenerys', 'Walter White', 'Eleven (Stranger Things)', 'Chaves', 'Chapolin Colorado', 'Seu Madruga', 'Dona Florinda',
  'Rei Arthur', 'Zorro', 'Drácula', 'Frankenstein', 'Alice no País das Maravilhas', 'Papai Noel', 'Saci-Pererê', 'Curupira', 'Iara',
  // Música, TV, famosos
  'Michael Jackson', 'Elvis Presley', 'Freddie Mercury', 'Madonna', 'Beyoncé', 'Rihanna', 'Taylor Swift', 'Shakira', 'Justin Bieber',
  'Lady Gaga', 'Eminem', 'Bob Marley', 'John Lennon', 'Roberto Carlos', 'Anitta', 'Pabllo Vittar', 'Gusttavo Lima', 'Ivete Sangalo',
  'Caetano Veloso', 'Gilberto Gil', 'Cazuza', 'Raul Seixas', 'Tim Maia', 'Zeca Pagodinho', 'Xuxa', 'Silvio Santos', 'Faustão',
  'Ana Maria Braga', 'Luciano Huck', 'Fátima Bernardes', 'Gugu', 'Hebe Camargo', 'Tiago Leifert', 'Paulo Gustavo', 'Fernanda Montenegro',
  // Esportistas
  'Pelé', 'Neymar', 'Cristiano Ronaldo', 'Messi', 'Ronaldinho Gaúcho', 'Ronaldo Fenômeno', 'Maradona', 'Zidane', 'Romário', 'Kaká',
  'Ayrton Senna', 'Lewis Hamilton', 'Gustavo Kuerten', 'Michael Jordan', 'LeBron James', 'Usain Bolt', 'Rebeca Andrade', 'Marta',
  'Muhammad Ali', 'Mike Tyson', 'Anderson Silva', 'Michael Phelps', 'Serena Williams', 'Cesar Cielo', 'Daiane dos Santos',
  // História e ciência
  'Albert Einstein', 'Isaac Newton', 'Leonardo da Vinci', 'Pablo Picasso', 'Frida Kahlo', 'Van Gogh', 'Mozart', 'Beethoven', 'Shakespeare',
  'Cleópatra', 'Napoleão', 'Júlio César', 'Tiradentes', 'Dom Pedro I', 'Princesa Isabel', 'Getúlio Vargas', 'Santos Dumont', 'Machado de Assis',
  'Monteiro Lobato', 'Clarice Lispector', 'Chico Xavier', 'Madre Teresa', 'Gandhi', 'Martin Luther King', 'Nelson Mandela', 'Che Guevara',
  'Jesus Cristo', 'Elon Musk', 'Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Papa Francisco', 'Rainha Elizabeth', 'Princesa Diana',
]

// Sorteia personagens sem repetir os que já saíram (`excluir`); se faltar, recomeça do zero.
export function sortearPersonagens(quantidade, excluir = []) {
  const disponiveis = personagensBank.filter((p) => !excluir.includes(p))
  const fonte = disponiveis.length >= quantidade ? disponiveis : personagensBank
  return embaralhar(fonte).slice(0, quantidade)
}
