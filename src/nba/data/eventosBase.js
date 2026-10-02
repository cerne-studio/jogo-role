// Eventos da fase de base (faculdade ou clube no exterior), antes de chegar na NBA.
export const EVENTOS_BASE = [
  {
    id: 'base_nil', fase: 'base', titulo: 'Proposta de patrocínio', cond: { nivel: ['college'], famaMin: 12 }, unico: true,
    texto: 'Uma concessionária de carros da cidade quer você de rosto da campanha. Pagam bem pra um calouro, mas o técnico torce o nariz pra distração.',
    escolhas: [
      { rotulo: 'Aceitar a grana', resultado: 'Você apareceu em outdoor e no ônibus. O dinheiro entrou e o vestiário implicou por semanas.', efeitos: { dinheiro: 0.15, fama: 4, vestiario: -4 } },
      { rotulo: 'Recusar e focar no jogo', resultado: 'O técnico guardou o gesto na memória. A conta bancária continuou na lona.', efeitos: { tecnico: 8, moral: 2 } },
    ],
  },
  {
    id: 'base_olheiro', fase: 'base', titulo: 'Olheiro da NBA na arquibancada', cond: { mediaMin: 54 },
    texto: 'Você fica sabendo que um dirigente da NBA está de camarote no jogo de hoje. A pressão bate forte antes mesmo do aquecimento.',
    escolhas: [
      { rotulo: 'Jogar pra mostrar tudo', resultado: 'Você forçou cada arremesso.', efeitos: {}, alea: { p: 0.5, sucesso: { resultado: 'Noite de gala. Os scouts rabiscaram seu nome com estrela.', efeitos: { fama: 9, moral: 6 } }, falha: { resultado: 'Noite de 4 em 17. O dirigente foi embora antes do terceiro quarto.', efeitos: { fama: -3, moral: -7 } } } },
      { rotulo: 'Jogar o seu jogo', resultado: 'Você ignorou a plateia e produziu o de sempre. Sem espetáculo, sem tragédia.', efeitos: { qi: 1, fama: 2, moral: 2 } },
    ],
  },
  {
    id: 'base_notas', fase: 'base', titulo: 'Nota vermelha', cond: { nivel: ['college'], idadeMax: 21 },
    texto: 'O professor de estatística avisa que você pode ficar fora dos jogos se não passar na prova. Coincidentemente é na véspera de um clássico.',
    escolhas: [
      { rotulo: 'Virar a noite estudando', resultado: 'Você passou raspando. Entrou em quadra com olheiras de coruja.', efeitos: { qi: 1, desgaste: 6, tecnico: 4 } },
      { rotulo: 'Pedir pra um colega ajudar', resultado: 'Deu certo, mas o colega agora te cobra o favor toda semana.', efeitos: { moral: 3, vestiario: -3 } },
      { rotulo: 'Ignorar e treinar', resultado: 'O técnico precisou te segurar no banco por um jogo. A nota continuou vermelha.', efeitos: { tecnico: -9, moral: -4, arremesso: 1 } },
    ],
  },
  {
    id: 'base_trote', fase: 'base', titulo: 'Trote dos veteranos', cond: { idadeMax: 19 }, unico: true,
    texto: 'Os veteranos mandam o calouro carregar as malas e cantar o hino do time no ônibus, na frente de todo mundo.',
    escolhas: [
      { rotulo: 'Cantar com vontade', resultado: 'Você desafinou feio. Virou apelido, e o grupo te adotou de vez.', efeitos: { vestiario: 10, fama: 1, moral: 3 } },
      { rotulo: 'Fingir que não ouviu', resultado: 'Silêncio constrangedor por 40 quilômetros.', efeitos: { vestiario: -6, moral: -2 } },
    ],
  },
  {
    id: 'base_agentes', fase: 'base', titulo: 'Os agentes começam a ligar', cond: { famaMin: 15, mediaMin: 56 }, unico: true,
    texto: 'Três agências querem te representar. Uma é grande, outra tem fama de dar atenção e a terceira é de um primo da sua mãe.',
    escolhas: [
      { rotulo: 'A agência gigante', resultado: 'Portas abertas, mas você é um entre cinquenta clientes.', efeitos: { fama: 5, imagem: 3, flag: 'agente_grande' } },
      { rotulo: 'A agência atenciosa', resultado: 'Telefone na hora, jantar com a família e um plano feito sob medida.', efeitos: { moral: 5, tecnico: 3, flag: 'agente_atencioso' } },
      { rotulo: 'O primo da sua mãe', resultado: 'Muita fé, pouca estrutura. A família ficou orgulhosa.', efeitos: { moral: 6, fama: -2, flag: 'agente_familia' } },
    ],
  },
  {
    id: 'base_saudade', fase: 'base', titulo: 'Saudade de casa', cond: { nivel: ['pro_exterior'], idadeMax: 21 }, unico: true,
    texto: 'Faz três meses que você não vê a família. A comida do refeitório do clube tem gosto de pacote e o inverno chegou cedo.',
    escolhas: [
      { rotulo: 'Pagar passagem pra família visitar', resultado: 'A casa ficou cheia de gente por duas semanas. Você voltou renovado.', efeitos: { dinheiro: -0.02, moral: 12, fisico: 1 } },
      { rotulo: 'Se enfiar no ginásio', resultado: 'Muito treino, pouca conversa. O arremesso melhorou, o humor não.', efeitos: { arremesso: 2, moral: -4, desgaste: 5 } },
    ],
  },
  {
    id: 'base_idioma', fase: 'base', titulo: 'Idioma novo', cond: { nivel: ['pro_exterior'] }, unico: true,
    texto: 'O técnico só grita instruções no idioma local. Você entende uma palavra a cada cinco.',
    escolhas: [
      { rotulo: 'Contratar um professor', resultado: 'Em dois meses você já discutia com o árbitro na língua dele.', efeitos: { qi: 2, tecnico: 6, dinheiro: -0.01 } },
      { rotulo: 'Aprender no tapa com os companheiros', resultado: 'Você aprendeu mais palavrão do que gramática.', efeitos: { vestiario: 6, qi: 1 } },
    ],
  },
  {
    id: 'base_salario_atrasado', fase: 'base', titulo: 'Salário atrasado', cond: { nivel: ['pro_exterior'] },
    texto: 'O clube atrasou o pagamento dos jogadores pela segunda vez. O capitão pergunta se o grupo entra em greve de treino.',
    escolhas: [
      { rotulo: 'Apoiar a greve', resultado: 'O clube pagou em dois dias. O dirigente ficou de cara fechada com você.', efeitos: { vestiario: 9, tecnico: -8 } },
      { rotulo: 'Continuar treinando', resultado: 'Você manteve a rotina e foi visto como o profissional do elenco.', efeitos: { tecnico: 7, vestiario: -6, qi: 1 } },
    ],
  },
  {
    id: 'base_mate_viral', fase: 'base', titulo: 'O mate viralizou', cond: { posicao: ['ala', 'ala_pivo', 'pivo', 'ala_armador'], mediaMin: 52 },
    texto: 'Um mate seu em cima de um pivô de dois metros e quinze virou vídeo em todas as redes. O telefone não para de apitar.',
    escolhas: [
      { rotulo: 'Aproveitar o momento', resultado: 'Você deu entrevista, postou a comemoração e ganhou uns mil seguidores novos por hora.', efeitos: { fama: 8, imagem: 4, moral: 4 } },
      { rotulo: 'Fingir que nada aconteceu', resultado: 'Humildade cara de pau. O técnico adorou, os fãs ficaram mais curiosos ainda.', efeitos: { tecnico: 6, fama: 4, imagem: 2 } },
    ],
  },
  {
    id: 'base_treino_combine', fase: 'base', titulo: 'Treino pré-draft', cond: { idadeMin: 19 },
    texto: 'Faltam meses para o draft e um preparador oferece um programa fechado. Dá pra escolher só um foco.',
    escolhas: [
      { rotulo: 'Arremesso', resultado: 'Milhares de repetições até a mão virar relógio.', efeitos: { arremesso: 3, desgaste: 3 } },
      { rotulo: 'Explosão e físico', resultado: 'Você voltou mais rápido e mais pesado.', efeitos: { fisico: 3, infiltracao: 1, desgaste: 5 } },
      { rotulo: 'QI e vídeo', resultado: 'Você começou a antecipar jogadas como quem lê a próxima página.', efeitos: { qi: 3, passe: 1 } },
    ],
  },
  {
    id: 'base_mock_draft', fase: 'base', titulo: 'Mock draft te coloca no topo', cond: { idadeMin: 19, famaMin: 25, mediaMin: 62 },
    texto: 'Um site de projeção do draft te colocou entre os cinco primeiros. Agora todo mundo quer te ver errar e acertar ao mesmo tempo.',
    escolhas: [
      { rotulo: 'Abraçar o hype', resultado: 'Você jogou com o peito estufado e a torcida adorou.', efeitos: { fama: 7, moral: 5, desgaste: 3 } },
      { rotulo: 'Silenciar as redes', resultado: 'Você deletou os aplicativos e jogou mais leve.', efeitos: { qi: 1, moral: 4, tecnico: 4 } },
    ],
  },
  {
    id: 'base_estrela_do_time', fase: 'base', titulo: 'O outro badalado', cond: { mediaMin: 55 },
    texto: 'O time tem outro jogador do seu nível, cheio de patrocinador. Os dois pedem a bola no mesmo lance.',
    escolhas: [
      { rotulo: 'Dividir a bola', resultado: 'O time rodou melhor e o outro virou parceiro de balada.', efeitos: { passe: 1, vestiario: 8, tecnico: 4 } },
      { rotulo: 'Pedir pra ser o principal', resultado: 'Você assumiu o jogo. Os números subiram e o vestiário esfriou.', efeitos: { fama: 5, vestiario: -8, arremesso: 1 } },
    ],
  },
  {
    id: 'base_tecnico_gritaria', fase: 'base', titulo: 'O técnico explodiu', cond: {},
    texto: 'No intervalo, o técnico chutou uma garrafa de água e disse que o time inteiro "joga com o coração no vestiário".',
    escolhas: [
      { rotulo: 'Encarar e responder', resultado: 'Silêncio no vestiário. Ele concordou em parte e te tirou do jogo.', efeitos: { tecnico: -9, moral: 3, vestiario: 4 } },
      { rotulo: 'Escutar calado', resultado: 'Você assimilou a bronca e entrou diferente no segundo tempo.', efeitos: { tecnico: 8, qi: 1, moral: -2 } },
      { rotulo: 'Rir baixo no canto', resultado: 'Alguém viu. Virou piada interna e meio problema.', efeitos: { vestiario: 6, tecnico: -6 } },
    ],
  },
  {
    id: 'base_mentor', fase: 'base', titulo: 'Ex-jogador de NBA dá uma aula', cond: { mediaMin: 52 }, unico: true,
    texto: 'Um ex-jogador da NBA, aposentado há uns anos, aparece num treino aberto e escolhe você pra uma sessão individual.',
    escolhas: [
      { rotulo: 'Perguntar tudo sobre a liga', resultado: 'Ele te contou como é a vida de verdade: hotel, avião e muita sola de sapato gasta.', efeitos: { qi: 2, moral: 4, flag: 'mentor_nba' } },
      { rotulo: 'Pedir uma aula de arremesso', resultado: 'Dez minutos de correção no pulso e o arremesso mudou.', efeitos: { arremesso: 3, flag: 'mentor_nba' } },
    ],
  },
  {
    id: 'base_selecao_sub19', fase: 'base', titulo: 'Convite pra seleção sub-19', cond: { idadeMax: 20, mediaMin: 58 }, unico: true,
    texto: 'A seleção do seu país te chama para o Mundial sub-19. O torneio cai no meio da preparação do clube.',
    escolhas: [
      { rotulo: 'Ir defender o país', resultado: 'Você apareceu pro mundo e voltou com a camisa suada de orgulho.', efeitos: { fama: 9, qi: 2, moral: 6, tecnico: -6, desgaste: 5, flag: 'selecao_base' } },
      { rotulo: 'Ficar no clube', resultado: 'A comissão técnica registrou o gesto com um sorriso.', efeitos: { tecnico: 10, fisico: 1, fama: -3 } },
    ],
  },
  {
    id: 'base_dente', fase: 'base', titulo: 'Cotovelada na boca', cond: {},
    texto: 'Você perdeu um dente num lance de rebote. O médico oferece um protetor bucal novo; o clube sugere que você volte ao jogo seguinte mesmo assim.',
    escolhas: [
      { rotulo: 'Pagar o dentista e parar um jogo', resultado: 'Sorriso novo e uma semana de molho.', efeitos: { dinheiro: -0.01, moral: 2, tecnico: -2 } },
      { rotulo: 'Voltar com protetor', resultado: 'Você jogou assustador, com sangue no canto da boca. Os fãs adoraram.', efeitos: { fama: 4, tecnico: 6, risco: 0.03 } },
    ],
  },
  {
    id: 'base_streamer', fase: 'base', titulo: 'Lives de videogame', cond: { famaMin: 10 },
    texto: 'Um amigo te convida pra transmitir jogos online. Você tem tempo livre, o técnico tem opinião.',
    escolhas: [
      { rotulo: 'Entrar nessa', resultado: 'Você ganhou seguidores e um bocado de olheiras. O técnico pediu pra moderar.', efeitos: { fama: 5, imagem: 3, desgaste: 3, tecnico: -4, dinheiro: 0.03 } },
      { rotulo: 'Recusar', resultado: 'Você ficou em casa descansando e vendo vídeo de jogo.', efeitos: { qi: 1, desgaste: -4 } },
    ],
  },
  {
    id: 'base_pais', fase: 'base', titulo: 'Pais cobrando', cond: { idadeMax: 21 },
    texto: 'Sua mãe quer que você pense na faculdade e no diploma. Seu pai só pergunta quanto você vai ganhar.',
    escolhas: [
      { rotulo: 'Prometer o diploma depois', resultado: 'Sua mãe suspirou aliviada, seu pai fez planilha.', efeitos: { moral: 5, qi: 1 } },
      { rotulo: 'Dizer que a prioridade é o draft', resultado: 'A conversa durou três horas e acabou em jantar. Ficou combinado.', efeitos: { moral: -3, fama: 1, arremesso: 1 } },
    ],
  },
  {
    id: 'base_funcao', fase: 'base', titulo: 'O técnico quer mudar sua função', cond: { mediaMin: 54 }, unico: true,
    texto: 'Ele acha que você rende mais cuidando do jogo, não só finalizando. Pra isso, quer mexer na sua forma de atuar.',
    escolhas: [
      { rotulo: 'Aceitar a nova função', resultado: 'Você ganhou visão de quadra e perdeu uns pontos por jogo.', efeitos: { passe: 3, qi: 2, tecnico: 6 } },
      { rotulo: 'Manter o estilo', resultado: 'Você continuou pontuando alto. Ele aceitou a contragosto.', efeitos: { arremesso: 2, infiltracao: 1, tecnico: -6 } },
    ],
  },
  {
    id: 'base_chuva_cestas', fase: 'base', titulo: 'Noite de milagre', cond: { mediaMin: 50 },
    texto: 'Você acertou cinco bolas de longe seguidas num jogo que valia pouco. Todo mundo no ginásio levantou. Agora o time inteiro quer ver de novo.',
    escolhas: [
      { rotulo: 'Arriscar tudo de novo', resultado: 'Deu certo por mais três arremessos, depois a mão esfriou.', efeitos: { arremesso: 1, fama: 3 } },
      { rotulo: 'Passar a bola', resultado: 'Não adiantou: era o seu dia, e os outros não acompanharam.', efeitos: { passe: 1, vestiario: 5 } },
    ],
  },
]
