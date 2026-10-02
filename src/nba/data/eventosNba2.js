// Eventos da NBA — bloco 2: dinheiro, patrocínio, mídia, contrato, família e vida pessoal.
export const EVENTOS_NBA_2 = [
  {
    id: 'n2_tenis', fase: 'nba', titulo: 'Contrato de tênis', cond: { famaMin: 30, temporadaNbaMin: 1 }, unico: true, peso: 3,
    texto: 'Três marcas de calçado disputam seu nome pro próximo ciclo. Cada uma tem uma proposta diferente.',
    escolhas: [
      { rotulo: 'A marca gigante', resultado: 'Dinheiro grosso, contrato longo e um tênis assinado nas prateleiras.', efeitos: { patrocinio: 2.5, imagem: 5, fama: 4 } },
      { rotulo: 'A marca pequena com royalties', resultado: 'Menos dinheiro agora, mas você ganha uma fatia de cada par vendido.', efeitos: { patrocinio: 1.0, dinheiro: 0.2, imagem: 2, flag: 'royalties_tenis' } },
      { rotulo: 'Lançar a sua própria marca', resultado: '', efeitos: {}, alea: { p: 0.35, sucesso: { resultado: 'A marca decolou, virou febre e te rendeu uma fortuna.', efeitos: { patrocinio: 4, dinheiro: 3, fama: 8, imagem: 6 } }, falha: { resultado: 'O estoque encalhou. Você perdeu uma boa grana e muita paciência.', efeitos: { dinheiro: -1.5, imagem: -3 } } } },
    ],
  },
  {
    id: 'n2_comercial', fase: 'nba', titulo: 'Proposta de comercial', cond: { famaMin: 25 }, peso: 2,
    texto: 'Uma rede de fast food quer você de rosto da campanha de verão. O roteiro é bobo, o cachê é bom.',
    escolhas: [
      { rotulo: 'Aceitar e fazer a dancinha', resultado: 'A dancinha viralizou, e você virou piada interna do vestiário.', efeitos: { dinheiro: 0.5, fama: 4, imagem: 2, vestiario: 2 } },
      { rotulo: 'Recusar por imagem', resultado: 'Seu agente chorou, mas seu orgulho ficou intacto.', efeitos: { imagem: 2 } },
    ],
  },
  {
    id: 'n2_restaurante', fase: 'nba', titulo: 'Sociedade num restaurante', cond: { patrimonioMin: 3 }, unico: true,
    texto: 'Um amigo de infância quer abrir um restaurante e pede que você entre como sócio. Ele jura que é negócio certo.',
    escolhas: [
      { rotulo: 'Investir', resultado: '', efeitos: {}, alea: { p: 0.45, sucesso: { resultado: 'O restaurante lotou e virou ponto turístico. Você recebe uma boa fatia todo mês.', efeitos: { patrocinio: 0.8, dinheiro: 0.5, imagem: 2 } }, falha: { resultado: 'Fechou em oito meses. O amigo sumiu e você ficou com a conta.', efeitos: { dinheiro: -1.2, moral: -4 } } } },
      { rotulo: 'Recusar educadamente', resultado: 'O amigo ficou chateado por um tempo, depois entendeu.', efeitos: { moral: -2 } },
    ],
  },
  {
    id: 'n2_cripto', fase: 'nba', titulo: 'A moeda da vez', cond: { patrimonioMin: 2 }, unico: true,
    texto: 'Um colega de elenco jura que uma criptomoeda desconhecida vai dar 20x. Ele já colocou metade do salário.',
    escolhas: [
      { rotulo: 'Entrar com uma boa quantia', resultado: '', efeitos: {}, alea: { p: 0.3, sucesso: { resultado: 'Você saiu na alta e dobrou o investimento.', efeitos: { dinheiro: 2.5 } }, falha: { resultado: 'A moeda virou pó. Você chorou no caminho da academia.', efeitos: { dinheiro: -1.0, moral: -5 } } } },
      { rotulo: 'Passar longe', resultado: 'Você ficou na renda fixa e na paz.', efeitos: { moral: 1 } },
    ],
  },
  {
    id: 'n2_supercarro', fase: 'nba', titulo: 'Concessionária de luxo', cond: { patrimonioMin: 4 }, peso: 2,
    texto: 'O vendedor te liga pessoalmente e diz que um carro esportivo com seu nome chegou da fábrica.',
    escolhas: [
      { rotulo: 'Comprar', resultado: 'Você deu uma volta no quarteirão e a foto vazou. A moral subiu junto.', efeitos: { dinheiro: -0.6, moral: 6, imagem: -2, fama: 2 } },
      { rotulo: 'Resistir', resultado: 'Você manteve o carro do ano passado. A conta agradece.', efeitos: { imagem: 2 } },
    ],
  },
  {
    id: 'n2_mansao', fase: 'nba', titulo: 'A casa dos sonhos', cond: { patrimonioMin: 8 }, unico: true,
    texto: 'O corretor encontrou uma mansão com quadra interna, cinema e uma cozinha maior que sua casa de infância.',
    escolhas: [
      { rotulo: 'Fechar negócio', resultado: 'Você se mudou com a família. O segurança já sabe seu nome.', efeitos: { dinheiro: -2, moral: 10, gasto: 0.15, flag: 'mansao' } },
      { rotulo: 'Continuar alugando', resultado: 'Você manteve a casa simples e a cabeça no lugar.', efeitos: { moral: 2 } },
    ],
  },
  {
    id: 'n2_parentes', fase: 'nba', titulo: 'Parentes pedindo ajuda', cond: { patrimonioMin: 1.5, temporadaNbaMin: 1 }, peso: 1.5,
    texto: 'Parentes que você não vê há dez anos aparecem com planos de negócio, problemas de saúde e uma história muito triste.',
    escolhas: [
      { rotulo: 'Ajudar generosamente', resultado: 'A família se aproximou e o dinheiro sumiu mais rápido que o esperado.', efeitos: { dinheiro: -0.5, moral: 6 } },
      { rotulo: 'Ajudar só os mais próximos', resultado: 'Você escolheu com cuidado e não magoou ninguém de verdade.', efeitos: { dinheiro: -0.15, moral: 2 } },
      { rotulo: 'Recusar tudo', resultado: 'Os parentes fizeram posts indiretos por semanas.', efeitos: { moral: -5, imagem: -2 } },
    ],
  },
  {
    id: 'n2_fundacao', fase: 'nba', titulo: 'Criar uma fundação', cond: { famaMin: 40, patrimonioMin: 3 }, unico: true,
    texto: 'Você pode abrir uma fundação pra ajudar jovens da sua cidade natal. Dá trabalho e custa dinheiro, mas muda vidas.',
    escolhas: [
      { rotulo: 'Abrir com orçamento alto', resultado: 'Três quadras novas, bolsas de estudo e um carinho enorme da cidade.', efeitos: { dinheiro: -1.0, imagem: 10, moral: 8, fama: 4, flag: 'fundacao' } },
      { rotulo: 'Fazer um projeto pequeno', resultado: 'O projeto funcionou em escala menor e te deu orgulho.', efeitos: { dinheiro: -0.2, imagem: 4, moral: 4, flag: 'fundacao' } },
      { rotulo: 'Adiar', resultado: 'Você prometeu pensar no assunto.', efeitos: {} },
    ],
  },
  {
    id: 'n2_extensao', fase: 'nba', titulo: 'Extensão antecipada', cond: { contratoAnosMax: 1, temporadaNbaMin: 1, mediaMin: 64 }, peso: 3,
    texto: 'A diretoria te chama pra assinar uma extensão antes do fim do contrato: menos dinheiro por ano, mais segurança.',
    escolhas: [
      { rotulo: 'Assinar a extensão', resultado: 'Você garantiu o futuro e deixou um pouco de dinheiro na mesa.', efeitos: { salarioPct: -8, tecnico: 6, moral: 6, flag: 'extensao_assinada' } },
      { rotulo: 'Esperar a agência livre', resultado: 'Você apostou em si mesmo. O mercado vai decidir.', efeitos: { tecnico: -4, moral: 1 } },
    ],
  },
  {
    id: 'n2_pedido_troca', fase: 'nba', titulo: 'Pedir pra sair', cond: { temporadaNbaMin: 2, moralMax: 45 },
    texto: 'Você está infeliz no time. O agente sugere pedir uma troca pública. Isso pode ser bom ou muito feio.',
    escolhas: [
      { rotulo: 'Fazer o pedido público', resultado: '', efeitos: {}, alea: { p: 0.5, sucesso: { resultado: 'A franquia cedeu e te trocou pra um time melhor.', efeitos: { moral: 12, fama: 3, flag: 'pediu_troca', salarioPct: 5 } }, falha: { resultado: 'O pedido vazou de mau jeito. A torcida virou contra você.', efeitos: { moral: -8, imagem: -8, tecnico: -10 } } } },
      { rotulo: 'Engolir', resultado: 'Você segurou a barra, mas o humor pesou.', efeitos: { moral: -3, tecnico: 3 } },
    ],
  },
  {
    id: 'n2_rumor_troca', fase: 'nba', titulo: 'Rumor de troca', cond: { temporadaNbaMin: 1 },
    texto: 'Um jornalista postou que você está sendo oferecido por vários times. Ninguém te avisou.',
    escolhas: [
      { rotulo: 'Confrontar a diretoria', resultado: 'A conversa foi tensa, mas te deixou mais seguro.', efeitos: { tecnico: -3, moral: 3 } },
      { rotulo: 'Ignorar e treinar', resultado: 'O rumor morreu sozinho, ao menos por enquanto.', efeitos: { moral: -2, qi: 1 } },
    ],
  },
  {
    id: 'n2_documentario', fase: 'nba', titulo: 'Série documental', cond: { famaMin: 55 }, unico: true,
    texto: 'Uma plataforma de streaming quer fazer uma série sobre sua vida. Eles querem acesso total, inclusive aos bastidores do vestiário.',
    escolhas: [
      { rotulo: 'Liberar tudo', resultado: 'Sucesso global. Você apareceu de pijama e chorando, e todo mundo gostou.', efeitos: { fama: 10, imagem: 6, dinheiro: 1.0, vestiario: -3 } },
      { rotulo: 'Liberar só a vida pessoal', resultado: 'Ficou charmosa e segura. O vestiário agradeceu.', efeitos: { fama: 5, imagem: 3, dinheiro: 0.5 } },
      { rotulo: 'Recusar', resultado: 'Você preservou sua privacidade.', efeitos: { moral: 2 } },
    ],
  },
  {
    id: 'n2_entrevista', fase: 'nba', titulo: 'Entrevista polêmica', cond: { famaMin: 30 },
    texto: 'Depois de uma derrota, o repórter faz uma pergunta pegadinha sobre o técnico. Todo o vestiário escuta de longe.',
    escolhas: [
      { rotulo: 'Defender o técnico', resultado: 'A frase virou manchete positiva.', efeitos: { tecnico: 8, imagem: 3 } },
      { rotulo: 'Dizer que o time precisa melhorar', resultado: 'Verdade dita, orelha puxada em seguida.', efeitos: { imagem: -3, tecnico: -6, vestiario: -2 } },
      { rotulo: 'Fingir que não ouviu', resultado: 'Você saiu pela porta lateral. Virou gíria no vestiário.', efeitos: { vestiario: 3 } },
    ],
  },
  {
    id: 'n2_rede_social', fase: 'nba', titulo: 'A thread infeliz', cond: { famaMin: 25 },
    texto: 'Você escreveu um desabafo às 2 da manhã. Na manhã seguinte, o tuíte tem 400 mil curtidas e três processos prováveis.',
    escolhas: [
      { rotulo: 'Apagar e pedir desculpas', resultado: 'A internet esqueceu em dois dias, e você aprendeu a lição.', efeitos: { imagem: -2, moral: 2 } },
      { rotulo: 'Manter e dobrar a aposta', resultado: 'A polêmica cresceu. Os patrocinadores tiraram o time de campo.', efeitos: { fama: 5, imagem: -8, patrocinio: -0.3 } },
    ],
  },
  {
    id: 'n2_podcast', fase: 'nba', titulo: 'Lançar um podcast', cond: { famaMin: 40, idadeMin: 24 }, unico: true,
    texto: 'Um amigo e você têm papo de sobra, e um estúdio quer produzir o programa. Você ia falar de basquete, mas pode escorregar.',
    escolhas: [
      { rotulo: 'Topar o desafio', resultado: 'O podcast virou hit. Você é o assunto da semana quase toda semana.', efeitos: { fama: 6, imagem: 4, patrocinio: 0.3, tecnico: -2 } },
      { rotulo: 'Recusar', resultado: 'Você manteve o foco na quadra.', efeitos: { qi: 1 } },
    ],
  },
  {
    id: 'n2_boato', fase: 'nba', titulo: 'Boato de tabloide', cond: { famaMin: 35 },
    texto: 'Um site de fofoca afirma que você e um colega estão brigados. Você nem sabia, mas o colega agora te evita no corredor.',
    escolhas: [
      { rotulo: 'Conversar com o colega', resultado: 'A conversa limpou o ar e o boato morreu.', efeitos: { vestiario: 5, moral: 2 } },
      { rotulo: 'Ignorar o boato', resultado: 'O boato cresceu por uma semana e secou.', efeitos: { vestiario: -4, imagem: -1 } },
    ],
  },
  {
    id: 'n2_imposto', fase: 'nba', titulo: 'Problema com a Receita', cond: { patrimonioMin: 6 }, unico: true,
    texto: 'Seu contador deixou passar uma declaração e a Receita notificou você. A multa é pesada.',
    escolhas: [
      { rotulo: 'Pagar e trocar de contador', resultado: 'Dói no bolso, mas fica resolvido de vez.', efeitos: { dinheiro: -0.8, moral: -2 } },
      { rotulo: 'Brigar na Justiça', resultado: 'Foram meses de papelada. No final, você pagou menos, mas perdeu paciência.', efeitos: { dinheiro: -0.4, moral: -4, imagem: -2 } },
    ],
  },
  {
    id: 'n2_leilao', fase: 'nba', titulo: 'Leilão de memorabilia', cond: { famaMin: 45, titulosMin: 0 },
    texto: 'Um colecionador oferece uma pequena fortuna pela camisa do seu melhor jogo. Parte vai pra caridade, parte vai pro bolso.',
    escolhas: [
      { rotulo: 'Vender metade pro bolso', resultado: 'A camisa foi pro mural de um colecionador no outro continente.', efeitos: { dinheiro: 0.4, imagem: 1 } },
      { rotulo: 'Doar tudo pra caridade', resultado: 'O gesto circulou nas redes e rendeu elogios.', efeitos: { imagem: 6, fama: 2, moral: 3 } },
    ],
  },
  {
    id: 'n2_filme', fase: 'nba', titulo: 'Participação num filme', cond: { famaMin: 55 }, unico: true,
    texto: 'Um estúdio quer você numa comédia de ação. O papel é de si mesmo, jogando num torneio de rua contra um vilão de araque.',
    escolhas: [
      { rotulo: 'Aceitar', resultado: 'Você apareceu por quatro minutos, ganhou um cachê e virou meme.', efeitos: { dinheiro: 0.8, fama: 6, imagem: 3, tecnico: -2 } },
      { rotulo: 'Recusar', resultado: 'Você manteve o foco no basquete.', efeitos: { qi: 1 } },
    ],
  },
  {
    id: 'n2_marca_roupa', fase: 'nba', titulo: 'Sua própria marca de roupa', cond: { famaMin: 50, patrimonioMin: 3 }, unico: true,
    texto: 'Uma estilista quer lançar uma linha de moda inspirada no seu estilo. Você banca a produção inicial.',
    escolhas: [
      { rotulo: 'Bancar o projeto', resultado: '', efeitos: {}, alea: { p: 0.45, sucesso: { resultado: 'A coleção esgotou em horas.', efeitos: { patrocinio: 1.2, imagem: 5, dinheiro: 0.5 } }, falha: { resultado: 'O estoque ficou parado e você chorou nas contas.', efeitos: { dinheiro: -0.8, imagem: -2 } } } },
      { rotulo: 'Fazer só uma colaboração', resultado: 'Uma coleção pequena, com risco baixo e lucro pequeno.', efeitos: { patrocinio: 0.3, imagem: 2 } },
    ],
  },
  {
    id: 'n2_atraso', fase: 'nba', titulo: 'Atrasado pro treino', cond: { temporadaNbaMin: 1 },
    texto: 'Um engarrafamento absurdo te fez chegar vinte minutos atrasado ao treino. O técnico quer exemplo.',
    escolhas: [
      { rotulo: 'Assumir e pagar a multa', resultado: 'Você pagou o valor e o grupo agradeceu a honestidade.', efeitos: { dinheiro: -0.02, tecnico: 3, vestiario: 3 } },
      { rotulo: 'Dar a desculpa do trânsito', resultado: 'O técnico fingiu acreditar, mas anotou o nome.', efeitos: { tecnico: -5 } },
    ],
  },
  {
    id: 'n2_capa_revista', fase: 'nba', titulo: 'Capa de revista', cond: { famaMin: 50 },
    texto: 'Uma revista de moda quer te fotografar para a capa. A sessão exige produção e um look que não é bem o seu.',
    escolhas: [
      { rotulo: 'Fazer a sessão completa', resultado: 'Você apareceu em tudo, em estilo e em pose. Foi tudo muito bonito.', efeitos: { fama: 5, imagem: 5, patrocinio: 0.2, desgaste: 2 } },
      { rotulo: 'Negociar um estilo mais casual', resultado: 'A capa ficou charmosa e você ainda dormiu cedo.', efeitos: { fama: 3, imagem: 3 } },
    ],
  },
  {
    id: 'n2_quadra_cidade', fase: 'nba', titulo: 'Quadra na sua cidade natal', cond: { famaMin: 35, patrimonioMin: 1 }, unico: true,
    texto: 'Sua cidade de origem quer batizar uma quadra com seu nome se você pagar parte da reforma.',
    escolhas: [
      { rotulo: 'Pagar a reforma toda', resultado: 'Inauguração cheia de criança e discurso do prefeito. Você chorou.', efeitos: { dinheiro: -0.4, moral: 10, imagem: 7 } },
      { rotulo: 'Pagar metade', resultado: 'A quadra ficou mais simples, mas ficou boa.', efeitos: { dinheiro: -0.2, moral: 5, imagem: 3 } },
    ],
  },
  {
    id: 'n2_conselheiro', fase: 'nba', titulo: 'Conselheiro financeiro', cond: { patrimonioMin: 3 }, unico: true,
    texto: 'Um consultor de investimentos oferece cuidar do seu patrimônio e garantir uma aposentadoria tranquila.',
    escolhas: [
      { rotulo: 'Contratar', resultado: 'Ele montou uma carteira bem diversificada. Você dorme melhor.', efeitos: { patrocinio: 0.4, moral: 4, gasto: 0.03 } },
      { rotulo: 'Fazer sozinho', resultado: 'Você deu uma de investidor, com resultados bem irregulares.', efeitos: { dinheiro: -0.1, moral: 1 } },
    ],
  },
  {
    id: 'n2_festa', fase: 'nba', titulo: 'Festa que vazou', cond: { famaMin: 35, temporadaNbaMin: 1 },
    texto: 'Uma festa na sua casa vazou em vídeos curtos. Tem gente pulando, dança, e seu técnico aparece no fundo comendo coxinha.',
    escolhas: [
      { rotulo: 'Pedir desculpas ao clube', resultado: 'A diretoria passou a mão na sua cabeça, desta vez.', efeitos: { tecnico: 2, imagem: -2 } },
      { rotulo: 'Rir da situação', resultado: 'Você virou assunto positivo, mas a diretoria revirou os olhos.', efeitos: { fama: 3, imagem: 2, tecnico: -4 } },
    ],
  },
  {
    id: 'n2_jantar_dono', fase: 'nba', titulo: 'Jantar com o dono da franquia', cond: { temporadaNbaMin: 1, mediaMin: 68 },
    texto: 'O dono do time te convida pra um jantar reservado. Ele não diz o motivo, só pede que você venha de terno.',
    escolhas: [
      { rotulo: 'Ir e ouvir', resultado: 'Ele queria só ouvir seus planos e oferecer o que o time pode fazer por você.', efeitos: { tecnico: 5, moral: 4, flag: 'jantar_dono' } },
      { rotulo: 'Pedir um aumento no jantar', resultado: 'Ele riu, anotou o recado e pediu a sobremesa.', efeitos: { salarioPct: 4, tecnico: -4 } },
    ],
  },
  {
    id: 'n2_titulo_festa', fase: 'nba', titulo: 'Desfile do título', cond: { campeaoRecente: true }, peso: 6,
    texto: 'A cidade inteira está nas ruas pra comemorar o título. Você é convidado pra subir no caminhão de bombeiros, com o troféu na mão.',
    escolhas: [
      { rotulo: 'Curtir cada segundo', resultado: 'Foi o dia mais lindo da carreira. Você chorou na frente de um milhão de pessoas.', efeitos: { fama: 5, moral: 12, imagem: 5, desgaste: 3 } },
      { rotulo: 'Dar a vez pro time', resultado: 'Você puxou os companheiros pro microfone e virou o capitão do povo.', efeitos: { vestiario: 10, moral: 8, imagem: 4 } },
    ],
  },
  {
    id: 'n2_mvp_festa', fase: 'nba', titulo: 'A noite do MVP', cond: { mvpRecente: true }, peso: 5,
    texto: 'Você recebeu o troféu de MVP num ginásio cheio. Chega a hora do discurso de agradecimento, e sua mãe está na primeira fila.',
    escolhas: [
      { rotulo: 'Agradecer à família', resultado: 'Sua mãe não parou de chorar e você também.', efeitos: { moral: 10, imagem: 6, fama: 4 } },
      { rotulo: 'Agradecer ao time', resultado: 'O vestiário aplaudiu de pé e o técnico se emocionou.', efeitos: { vestiario: 8, tecnico: 6, moral: 6 } },
    ],
  },
  {
    id: 'n2_sem_playoffs', fase: 'nba', titulo: 'Verão amargo', cond: { semPlayoffsRecente: true }, peso: 3,
    texto: 'A temporada acabou cedo, sem playoffs. A torcida cobra e a diretoria promete mudanças que ninguém sabe quais são.',
    escolhas: [
      { rotulo: 'Ir pra academia na semana seguinte', resultado: 'Você descontou a frustração no ferro e voltou melhor.', efeitos: { fisico: 2, moral: -2, desgaste: -4 } },
      { rotulo: 'Viajar e desligar', resultado: 'Você passou duas semanas numa praia sem sinal. A cabeça agradeceu.', efeitos: { moral: 8, desgaste: -8, dinheiro: -0.05 } },
    ],
  },
  {
    id: 'n2_jogo_cover', fase: 'nba', titulo: 'Capa do videogame', cond: { famaMin: 70, mediaMin: 82 }, unico: true,
    texto: 'A produtora do jogo de basquete mais famoso do mundo quer você na capa da edição do ano.',
    escolhas: [
      { rotulo: 'Aceitar com festa', resultado: 'Seu rosto está em todas as lojas e em todas as telas de abertura.', efeitos: { fama: 8, imagem: 6, patrocinio: 1.0, dinheiro: 0.8 } },
      { rotulo: 'Pedir que seja capa regional', resultado: 'Boa exposição, sem o peso global.', efeitos: { fama: 4, imagem: 3, patrocinio: 0.4 } },
    ],
  },
  {
    id: 'n2_selecao_verao', fase: 'nba', titulo: 'Seleção nacional no verão', cond: { mediaMin: 72, temporadaNbaMin: 2 },
    texto: 'Sua seleção te chama pro torneio internacional do verão. O clube prefere que você descanse.',
    escolhas: [
      { rotulo: 'Ir representar o país', resultado: 'Você jogou um torneio épico com a camisa da pátria. Voltou cansado e orgulhoso.', efeitos: { fama: 8, qi: 1, moral: 8, desgaste: 10, tecnico: -4 } },
      { rotulo: 'Descansar com o clube', resultado: 'Os fãs do país reclamaram, mas o clube sorriu.', efeitos: { tecnico: 6, desgaste: -6, fama: -2 } },
    ],
  },
  {
    id: 'n2_reality', fase: 'nba', titulo: 'Reality show', cond: { famaMin: 50 },
    texto: 'Um canal quer te levar pra um programa de variedades onde celebridades cozinham, dançam e brigam por feijoada.',
    escolhas: [
      { rotulo: 'Entrar no programa', resultado: 'Seu feijão queimou, sua dança foi péssima e o público te amou.', efeitos: { fama: 7, imagem: 3, dinheiro: 0.3, tecnico: -2 } },
      { rotulo: 'Recusar', resultado: 'Você ficou em casa assistindo o outro tentar fazer um risoto.', efeitos: { moral: 1 } },
    ],
  },
  {
    id: 'n2_agente_bomba', fase: 'nba', titulo: 'Seu agente aprontou', cond: { temporadaNbaMin: 2, patrimonioMin: 2 }, unico: true,
    texto: 'Você descobre que seu agente vem embolsando comissões acima do combinado. A prova está num e-mail esquecido.',
    escolhas: [
      { rotulo: 'Confrontar e demitir', resultado: 'Ele devolveu parte do valor e saiu falando mal de você nos corredores.', efeitos: { dinheiro: 0.3, imagem: -2, moral: 3 } },
      { rotulo: 'Renegociar o contrato', resultado: 'Ele pediu desculpas e baixou a comissão. A relação nunca foi a mesma.', efeitos: { dinheiro: 0.1, tecnico: 1, moral: -1 } },
    ],
  },
  {
    id: 'n2_bonus', fase: 'nba', titulo: 'Bônus por desempenho', cond: { temporadaNbaMin: 1, mediaMin: 66 },
    texto: 'Uma cláusula do contrato foi atingida e você recebe um bônus. A pergunta é o que fazer com ele.',
    escolhas: [
      { rotulo: 'Guardar tudo', resultado: 'Você pôs o dinheiro na poupança e dormiu em paz.', efeitos: { dinheiro: 0.8 } },
      { rotulo: 'Dar uma festa pro time', resultado: 'Churrasco no sábado, ressaca no domingo. O vestiário te chama de patrão.', efeitos: { dinheiro: 0.4, vestiario: 8, moral: 4 } },
    ],
  },
  {
    id: 'n2_patrocinador_sai', fase: 'nba', titulo: 'Patrocinador rescindiu', cond: { famaMin: 30, moralMax: 60 },
    texto: 'Uma empresa que te patrocinava mudou de estratégia e cancelou o contrato. Seu agente propõe duas saídas.',
    escolhas: [
      { rotulo: 'Fechar com uma marca menor', resultado: 'Menos dinheiro, mas um parceiro mais comprometido.', efeitos: { patrocinio: -0.4, imagem: 2 } },
      { rotulo: 'Esperar propostas melhores', resultado: 'Você ficou um tempo sem patrocínio, mas sem se vender barato.', efeitos: { patrocinio: -0.8, moral: -2 } },
    ],
  },
  {
    id: 'n2_convite_dunk', fase: 'nba', titulo: 'Concurso de enterradas', cond: { posicao: ['ala', 'ala_armador', 'armador', 'ala_pivo'], temporadaNbaMin: 0, temporadaNbaMax: 6, famaMin: 15, mediaMin: 58 },
    texto: 'Convidaram você pro concurso de enterradas do fim de semana das estrelas. Dá pra chocar o mundo ou virar meme ruim.',
    escolhas: [
      { rotulo: 'Entrar e arriscar uma enterrada impossível', resultado: '', efeitos: {}, alea: { p: 0.5, sucesso: { resultado: 'Você pulou por cima de um carro e voou. A internet inteira parou.', efeitos: { fama: 12, imagem: 6, moral: 8, desgaste: 3 } }, falha: { resultado: 'Você bateu no aro e caiu de bunda. Virou figurinha.', efeitos: { fama: 4, moral: -6, desgaste: 5 } } } },
      { rotulo: 'Recusar', resultado: 'Você preservou as pernas e a pose.', efeitos: { desgaste: -2 } },
    ],
  },
  {
    id: 'n2_ostentacao', fase: 'nba', titulo: 'Ostentação nas redes', cond: { famaMin: 40, patrimonioMin: 3 },
    texto: 'Você postou uma foto de um relógio de dois milhões de reais. A internet explodiu em amor e ódio.',
    escolhas: [
      { rotulo: 'Apagar a foto', resultado: 'Você apagou, mas o print já estava rodando.', efeitos: { imagem: -1 } },
      { rotulo: 'Dobrar a aposta', resultado: 'Você ganhou haters e fãs na mesma proporção.', efeitos: { fama: 4, imagem: -5, patrocinio: 0.1 } },
    ],
  },
  {
    id: 'n2_aposentado_visita', fase: 'nba', titulo: 'Lenda aposentada passa no treino', cond: { temporadaNbaMin: 2, mediaMin: 68 },
    texto: 'Uma lenda do time, aposentada há anos, aparece no ginásio e pede pra bater uma bola com você.',
    escolhas: [
      { rotulo: 'Pedir conselhos', resultado: 'Ele deu dicas de posicionamento e te chamou de "garoto".', efeitos: { qi: 2, moral: 4, vestiario: 2 } },
      { rotulo: 'Desafiar pra um 1x1', resultado: 'Você tomou uma aula de fundamentos. Ele ainda sabia tudo.', efeitos: { qi: 1, defesa: 1, moral: 2, fama: 1 } },
    ],
  },
]
