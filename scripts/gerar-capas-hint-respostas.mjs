// Gera as capas do HINT e do Respostas sem Perguntas no mesmo estilo das outras (fundo facetado de uma cor só,
// formas chapadas, faíscas amarelas), 768x512 .webp em src/assets/role/.
// Precisa do sharp só pra rodar: npm i --no-save sharp && node scripts/gerar-capas-hint-respostas.mjs
import sharp from 'sharp'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const W = 768
const H = 512
const saida = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/role')

function rng(seed) {
  let s = seed >>> 0
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296
}

// Fundo facetado: grade com pontos sacudidos, cada célula vira 2 triângulos com luminosidade sorteada
// (mais clara perto do foco, como nas outras capas).
function fundo({ hue, sat = 62, lMin = 9, lMax = 34, foco = [0.5, 0.5], seed }) {
  const r = rng(seed)
  const cols = 7
  const rows = 5
  const cw = W / (cols - 2)
  const ch = H / (rows - 2)
  const pts = []
  for (let j = 0; j <= rows; j++) {
    pts[j] = []
    for (let i = 0; i <= cols; i++) {
      pts[j][i] = [(i - 1) * cw + (r() - 0.5) * cw * 0.8, (j - 1) * ch + (r() - 0.5) * ch * 0.8]
    }
  }
  let out = ''
  const tri = (a, b, c) => {
    const cx = (a[0] + b[0] + c[0]) / 3 / W
    const cy = (a[1] + b[1] + c[1]) / 3 / H
    const d = Math.hypot(cx - foco[0], (cy - foco[1]) * 0.8)
    const luz = Math.max(0, 1 - d * 1.35)
    const l = lMin + (lMax - lMin) * (0.25 + 0.75 * luz) * (0.55 + r() * 0.6)
    const cor = `hsl(${hue + (r() - 0.5) * 8},${sat}%,${Math.min(l, lMax + 6).toFixed(1)}%)`
    out += `<polygon points="${a} ${b} ${c}" fill="${cor}" stroke="${cor}" stroke-width="1.2" stroke-linejoin="round"/>`
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = pts[j][i]
      const b = pts[j][i + 1]
      const c = pts[j + 1][i + 1]
      const d = pts[j + 1][i]
      if (r() < 0.5) {
        tri(a, b, c)
        tri(a, c, d)
      } else {
        tri(a, b, d)
        tri(b, c, d)
      }
    }
  }
  return out
}

const faisca = (x, y, ang, len = 34, cor = '#ffba38') =>
  `<line x1="${x}" y1="${y}" x2="${x + Math.cos(ang) * len}" y2="${y + Math.sin(ang) * len}" stroke="${cor}" stroke-width="11" stroke-linecap="round"/>`

const estrela = (x, y, s, cor) =>
  `<path d="M${x} ${y - s} Q${x + s * 0.16} ${y - s * 0.16} ${x + s} ${y} Q${x + s * 0.16} ${y + s * 0.16} ${x} ${y + s} Q${x - s * 0.16} ${y + s * 0.16} ${x - s} ${y} Q${x - s * 0.16} ${y - s * 0.16} ${x} ${y - s}Z" fill="${cor}"/>`

const rad = (g) => (g * Math.PI) / 180

