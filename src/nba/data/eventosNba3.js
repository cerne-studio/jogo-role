// Eventos da NBA — bloco 3: rivais reais (só como adversário, sem falas), G League, humor, lesões e fim de carreira.
export const EVENTOS_NBA_3 = [
  // ── Duelos com estrelas reais (menção neutra, só o nome) ──
  {
    id: 'n3_jokic', fase: 'nba', titulo: 'Plano contra Nikola Jokić', cond: { temporadaNbaMin: 1, mediaMin: 66, posicao: ['ala_pivo', 'pivo', 'ala'] },
    texto: 'Na próxima semana você enfrenta o time de Nikola Jokić. A comissão desenhou duas formas de lidar com o pivô que joga de armador.',
    escolhas: [
      { rotulo: 'Marcação na frente', resultado: 'Você foi pra cima. Ele achou os cortes, mas você tirou alguns passes.', efeitos: { defesa: 2, desgaste: 3, qi: 1 } },
      { rotulo: 'Cercar com ajuda', resultado: 'A defesa dobrou e o time se adaptou, ainda que ele tenha feito um triplo-duplo.', efeitos: { qi: 2, vestiario: 3 } },
    ],
  },
  {
    id: 'n3_curry', fase: 'nba', titulo: 'Contra Stephen Curry', cond: { temporadaNbaMin: 1, mediaMin: 64, posicao: ['armador', 'ala_armador'] },
    texto: 'O jogo da noite é contra Stephen Curry, que arremessa de longe mesmo quando a bola ainda não saiu do chão. Você vai ser o marcador direto.',
    escolhas: [
      { rotulo: 'Sair em cima da bola', resultado: 'Você correu a quadra toda e ele acertou quatro bolas mesmo assim.', efeitos: { defesa: 2, fisico: 1, desgaste: 5 } },
      { rotulo: 'Marcar com recuo', resultado: 'Você controlou o espaço e fez a noite dele mais cansativa.', efeitos: { qi: 2, defesa: 1 } },
    ],
  },
  {
    id: 'n3_wemby', fase: 'nba', titulo: 'O pivô de 2,24 m', cond: { temporadaNbaMin: 1, mediaMin: 62 },
    texto: 'Você vai enfrentar Victor Wembanyama, o pivô de 2,24 m que tapa a cesta como poucos. Cada infiltração pode virar toco.',
    escolhas: [
      { rotulo: 'Atacar de longe', resultado: 'Você puxou ele pra fora e achou espaço pra três.', efeitos: { arremesso: 2, qi: 1 } },
      { rotulo: 'Entrar com força', resultado: 'Você tomou alguns tocos, mas fez ele precisar de ajuda.', efeitos: { infiltracao: 2, fisico: 1, desgaste: 3 } },
    ],
  },
  {
    id: 'n3_giannis', fase: 'nba', titulo: 'Frente a Giannis Antetokounmpo', cond: { temporadaNbaMin: 1, mediaMin: 66, posicao: ['ala', 'ala_pivo', 'pivo'] },
    texto: 'Giannis Antetokounmpo vem em velocidade, e a equipe te escala pra tentar parar a corrida. É um trem sem freio.',
    escolhas: [
      { rotulo: 'Fazer falta tática', resultado: 'Você parou a corrida duas vezes e tomou uma técnica.', efeitos: { defesa: 1, fisico: 1, tecnico: -2 } },
      { rotulo: 'Posicionar o corpo e esperar', resultado: 'Você segurou ele com técnica de fundamentos, sem ser atropelado.', efeitos: { defesa: 2, qi: 1 } },
    ],
  },
  {
    id: 'n3_luka', fase: 'nba', titulo: 'Duelo de pontos com Luka Dončić', cond: { temporadaNbaMin: 1, mediaMin: 70 },
    texto: 'A NBA está de olho no confronto de hoje: Luka Dončić contra você, na mesma noite em que os dois estão em alta.',
    escolhas: [
      { rotulo: 'Entrar no duelo', resultado: '', efeitos: {}, alea: { p: 0.5, sucesso: { resultado: 'Você respondeu cada cesta dele com outra. O ginásio inteiro ficou de pé.', efeitos: { fama: 8, moral: 6, imagem: 3 } }, falha: { resultado: 'Ele ganhou o duelo e te deixou com uma noite apagada.', efeitos: { fama: -1, moral: -4 } } } },
      { rotulo: 'Jogar pro time', resultado: 'Você ignorou o duelo e venceu o jogo no coletivo.', efeitos: { vestiario: 5, tecnico: 4, qi: 1 } },
    ],
  },
  {
    id: 'n3_durant', fase: 'nba', titulo: 'O arremesso de Kevin Durant', cond: { temporadaNbaMin: 1, mediaMin: 68, posicao: ['ala', 'ala_armador', 'ala_pivo'] },
    texto: 'Kevin Durant faz o arremesso de mid-range parecer fácil. O técnico pede que você aprenda a marcar e a copiar um pouco.',
    escolhas: [
      { rotulo: 'Estudar os vídeos do arremesso', resultado: 'Você aprendeu a posicionar o pulso mais alto e a soltar melhor a bola.', efeitos: { arremesso: 3, qi: 1 } },
      { rotulo: 'Marcar com vontade', resultado: 'A defesa ficou mais firme, mas ele ainda converteu três.', efeitos: { defesa: 2, desgaste: 2 } },
    ],
  },
  {
    id: 'n3_lebron', fase: 'nba', titulo: 'Cumprimento no corredor', cond: { temporadaNbaMin: 1, mediaMin: 72, famaMin: 40 },
    texto: 'Depois de uma bela atuação sua, LeBron James cumprimenta você no corredor do ginásio. Alguém registra a cena e ela viraliza.',
    escolhas: [
      { rotulo: 'Retribuir com respeito', resultado: 'A imagem rodou o mundo e te rendeu muita simpatia.', efeitos: { fama: 5, imagem: 5, moral: 4 } },
      { rotulo: 'Postar a foto', resultado: 'Você mostrou o encontro nas redes e ganhou mil mensagens.', efeitos: { fama: 4, imagem: 3, patrocinio: 0.1 } },
    ],
  },
  {
    id: 'n3_embiid', fase: 'nba', titulo: 'Embaixo da cesta com Joel Embiid', cond: { temporadaNbaMin: 1, mediaMin: 66, posicao: ['ala_pivo', 'pivo'] },
    texto: 'Joel Embiid vai exigir muito de você embaixo da cesta no jogo de hoje. Você pode contar com ajuda ou ir sozinho.',
    escolhas: [
      { rotulo: 'Ir sozinho', resultado: 'Você bateu de frente e teve alguns bons momentos.', efeitos: { fisico: 2, infiltracao: 1, desgaste: 4 } },
      { rotulo: 'Pedir ajuda na defesa', resultado: 'A equipe fechou o garrafão e dividiu a responsabilidade.', efeitos: { qi: 2, vestiario: 4 } },
    ],
  },
  {
    id: 'n3_tatum', fase: 'nba', titulo: 'Duelo de alas contra Jayson Tatum', cond: { temporadaNbaMin: 1, mediaMin: 68, posicao: ['ala', 'ala_armador'] },
    texto: 'Jayson Tatum é seu marcador direto na noite. O plano é simples: não deixar o cara respirar.',
    escolhas: [
      { rotulo: 'Pressão total', resultado: 'Você grudou nele, e ele perdeu o ritmo no segundo quarto.', efeitos: { defesa: 2, fisico: 1, desgaste: 3 } },
      { rotulo: 'Trocar de marcação', resultado: 'A equipe se perdeu um pouco e a defesa sofreu com ele.', efeitos: { qi: 1, tecnico: -2 } },
    ],
  },
  {
    id: 'n3_edwards', fase: 'nba', titulo: 'Anthony Edwards voando', cond: { temporadaNbaMin: 1, mediaMin: 66, posicao: ['ala_armador', 'armador', 'ala'] },
    texto: 'Anthony Edwards aparece de repente na quadra com uma enterrada. A bola ainda está no ar e você ainda está no chão.',
    escolhas: [
      { rotulo: 'Responder com uma enterrada', resultado: 'Você respondeu na jogada seguinte e a plateia veio abaixo.', efeitos: { fama: 4, moral: 5, infiltracao: 1 } },
      { rotulo: 'Voltar pra defesa em silêncio', resultado: 'Você manteve a calma e dominou a jogada seguinte.', efeitos: { qi: 2, defesa: 1 } },
    ],
  },
  {
    id: 'n3_sga', fase: 'nba', titulo: 'Marcando Shai Gilgeous-Alexander', cond: { temporadaNbaMin: 1, mediaMin: 68 },
    texto: 'Shai Gilgeous-Alexander domina o ritmo do jogo com mudanças de direção que quebram tornozelos. Hoje o desafio é seu.',
    escolhas: [
      { rotulo: 'Aguentar a pressão de frente', resultado: 'Você ficou firme e fez duas paradas importantes.', efeitos: { defesa: 2, qi: 1 } },
      { rotulo: 'Pedir ajuda de um grandalhão', resultado: 'A defesa trabalhou em conjunto e o plano funcionou.', efeitos: { qi: 2, vestiario: 3 } },
    ],
  },
  {
    id: 'n3_booker', fase: 'nba', titulo: 'Show de Devin Booker', cond: { temporadaNbaMin: 1, mediaMin: 66 },
    texto: 'Devin Booker está numa noite de ouro, e a torcida adversária faz silêncio sempre que ele pega a bola.',
    escolhas: [
      { rotulo: 'Dobrar a marcação', resultado: 'Você forçou a bola a sair da mão dele e o time do outro lado quebrou.', efeitos: { qi: 2, defesa: 1 } },
      { rotulo: 'Marcar um contra um', resultado: 'Ele fez 40, você perdeu o sono.', efeitos: { defesa: 1, moral: -3, fisico: 1 } },
    ],
  },
  // ── Lendas e comparações ──
  {
    id: 'n3_comparacao_jordan', fase: 'nba', titulo: 'Comparação com Michael Jordan', cond: { mediaMin: 84, temporadaNbaMin: 2 }, unico: true,
    texto: 'Um colunista escreveu que você lembra Michael Jordan nos primeiros anos de carreira. As redes dividiram o assunto em duas torcidas.',
    escolhas: [
      { rotulo: 'Agradecer e dizer que é só o começo', resultado: 'Você virou simpático e ainda deixou o recado de ambição.', efeitos: { imagem: 5, fama: 4, moral: 4 } },
      { rotulo: 'Dizer que prefere ser você mesmo', resultado: 'A resposta rodou como sinal de maturidade.', efeitos: { imagem: 6, tecnico: 3, qi: 1 } },
      { rotulo: 'Não comentar', resultado: 'Você deixou as torcidas brigarem.', efeitos: { fama: 2 } },
    ],
  },
  {
    id: 'n3_recorde', fase: 'nba', titulo: 'Perseguindo um recorde', cond: { mediaMin: 82, temporadaNbaMin: 3, famaMin: 60 }, unico: true,
    texto: 'Você começou a ser citado em reportagens sobre os maiores pontuadores da história. Todo jogo agora vem com um contador de marcos na TV.',
    escolhas: [
      { rotulo: 'Entrar na caça', resultado: 'Você forçou mais bolas e a plateia amou. O time se ressentiu um pouco.', efeitos: { fama: 6, arremesso: 1, vestiario: -4, desgaste: 4 } },
      { rotulo: 'Ignorar o contador', resultado: 'Você deixou o recorde vir naturalmente. A equipe agradeceu.', efeitos: { vestiario: 5, moral: 3 } },
    ],
  },
  {
    id: 'n3_camisa_lenda', fase: 'nba', titulo: 'Cerimônia de camisa aposentada', cond: { temporadaNbaMin: 1 },
    texto: 'O time fez uma cerimônia pra aposentar a camisa de uma lenda da casa. Você está na plateia, ao lado de pessoas que viram tudo.',
    escolhas: [
      { rotulo: 'Aproveitar e conversar com os ex-jogadores', resultado: 'Você ouviu histórias de 30 anos atrás e saiu de lá com a cabeça cheia.', efeitos: { qi: 1, vestiario: 3, moral: 4 } },
      { rotulo: 'Ir embora cedo', resultado: 'Você perdeu a festa, mas ganhou umas horas de sono.', efeitos: { desgaste: -3 } },
    ],
  },
  // ── G League ──
  {
    id: 'n3_gl_viagem', fase: 'nba', titulo: 'Ônibus da G League', cond: { nivel: ['gleague'] }, peso: 3,
    texto: 'Mais uma viagem de ônibus de seis horas pra jogar numa cidade que você nem sabia que existia. O ar-condicionado está quebrado.',
    escolhas: [
      { rotulo: 'Transformar em treino de vídeo', resultado: 'Você passou a viagem estudando jogadas no tablet.', efeitos: { qi: 2, desgaste: 3 } },
      { rotulo: 'Dormir', resultado: 'Você acordou torto, mas descansado.', efeitos: { desgaste: -4 } },
    ],
  },
  {
    id: 'n3_gl_chamada', fase: 'nba', titulo: 'Ligação do time principal', cond: { nivel: ['gleague'], mediaMin: 58 }, peso: 4,
    texto: 'O técnico do time principal te chama: tem lesionado no elenco e ele precisa de um jogador de energia por 10 dias.',
    escolhas: [
      { rotulo: 'Pegar o voo e entrar a mil', resultado: 'Você deu energia, defendeu duro e conquistou uns minutos extras.', efeitos: { minutosBonus: 4, tecnico: 8, moral: 8, fama: 3 } },
      { rotulo: 'Pedir pra terminar o jogo da G League antes', resultado: 'Você mostrou compromisso com o time local e atrasou um dia.', efeitos: { tecnico: 3, vestiario: 4 } },
    ],
  },
  {
    id: 'n3_gl_estrela', fase: 'nba', titulo: 'Estrela da G League', cond: { nivel: ['gleague'], mediaMin: 60 },
    texto: 'Você virou o melhor jogador da G League. Ainda assim, ninguém no time principal parece lembrar do seu nome.',
    escolhas: [
      { rotulo: 'Continuar mostrando serviço', resultado: 'A produção virou assunto em reportagens locais.', efeitos: { fama: 5, moral: 3, arremesso: 1 } },
      { rotulo: 'Pedir pra ser negociado', resultado: 'A diretoria ouviu, mas pediu paciência.', efeitos: { tecnico: -5, moral: 2 } },
    ],
  },
  // ── Humor ──
  {
    id: 'n3_invasor', fase: 'nba', titulo: 'Torcedor invadiu a quadra', cond: { temporadaNbaMin: 0 },
    texto: 'Um torcedor de camisa de time rival invade a quadra em pleno jogo e corre direto na sua direção. Os seguranças demoram.',
    escolhas: [
      { rotulo: 'Dar um abraço nele', resultado: 'O ginásio aplaudiu. O vídeo fez milhões de visualizações.', efeitos: { fama: 4, imagem: 5, moral: 3 } },
      { rotulo: 'Desviar e continuar', resultado: 'Você manteve a postura. A segurança resolveu.', efeitos: { qi: 1 } },
    ],
  },
  {
    id: 'n3_ar_condicionado', fase: 'nba', titulo: 'Ginásio sem ar-condicionado', cond: { temporadaNbaMin: 1 },
    texto: 'O ar-condicionado do ginásio quebrou no dia mais quente do ano. A arbitragem pergunta se vocês querem continuar o jogo.',
    escolhas: [
      { rotulo: 'Continuar jogando', resultado: 'Você suou como nunca e acabou o jogo rindo de tudo.', efeitos: { fisico: 1, desgaste: 6, vestiario: 4 } },
      { rotulo: 'Pedir pausa', resultado: 'O jogo foi adiado e você aproveitou pra descansar.', efeitos: { desgaste: -3 } },
    ],
  },
  {
    id: 'n3_apelido', fase: 'nba', titulo: 'Apelido do narrador', cond: { temporadaNbaMin: 1, famaMin: 20 },
    texto: 'O narrador da TV te deu um apelido ridículo. Os fãs adoraram e agora o apelido está em camisetas.',
    escolhas: [
      { rotulo: 'Abraçar o apelido', resultado: 'Você virou personagem. O estoque de camisetas esgotou em um dia.', efeitos: { fama: 4, imagem: 4, patrocinio: 0.1 } },
      { rotulo: 'Pedir pra pararem', resultado: 'O apelido pegou mais ainda.', efeitos: { moral: -1, fama: 2 } },
    ],
  },
  {
    id: 'n3_hotel', fase: 'nba', titulo: 'Quarto de hotel trocado', cond: { temporadaNbaMin: 0 },
    texto: 'O time te hospedou numa suíte com cama de três metros de altura. Você percebe que reservaram o quarto do dono por engano.',
    escolhas: [
      { rotulo: 'Avisar a recepção', resultado: 'Você trocou de quarto e ganhou um café da manhã grátis pelo gesto.', efeitos: { tecnico: 2, moral: 1 } },
      { rotulo: 'Ficar quieto', resultado: 'Você dormiu como um rei. O dono ficou numa suíte menor e fez cara de poucos amigos.', efeitos: { moral: 4, tecnico: -3 } },
    ],
  },
  {
    id: 'n3_aviao', fase: 'nba', titulo: 'Comida do avião', cond: { temporadaNbaMin: 0 },
    texto: 'O time serve uma refeição de avião que ninguém reconhece. Os veteranos juram que é frango, os novatos duvidam.',
    escolhas: [
      { rotulo: 'Comer tudo', resultado: 'Você sobreviveu, mas passou mal na hora do aquecimento.', efeitos: { desgaste: 3, vestiario: 2 } },
      { rotulo: 'Passar fome e pedir pizza depois', resultado: 'Pizza às 3 da manhã e o time inteiro te agradece.', efeitos: { dinheiro: -0.01, vestiario: 4 } },
    ],
  },
  {
    id: 'n3_bola_furada', fase: 'nba', titulo: 'Bola furada no meio do jogo', cond: { temporadaNbaMin: 0 },
    texto: 'A bola vazou na quarta quadra seguida e ninguém acha uma de reserva. A arbitragem manda o jogo continuar.',
    escolhas: [
      { rotulo: 'Reclamar com a arbitragem', resultado: 'O jogo parou por dois minutos e a internet fez piada.', efeitos: { fama: 2, tecnico: -2 } },
      { rotulo: 'Jogar com a bola murcha', resultado: 'Você driblou como quem batia uma bola de borracha. A torcida riu e aplaudiu.', efeitos: { imagem: 2, qi: 1 } },
    ],
  },
  {
    id: 'n3_camisa_errada', fase: 'nba', titulo: 'Camisa trocada', cond: { temporadaNbaMin: 0 },
    texto: 'Você entra em quadra com a camisa de outro jogador, de outro time. O elenco inteiro viu antes de você.',
    escolhas: [
      { rotulo: 'Rir e trocar', resultado: 'Virou o momento mais engraçado da semana.', efeitos: { vestiario: 5, imagem: 2 } },
      { rotulo: 'Jogar assim mesmo', resultado: 'A arbitragem não deixou. Você foi vestir a certa e perdeu um minuto.', efeitos: { tecnico: -2, moral: -1 } },
    ],
  },
  {
    id: 'n3_pelada', fase: 'nba', titulo: 'Pelada na rua', cond: { temporadaNbaMin: 0, famaMin: 20 },
    texto: 'Em plena folga, você passa por uma quadra de bairro e vê uma pelada sem um jogador. Ninguém te reconhece de capuz.',
    escolhas: [
      { rotulo: 'Entrar e jogar de verdade', resultado: 'Você deu show e o vídeo vazou com uma legenda: "esse cara joga muito".', efeitos: { fama: 4, imagem: 5, moral: 6, risco: 0.02 } },
      { rotulo: 'Só assistir', resultado: 'Você ficou de longe, curtindo o jogo dos outros.', efeitos: { moral: 2 } },
    ],
  },
  {
    id: 'n3_crianca', fase: 'nba', titulo: 'Criança pede sua camisa', cond: { temporadaNbaMin: 0, famaMin: 15 },
    texto: 'Depois do jogo, uma criança pede sua camisa suada com os olhos brilhando. Seu segurança diz que não dá.',
    escolhas: [
      { rotulo: 'Dar a camisa', resultado: 'O pai da criança chorou e a cena viralizou.', efeitos: { imagem: 7, fama: 3, moral: 5 } },
      { rotulo: 'Dar um autógrafo', resultado: 'A criança ficou feliz. A camisa ficou com você.', efeitos: { imagem: 3, moral: 2 } },
    ],
  },
  // ── Lesões e recuperação ──
  {
    id: 'n3_reabilitacao', fase: 'nba', titulo: 'Reabilitação dura', cond: { lesaoRecente: true }, peso: 4,
    texto: 'A reabilitação virou rotina: seis horas por dia de fisioterapia, bicicleta e exercícios chatos. O corpo reage devagar.',
    escolhas: [
      { rotulo: 'Cumprir tudo à risca', resultado: 'Você se recuperou com disciplina. Voltou com confiança.', efeitos: { desgaste: -12, moral: 2, fisico: 1 } },
      { rotulo: 'Acelerar o processo', resultado: 'Você voltou mais cedo, mas o corpo reclamou.', efeitos: { desgaste: -4, risco: 0.1, tecnico: 3 } },
    ],
  },
  {
    id: 'n3_medo_voltar', fase: 'nba', titulo: 'Medo de se machucar de novo', cond: { lesaoRecente: true, moralMax: 60 },
    texto: 'Você está liberado, mas toda vez que pula, a lembrança volta. O psicólogo diz que é normal, mas precisa de tempo.',
    escolhas: [
      { rotulo: 'Fazer terapia', resultado: 'Você trabalhou o medo e voltou com mais firmeza.', efeitos: { moral: 10, qi: 1, dinheiro: -0.01 } },
      { rotulo: 'Ignorar e treinar mais forte', resultado: 'Você escondeu a insegurança e jogou travado.', efeitos: { moral: -5, desgaste: 4 } },
    ],
  },
  // ── Contender / fim de carreira ──
  {
    id: 'n3_chamada_anel', fase: 'nba', titulo: 'Chamada de um favorito ao título', cond: { mediaMin: 72, temporadaNbaMin: 3, idadeMin: 27 }, unico: true,
    texto: 'Um time rival, candidato ao título, liga e diz que adoraria te ter no elenco. Falta saber se você quer sair ou ficar.',
    escolhas: [
      { rotulo: 'Ouvir a proposta', resultado: 'A conversa foi franca e ele deixou claro que o projeto é sério.', efeitos: { moral: 4, tecnico: -3, flag: 'ouviu_contender' } },
      { rotulo: 'Dizer que está bem onde está', resultado: 'Você manteve a lealdade e a diretoria ficou sabendo.', efeitos: { tecnico: 6, vestiario: 3, moral: -1 } },
    ],
  },
  {
    id: 'n3_ultima_dancada', fase: 'nba', titulo: 'A última temporada?', cond: { idadeMin: 35 }, unico: true, peso: 3,
    texto: 'O corpo já pesa e o joelho estala. O agente pergunta se essa será a última temporada, e a imprensa também quer saber.',
    escolhas: [
      { rotulo: 'Anunciar a despedida', resultado: 'A torcida de cada cidade te fez uma homenagem. Você chorou três vezes.', efeitos: { fama: 6, imagem: 6, moral: 10, desgaste: -4 } },
      { rotulo: 'Deixar em aberto', resultado: 'Você manteve a decisão em segredo e foi jogando como dava.', efeitos: { moral: 2 } },
    ],
  },
  {
    id: 'n3_convite_tecnico', fase: 'nba', titulo: 'Convite pra virar assistente', cond: { idadeMin: 34, temporadaNbaMin: 8 }, unico: true,
    texto: 'O técnico fala que você já pensa o jogo como um treinador e te convida a fazer parte da comissão quando parar.',
    escolhas: [
      { rotulo: 'Aceitar o futuro cargo', resultado: 'Você garantiu um plano pra depois da quadra.', efeitos: { tecnico: 8, moral: 5, qi: 1, flag: 'futuro_tecnico' } },
      { rotulo: 'Dizer que ainda quer jogar', resultado: 'Você respondeu com um sorriso e voltou pro treino.', efeitos: { moral: 3 } },
    ],
  },
  {
    id: 'n3_aposentadoria_rival', fase: 'nba', titulo: 'Rival se aposenta', cond: { idadeMin: 28, mediaMin: 74 },
    texto: 'Um jogador que dividiu a vida com você em quadra durante anos anuncia a aposentadoria. A imprensa te pergunta o que acha.',
    escolhas: [
      { rotulo: 'Fazer uma homenagem pública', resultado: 'Você escreveu uma carta bonita e o vídeo viralizou.', efeitos: { imagem: 6, fama: 3, moral: 4 } },
      { rotulo: 'Só desejar boa sorte', resultado: 'Educado, discreto, direto.', efeitos: { imagem: 2 } },
    ],
  },
  {
    id: 'n3_retorno_cidade', fase: 'nba', titulo: 'Volta à sua cidade natal', cond: { temporadaNbaMin: 2, famaMin: 30 },
    texto: 'O calendário te leva a jogar na sua cidade natal. A família inteira comprou ingresso e a vizinhança fez faixa.',
    escolhas: [
      { rotulo: 'Entrar em quadra com a camisa especial', resultado: 'Você encarou o jogo mais emocionante do ano.', efeitos: { moral: 10, fama: 4, imagem: 4 } },
      { rotulo: 'Manter o foco no jogo', resultado: 'Você jogou sério e saiu satisfeito. A emoção veio depois.', efeitos: { qi: 1, moral: 4 } },
    ],
  },
  {
    id: 'n3_novo_craque', fase: 'nba', titulo: 'Surge um novato badalado', cond: { temporadaNbaMin: 3, mediaMin: 68, idadeMin: 25 },
    texto: 'Um novato da sua posição virou o assunto da liga. Os comentaristas já falam que ele vai tomar seu lugar de destaque.',
    escolhas: [
      { rotulo: 'Provar que ainda manda na posição', resultado: 'Você tratou cada jogo contra ele como final e subiu seu jogo.', efeitos: { arremesso: 1, defesa: 1, moral: 3, desgaste: 4 } },
      { rotulo: 'Ajudar o garoto a se adaptar', resultado: 'Você virou mentor e ganhou admiração do vestiário.', efeitos: { vestiario: 8, imagem: 4, qi: 1 } },
    ],
  },
  {
    id: 'n3_lesao_rival', fase: 'nba', titulo: 'Rival se machuca de verdade', cond: { temporadaNbaMin: 1, mediaMin: 66 },
    texto: 'Depois de uma jogada dura, um adversário sai de maca. A arena inteira ficou em silêncio e você se sente mal.',
    escolhas: [
      { rotulo: 'Ligar pra ele no hospital', resultado: 'O gesto foi lembrado por semanas e fez a liga te ver diferente.', efeitos: { imagem: 7, moral: 3, vestiario: 2 } },
      { rotulo: 'Mandar uma mensagem nas redes', resultado: 'Rápido, simples e simpático.', efeitos: { imagem: 3 } },
    ],
  },
]
