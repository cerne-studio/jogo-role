// Curadoria manual — personagens conhecidos, fáceis de adivinhar com
// perguntas sim/não. Mistura de famosos globais e referências BR.
export const personagensBank = [
  'Batman', 'Homer Simpson', 'Shrek', 'Harry Potter', 'Mulher Maravilha',
  'Cristiano Ronaldo', 'Neymar', 'Michael Jackson', 'Silvio Santos',
  'Xuxa', 'Pelé', 'Homem-Aranha', 'Darth Vader', 'Mickey Mouse',
  'Chapolin Colorado', 'Chaves', 'Luciano Huck', 'Anitta', 'Pabllo Vittar',
  'Ronaldinho Gaúcho', 'Albert Einstein', 'Cleópatra', 'Napoleão',
  'Tiradentes', 'Monteiro Lobato', 'Pinóquio', 'Cinderela', 'Elsa (Frozen)',
  'Hulk', 'Superman', 'Coringa', 'Gasparzinho', 'Bob Esponja',
  'Scooby-Doo', 'Papai Noel', 'Jesus Cristo', 'Madonna', 'Beyoncé',
  'Roberto Carlos', 'Gusttavo Lima', 'Faustão', 'Ana Maria Braga',
  'Machado de Assis', 'Frida Kahlo', 'Pablo Picasso', 'Charlie Chaplin',
  'Sherlock Holmes', 'Zorro', 'Rei Arthur', 'Buzz Lightyear', 'Woody',
  'Mario (Super Mario)', 'Sonic', 'Pikachu', 'Naruto', 'Goku',
]

export function sortearPersonagens(quantidade) {
  const embaralhado = [...personagensBank].sort(() => Math.random() - 0.5)
  return embaralhado.slice(0, quantidade)
}