// ---------------------------------------------------------------- HINT
function capaHint() {
  const cx = 384
  const cy = 262
  const Ro = 196
  const Ri = 76
  const P = (r, g) => [cx + r * Math.cos(rad(g)), cy + r * Math.sin(rad(g))]
  const setor = (i) => {
    const a0 = -90 + i * 72 + 2
    const a1 = -90 + (i + 1) * 72 - 2
    const [x0, y0] = P(Ro, a0)
    const [x1, y1] = P(Ro, a1)
    const [x2, y2] = P(Ri, a1)
    const [x3, y3] = P(Ri, a0)
    return `M${x0} ${y0}A${Ro} ${Ro} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${Ri} ${Ri} 0 0 0 ${x3} ${y3}Z`
  }
  // entrada (creme), bônus (dourado), creme, bônus (dourado), obrigatória (vermelho)
  const cores = ['#f6ead0', '#ffba38', '#f6ead0', '#ffba38', '#ef4b50']
  let s = ''
  for (let i = 0; i < 5; i++) s += `<path d="${setor(i)}" fill="${cores[i]}"/><path d="${setor(i)}" fill="url(#brilho)"/>`

  const chip = (i, cor, icone) => {
    const [x, y] = P((Ro + Ri) / 2 + 2, -90 + i * 72 + 36)
    return `<g transform="translate(${x} ${y})"><circle r="46" fill="${cor}" stroke="#fff8e6" stroke-width="7"/><circle r="46" fill="url(#brilhoChip)"/>${icone}</g>`
  }
  const lapis = `<g transform="rotate(45)" fill="#0f1623"><rect x="-8" y="-26" width="16" height="42" rx="3"/><path d="M-8 16 L8 16 L0 31Z"/><rect x="-8" y="-34" width="16" height="8" rx="3"/></g>`
  const mic = `<g fill="#0f1623"><rect x="-10" y="-27" width="20" height="36" rx="10"/><path d="M-19 -2 Q-19 20 0 20 Q19 20 19 -2" fill="none" stroke="#0f1623" stroke-width="5" stroke-linecap="round"/><rect x="-2.5" y="19" width="5" height="12"/><rect x="-12" y="29" width="24" height="5" rx="2.5"/></g>`
  const nota = `<g fill="#0f1623"><ellipse cx="-9" cy="18" rx="12" ry="9" transform="rotate(-20 -9 18)"/><rect x="1" y="-26" width="6" height="44"/><path d="M7 -26 Q26 -20 24 -2 Q18 -12 7 -12Z"/></g>`
  const mao = `<g fill="#0f1623"><rect x="-17" y="-2" width="34" height="30" rx="12"/><rect x="-17" y="-26" width="7" height="30" rx="3.5"/><rect x="-8" y="-32" width="7" height="36" rx="3.5"/><rect x="1" y="-30" width="7" height="34" rx="3.5"/><rect x="10" y="-24" width="7" height="28" rx="3.5"/><rect x="-27" y="4" width="14" height="7" rx="3.5" transform="rotate(35 -27 4)"/></g>`

  // lâmpada no miolo: a "dica"
  const lampada = `<g transform="translate(${cx} ${cy})">
    <circle r="62" fill="#17120a"/>
    <circle r="62" fill="none" stroke="#ffba38" stroke-width="5"/>
    <path d="M0 -34 C-26 -34 -34 -10 -22 8 C-16 17 -14 22 -14 28 L14 28 C14 22 16 17 22 8 C34 -10 26 -34 0 -34Z" fill="#ffd55a"/>
    <rect x="-13" y="31" width="26" height="6" rx="3" fill="#f6ead0"/>
    <rect x="-9" y="39" width="18" height="6" rx="3" fill="#f6ead0"/>
    <path d="M-7 4 L0 -6 L7 4 M0 -6 L0 24" fill="none" stroke="#c98a12" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="52%" r="55%"><stop offset="0" stop-color="#ffba38" stop-opacity=".42"/><stop offset="1" stop-color="#ffba38" stop-opacity="0"/></radialGradient>
    <linearGradient id="brilho" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
    <linearGradient id="brilhoChip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
  </defs>
  ${fundo({ hue: 36, sat: 78, lMin: 10, lMax: 38, foco: [0.5, 0.5], seed: 11 })}
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${s}
  ${lampada}
  ${chip(0, '#7ee787', nota)}
  ${chip(1, '#38d0ff', lapis)}
  ${chip(2, '#ffe9a8', mic)}
  ${chip(3, '#ff7ad9', mao)}
  ${faisca(96, 120, rad(-35))}${faisca(126, 92, rad(-70), 30)}${faisca(76, 156, rad(-5), 28)}
  ${faisca(672, 392, rad(145))}${faisca(646, 424, rad(110), 30)}${faisca(694, 358, rad(175), 26)}
  ${estrela(650, 96, 26, '#fff1c2')}${estrela(120, 410, 20, '#ffd55a')}${estrela(700, 210, 13, '#fff1c2')}
</svg>`
}

