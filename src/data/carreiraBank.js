// Banco de dados do Simulador de Carreira (basquete).
// Times, ligas e competições são FICTÍCIOS — inspirados em cidades reais, mas
// sem usar marcas de clubes existentes. Os números de "força" são só balanço
// de jogo, não ranking de ninguém.

// ─────────────────────────────────────────────────────────────
// Posições
// ─────────────────────────────────────────────────────────────
export const POSICOES = [
  { id: 'armador', nome: 'Armador', sigla: 'PG', alturaMin: 178, alturaMax: 193 },
  { id: 'ala_armador', nome: 'Ala-armador', sigla: 'SG', alturaMin: 188, alturaMax: 200 },
  { id: 'ala', nome: 'Ala', sigla: 'SF', alturaMin: 196, alturaMax: 206 },
  { id: 'ala_pivo', nome: 'Ala-pivô', sigla: 'PF', alturaMin: 202, alturaMax: 211 },
  { id: 'pivo', nome: 'Pivô', sigla: 'C', alturaMin: 206, alturaMax: 221 },
]

// Peso de cada atributo na média geral, por posição.
export const PESOS_POSICAO = {
  armador: { arremesso: 0.22, infiltracao: 0.16, passe: 0.28, defesa: 0.14, fisico: 0.08, qi: 0.12 },
  ala_armador: { arremesso: 0.3, infiltracao: 0.22, passe: 0.14, defesa: 0.16, fisico: 0.08, qi: 0.1 },
  ala: { arremesso: 0.24, infiltracao: 0.24, passe: 0.12, defesa: 0.2, fisico: 0.1, qi: 0.1 },
  ala_pivo: { arremesso: 0.18, infiltracao: 0.24, passe: 0.08, defesa: 0.22, fisico: 0.18, qi: 0.1 },
  pivo: { arremesso: 0.1, infiltracao: 0.28, passe: 0.06, defesa: 0.24, fisico: 0.22, qi: 0.1 },
}

// Multiplicadores de produção estatística por posição.
export const PRODUCAO_POSICAO = {
  armador: { pontos: 0.95, rebotes: 0.35, assistencias: 1.6, arremessoBase: 44 },
  ala_armador: { pontos: 1.15, rebotes: 0.5, assistencias: 0.8, arremessoBase: 45 },
  ala: { pontos: 1.05, rebotes: 0.78, assistencias: 0.7, arremessoBase: 47 },
  ala_pivo: { pontos: 0.95, rebotes: 1.25, assistencias: 0.5, arremessoBase: 51 },
  pivo: { pontos: 0.85, rebotes: 1.6, assistencias: 0.4, arremessoBase: 56 },
}

export const ATRIBUTOS = [
  { id: 'arremesso', nome: 'Arremesso' },
  { id: 'infiltracao', nome: 'Infiltração' },
  { id: 'passe', nome: 'Passe' },
  { id: 'defesa', nome: 'Defesa' },
  { id: 'fisico', nome: 'Físico' },
  { id: 'qi', nome: 'QI de jogo' },
]

// ─────────────────────────────────────────────────────────────
// Países (força da seleção + liga de origem + torneio continental)
// ─────────────────────────────────────────────────────────────
export const PAISES = [
  { id: 'brasil', nome: 'Brasil', bandeira: '🇧🇷', forca: 74, liga: 'nbb', continental: 'AmeriCup' },
  { id: 'eua', nome: 'Estados Unidos', bandeira: '🇺🇸', forca: 96, liga: 'americana', continental: 'AmeriCup' },
  { id: 'argentina', nome: 'Argentina', bandeira: '🇦🇷', forca: 76, liga: 'nbb', continental: 'AmeriCup' },
  { id: 'espanha', nome: 'Espanha', bandeira: '🇪🇸', forca: 88, liga: 'espanhola', continental: 'EuroBasket' },
  { id: 'servia', nome: 'Sérvia', bandeira: '🇷🇸', forca: 90, liga: 'adriatica', continental: 'EuroBasket' },
  { id: 'franca', nome: 'França', bandeira: '🇫🇷', forca: 88, liga: 'francesa', continental: 'EuroBasket' },
  { id: 'grecia', nome: 'Grécia', bandeira: '🇬🇷', forca: 82, liga: 'grega', continental: 'EuroBasket' },
  { id: 'italia', nome: 'Itália', bandeira: '🇮🇹', forca: 78, liga: 'italiana', continental: 'EuroBasket' },
  { id: 'turquia', nome: 'Turquia', bandeira: '🇹🇷', forca: 76, liga: 'turca', continental: 'EuroBasket' },
  { id: 'lituania', nome: 'Lituânia', bandeira: '🇱🇹', forca: 80, liga: 'adriatica', continental: 'EuroBasket' },
  { id: 'canada', nome: 'Canadá', bandeira: '🇨🇦', forca: 86, liga: 'americana', continental: 'AmeriCup' },
  { id: 'australia', nome: 'Austrália', bandeira: '🇦🇺', forca: 84, liga: 'australiana', continental: 'Copa da Ásia' },
  { id: 'nigeria', nome: 'Nigéria', bandeira: '🇳🇬', forca: 68, liga: 'francesa', continental: 'AfroBasket' },
  { id: 'china', nome: 'China', bandeira: '🇨🇳', forca: 64, liga: 'chinesa', continental: 'Copa da Ásia' },
]

