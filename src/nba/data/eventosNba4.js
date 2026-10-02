// Eventos — bloco 4: humor, vida de atleta, rotina de viagem e pequenas decisões que mexem na carreira.
export const EVENTOS_NBA_4 = [
  {
    id: 'n4_voo_atrasado', fase: 'nba', titulo: 'Voo atrasado', peso: 2,
    texto: 'O charter atrasou seis horas e o jogo é amanhã cedo. O time inteiro dorme no saguão em cima das malas.',
    escolhas: [
      { rotulo: 'Dormir no chão como todo mundo', resultado: 'Você acordou com torcicolo, mas o vestiário respeitou o sacrifício.', efeitos: { vestiario: 3, desgaste: 4 } },
      { rotulo: 'Pagar um hotel só pra você', resultado: 'Dormiu como um bebê. A foto do hotel vazou no grupo do time.', efeitos: { dinheiro: -0.05, desgaste: -3, vestiario: -3 } },
    ],
  },
  {
    id: 'n4_pizza', fase: 'nba', titulo: 'Pizza pós-jogo', peso: 2,
    texto: 'O nutricionista deixou uma salada no seu armário. A pizzaria da esquina deixou um cheiro irresistível no corredor.',
    escolhas: [
      { rotulo: 'Salada, sem drama', resultado: 'Você sofreu em silêncio. O corpo agradece.', efeitos: { fisico: 1, moral: -2 } },
      { rotulo: 'Duas fatias e dane-se', resultado: 'Estava ótima. No treino do dia seguinte, nem tanto.', efeitos: { moral: 4, desgaste: 2 } },
      { rotulo: 'Dividir a pizza com o elenco', resultado: 'Virou tradição de pós-jogo e o nutricionista fingiu que não viu.', efeitos: { vestiario: 4, moral: 3, desgaste: 1 } },
    ],
  },
  {
    id: 'n4_camera_beijo', fase: 'nba', titulo: 'Câmera do beijo', cond: { famaMin: 15 }, peso: 1.5,
    texto: 'A câmera do ginásio foca em você no intervalo. O telão pede um gesto pra torcida.',
    escolhas: [
      { rotulo: 'Dançar de verdade', resultado: 'Dançou mal e com convicção. O ginásio inteiro aplaudiu.', efeitos: { fama: 3, imagem: 2, moral: 3 } },
      { rotulo: 'Fingir que não viu', resultado: 'Você olhou pro teto até o telão desistir.', efeitos: { imagem: -1 } },
      { rotulo: 'Pegar o microfone', resultado: 'O discurso foi curto, simpático e viralizou.', efeitos: { fama: 4, imagem: 3 } },
    ],
  },
  {
    id: 'n4_mascote', fase: 'nba', titulo: 'O mascote exagerou', peso: 1.5,
    texto: 'Durante um pedido de tempo, o mascote tropeça e acerta você em cheio com um canhão de camisetas.',
    escolhas: [
      { rotulo: 'Rir e levantar', resultado: 'Você fez piada do próprio tombo e a internet gostou.', efeitos: { imagem: 2, fama: 2 } },
      { rotulo: 'Pedir pro mascote ser cortado', resultado: 'Ninguém levou a sério. O mascote passou a te evitar.', efeitos: { imagem: -2, vestiario: -2 } },
    ],
  },
  {
    id: 'n4_podcast', fase: 'nba', titulo: 'Convite de podcast', cond: { famaMin: 20 }, peso: 2,
    texto: 'Um podcast popular quer você por duas horas, sem roteiro. Isso pode virar ouro ou manchete ruim.',
    escolhas: [
      { rotulo: 'Ir e falar com cuidado', resultado: 'Você foi simpático e sem polêmica. Bom e meio sem graça.', efeitos: { fama: 3, imagem: 2 } },
      { rotulo: 'Ir e falar tudo', resultado: '', efeitos: {}, alea: { p: 0.5, sucesso: { resultado: 'A franqueza virou assunto da semana, no bom sentido.', efeitos: { fama: 7, imagem: 4 } }, falha: { resultado: 'Uma frase solta virou manchete e o técnico quis conversar.', efeitos: { fama: 3, imagem: -5, tecnico: -4 } } } },
      { rotulo: 'Recusar', resultado: 'O foco ficou no treino. O podcast chamou outro.', efeitos: { moral: 1 } },
    ],
  },
  {
    id: 'n4_video_game', fase: 'nba', titulo: 'Seu rosto no videogame', cond: { mediaMin: 60, temporadaNbaMin: 1 }, unico: true,
    texto: 'O jogo de basquete mais famoso do mundo vai incluir sua carta. A nota ficou… questionável.',
    escolhas: [
      { rotulo: 'Reclamar da nota publicamente', resultado: 'A nota subiu um ponto e você virou meme na comunidade.', efeitos: { fama: 3, imagem: -1, moral: 2 } },
      { rotulo: 'Usar como motivação', resultado: 'Você treinou com a nota anotada na parede. No fim do ano, ela subiu.', efeitos: { arremesso: 1, qi: 1, moral: 2 } },
      { rotulo: 'Rir da própria carta', resultado: 'Você postou a carta com uma legenda debochada. Todo mundo curtiu.', efeitos: { imagem: 3, fama: 2 } },
    ],
  },
  {
    id: 'n4_cirurgia_lazer', fase: 'nba', titulo: 'Folga de verdade', cond: { desgasteMin: 50 }, peso: 2,
    texto: 'O corpo está cobrando. Você tem uma semana livre e uma lista de compromissos de patrocinador.',
    escolhas: [
      { rotulo: 'Descansar de verdade', resultado: 'Praia, sono e zero celular. Você voltou renovado.', efeitos: { desgaste: -14, moral: 5, patrocinio: -0.1 } },
      { rotulo: 'Cumprir todos os compromissos', resultado: 'A agenda foi cumprida e o cansaço também.', efeitos: { patrocinio: 0.3, desgaste: 4, fama: 2 } },
    ],
  },
  {
    id: 'n4_treino_pesado', fase: 'nba', titulo: 'Treino de sobrevivência', peso: 1.5, cond: { idadeMax: 30 },
    texto: 'O preparador inventou um circuito que chama de "o inferno". Metade do elenco finge lesão pra escapar.',
    escolhas: [
      { rotulo: 'Fazer o circuito completo', resultado: 'Você vomitou duas vezes e terminou em pé. Respeito geral.', efeitos: { fisico: 1, vestiario: 3, desgaste: 5 } },
      { rotulo: 'Fazer metade e se poupar', resultado: 'Sem heroísmo, sem lesão. O preparador anotou.', efeitos: { tecnico: -2 } },
    ],
  },
  {
    id: 'n4_dm_fa', fase: 'nba', titulo: 'Mensagem de um fã', cond: { famaMin: 10 }, peso: 1.5,
    texto: 'Um garoto de 12 anos te manda uma mensagem dizendo que treina todo dia no quintal por sua causa.',
    escolhas: [
      { rotulo: 'Responder com um vídeo', resultado: 'O vídeo bombou e o garoto ganhou o dia (e a escola inteira).', efeitos: { imagem: 5, fama: 2, moral: 4 } },
      { rotulo: 'Convidar pro jogo', resultado: 'Ele apareceu de camisa sua no túnel. Foi bonito demais.', efeitos: { imagem: 6, moral: 6, dinheiro: -0.01 } },
    ],
  },
  {
    id: 'n4_apelido', fase: 'nba', titulo: 'Apelido que pegou', peso: 1.5, unico: true,
    texto: 'Um comentarista inventou um apelido para você durante uma transmissão. A torcida adotou na hora.',
    escolhas: [
      { rotulo: 'Assumir e vender camiseta', resultado: 'A camiseta esgotou em duas semanas. O comentarista pediu comissão.', efeitos: { patrocinio: 0.4, fama: 4, imagem: 2 } },
      { rotulo: 'Rejeitar o apelido', resultado: 'Pegou do mesmo jeito. Agora você é o cara que tem apelido e não gosta.', efeitos: { fama: 2, moral: -1 } },
    ],
  },
  {
    id: 'n4_barba', fase: 'nba', titulo: 'Mudança de visual', peso: 1.2,
    texto: 'Seu cabeleireiro garante que um corte novo muda tudo. Você não tem certeza.',
    escolhas: [
      { rotulo: 'Arriscar', resultado: '', efeitos: {}, alea: { p: 0.55, sucesso: { resultado: 'Ficou incrível. Os fotógrafos pediram bis.', efeitos: { imagem: 3, fama: 2, moral: 3 } }, falha: { resultado: 'Virou meme por uma semana inteira.', efeitos: { imagem: -1, moral: -2, fama: 1 } } } },
      { rotulo: 'Manter o de sempre', resultado: 'Seguro. Nenhuma foto engraçada.', efeitos: {} },
    ],
  },
  {
    id: 'n4_jogo_cartas', fase: 'nba', titulo: 'Baralho no avião', peso: 1.2,
    texto: 'Os veteranos montaram uma roda de pôquer no fundo do avião e te chamaram pra "aprender".',
    escolhas: [
      { rotulo: 'Entrar na roda', resultado: '', efeitos: {}, alea: { p: 0.4, sucesso: { resultado: 'Você limpou a banca dos veteranos. Eles te chamam de "o estudante".', efeitos: { dinheiro: 0.1, vestiario: 4, moral: 3 } }, falha: { resultado: 'Você perdeu a viagem inteira e um relógio.', efeitos: { dinheiro: -0.15, vestiario: 2, moral: -2 } } } },
      { rotulo: 'Ouvir música e fingir que dorme', resultado: 'Ninguém te incomodou. Você também não fez amigos.', efeitos: { vestiario: -1 } },
    ],
  },
  {
    id: 'n4_dentista', fase: 'nba', titulo: 'Bola na cara', peso: 1,
    texto: 'Um cotovelo perdido no segundo quarto abre seu lábio. O médico pergunta se você aguenta continuar.',
    escolhas: [
      { rotulo: 'Pontos e volta ao jogo', resultado: 'Sangue na camisa, orgulho no peito. A torcida enlouqueceu.', efeitos: { vestiario: 3, fama: 2, desgaste: 3 } },
      { rotulo: 'Ficar no vestiário', resultado: 'Você seguiu a orientação médica. Melhor assim.', efeitos: { desgaste: -1 } },
    ],
  },
  {
    id: 'n4_arbitro', fase: 'nba', titulo: 'O árbitro e você', peso: 1.5,
    texto: 'Você acha que o árbitro marcou três faltas inventadas. Ele acha que você reclama demais.',
    escolhas: [
      { rotulo: 'Reclamar até ser expulso', resultado: 'Falta técnica, multa pequena e a torcida em êxtase.', efeitos: { dinheiro: -0.03, fama: 2, tecnico: -2, vestiario: 1 } },
      { rotulo: 'Respirar e seguir', resultado: 'Você segurou a onda e ganhou a confiança do técnico.', efeitos: { tecnico: 2, qi: 1 } },
    ],
  },
  {
    id: 'n4_aniversario', fase: 'nba', titulo: 'Festa de aniversário', cond: { famaMin: 25 }, peso: 1.2,
    texto: 'Sua festa de aniversário virou um evento de celebridades e a imprensa já está na porta.',
    escolhas: [
      { rotulo: 'Festão com todo mundo', resultado: 'A festa foi lendária. A ressaca também.', efeitos: { fama: 5, moral: 6, desgaste: 3, dinheiro: -0.2 } },
      { rotulo: 'Jantar com a família', resultado: 'Pouca gente, muita risada. A imprensa foi embora sem pauta.', efeitos: { moral: 5, imagem: 1 } },
    ],
  },
  {
    id: 'n4_olimpiadas', fase: 'nba', titulo: 'Convocação pela seleção', cond: { mediaMin: 68 }, peso: 1.5,
    texto: 'A seleção do seu país te convoca para o torneio de verão. Seu time prefere que você descanse.',
    escolhas: [
      { rotulo: 'Servir a seleção', resultado: 'Você vestiu a camisa do país e voltou cansado, mas orgulhoso.', efeitos: { fama: 5, imagem: 3, moral: 6, desgaste: 7, qi: 1 } },
      { rotulo: 'Descansar o verão', resultado: 'O time agradeceu. A torcida do seu país reclamou.', efeitos: { desgaste: -8, imagem: -2, moral: -2 } },
    ],
  },
  {
    id: 'n4_mentor', fase: 'nba', titulo: 'Um mentor aparece', cond: { idadeMax: 25, temporadaNbaMin: 1 }, peso: 2,
    texto: 'Um veterano que já viu de tudo se oferece pra treinar com você antes da temporada.',
    escolhas: [
      { rotulo: 'Aceitar e escutar muito', resultado: 'Você aprendeu atalhos de leitura de jogo que ninguém ensina.', efeitos: { qi: 2, passe: 1, vestiario: 2 } },
      { rotulo: 'Agradecer e treinar sozinho', resultado: 'Você manteve a rotina. O veterano ficou meio chateado.', efeitos: { vestiario: -1, moral: 1 } },
    ],
  },
  {
    id: 'n4_sequencia_perdas', fase: 'nba', titulo: 'Sequência de derrotas', cond: { semPlayoffsRecente: true }, peso: 2,
    texto: 'O time perdeu onze jogos seguidos. O vestiário está quieto demais.',
    escolhas: [
      { rotulo: 'Chamar uma reunião só dos jogadores', resultado: 'Ninguém gostou de ouvir, mas todo mundo precisava.', efeitos: { vestiario: 4, tecnico: -1, moral: 2 } },
      { rotulo: 'Fingir que está tudo bem', resultado: 'A sequência acabou sozinha, mas ficou um clima estranho.', efeitos: { moral: -3 } },
      { rotulo: 'Pedir pra ser negociado', resultado: 'A diretoria anotou o pedido e o clima piorou.', efeitos: { vestiario: -5, tecnico: -4, flag: 'pediu_troca' } },
    ],
  },
  {
    id: 'n4_apresentador', fase: 'nba', titulo: 'Convite pra talk show', cond: { famaMin: 35 }, unico: true,
    texto: 'Um apresentador de talk show te chama para um quadro de culinária. Você nunca fritou um ovo.',
    escolhas: [
      { rotulo: 'Ir e queimar a cozinha', resultado: 'O desastre foi tão engraçado que virou clipe do dia.', efeitos: { fama: 6, imagem: 3, dinheiro: 0.1 } },
      { rotulo: 'Treinar antes com um chef', resultado: 'Você apareceu preparado. Ficou ótimo, mas sem graça.', efeitos: { fama: 3, imagem: 2 } },
    ],
  },
  {
    id: 'n4_garrafao_lotado', fase: 'nba', titulo: 'Briga de garrafão', cond: { posicao: ['ala_pivo', 'pivo'] }, peso: 1.5,
    texto: 'Um pivô rival te provoca a noite inteira. Cada rebote vem com empurrão e comentário.',
    escolhas: [
      { rotulo: 'Responder na quadra', resultado: 'Você dominou o garrafão. A provocação virou elogio na coletiva.', efeitos: { fisico: 1, fama: 3, vestiario: 2 } },
      { rotulo: 'Entrar na provocação', resultado: 'Falta técnica pra os dois e um vídeo de nove segundos que rodou o mundo.', efeitos: { dinheiro: -0.04, fama: 3, tecnico: -2 } },
    ],
  },
  {
    id: 'n4_armador_leitura', fase: 'nba', titulo: 'Filme com o técnico', cond: { posicao: ['armador', 'ala_armador'] }, peso: 1.5,
    texto: 'O técnico passa uma tarde inteira mostrando todos os seus erros em vídeo. Foram muitos.',
    escolhas: [
      { rotulo: 'Anotar tudo', resultado: 'Você saiu cansado e mais inteligente.', efeitos: { qi: 2, passe: 1, tecnico: 3 } },
      { rotulo: 'Discutir cada lance', resultado: 'Você ganhou três discussões e perdeu a confiança do técnico.', efeitos: { tecnico: -3, moral: 2 } },
    ],
  },
  {
    id: 'n4_reserva_alegre', fase: 'nba', titulo: 'Rei do banco', cond: { papel: ['banco', 'g_league'] }, peso: 2,
    texto: 'Você não joga muito, mas virou o melhor animador do banco de reservas. Até o técnico ri das suas comemorações.',
    escolhas: [
      { rotulo: 'Continuar a festa', resultado: 'O banco vive lindo. Seu lugar no time, nem tanto.', efeitos: { vestiario: 5, moral: 4, tecnico: -2 } },
      { rotulo: 'Levar mais a sério', resultado: 'Você parou de bagunçar. O vestiário sentiu falta.', efeitos: { tecnico: 3, vestiario: -2 } },
    ],
  },
  {
    id: 'n4_faculdade_diploma', fase: 'nba', titulo: 'Diploma pendente', cond: { caminho: ['college'], idadeMin: 24 }, unico: true,
    texto: 'Sua faculdade oferece um programa para você concluir o curso à distância durante a temporada.',
    escolhas: [
      { rotulo: 'Estudar à noite', resultado: 'Você se formou. A mãe chorou mais que no draft.', efeitos: { imagem: 4, moral: 6, desgaste: 3, qi: 1 } },
      { rotulo: 'Deixar pra depois', resultado: 'A pasta de trabalhos ficou em um canto do armário.', efeitos: {} },
    ],
  },
  {
    id: 'n4_base_festa_rep', fase: 'base', titulo: 'Festa da república', cond: { nivel: ['college'] }, peso: 2,
    texto: 'Os veteranos da faculdade te chamam pra uma festa na véspera do treino. Eles prometem "só uma hora".',
    escolhas: [
      { rotulo: 'Ir e se comportar', resultado: 'Você bebeu água e conheceu metade do campus.', efeitos: { fama: 2, vestiario: 2 } },
      { rotulo: 'Ir e ficar até o fim', resultado: 'No treino, você parecia estar sonhando em pé.', efeitos: { moral: 4, desgaste: 5, tecnico: -2, vestiario: 2 } },
      { rotulo: 'Dormir cedo', resultado: 'Você acordou inteiro. Os veteranos te chamaram de chato.', efeitos: { tecnico: 2, vestiario: -1 } },
    ],
  },
  {
    id: 'n4_base_primeiro_voo', fase: 'base', titulo: 'Primeira viagem longa', peso: 1.5,
    texto: 'O time viaja para um torneio em outro estado. Você nunca andou de avião tão cheio de mochila na vida.',
    escolhas: [
      { rotulo: 'Ficar quieto no canto', resultado: 'Você observou, aprendeu e dormiu em cima da mochila.', efeitos: { qi: 1 } },
      { rotulo: 'Fazer amizade com todo mundo', resultado: 'Você voltou com mais contatos do que a agenda do técnico.', efeitos: { vestiario: 3, fama: 1 } },
    ],
  },
  {
    id: 'n4_base_clip', fase: 'base', titulo: 'Seu lance vira vídeo', peso: 1.5,
    texto: 'Uma enterrada sua foi parar numa conta de lances. Milhares de visualizações até o almoço.',
    escolhas: [
      { rotulo: 'Compartilhar com os amigos', resultado: 'Seus amigos exageraram e ficou até maior que o original.', efeitos: { fama: 4, moral: 3 } },
      { rotulo: 'Fingir que não aconteceu', resultado: 'Você ficou na sua. O olheiro veio perguntar do mesmo jeito.', efeitos: { fama: 2, tecnico: 1 } },
    ],
  },
]
