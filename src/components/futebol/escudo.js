// Escudos dos times do Draft FC: forma + padrão + símbolo + duas cores + sigla. Os humanos montam o próprio (ou sorteiam);
// os bots recebem um escudo gerado a partir do id do clube, então o mesmo clube tem sempre o mesmo escudo em todo celular.

export const FORMAS = ['classico', 'arredondado', 'hexagono', 'redondo', 'losango']
export const PADROES = ['liso', 'vertical', 'horizontal', 'metade', 'diagonal', 'faixa']
export const SIMBOLOS = ['nenhum', 'estrela', 'raio', 'coroa', 'bola', 'chama', 'diamante', 'folha']
export const NOMES_FORMA = { classico: 'Clássico', arredondado: 'Brasão', hexagono: 'Hexágono', redondo: 'Redondo', losango: 'Losango' }
export const NOMES_PADRAO = { liso: 'Liso', vertical: 'Listrado', horizontal: 'Faixa larga', metade: 'Metade', diagonal: 'Diagonal', faixa: 'Cinta' }
export const NOMES_SIMBOLO = { nenhum: 'Sem símbolo', estrela: 'Estrela', raio: 'Raio', coroa: 'Coroa', bola: 'Bola', chama: 'Chama', diamante: 'Diamante', folha: 'Folha' }

export const PALETA = ['#e11d48', '#f97316', '#facc15', '#16a34a', '#14b8a6', '#0ea5e9', '#2563eb', '#1e3a8a', '#7c3aed', '#db2777', '#92400e', '#f4f2ed', '#6b7280', '#111827']

// Pares de cores que combinam e têm contraste (usados no sorteio)
const PARES = [
  ['#e11d48', '#f4f2ed'], ['#2563eb', '#facc15'], ['#16a34a', '#f4f2ed'], ['#111827', '#f97316'], ['#7c3aed', '#facc15'],
  ['#0ea5e9', '#111827'], ['#f97316', '#111827'], ['#facc15', '#111827'], ['#db2777', '#f4f2ed'], ['#14b8a6', '#111827'],
  ['#92400e', '#facc15'], ['#f4f2ed', '#e11d48'], ['#1e3a8a', '#f4f2ed'], ['#e11d48', '#111827'], ['#16a34a', '#facc15'],
  ['#111827', '#f4f2ed'], ['#7c3aed', '#f4f2ed'], ['#2563eb', '#f4f2ed'],
]

export function hash(texto) {
  let h = 2166136261
  for (let i = 0; i < String(texto).length; i++) h = Math.imul(h ^ String(texto).charCodeAt(i), 16777619)
  return h >>> 0
}

function gerador(semente) {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function siglaDe(nome) {
  const limpo = String(nome ?? '').replace(/\bFC\b/gi, '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z\s]/g, '').trim()
  const palavras = limpo.split(/\s+/).filter(Boolean)
  const base = palavras.length >= 2 ? palavras[0][0] + palavras[1].slice(0, 2) : (palavras[0] ?? 'FC').slice(0, 3)
  return base.toUpperCase().padEnd(2, 'X')
}

// Escudo sorteado. Com `semente` é sempre o mesmo pra mesma semente; sem, é aleatório de verdade.
export function escudoAleatorio(semente, sigla = 'FC') {
  const r = gerador(semente == null ? Math.floor(Math.random() * 4294967295) : hash(semente))
  const pick = (lista) => lista[Math.floor(r() * lista.length)]
  const [cor1, cor2] = pick(PARES)
  const padrao = pick(PADROES)
  return {
    forma: pick(FORMAS),
    padrao,
    simbolo: pick(SIMBOLOS.filter((s) => s !== 'nenhum')),
    cor1,
    cor2,
    sigla: String(sigla).slice(0, 3).toUpperCase(),
  }
}

export function escudoValido(e) {
  return !!e && FORMAS.includes(e.forma) && PADROES.includes(e.padrao) && SIMBOLOS.includes(e.simbolo)
    && /^#[0-9a-fA-F]{6}$/.test(e.cor1) && /^#[0-9a-fA-F]{6}$/.test(e.cor2) && typeof e.sigla === 'string' && e.sigla.length >= 1 && e.sigla.length <= 3
}

// Escudo de um time do campeonato: o que ele montou, ou um gerado do id (estável).
export function escudoDoTime(time) {
  if (escudoValido(time?.escudo)) return time.escudo
  return escudoAleatorio(time?.id ?? time?.nome ?? 'time', time?.sigla ?? siglaDe(time?.nome))
}

function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

export function contraste(a, b) {
  const la = luminancia(a)
  const lb = luminancia(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// Cores das peças do campo pra um escudo: face = cor principal, aro = secundária (ou escura), número legível.
export function coresDoEscudo(e) {
  const face = e.cor1
  const aro = contraste(e.cor1, e.cor2) >= 1.6 ? e.cor2 : '#111827'
  return { face, aro, texto: luminancia(face) > 0.35 ? '#111827' : '#ffffff' }
}

// Escolhe as cores dos dois times de uma partida; se forem parecidas demais, o time B usa branco ou preto.
export function coresDaPartida(escA, escB) {
  const a = coresDoEscudo(escA)
  let b = coresDoEscudo(escB)
  if (contraste(a.face, b.face) < 1.7) {
    const alt = luminancia(a.face) > 0.35 ? '#1f2937' : '#f3f4f6'
    b = { face: alt, aro: '#9ca3af', texto: luminancia(alt) > 0.35 ? '#111827' : '#ffffff' }
  }
  return { A: { ...a, gol: '#16a34a', golAro: '#14532d' }, B: { ...b, gol: '#f59e0b', golAro: '#92400e' } }
}