// ─────────────────────────────────────────────────────────────
// Ligas e times
// ─────────────────────────────────────────────────────────────
export const LIGAS = {
  nbb: {
    id: 'nbb',
    nome: 'Liga Brasileira',
    pais: 'Brasil',
    prestigio: 56,
    jogos: 38,
    salarioBase: 0.12,
    copa: 'Copa das Américas',
    times: [
      { nome: 'Franca Chama', forca: 84 },
      { nome: 'Rio Maré', forca: 82 },
      { nome: 'São Paulo Metrópole', forca: 80 },
      { nome: 'Ribeirão Fúria', forca: 77 },
      { nome: 'Minas Montanha', forca: 75 },
      { nome: 'Bauru Alvorada', forca: 72 },
      { nome: 'Brasília Planalto', forca: 68 },
      { nome: 'Mogi Bandeirante', forca: 66 },
      { nome: 'Pato Trovão', forca: 62 },
      { nome: 'Caxias Serra', forca: 59 },
    ],
  },
  americana: {
    id: 'americana',
    nome: 'Liga Americana',
    pais: 'Estados Unidos',
    prestigio: 96,
    jogos: 72,
    salarioBase: 1.0,
    copa: 'Copa da Liga',
    times: [
      { nome: 'Boston Muralha', forca: 92 },
      { nome: 'Los Angeles Cometas', forca: 90 },
      { nome: 'Golden Bay Corrente', forca: 90 },
      { nome: 'Miami Neon', forca: 88 },
      { nome: 'Denver Altitude', forca: 87 },
      { nome: 'Nova York Império', forca: 86 },
      { nome: 'Dallas Cavalaria', forca: 84 },
      { nome: 'Filadélfia Forja', forca: 83 },
      { nome: 'Chicago Ventania', forca: 82 },
      { nome: 'Oklahoma Pradaria', forca: 79 },
      { nome: 'Memphis Névoa', forca: 78 },
      { nome: 'Houston Órbita', forca: 76 },
      { nome: 'Portland Cedro', forca: 74 },
      { nome: 'Sacramento Realeza', forca: 72 },
      { nome: 'Detroit Motor', forca: 69 },
      { nome: 'Charlotte Colmeia', forca: 66 },
    ],
  },
  espanhola: {
    id: 'espanhola',
    nome: 'Liga Espanhola',
    pais: 'Espanha',
    prestigio: 80,
    jogos: 40,
    salarioBase: 0.45,
    copa: 'EuroLiga',
    times: [
      { nome: 'Madri Coroa', forca: 90 },
      { nome: 'Barcelona Condal', forca: 88 },
      { nome: 'Vitória Basco', forca: 82 },
      { nome: 'Valência Laranjal', forca: 81 },
      { nome: 'Málaga Costa', forca: 79 },
      { nome: 'Gran Canária Vulcão', forca: 74 },
      { nome: 'Bilbau Ferro', forca: 71 },
      { nome: 'Múrcia Horta', forca: 68 },
    ],
  },
  turca: {
    id: 'turca',
    nome: 'Liga Turca',
    pais: 'Turquia',
    prestigio: 74,
    jogos: 38,
    salarioBase: 0.4,
    copa: 'EuroLiga',
    times: [
      { nome: 'Istambul Bósforo', forca: 88 },
      { nome: 'Istambul Anatólia', forca: 86 },
      { nome: 'Istambul Ponte', forca: 78 },
      { nome: 'Ancara Capital', forca: 74 },
      { nome: 'Esmirna Egeu', forca: 72 },
      { nome: 'Trabzon Mar Negro', forca: 67 },
      { nome: 'Bursa Verde', forca: 65 },
      { nome: 'Adana Sul', forca: 62 },
    ],
  },
  italiana: {
    id: 'italiana',
    nome: 'Liga Italiana',
    pais: 'Itália',
    prestigio: 72,
    jogos: 38,
    salarioBase: 0.33,
    copa: 'EuroLiga',
    times: [
      { nome: 'Milão Duomo', forca: 84 },
      { nome: 'Bolonha Torres', forca: 83 },
      { nome: 'Veneza Laguna', forca: 76 },
      { nome: 'Trento Alpes', forca: 74 },
      { nome: 'Brescia Leão', forca: 72 },
      { nome: 'Sassari Ilha', forca: 69 },
      { nome: 'Pesaro Adriático', forca: 66 },
      { nome: 'Trieste Porto', forca: 63 },
    ],
  },
  grega: {
    id: 'grega',
    nome: 'Liga Grega',
    pais: 'Grécia',
    prestigio: 72,
    jogos: 34,
    salarioBase: 0.32,
    copa: 'EuroLiga',
    times: [
      { nome: 'Atenas Trevo', forca: 87 },
      { nome: 'Atenas Pireu', forca: 86 },
      { nome: 'Salônica Farol', forca: 74 },
      { nome: 'Patras Golfo', forca: 68 },
      { nome: 'Creta Minoico', forca: 65 },
      { nome: 'Larissa Planície', forca: 63 },
      { nome: 'Rodes Colosso', forca: 61 },
      { nome: 'Volos Argo', forca: 58 },
    ],
  },
  francesa: {
    id: 'francesa',
    nome: 'Liga Francesa',
    pais: 'França',
    prestigio: 70,
    jogos: 38,
    salarioBase: 0.3,
    copa: 'EuroLiga',
    times: [
      { nome: 'Mônaco Rocha', forca: 84 },
      { nome: 'Paris Sena', forca: 82 },
      { nome: 'Villeurbanne Ródano', forca: 80 },
      { nome: 'Estrasburgo Reno', forca: 74 },
      { nome: 'Nanterre Subúrbio', forca: 72 },
      { nome: 'Dijon Vinhedo', forca: 69 },
      { nome: 'Le Mans Circuito', forca: 66 },
      { nome: 'Cholet Bocage', forca: 62 },
    ],
  },
  adriatica: {
    id: 'adriatica',
    nome: 'Liga Adriática',
    pais: 'Balcãs',
    prestigio: 68,
    jogos: 34,
    salarioBase: 0.25,
    copa: 'EuroLiga',
    times: [
      { nome: 'Belgrado Fortaleza', forca: 86 },
      { nome: 'Belgrado Rio', forca: 84 },
      { nome: 'Liubliana Dragão', forca: 76 },
      { nome: 'Zagreb Sava', forca: 74 },
      { nome: 'Podgorica Cânion', forca: 70 },
      { nome: 'Split Adriático', forca: 67 },
      { nome: 'Sarajevo Ponte', forca: 64 },
      { nome: 'Novi Sad Danúbio', forca: 61 },
    ],
  },
  australiana: {
    id: 'australiana',
    nome: 'Liga Australiana',
    pais: 'Austrália',
    prestigio: 64,
    jogos: 30,
    salarioBase: 0.22,
    copa: 'Copa do Pacífico',
    times: [
      { nome: 'Perth Pôr do Sol', forca: 82 },
      { nome: 'Sydney Porto', forca: 80 },
      { nome: 'Melbourne Trilho', forca: 78 },
      { nome: 'Brisbane Rio', forca: 72 },
      { nome: 'Adelaide Colina', forca: 70 },
      { nome: 'Tasmânia Ilha', forca: 67 },
      { nome: 'Cairns Recife', forca: 65 },
      { nome: 'Illawarra Falésia', forca: 62 },
    ],
  },
  chinesa: {
    id: 'chinesa',
    nome: 'Liga Chinesa',
    pais: 'China',
    prestigio: 60,
    jogos: 46,
    salarioBase: 0.7, // paga muito acima do prestígio — o clássico "cheque grande"
    copa: 'Copa da Ásia de Clubes',
    times: [
      { nome: 'Cantão Delta', forca: 80 },
      { nome: 'Liaoning Aço', forca: 79 },
      { nome: 'Pequim Muralha', forca: 78 },
      { nome: 'Xangai Torre', forca: 76 },
      { nome: 'Xinjiang Deserto', forca: 74 },
      { nome: 'Shenzhen Circuito', forca: 72 },
      { nome: 'Zhejiang Seda', forca: 69 },
      { nome: 'Qingdao Baía', forca: 65 },
    ],
  },
}