// ---------------------------------------------------------------- RESPOSTAS SEM PERGUNTAS
function capaRespostas() {
  // cartão com palavras: algumas reveladas (douradas), o resto escondido (escuro)
  const linha = (y, w, revelada) =>
    `<rect x="-86" y="${y}" width="${w}" height="26" rx="13" fill="${revelada ? '#ffba38' : '#13313a'}"/>` +
    (revelada ? `<rect x="-86" y="${y}" width="${w}" height="26" rx="13" fill="url(#brilho)"/>` : '')
  const cartao = `<g transform="translate(212 272) rotate(-7)">
    <rect x="-128" y="-170" width="256" height="340" rx="26" fill="#0b2128" opacity=".45" transform="translate(10 14)"/>
    <rect x="-128" y="-170" width="256" height="340" rx="26" fill="#f4fbfc"/>
    <rect x="-128" y="-170" width="256" height="340" rx="26" fill="url(#brilho)"/>
    <rect x="-86" y="-134" width="94" height="14" rx="7" fill="#7fb9c4"/>
    ${linha(-92, 150, true)}${linha(-48, 118, true)}${linha(-4, 172, false)}${linha(40, 96, false)}${linha(84, 140, false)}
    <circle cx="86" cy="130" r="0" fill="none"/>
  </g>`

  // balão com o ponto de interrogação
  const bx = 540
  const by = 236
  const balao = `<g transform="translate(${bx} ${by}) rotate(5)">
    <path d="M-150 -118 Q-150 -168 -100 -168 L100 -168 Q150 -168 150 -118 L150 66 Q150 116 100 116 L40 116 L-34 176 L-22 116 L-100 116 Q-150 116 -150 66Z" fill="#0b2128" opacity=".4" transform="translate(12 14)"/>
    <path d="M-150 -118 Q-150 -168 -100 -168 L100 -168 Q150 -168 150 -118 L150 66 Q150 116 100 116 L40 116 L-34 176 L-22 116 L-100 116 Q-150 116 -150 66Z" fill="#22d3ee"/>
    <path d="M-150 -118 Q-150 -168 -100 -168 L100 -168 Q150 -168 150 -118 L150 66 Q150 116 100 116 L40 116 L-34 176 L-22 116 L-100 116 Q-150 116 -150 66Z" fill="url(#brilho)"/>
    <path d="M-50 -66 C-50 -118 52 -118 52 -60 C52 -22 2 -22 2 22" fill="none" stroke="#0b2128" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="2" cy="70" r="20" fill="#0b2128"/>
  </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="62%" cy="48%" r="55%"><stop offset="0" stop-color="#22d3ee" stop-opacity=".4"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
    <linearGradient id="brilho" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
  </defs>
  ${fundo({ hue: 190, sat: 70, lMin: 10, lMax: 36, foco: [0.62, 0.48], seed: 29 })}
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${cartao}
  ${balao}
  ${faisca(364, 70, rad(-60))}${faisca(398, 52, rad(-95), 28)}${faisca(334, 98, rad(-25), 26)}
  ${faisca(704, 442, rad(130))}${faisca(676, 470, rad(100), 28)}
  ${estrela(70, 72, 22, '#d9f7fb')}${estrela(722, 78, 16, '#ffd55a')}${estrela(52, 452, 14, '#ffd55a')}${estrela(380, 456, 12, '#d9f7fb')}
</svg>`
}

for (const [nome, svg] of [['hint', capaHint()], ['respostas', capaRespostas()]]) {
  await sharp(Buffer.from(svg)).webp({ quality: 84 }).toFile(join(saida, `capa-${nome}.webp`))
  console.log('ok capa-' + nome + '.webp')
}
