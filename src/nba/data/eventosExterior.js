// Eventos de quem joga fora da NBA: clube estrangeiro, idioma, torcida, saudade e a vida depois do sonho americano.
export const EVENTOS_EXTERIOR = [
  {
    id: 'ex_idioma', fase: 'exterior', titulo: 'Idioma novo', unico: true,
    texto: 'Metade do vestiário fala uma língua que você não entende. O técnico grita instruções que só parecem simples.',
    escolhas: [
      { rotulo: 'Contratar professor particular', resultado: 'Seis meses depois você já xinga o árbitro no idioma local. Evolução.', efeitos: { qi: 1, vestiario: 4, dinheiro: -0.03 } },
      { rotulo: 'Aprender no improviso', resultado: 'Você aprendeu muita palavra feia e pouca gramática. Mas todo mundo entendeu.', efeitos: { vestiario: 3, moral: 2 } },
      { rotulo: 'Só falar inglês', resultado: 'Funciona no meio da quadra, nem tanto no churrasco do elenco.', efeitos: { vestiario: -3 } },
    ],
  },
  {
    id: 'ex_torcida', fase: 'exterior', titulo: 'Torcida fanática', peso: 2,
    texto: 'A torcida organizada do clube canta seu nome desde o aquecimento. Já tem faixa com seu rosto na arquibancada.',
    escolhas: [
      { rotulo: 'Ir cumprimentar a arquibancada', resultado: 'Virou ídolo no bairro. Ganhou até uma camisa pirata com seu nome.', efeitos: { fama: 4, moral: 6, imagem: 2 } },
      { rotulo: 'Manter a concentração', resultado: 'Você foi frio e profissional. A torcida achou meio distante.', efeitos: { qi: 1, moral: -1 } },
    ],
  },
  {
    id: 'ex_salario_atrasado', fase: 'exterior', titulo: 'Salário atrasado', peso: 1.5,
    texto: 'O clube atrasou dois meses de pagamento e a diretoria pede paciência pela terceira vez.',
    escolhas: [
      { rotulo: 'Aguardar e confiar', resultado: 'Pagaram tudo, com juros. O clima ficou estranho por um tempo.', efeitos: { dinheiro: -0.05, moral: -3, vestiario: 2 } },
      { rotulo: 'Cobrar na justiça esportiva', resultado: 'Você recebeu rápido, mas a diretoria passou a te olhar torto.', efeitos: { tecnico: -4, dinheiro: 0.1, vestiario: 2 } },
      { rotulo: 'Ameaçar greve junto com o elenco', resultado: 'A diretoria pagou no dia seguinte. Todo mundo te chama de sindicalista.', efeitos: { vestiario: 6, tecnico: -2, imagem: 1 } },
    ],
  },
  {
    id: 'ex_saudade', fase: 'exterior', titulo: 'Saudade de casa', peso: 2,
    texto: 'Feriado, sala vazia, chuva lá fora e uma chamada de vídeo com a família que cai a cada dois minutos.',
    escolhas: [
      { rotulo: 'Trazer a família pra passar uma temporada', resultado: 'A casa ficou cheia e a alma também. A conta de luz não.', efeitos: { moral: 10, dinheiro: -0.2, desgaste: -4 } },
      { rotulo: 'Focar no treino e aguentar', resultado: 'O físico agradeceu. O coração, nem tanto.', efeitos: { fisico: 1, moral: -5 } },
      { rotulo: 'Sair com os colegas do time', resultado: 'Uma noite de comida local e risadas na língua errada.', efeitos: { moral: 5, vestiario: 4 } },
    ],
  },
  {
    id: 'ex_naturalizacao', fase: 'exterior', titulo: 'Oferta de naturalização', cond: { idadeMin: 26, mediaMin: 58 }, unico: true,
    texto: 'O clube oferece te ajudar a conseguir passaporte local. Isso abre espaço na seleção do país, mas tem burocracia e opinião pública.',
    escolhas: [
      { rotulo: 'Aceitar o passaporte', resultado: 'Você estreou pela nova seleção e virou assunto nos dois países.', efeitos: { fama: 5, imagem: -1, moral: 3, flag: 'naturalizado' } },
      { rotulo: 'Recusar', resultado: 'Você manteve a bandeira de origem e a consciência tranquila.', efeitos: { imagem: 2, moral: 2 } },
    ],
  },
  {
    id: 'ex_summer_league', fase: 'exterior', titulo: 'Ligação do agente', cond: { idadeMax: 31, mediaMin: 56 }, peso: 1.5,
    texto: 'Seu agente jura que times da NBA estão de olho. Ele pede que você mostre serviço num torneio de verão.',
    escolhas: [
      { rotulo: 'Treinar forte pra provar o valor', resultado: 'O trabalho extra chamou atenção de olheiros que não esperava.', efeitos: { arremesso: 1, fisico: 1, fama: 3, desgaste: 5 } },
      { rotulo: 'Ignorar e curtir o verão', resultado: 'O verão foi bom. O telefone não tocou mais.', efeitos: { moral: 4, desgaste: -6 } },
    ],
  },
  {
    id: 'ex_clube_rival', fase: 'exterior', titulo: 'Clássico da cidade', peso: 2,
    texto: 'O maior rival do seu clube mora na mesma cidade. Semana inteira de provocação nas rádios e no portão do ginásio.',
    escolhas: [
      { rotulo: 'Entrar no clima e provocar', resultado: 'A cidade parou. Você jogou o clássico no ritmo da torcida.', efeitos: { fama: 4, moral: 5, desgaste: 3 } },
      { rotulo: 'Deixar a bola falar', resultado: 'Você foi discreto e brilhou na hora certa.', efeitos: { qi: 1, imagem: 2 } },
    ],
  },
  {
    id: 'ex_comida', fase: 'exterior', titulo: 'Culinária local', peso: 1.5,
    texto: 'Seu chef local garante que o prato típico da região é ótimo pra recuperação. O cheiro, porém, é um desafio.',
    escolhas: [
      { rotulo: 'Encarar tudo', resultado: 'Virou seu prato favorito. Seu nutricionista pediu receita.', efeitos: { moral: 3, desgaste: -4 } },
      { rotulo: 'Pedir comida de casa', resultado: 'Seguro, saboroso e muito caro de importar.', efeitos: { dinheiro: -0.05, moral: 2 } },
    ],
  },
  {
    id: 'ex_jovem_talento', fase: 'exterior', titulo: 'Talento da base', cond: { idadeMin: 28 }, peso: 2,
    texto: 'Um garoto de 17 anos do clube treina com o grupo principal e todo mundo comenta que ele vai longe. Ele te pede dicas.',
    escolhas: [
      { rotulo: 'Ensinar tudo que sabe', resultado: 'O garoto virou seu afilhado de quadra. Você ganhou respeito e uma amizade.', efeitos: { vestiario: 4, imagem: 3, moral: 4 } },
      { rotulo: 'Marcar território', resultado: 'Você ganhou o duelo no treino, mas ficou com fama de duro.', efeitos: { vestiario: -2, qi: 1 } },
    ],
  },
  {
    id: 'ex_ultimo_contrato', fase: 'exterior', titulo: 'O último grande contrato', cond: { idadeMin: 32 }, peso: 2,
    texto: 'Um clube rico oferece um contrato gordo para fechar a carreira. Você sente que ainda tem lenha pra queimar.',
    escolhas: [
      { rotulo: 'Pegar o dinheiro', resultado: 'O saldo bancário subiu e a motivação nem tanto.', efeitos: { dinheiro: 1.5, moral: -2 } },
      { rotulo: 'Ficar onde é feliz', resultado: 'Você ficou no clube que te abraçou. A paz vale mais.', efeitos: { moral: 6, vestiario: 3 } },
    ],
  },
]