export const LIGAS_LISTA = Object.values(LIGAS)

// ─────────────────────────────────────────────────────────────
// Lesões
// ─────────────────────────────────────────────────────────────
export const LESOES = [
  { nome: 'Entorse de tornozelo', jogosFora: [3, 10], sequela: 0 },
  { nome: 'Estiramento na panturrilha', jogosFora: [5, 14], sequela: 0 },
  { nome: 'Fratura no dedo da mão', jogosFora: [6, 16], sequela: 0 },
  { nome: 'Lesão no punho', jogosFora: [8, 18], sequela: 1 },
  { nome: 'Tendinite no joelho', jogosFora: [10, 22], sequela: 1 },
  { nome: 'Lombalgia crônica', jogosFora: [12, 25], sequela: 2 },
  { nome: 'Ruptura do ligamento do joelho', jogosFora: [40, 82], sequela: 6 },
  { nome: 'Ruptura do tendão de aquiles', jogosFora: [45, 90], sequela: 8 },
  { nome: 'Cirurgia no ombro', jogosFora: [25, 50], sequela: 4 },
]

// ─────────────────────────────────────────────────────────────
// Eventos de carreira ("escolhe tua própria aventura")
// cond: filtros opcionais — idadeMin, idadeMax, mediaMin, mediaMax,
//       temporadaMin, famaMin, apenasLiga, peso (chance relativa)
// efeitos: deltas aplicados no estado (atributos + moral/fama/tecnico/
//          desgaste/potencial). `risco` = chance extra de lesão na temporada.
// ─────────────────────────────────────────────────────────────
export const EVENTOS = [
  {
    id: 'academia',
    titulo: 'Pré-temporada',
    texto: 'O preparador físico te chama antes de todo mundo e pergunta onde você quer colocar as horas extras desse ano.',
    escolhas: [
      { rotulo: 'Sala de musculação', resultado: 'Você ganhou massa e passou a aguentar contato embaixo da cesta.', efeitos: { fisico: 3, infiltracao: 1, desgaste: 2 } },
      { rotulo: '500 arremessos por dia', resultado: 'A mão ficou calibrada. O arremesso saiu mais limpo a temporada inteira.', efeitos: { arremesso: 3, moral: 3 } },
      { rotulo: 'Vídeo e leitura de jogo', resultado: 'Você passou a enxergar a jogada antes dela acontecer.', efeitos: { qi: 3, passe: 1 } },
    ],
  },
  {
    id: 'tecnico_novo',
    titulo: 'Técnico novo',
    texto: 'O clube trocou de comissão. O novo técnico quer um sistema de muita movimentação e cobra defesa de todo mundo.',
    escolhas: [
      { rotulo: 'Abraçar o sistema', resultado: 'Você virou o exemplo que ele usa nas preleções.', efeitos: { defesa: 2, tecnico: 12, moral: -2 } },
      { rotulo: 'Manter seu jogo', resultado: 'Você produziu igual, mas ficou marcado como o cara que não entrou no esquema.', efeitos: { tecnico: -12, moral: 3 } },
    ],
  },
  {
    id: 'contusao_treino',
    titulo: 'Incômodo no joelho',
    texto: 'Dor chata no joelho desde a semana passada. O departamento médico sugere parar duas semanas. O clube está numa sequência importante.',
    escolhas: [
      { rotulo: 'Parar e tratar', resultado: 'Você perdeu alguns jogos, mas voltou inteiro.', efeitos: { desgaste: -8, tecnico: -5, moral: -3 } },
      { rotulo: 'Jogar no sacrifício', resultado: 'A torcida te adorou. O joelho, nem tanto.', efeitos: { fama: 6, tecnico: 8, desgaste: 12, risco: 0.12 } },
    ],
  },
  {
    id: 'convite_selecao_base',
    titulo: 'Convite da seleção de base',
    texto: 'Chamaram você pra disputar o Mundial sub-19 no meio da pré-temporada do clube.',
    cond: { idadeMax: 20 },
    escolhas: [
      { rotulo: 'Ir defender o país', resultado: 'Você apareceu pro mundo e voltou com moral lá em cima.', efeitos: { fama: 10, qi: 2, moral: 6, tecnico: -6, desgaste: 5 } },
      { rotulo: 'Ficar no clube', resultado: 'A comissão técnica registrou o gesto.', efeitos: { tecnico: 12, fisico: 1, fama: -3 } },
    ],
  },
  {
    id: 'empresario',
    titulo: 'Troca de empresário',
    texto: 'Um agente grande apareceu prometendo abrir portas em ligas melhores. O seu empresário atual é amigo da família.',
    cond: { temporadaMin: 2 },
    escolhas: [
      { rotulo: 'Assinar com o agente grande', resultado: 'Seu nome começou a circular em lugares que você nem sonhava.', efeitos: { fama: 12, moral: -4 } },
      { rotulo: 'Ficar com quem te trouxe', resultado: 'Nada mudou por fora. Por dentro, você dorme tranquilo.', efeitos: { moral: 8 } },
    ],
  },
  {
    id: 'briga_vestiario',
    titulo: 'Clima pesado no vestiário',
    texto: 'O armador titular reclamou publicamente da distribuição de bola. O grupo rachou em dois.',
    cond: { temporadaMin: 2 },
    escolhas: [
      { rotulo: 'Puxar a responsabilidade e conversar', resultado: 'Você virou liderança. O grupo voltou a jogar junto.', efeitos: { qi: 2, tecnico: 8, moral: 4, fama: 3 } },
      { rotulo: 'Não se meter', resultado: 'Você ficou fora da briga — e fora da conversa também.', efeitos: { moral: -4 } },
      { rotulo: 'Entrar na discussão', resultado: 'Vazou pra imprensa. Virou novela por duas semanas.', efeitos: { fama: 8, tecnico: -14, moral: -6 } },
    ],
  },
  {
    id: 'patrocinio',
    titulo: 'Proposta de patrocínio',
    texto: 'Uma marca de material esportivo quer te colocar numa campanha nacional. São muitas viagens no meio da temporada.',
    cond: { famaMin: 35 },
    escolhas: [
      { rotulo: 'Fechar o contrato', resultado: 'Seu rosto apareceu em outdoor. O corpo sentiu a estrada.', efeitos: { fama: 15, desgaste: 6, tecnico: -4 } },
      { rotulo: 'Recusar e focar na quadra', resultado: 'Você chegou na reta final mais inteiro que todo mundo.', efeitos: { desgaste: -6, tecnico: 6, fisico: 1 } },
    ],
  },
  {
    id: 'mentor',
    titulo: 'O veterano do elenco',
    texto: 'Um veterano de 37 anos se ofereceu pra treinar com você depois dos treinos. Ele cobra caro em cansaço.',
    cond: { idadeMax: 25 },
    escolhas: [
      { rotulo: 'Aceitar a rotina extra', resultado: 'Ele te ensinou coisas que não estão em vídeo nenhum.', efeitos: { qi: 3, defesa: 2, potencial: 2, desgaste: 5 } },
      { rotulo: 'Agradecer e seguir a rotina', resultado: 'Você descansou. Também é escolha.', efeitos: { desgaste: -4, moral: 2 } },
    ],
  },
  {
    id: 'festa',
    titulo: 'Vida fora da quadra',
    texto: 'Depois de uma vitória grande, o pessoal chamou pra comemorar. Tem treino às 8h.',
    escolhas: [
      { rotulo: 'Ir e aproveitar', resultado: 'Foi bom. O treino do dia seguinte foi horrível.', efeitos: { moral: 8, fisico: -1, tecnico: -6, desgaste: 4 } },
      { rotulo: 'Ir e voltar cedo', resultado: 'Equilíbrio é uma habilidade também.', efeitos: { moral: 4, tecnico: 1 } },
      { rotulo: 'Ficar em casa', resultado: 'Você acordou às 6h e foi o primeiro no ginásio.', efeitos: { fisico: 1, tecnico: 5, moral: -3 } },
    ],
  },
  {
    id: 'arremesso_final',
    titulo: 'Último arremesso',
    texto: 'Decisão do campeonato, 4 segundos, bola na sua mão, dois pontos atrás. Tem um companheiro livre no canto.',
    cond: { temporadaMin: 2 },
    escolhas: [
      { rotulo: 'Arremessar de três', resultado: 'Você assumiu. Isso a arquibancada nunca esquece — deu certo ou não.', efeitos: { fama: 12, moral: 5, arremesso: 1 } },
      { rotulo: 'Passar pro companheiro livre', resultado: 'A jogada certa. Nem sempre é a que vira manchete.', efeitos: { qi: 3, passe: 2, tecnico: 8, fama: -2 } },
    ],
  },
  {
    id: 'imprensa',
    titulo: 'Pergunta capciosa',
    texto: 'Depois de uma derrota feia, um repórter pergunta se o problema é o técnico.',
    cond: { temporadaMin: 2 },
    escolhas: [
      { rotulo: 'Defender o técnico', resultado: 'O grupo fechou com você.', efeitos: { tecnico: 12, fama: 2 } },
      { rotulo: 'Assumir a culpa', resultado: 'Virou meme por um dia e exemplo por um ano.', efeitos: { moral: -4, tecnico: 8, fama: 6 } },
      { rotulo: 'Falar o que realmente pensa', resultado: 'A entrevista viralizou. O técnico viu.', efeitos: { fama: 14, tecnico: -18, moral: 4 } },
    ],
  },
  {
    id: 'reserva',
    titulo: 'Banco de reservas',
    texto: 'O técnico te avisou que vai te tirar do time titular pra encaixar um reforço.',
    cond: { mediaMax: 82 },
    escolhas: [
      { rotulo: 'Aceitar e virar o melhor sexto homem', resultado: 'Você entrou pra decidir jogo, não pra completar minuto.', efeitos: { tecnico: 10, qi: 2, moral: -4 } },
      { rotulo: 'Bater de frente com a comissão', resultado: 'Você deixou claro que não veio pra sentar.', efeitos: { tecnico: -16, moral: 6, fama: 4 } },
      { rotulo: 'Trabalhar calado e provar em treino', resultado: 'Duas semanas depois você voltou pro cinco inicial.', efeitos: { fisico: 2, defesa: 1, tecnico: 5 } },
    ],
  },
  {
    id: 'salto_liga',
    titulo: 'Olheiro na arquibancada',
    texto: 'Tem olheiro de liga grande te assistindo hoje. O jogo é contra a melhor defesa do campeonato.',
    cond: { idadeMax: 26 },
    escolhas: [
      { rotulo: 'Forçar o jogo e aparecer', resultado: 'Você tentou de tudo. Teve highlight e teve erro bobo.', efeitos: { fama: 10, arremesso: 1, tecnico: -5 } },
      { rotulo: 'Jogar o seu jogo normal', resultado: 'O relatório dele dizia: "confiável".', efeitos: { qi: 2, tecnico: 4, fama: 3 } },
    ],
  },
  {
    id: 'salario_atraso',
    titulo: 'Salário atrasado',
    texto: 'O clube está com três meses de salário em atraso. Seu empresário sugere entrar na justiça e rescindir.',
    cond: { temporadaMin: 2 },
    escolhas: [
      { rotulo: 'Rescindir e procurar outro clube', resultado: 'Você saiu de graça no meio da temporada.', efeitos: { moral: -6, fama: 3, tecnico: -10 } },
      { rotulo: 'Ficar e terminar a temporada', resultado: 'A torcida fez faixa com o seu nome.', efeitos: { fama: 8, moral: -3, tecnico: 10 } },
    ],
  },
  {
    id: 'naturalizacao',
    titulo: 'Proposta de naturalização',
    texto: 'Uma federação estrangeira ofereceu passaporte pra você defender a seleção deles. Sua seleção nunca te chamou.',
    cond: { idadeMin: 24, mediaMin: 76 },
    escolhas: [
      { rotulo: 'Aceitar o passaporte', resultado: 'Você passou a jogar torneio internacional todo verão.', efeitos: { fama: 10, qi: 2, desgaste: 6, selecaoBoost: 12 } },
      { rotulo: 'Esperar a chamada do seu país', resultado: 'Você continuou esperando o telefone tocar.', efeitos: { moral: -4, selecaoBoost: 4 } },
    ],
  },
  {
    id: 'lider',
    titulo: 'Faixa de capitão',
    texto: 'O capitão se aposentou. A comissão quer te dar a braçadeira.',
    cond: { idadeMin: 26, temporadaMin: 4 },
    escolhas: [
      { rotulo: 'Aceitar a responsabilidade', resultado: 'Você virou a voz do vestiário.', efeitos: { qi: 2, tecnico: 12, fama: 5, moral: 4 } },
      { rotulo: 'Recusar e focar no seu jogo', resultado: 'Menos reunião, mais arremesso.', efeitos: { arremesso: 2, tecnico: -4 } },
    ],
  },
  {
    id: 'cheque_grande',
    titulo: 'O cheque do Oriente',
    texto: 'Um clube da Liga Chinesa ofereceu o triplo do seu salário atual. Fica longe dos holofotes.',
    cond: { idadeMin: 28, mediaMin: 74 },
    escolhas: [
      { rotulo: 'Ouvir a proposta na próxima janela', resultado: 'Seu empresário marcou a reunião.', efeitos: { moral: 4, chinaBoost: 1 } },
      { rotulo: 'Nem atender', resultado: 'Você quer troféu, não conta bancária.', efeitos: { moral: -2, tecnico: 4 } },
    ],
  },
  {
    id: 'volta_casa',
    titulo: 'O clube que te formou',
    texto: 'O time da sua cidade, onde você começou, está prestes a cair de divisão e pediu ajuda.',
    cond: { idadeMin: 30, famaMin: 45 },
    escolhas: [
      { rotulo: 'Ir gravar um vídeo de apoio', resultado: 'Simples e sincero. A cidade agradeceu.', efeitos: { fama: 4, moral: 4 } },
      { rotulo: 'Bancar a folha salarial do clube', resultado: 'Você salvou o clube. O ginásio ganhou o seu nome.', efeitos: { fama: 14, moral: 10 } },
    ],
  },
  {
    id: 'novo_arremesso',
    titulo: 'Reformular o arremesso',
    texto: 'Um consultor de arremesso diz que sua mecânica trava depois dos 30. A correção custa meia temporada ruim.',
    cond: { idadeMin: 27 },
    escolhas: [
      { rotulo: 'Refazer a mecânica do zero', resultado: 'Os primeiros meses foram feios. Depois virou chave.', efeitos: { arremesso: 5, moral: -6, tecnico: -5 } },
      { rotulo: 'Manter o que sempre funcionou', resultado: 'Você continuou sendo você.', efeitos: { moral: 3 } },
    ],
  },
  {
    id: 'defesa_marcacao',
    titulo: 'Missão de marcação',
    texto: 'O técnico quer te escalar pra marcar o melhor jogador do adversário todo jogo. Vai sobrar menos energia pro ataque.',
    cond: { mediaMin: 72 },
    escolhas: [
      { rotulo: 'Pegar a missão', resultado: 'Seu nome virou sinônimo de defesa na liga.', efeitos: { defesa: 4, fisico: 1, tecnico: 10, desgaste: 6 } },
      { rotulo: 'Pedir pra poupar pro ataque', resultado: 'Você guardou perna pros últimos cinco minutos.', efeitos: { arremesso: 2, infiltracao: 1, tecnico: -6 } },
    ],
  },
  {
    id: 'documentario',
    titulo: 'Documentário',
    texto: 'Um streaming quer acompanhar sua temporada de perto, câmera no vestiário e tudo.',
    cond: { famaMin: 55 },
    escolhas: [
      { rotulo: 'Abrir as portas', resultado: 'Virou série de sucesso. Nem tudo que apareceu era bonito.', efeitos: { fama: 18, tecnico: -8, moral: 3 } },
      { rotulo: 'Recusar', resultado: 'Privacidade também é patrimônio.', efeitos: { moral: 4, tecnico: 3 } },
    ],
  },
  {
    id: 'jovem_promessa',
    titulo: 'O garoto de 18 anos',
    texto: 'O clube trouxe um novato que joga na sua posição e é claramente talentoso.',
    cond: { idadeMin: 29 },
    escolhas: [
      { rotulo: 'Ensinar tudo pra ele', resultado: 'Ele te roubou minutos — e te chamou de referência na coletiva.', efeitos: { fama: 6, tecnico: 8, moral: 2, minutosPenalidade: 1 } },
      { rotulo: 'Mostrar que o posto ainda é seu', resultado: 'Você treinou como se tivesse 22 de novo.', efeitos: { fisico: 2, infiltracao: 1, desgaste: 8, moral: 4 } },
    ],
  },
  {
    id: 'aposta',
    titulo: 'Convite suspeito',
    texto: 'Um conhecido apareceu com uma proposta envolvendo casa de aposta e "informação de dentro".',
    cond: { temporadaMin: 3 },
    escolhas: [
      { rotulo: 'Recusar e reportar ao clube', resultado: 'O clube blindou você e o caso nem chegou na imprensa.', efeitos: { tecnico: 10, moral: 3 } },
      { rotulo: 'Ignorar e não falar nada', resultado: 'Sumiu o assunto. Ficou o incômodo.', efeitos: { moral: -5 } },
    ],
  },
  {
    id: 'ferias',
    titulo: 'Verão livre',
    texto: 'Sem convocação nesse ano. Três meses de agenda vazia.',
    cond: { temporadaMin: 3 },
    escolhas: [
      { rotulo: 'Descansar de verdade', resultado: 'Você voltou leve e sem dor.', efeitos: { desgaste: -14, moral: 6 } },
      { rotulo: 'Verão inteiro treinando', resultado: 'Voltou mais forte. E mais cansado.', efeitos: { fisico: 2, arremesso: 2, infiltracao: 1, desgaste: 8 } },
      { rotulo: 'Jogar liga de verão de rua', resultado: 'Os cortes viralizaram. Os tornozelos reclamaram.', efeitos: { fama: 10, infiltracao: 2, desgaste: 6, risco: 0.08 } },
    ],
  },
  {
    id: 'camisa',
    titulo: 'Número da camisa',
    texto: 'Um veterano recém-contratado usa o seu número desde criança e pediu pra ficar com ele.',
    escolhas: [
      { rotulo: 'Ceder o número', resultado: 'Gesto pequeno, vestiário inteiro reparou.', efeitos: { tecnico: 6, moral: -2 } },
      { rotulo: 'Manter o número', resultado: 'É seu, e ponto.', efeitos: { moral: 3, tecnico: -3 } },
    ],
  },
  {
    id: 'cirurgia',
    titulo: 'A decisão da cirurgia',
    texto: 'O exame apontou desgaste avançado. Operar agora custa uma temporada inteira; adiar custa dor todo dia.',
    cond: { idadeMin: 30, desgasteMin: 45 },
    escolhas: [
      { rotulo: 'Operar e parar o ano', resultado: 'Ano perdido, corpo recuperado.', efeitos: { desgaste: -35, fisico: -2, moral: -8, foraTemporada: 1 } },
      { rotulo: 'Tratar conservador e seguir jogando', resultado: 'Infiltração, gelo e mais um ano em quadra.', efeitos: { desgaste: 10, risco: 0.18, fama: 4 } },
    ],
  },
  {
    id: 'legado',
    titulo: 'Conversa sobre o fim',
    texto: 'Um jornalista pergunta, ao vivo, quanto tempo ainda resta de você em quadra.',
    cond: { idadeMin: 33 },
    escolhas: [
      { rotulo: '"Enquanto eu ajudar o time a ganhar"', resultado: 'A resposta virou frase de camiseta.', efeitos: { fama: 8, moral: 4, tecnico: 4 } },
      { rotulo: '"Já estou pensando no depois"', resultado: 'A diretoria começou a planejar sem você.', efeitos: { moral: -3, tecnico: -6, fama: 2 } },
    ],
  },
  {
    id: 'escola',
    titulo: 'Projeto social',
    texto: 'Uma ONG quer abrir uma quadra na periferia com o seu nome. Precisa do seu tempo e do seu dinheiro.',
    cond: { famaMin: 40 },
    escolhas: [
      { rotulo: 'Entrar de cabeça', resultado: 'Duzentos moleques treinam ali toda semana.', efeitos: { fama: 10, moral: 10, desgaste: 3 } },
      { rotulo: 'Só emprestar o nome', resultado: 'Ajudou. Menos do que podia.', efeitos: { fama: 4 } },
    ],
  },
  {
    id: 'torcida',
    titulo: 'Cobrança da torcida',
    texto: 'Depois da quarta derrota seguida, um grupo de torcedores foi cobrar o elenco no centro de treinamento.',
    escolhas: [
      { rotulo: 'Descer e conversar de frente', resultado: 'Você encarou. A torcida respeitou.', efeitos: { fama: 8, moral: -2, tecnico: 6 } },
      { rotulo: 'Ficar no vestiário', resultado: 'Nada aconteceu. Nada melhorou.', efeitos: { moral: -5 } },
    ],
  },
  {
    id: 'dieta',
    titulo: 'Novo nutricionista',
    texto: 'O clube contratou um nutricionista que quer mudar tudo no seu cardápio.',
    escolhas: [
      { rotulo: 'Seguir à risca', resultado: 'Você chegou em abril com o mesmo gás de outubro.', efeitos: { fisico: 2, desgaste: -8, moral: -3 } },
      { rotulo: 'Seguir mais ou menos', resultado: 'Você é humano.', efeitos: { moral: 3 } },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Manchetes de flavor
// ─────────────────────────────────────────────────────────────
export const MANCHETES = {
  excelente: [
    '{nome} carrega {time} nas costas e a liga inteira reparou',
    'A temporada de {nome} entrou na conversa de melhor do campeonato',
    '"Não tem como marcar": adversários se rendem a {nome}',
  ],
  boa: [
    '{nome} vive a melhor fase desde que chegou ao {time}',
    '{time} encontrou o eixo — e ele atende por {nome}',
    'Consistência: {nome} repete boas atuações e ganha status no elenco',
  ],
  media: [
    '{nome} cumpre o combinado no {time}, sem escândalo nem brilho',
    'Temporada de manutenção para {nome}',
    '{time} alterna altos e baixos, e {nome} acompanha a oscilação',
  ],
  ruim: [
    'Imprensa questiona o espaço de {nome} no {time}',
    'Temporada para esquecer: {nome} não engrenou',
    '{nome} perde protagonismo no {time}',
  ],
}

export const SOBRENOMES = [
  'Almeida', 'Barbosa', 'Cardoso', 'Duarte', 'Esteves', 'Fontes', 'Gouveia',
  'Herrera', 'Ibarra', 'Jokić', 'Kovač', 'Lemos', 'Marinho', 'Novaes',
  'Okafor', 'Pires', 'Quintana', 'Ramalho', 'Salgado', 'Teixeira', 'Ustinov',
  'Valente', 'Wallace', 'Xavier', 'Zanetti',
]
