// Eventos da NBA — bloco 1: treino, técnico, vestiário, corpo e saúde.
export const EVENTOS_NBA_1 = [
  {
    id: 'n1_preparador', fase: 'nba', titulo: 'Verão de treino', peso: 2,
    texto: 'O preparador físico te chama antes de todo mundo e pergunta onde você quer colocar as horas extras do verão.',
    escolhas: [
      { rotulo: 'Sala de musculação', resultado: 'Você ganhou massa e passou a aguentar contato embaixo da cesta.', efeitos: { fisico: 3, infiltracao: 1, desgaste: 3 } },
      { rotulo: '500 arremessos por dia', resultado: 'A mão ficou calibrada. O arremesso saiu mais limpo a temporada inteira.', efeitos: { arremesso: 3, moral: 3 } },
      { rotulo: 'Vídeo e leitura de jogo', resultado: 'Você passou a enxergar a jogada antes dela acontecer.', efeitos: { qi: 3, passe: 1 } },
      { rotulo: 'Defesa individual', resultado: 'Seis semanas de deslize lateral. As coxas reclamaram, o ataque adversário também.', efeitos: { defesa: 3, desgaste: 4 } },
    ],
  },
  {
    id: 'n1_tecnico_novo', fase: 'nba', titulo: 'Técnico novo', cond: { temporadaNbaMin: 1 },
    texto: 'A franquia trocou a comissão técnica. O novo técnico quer um sistema de muita movimentação e cobra defesa de todo mundo.',
    escolhas: [
      { rotulo: 'Abraçar o sistema', resultado: 'Você virou o exemplo que ele usa nas preleções.', efeitos: { defesa: 2, tecnico: 12, moral: -2 } },
      { rotulo: 'Manter seu jogo', resultado: 'Você produziu igual, mas ficou marcado como o cara que não entrou no esquema.', efeitos: { tecnico: -12, moral: 3 } },
    ],
  },
  {
    id: 'n1_joelho', fase: 'nba', titulo: 'Incômodo no joelho', cond: { temporadaNbaMin: 1, desgasteMin: 25 }, peso: 2,
    texto: 'Dor chata no joelho desde a semana passada. O departamento médico sugere parar duas semanas. O time está numa sequência importante.',
    escolhas: [
      { rotulo: 'Parar e tratar', resultado: 'Você perdeu alguns jogos, mas voltou inteiro.', efeitos: { desgaste: -10, tecnico: -4, moral: -3 } },
      { rotulo: 'Jogar no sacrifício', resultado: 'A torcida te adorou. O joelho, nem tanto.', efeitos: { fama: 6, tecnico: 8, desgaste: 12, risco: 0.12 } },
    ],
  },
  {
    id: 'n1_minutos', fase: 'nba', titulo: 'Reunião sobre minutos', cond: { papel: ['banco', 'rotacao'], temporadaNbaMin: 1 },
    texto: 'Você bate na sala do técnico pra reclamar do tempo em quadra. Ele deixa você falar até o fim e depois pede uma coisa em troca.',
    escolhas: [
      { rotulo: 'Reclamar sem filtro', resultado: 'Saiu de lá com o cartão de visita de um malcriado e a promessa de mais minutos.', efeitos: { minutosBonus: 3, tecnico: -10, moral: 3 } },
      { rotulo: 'Pedir um plano de evolução', resultado: 'Ele desenhou três metas pra você. Cumpriu duas e ganhou espaço.', efeitos: { minutosBonus: 2, tecnico: 6, qi: 1 } },
      { rotulo: 'Engolir e trabalhar', resultado: 'Você ficou calado. O treino foi seu desabafo.', efeitos: { fisico: 1, desgaste: 3, moral: -3 } },
    ],
  },
  {
    id: 'n1_veterano_mentor', fase: 'nba', titulo: 'O veterano te adota', cond: { temporadaNbaMin: 0, temporadaNbaMax: 3 }, unico: true,
    texto: 'Um veterano de quase quarenta, de vestiário respeitado, resolve te ensinar os macetes da liga: arbitragem, viagens e rotina.',
    escolhas: [
      { rotulo: 'Colar nele', resultado: 'Você aprendeu a descansar, a falar com o árbitro e a escolher os batalhas.', efeitos: { qi: 3, vestiario: 6, desgaste: -4, flag: 'mentor_veterano' } },
      { rotulo: 'Manter distância', resultado: 'Você aprendeu do jeito mais caro, errando.', efeitos: { moral: -2, fisico: 1 } },
    ],
  },
  {
    id: 'n1_briga', fase: 'nba', titulo: 'Confusão em quadra', cond: { temporadaNbaMin: 1 },
    texto: 'Depois de uma falta dura, o adversário te empurra pelas costas. O banco inteiro de pé e o árbitro com o apito na boca.',
    escolhas: [
      { rotulo: 'Entrar na confusão', resultado: 'Duas expulsões e uma multa. O vestiário aplaudiu em pé.', efeitos: { vestiario: 10, dinheiro: -0.05, tecnico: -4, imagem: -3 } },
      { rotulo: 'Pular fora e acalmar', resultado: 'O técnico agradeceu a cabeça fria. A torcida gritou por mais.', efeitos: { tecnico: 7, imagem: 4, vestiario: -3 } },
    ],
  },
  {
    id: 'n1_vestiario_racha', fase: 'nba', titulo: 'Vestiário rachado', cond: { vestiarioMax: 35, temporadaNbaMin: 1 },
    texto: 'Dois grupos no elenco não se falam. A comissão pede que as estrelas deem o exemplo e façam um churrasco de integração.',
    escolhas: [
      { rotulo: 'Bancar o churrasco', resultado: 'Carne, cerveja e uma partida de dominó. A paz voltou por alguns meses.', efeitos: { dinheiro: -0.03, vestiario: 14, moral: 4 } },
      { rotulo: 'Ficar de fora', resultado: 'O clima azedou mais. O técnico tentou resolver sozinho.', efeitos: { vestiario: -6, tecnico: -2 } },
    ],
  },
  {
    id: 'n1_viagem', fase: 'nba', titulo: 'Voo cancelado', cond: { temporadaNbaMin: 0 },
    texto: 'Neve na pista e o voo do time está parado há seis horas. Alguns jogadores sugerem ir de ônibus, outros preferem dormir no aeroporto.',
    escolhas: [
      { rotulo: 'Ir de ônibus mesmo', resultado: 'Doze horas e muita risada no fundo do ônibus. O time chegou unido e destruído.', efeitos: { vestiario: 7, desgaste: 6 } },
      { rotulo: 'Esperar no aeroporto', resultado: 'Você dormiu numa cadeira de plástico. Acordou com dor nas costas e uma foto viral.', efeitos: { desgaste: 3, fama: 2, imagem: 2 } },
    ],
  },
  {
    id: 'n1_dieta', fase: 'nba', titulo: 'Nutricionista novo', cond: { temporadaNbaMin: 1 }, peso: 1.2,
    texto: 'O clube contratou uma nutricionista implacável. Ela quer cortar seu açaí, suas três pizzas de domingo e o refrigerante da noite.',
    escolhas: [
      { rotulo: 'Obedecer à risca', resultado: 'Você perdeu três quilos e ganhou fôlego. A vida perdeu um pouco de cor.', efeitos: { fisico: 2, desgaste: -6, moral: -2 } },
      { rotulo: 'Fazer metade', resultado: 'Você ficou no meio do caminho, sem culpa e sem milagre.', efeitos: { fisico: 1, desgaste: -2 } },
      { rotulo: 'Ignorar', resultado: 'A balança subiu e o técnico notou.', efeitos: { fisico: -2, tecnico: -4, moral: 3 } },
    ],
  },
  {
    id: 'n1_sono', fase: 'nba', titulo: 'Insônia de jogador', cond: { temporadaNbaMin: 1, moralMax: 55 },
    texto: 'Os jogos terminam tarde, o corpo não desliga e a noite vira um deserto. O departamento médico indica um especialista em sono.',
    escolhas: [
      { rotulo: 'Fazer o tratamento', resultado: 'Você passou a dormir como um bebê gigante.', efeitos: { desgaste: -8, moral: 5, dinheiro: -0.02 } },
      { rotulo: 'Tomar um chá e esperar', resultado: 'O chá não adiantou. O cansaço cobrou depois.', efeitos: { desgaste: 5, moral: -3 } },
    ],
  },
  {
    id: 'n1_cirurgia_adiada', fase: 'nba', titulo: 'Cirurgia que dá pra adiar', cond: { desgasteMin: 50, temporadaNbaMin: 2 },
    texto: 'Um problema no ombro pode esperar até o fim da temporada, mas pode piorar. O time está brigando por vaga nos playoffs.',
    escolhas: [
      { rotulo: 'Operar agora', resultado: 'Você ficou fora meses, mas voltou inteiro e confiante.', efeitos: { foraTemporada: true, desgaste: -25, tecnico: -6, moral: -4 } },
      { rotulo: 'Adiar e jogar infiltrado', resultado: 'Você segurou a dor com injeção e coragem. A lesão ficou mais séria depois.', efeitos: { fama: 5, tecnico: 6, risco: 0.15, desgaste: 8 } },
    ],
  },
  {
    id: 'n1_ritual', fase: 'nba', titulo: 'Seu ritual de pré-jogo', cond: { temporadaNbaMin: 1 }, unico: true,
    texto: 'Um repórter descobriu que você sempre veste a meia esquerda antes da direita e escuta a mesma playlist antes do jogo. A conta de fãs virou fã-clube.',
    escolhas: [
      { rotulo: 'Assumir publicamente', resultado: 'Virou meme e camiseta. Todo mundo quer saber qual é a playlist.', efeitos: { fama: 4, imagem: 5, patrocinio: 0.05 } },
      { rotulo: 'Mudar o ritual', resultado: 'Você perdeu a mandinga, e a primeira semana de jogos foi estranha.', efeitos: { moral: -4, qi: 1 } },
    ],
  },
  {
    id: 'n1_batalha_arremesso', fase: 'nba', titulo: 'Concurso de arremessos no treino', cond: { temporadaNbaMin: 0 },
    texto: 'Depois do treino, os melhores arremessadores apostam o café da semana inteira num duelo da linha de três.',
    escolhas: [
      { rotulo: 'Entrar no duelo', resultado: 'Você bateu os dois rivais na final e ganhou o café, o respeito e a fama.', efeitos: {}, alea: { p: 0.5, sucesso: { resultado: 'Você bateu os dois rivais na final e ganhou o café, o respeito e a fama.', efeitos: { arremesso: 1, vestiario: 6, moral: 4 } }, falha: { resultado: 'Você errou a bola decisiva e pagou o café de todo mundo.', efeitos: { dinheiro: -0.01, vestiario: 2, moral: -2 } } } },
      { rotulo: 'Assistir de longe', resultado: 'Você economizou o ego e o dinheiro.', efeitos: { qi: 1 } },
    ],
  },
  {
    id: 'n1_arbitro', fase: 'nba', titulo: 'Briga com o árbitro', cond: { temporadaNbaMin: 1, mediaMin: 62 },
    texto: 'Você achou uma falta claramente marcada errada e foi reclamar no meio do jogo. O árbitro apontou o dedo e a plateia gritou.',
    escolhas: [
      { rotulo: 'Insistir na reclamação', resultado: 'Falta técnica, multa e um clipe no telejornal.', efeitos: { dinheiro: -0.03, fama: 3, imagem: -4, tecnico: -3 } },
      { rotulo: 'Engolir e voltar pra defesa', resultado: 'Você deixou o árbitro falando sozinho e provou maturidade.', efeitos: { tecnico: 4, imagem: 3, qi: 1 } },
    ],
  },
  {
    id: 'n1_playmaker', fase: 'nba', titulo: 'O time quer que você passe mais', cond: { papel: ['estrela', 'titular'], temporadaNbaMin: 2, posicao: ['ala', 'ala_armador', 'ala_pivo'] }, unico: true,
    texto: 'O técnico acha que seu jogo ficou previsível e pede que você crie pros outros. Os companheiros adoram a ideia.',
    escolhas: [
      { rotulo: 'Abraçar o jogo coletivo', resultado: 'Você virou um facilitador de verdade. Menos pontos, mais vitórias.', efeitos: { passe: 3, qi: 2, vestiario: 8, tecnico: 6 } },
      { rotulo: 'Continuar pontuando', resultado: 'Os números não mentem: você fez mais pontos e o time só ficou quase igual.', efeitos: { arremesso: 2, infiltracao: 1, vestiario: -5 } },
    ],
  },
  {
    id: 'n1_grupo_gym', fase: 'nba', titulo: 'Treino extra com o elenco', cond: { temporadaNbaMin: 1 },
    texto: 'Seus companheiros combinam um treino extra às 6 da manhã, antes do voo do dia. Ninguém está obrigado, mas todo mundo vai ver quem apareceu.',
    escolhas: [
      { rotulo: 'Acordar cedo e ir', resultado: 'Você chegou de olho inchado e saiu ganhando moral com o grupo.', efeitos: { vestiario: 6, fisico: 1, desgaste: 4 } },
      { rotulo: 'Dormir mais', resultado: 'Você descansou, mas ouviu piada do capitão a semana toda.', efeitos: { vestiario: -3, desgaste: -4 } },
    ],
  },
  {
    id: 'n1_lesao_retorno', fase: 'nba', titulo: 'A volta depois da lesão', cond: { lesaoRecente: true, temporadaNbaMin: 1 }, peso: 3,
    texto: 'Você está liberado pra jogar de novo, mas o corpo ainda lembra. O departamento médico pede cautela e o técnico precisa de você já.',
    escolhas: [
      { rotulo: 'Voltar com calma', resultado: 'Você cumpriu o protocolo e voltou sem sustos.', efeitos: { desgaste: -8, tecnico: -2 } },
      { rotulo: 'Voltar já', resultado: 'Você correu o risco e o time agradeceu. O corpo mandou a conta depois.', efeitos: { tecnico: 8, fama: 3, risco: 0.1 } },
    ],
  },
  {
    id: 'n1_confianca', fase: 'nba', titulo: 'Crise de confiança', cond: { moralMax: 35, temporadaNbaMin: 1 }, peso: 2,
    texto: 'Você errou três bolas decisivas seguidas e as redes sociais pegaram fogo. A confiança foi embora e não deixou bilhete.',
    escolhas: [
      { rotulo: 'Procurar um psicólogo esportivo', resultado: 'Você descobriu que o problema era mais o medo do que a mão.', efeitos: { moral: 14, qi: 1, dinheiro: -0.01 } },
      { rotulo: 'Treinar até passar', resultado: 'Você ficou no ginásio até tarde, mas a cabeça só piorou.', efeitos: { arremesso: 1, moral: -3, desgaste: 5 } },
    ],
  },
  {
    id: 'n1_aniversario', fase: 'nba', titulo: 'Aniversário do capitão', cond: { temporadaNbaMin: 1 },
    texto: 'O capitão do time pede uma vaquinha pra festa surpresa. Todo mundo vai, você é obrigado a participar.',
    escolhas: [
      { rotulo: 'Cobrir metade', resultado: 'A festa foi grandiosa e o capitão te chama de irmão.', efeitos: { dinheiro: -0.04, vestiario: 9, moral: 3 } },
      { rotulo: 'Dar o mínimo', resultado: 'Participou sem fazer barulho. Ninguém se lembrou.', efeitos: { dinheiro: -0.005, vestiario: 1 } },
    ],
  },
  {
    id: 'n1_corrida', fase: 'nba', titulo: 'O técnico quer ritmo rápido', cond: { temporadaNbaMin: 1 },
    texto: 'O time vai jogar em transição o tempo todo: muita corrida, pouco descanso. Quem não acompanha perde minutos.',
    escolhas: [
      { rotulo: 'Entrar no ritmo', resultado: 'Você ganhou preparo e perdeu o fôlego nas últimas semanas.', efeitos: { fisico: 2, desgaste: 6, minutosBonus: 2 } },
      { rotulo: 'Pedir pra segurar o jogo', resultado: 'Ele ouviu e seguiu com o plano mesmo assim.', efeitos: { tecnico: -4, desgaste: -2 } },
    ],
  },
  {
    id: 'n1_lesao_colega', fase: 'nba', titulo: 'Seu parceiro de quarto se machucou', cond: { temporadaNbaMin: 1 },
    texto: 'O titular da sua posição rompeu um ligamento. O técnico olha pra você e diz que a vaga é sua, se você aguentar a pressão.',
    escolhas: [
      { rotulo: 'Assumir a vaga', resultado: 'Você pegou o lugar com raiva boa e entregou uma sequência sólida.', efeitos: { minutosBonus: 5, fama: 4, moral: 5, desgaste: 5 } },
      { rotulo: 'Pedir ajuda pro veterano', resultado: 'Dividiu a responsabilidade e jogou mais leve.', efeitos: { minutosBonus: 3, vestiario: 4, qi: 1 } },
    ],
  },
  {
    id: 'n1_pre_jogo_playoffs', fase: 'nba', titulo: 'Reunião antes dos playoffs', cond: { temporadaNbaMin: 1, mediaMin: 66 },
    texto: 'Faltam semanas para os playoffs. O técnico pergunta se você prefere começar acelerado ou poupar energia pro mata-mata.',
    escolhas: [
      { rotulo: 'Acelerar já', resultado: 'Você puxou o time pra cima e chegou queimado.', efeitos: { fama: 3, moral: 4, desgaste: 8 } },
      { rotulo: 'Guardar energia', resultado: 'Você esperou o momento certo e chegou inteiro.', efeitos: { desgaste: -6, fama: -1 } },
    ],
  },
  {
    id: 'n1_mascote', fase: 'nba', titulo: 'O mascote te escolheu', cond: { temporadaNbaMin: 0 },
    texto: 'A mascote do time resolveu fazer piada com você todo jogo: cutuca, imita seu arremesso e ainda come seu lanche.',
    escolhas: [
      { rotulo: 'Entrar na brincadeira', resultado: 'Virou número fixo do jogo. A torcida pede.', efeitos: { fama: 3, imagem: 4, vestiario: 3 } },
      { rotulo: 'Ignorar', resultado: 'A mascote fez a imitação mais engraçada ainda, e você ficou no vácuo.', efeitos: { moral: -1 } },
    ],
  },
  {
    id: 'n1_rotina_pos_jogo', fase: 'nba', titulo: 'Banho de gelo ou festa?', cond: { temporadaNbaMin: 1 },
    texto: 'Depois de uma vitória em casa, os amigos chamam pra uma balada. Os fisioterapeutas oferecem banho de gelo e massagem.',
    escolhas: [
      { rotulo: 'Balada', resultado: 'Você curtiu até de manhã e rendeu menos no dia seguinte.', efeitos: { moral: 6, desgaste: 5, imagem: -1 } },
      { rotulo: 'Recuperação', resultado: 'Você acordou novo e viu um vídeo seu dançando no feed. Pelo menos era em casa.', efeitos: { desgaste: -7, moral: -1 } },
    ],
  },
  {
    id: 'n1_aposta_estatistica', fase: 'nba', titulo: 'Meta de estatística no contrato', cond: { temporadaNbaMin: 1, papel: ['estrela', 'titular'] },
    texto: 'Seu agente conseguiu incluir um bônus se você bater 20 pontos de média. O problema: o técnico quer que o time ganhe jogando coletivo.',
    escolhas: [
      { rotulo: 'Perseguir o bônus', resultado: 'Você bateu a meta. O time rendeu menos.', efeitos: { dinheiro: 0.8, vestiario: -6, fama: 3, tecnico: -4 } },
      { rotulo: 'Jogar pra equipe', resultado: 'Perdeu o bônus e ganhou moral. Seu agente ficou lívido.', efeitos: { vestiario: 7, tecnico: 6, moral: 2 } },
    ],
  },
  {
    id: 'n1_motivacao', fase: 'nba', titulo: 'Discurso do capitão', cond: { temporadaNbaMin: 1 },
    texto: 'Depois de cinco derrotas, o capitão pede a palavra e dá um discurso que dura nove minutos e fala de família, pão de queijo e redenção.',
    escolhas: [
      { rotulo: 'Aplaudir e cobrar cada palavra', resultado: 'O time ganhou o jogo seguinte e ele chorou no vestiário.', efeitos: { vestiario: 7, moral: 5 } },
      { rotulo: 'Brincar que foi longo', resultado: 'A risada aliviou a tensão. O capitão fingiu ofensa.', efeitos: { vestiario: 4, moral: 2 } },
    ],
  },
  {
    id: 'n1_academia_propria', fase: 'nba', titulo: 'Montar uma academia em casa', cond: { patrimonioMin: 5, temporadaNbaMin: 2 }, unico: true,
    texto: 'Com o dinheiro entrando, você pode instalar uma estrutura de treino de ponta na sua casa. O arquiteto pergunta o que priorizar.',
    escolhas: [
      { rotulo: 'Quadra com máquina de passes', resultado: 'Você passou a treinar de madrugada e ainda arrumou quadra pro pessoal.', efeitos: { dinheiro: -0.8, arremesso: 2, qi: 1, flag: 'academia_casa' } },
      { rotulo: 'Piscina e recuperação', resultado: 'Seu corpo agradeceu. O tempo de recuperação caiu.', efeitos: { dinheiro: -0.6, desgaste: -10, flag: 'academia_casa' } },
    ],
  },
  {
    id: 'n1_tatuagem', fase: 'nba', titulo: 'Tatuagem polêmica', cond: { temporadaNbaMin: 1 },
    texto: 'Você quer fechar o braço com uma tatuagem enorme. O departamento de marketing do time pediu cautela, e sua mãe pediu pelo amor de Deus.',
    escolhas: [
      { rotulo: 'Fazer assim mesmo', resultado: 'Ficou lindo e viral. A mãe não ligou por três dias.', efeitos: { imagem: 3, fama: 2, moral: 4 } },
      { rotulo: 'Esperar o fim do contrato', resultado: 'Você segurou a ideia e economizou uns sustos.', efeitos: { imagem: 1, tecnico: 1 } },
    ],
  },
  {
    id: 'n1_cochilo', fase: 'nba', titulo: 'Cochilo no banco', cond: { temporadaNbaMin: 1 },
    texto: 'A câmera te pegou dormindo no banco no meio do jogo. A internet fez um filtro com seu rosto. A torcida adorou, a comissão nem tanto.',
    escolhas: [
      { rotulo: 'Postar o meme você mesmo', resultado: 'Você assumiu a vergonha e virou o assunto do dia.', efeitos: { fama: 4, imagem: 4, tecnico: -3 } },
      { rotulo: 'Pedir desculpas ao grupo', resultado: 'Dessa vez o grupo achou graça, mas você tomou nota.', efeitos: { vestiario: 4, tecnico: 2 } },
    ],
  },
  {
    id: 'n1_cesta_vitoria', fase: 'nba', titulo: 'A bola do jogo é sua', cond: { temporadaNbaMin: 1, mediaMin: 62, papel: ['estrela', 'titular'] },
    texto: 'Quatro segundos no relógio, placar empatado e o técnico desenha a jogada. A bola vai ficar com você.',
    escolhas: [
      { rotulo: 'Arremessar', resultado: '', efeitos: {}, alea: { p: 0.45, sucesso: { resultado: 'A bola desenhou o arco, bateu no aro e entrou. O ginásio explodiu e você virou herói da cidade.', efeitos: { fama: 10, moral: 8, imagem: 5 } }, falha: { resultado: 'A bola bateu no aro e saiu. O silêncio no ginásio foi ensurdecedor.', efeitos: { fama: -2, moral: -7 } } } },
      { rotulo: 'Passar pro companheiro livre', resultado: 'Você viu o marcador chegar e achou o parceiro livre. O jogo foi decidido sem você.', efeitos: { qi: 1, vestiario: 6, fama: 2 } },
    ],
  },
  {
    id: 'n1_treinador_pessoal', fase: 'nba', titulo: 'Treinador pessoal', cond: { patrimonioMin: 2, temporadaNbaMin: 1, mediaMax: 82 },
    texto: 'Um treinador pessoal famoso quer cuidar do seu desenvolvimento no verão. Cobra caro e promete resultado.',
    escolhas: [
      { rotulo: 'Contratar por um ano', resultado: 'Seis semanas de rotina militar. Os resultados vieram.', efeitos: { dinheiro: -0.5, arremesso: 2, qi: 2, fisico: 1, desgaste: 5 } },
      { rotulo: 'Pagar só por um mês', resultado: 'Pouco tempo, mas ele corrigiu o mais importante.', efeitos: { dinheiro: -0.15, arremesso: 1, qi: 1 } },
    ],
  },
  {
    id: 'n1_hidratacao', fase: 'nba', titulo: 'Jogo em altitude', cond: { temporadaNbaMin: 1 },
    texto: 'O time vai jogar uma sequência de partidas em cidades altas. Os médicos recomendam rotina de hidratação e sono controlado.',
    escolhas: [
      { rotulo: 'Cumprir a rotina', resultado: 'Você suportou o ar rarefeito sem enjoo.', efeitos: { desgaste: -3, fisico: 1 } },
      { rotulo: 'Fazer do seu jeito', resultado: 'Você passou mal no segundo jogo e foi tirado de quadra.', efeitos: { desgaste: 8, tecnico: -3 } },
    ],
  },
  {
    id: 'n1_filho', fase: 'nba', titulo: 'Notícia em casa', cond: { idadeMin: 24, temporadaNbaMin: 2 }, unico: true,
    texto: 'Você descobre que vai ser pai/mãe no meio da temporada. A rotina vai virar de cabeça pra baixo.',
    escolhas: [
      { rotulo: 'Reorganizar a vida pra família', resultado: 'Sem balada e com um sorriso novo. O foco mudou de lugar.', efeitos: { moral: 12, desgaste: -4, gasto: 0.2, flag: 'familia_filho' } },
      { rotulo: 'Manter a rotina de sempre', resultado: 'Você conciliou como deu. O cansaço apareceu.', efeitos: { moral: 4, desgaste: 5, flag: 'familia_filho' } },
    ],
  },
]
