import { CAMPO, posicaoDaBola, posicoesDoTime } from './layoutCampo.js'

export const CORES_PADRAO = {
  A: { face: '#7c3aed', aro: '#4c1d95', texto: '#ffffff', gol: '#16a34a', golAro: '#14532d' },
  B: { face: '#f3f4f6', aro: '#9ca3af', texto: '#111827', gol: '#f59e0b', golAro: '#92400e' },
}

const { w: W, h: H, margem: M } = CAMPO

// Peça de futebol de botão: sombra, aro, face e um brilho curto no alto. A bola de cada lance passa de peça em peça.
function Peca({ x, y, cores, num, portador, destaque, goleiro, dur }) {
  const face = goleiro ? cores.gol : cores.face
  const aro = goleiro ? cores.golAro : cores.aro
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: `transform ${dur}s cubic-bezier(.4,0,.2,1)` }}>
      <circle r="10" cx="0.8" cy="2.4" fill="rgba(0,0,0,.5)" />
      {portador && <circle r="14" fill="none" stroke="#f59e0b" strokeWidth="2.2" className="pulso-peca" />}
      {destaque && <circle r="17" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" className="pulso-peca" />}
      <circle r="10" fill={aro} />
      <circle r="7.6" fill={face} />
      <path d="M-5.1 -2.6 A 5.9 5.9 0 0 1 1.2 -5.6" fill="none" stroke="#ffffff" strokeOpacity=".4" strokeWidth="1.3" strokeLinecap="round" />
      <text y="3.1" textAnchor="middle" fontSize="8.6" fontWeight="800" fill={cores.texto} style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
        {num}
      </text>
    </g>
  )
}

function Campo() {
  const listras = 10
  const largura = (W - 2 * M) / listras
  const areaW = 0.17 * (W - 2 * M)
  const areaH = 0.6 * (H - 2 * M)
  const peqW = 0.06 * (W - 2 * M)
  const peqH = 0.3 * (H - 2 * M)
  const linha = { fill: 'none', stroke: 'rgba(255,255,255,.55)', strokeWidth: 1.2 }
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill="#14301f" />
      {Array.from({ length: listras }, (_, i) => (
        <rect key={i} x={M + i * largura} y={M} width={largura} height={H - 2 * M} fill={i % 2 ? '#1b3d28' : '#1f4630'} />
      ))}
      <rect x={M} y={M} width={W - 2 * M} height={H - 2 * M} {...linha} />
      <line x1={W / 2} y1={M} x2={W / 2} y2={H - M} {...linha} />
      <circle cx={W / 2} cy={H / 2} r="26" {...linha} />
      <circle cx={W / 2} cy={H / 2} r="1.6" fill="rgba(255,255,255,.7)" />
      <rect x={M} y={(H - areaH) / 2} width={areaW} height={areaH} {...linha} />
      <rect x={W - M - areaW} y={(H - areaH) / 2} width={areaW} height={areaH} {...linha} />
      <rect x={M} y={(H - peqH) / 2} width={peqW} height={peqH} {...linha} />
      <rect x={W - M - peqW} y={(H - peqH) / 2} width={peqW} height={peqH} {...linha} />
      <circle cx={M + 0.12 * (W - 2 * M)} cy={H / 2} r="1.4" fill="rgba(255,255,255,.7)" />
      <circle cx={W - M - 0.12 * (W - 2 * M)} cy={H / 2} r="1.4" fill="rgba(255,255,255,.7)" />
      <rect x={M - 5} y={H / 2 - 17} width="5" height="34" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.7)" strokeWidth="1" />
      <rect x={W - M} y={H / 2 - 17} width="5" height="34" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.7)" strokeWidth="1" />
    </g>
  )
}

export default function MatchPitch({ sim, cfg, cores = CORES_PADRAO, visual, nomes = {}, numeros = {} }) {
  const ids = { A: sim.escalacoes.A.map((e) => e.id), B: sim.escalacoes.B.map((e) => e.id) }
  const posicoes = {}
  for (const lado of ['A', 'B']) {
    posicoes[lado] = posicoesDoTime({
      lado, formacao: cfg[lado].formacao, tatica: cfg[lado].tatica, temBola: visual.dono === lado, zona: visual.zona, by: visual.by,
    }).map((p, i) => visual.overrides?.[ids[lado][i]] ?? p)
  }

  const idxPortador = ids[visual.dono].indexOf(visual.portadorId)
  let bola
  if (visual.bolaOverride) bola = visual.bolaOverride
  else if (idxPortador >= 0) {
    const p = posicoes[visual.dono][idxPortador]
    bola = { x: p.x + (visual.dono === 'A' ? 7 : -7), y: p.y + 1 }
  } else bola = posicaoDaBola(visual.dono, visual.zona, visual.by)

  const cam = visual.camera
  const transformCam = cam ? `translate(${W / 2 - cam.cx * cam.s}px, ${H / 2 - cam.cy * cam.s}px) scale(${cam.s})` : 'translate(0px, 0px) scale(1)'
  const trilha = visual.trilha ?? []
  const nomePortador = visual.portadorId ? nomes[visual.portadorId] : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Campo de futebol com as peças dos dois times" style={{ display: 'block', borderRadius: 14, overflow: 'hidden', background: '#14301f' }}>
      <style>{`.pulso-peca{transform-box:fill-box;transform-origin:center;animation:pulsoPeca 1.1s ease-in-out infinite}@keyframes pulsoPeca{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.18);opacity:.55}}`}</style>
      <defs>
        <marker id="seta-trilha" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#f59e0b" />
        </marker>
      </defs>
      <g style={{ transform: transformCam, transformOrigin: '0 0', transition: 'transform .9s cubic-bezier(.4,0,.2,1)' }}>
        <Campo />
        {trilha.length > 1 && (
          <polyline
            points={trilha.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="#f59e0b" strokeWidth={visual.modo === 'replay' ? 2.4 : 1.6} strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round"
            markerEnd="url(#seta-trilha)" opacity=".92"
          />
        )}
        {['A', 'B'].map((lado) =>
          posicoes[lado].map((p, i) => {
            const id = ids[lado][i]
            const goleiro = sim.escalacoes[lado][i].papel === 'G'
            return (
              <Peca
                key={`${lado}-${i}`} x={p.x} y={p.y} cores={cores[lado]} num={numeros[id] ?? i + 1} goleiro={goleiro}
                portador={id === visual.portadorId && !visual.bolaOverride} destaque={visual.destaque === id} dur={visual.dur}
              />
            )
          }),
        )}
        <g style={{ transform: `translate(${bola.x}px, ${bola.y}px)`, transition: `transform ${visual.dur}s cubic-bezier(.4,0,.2,1)` }}>
          <ellipse cx="0.6" cy="3" rx="4.6" ry="1.8" fill="rgba(0,0,0,.45)" />
          <circle r="4.3" fill="#ffffff" stroke="#1f2937" strokeWidth="1.1" />
          <path d="M0 -2.2 L2.1 -0.7 L1.3 1.8 L-1.3 1.8 L-2.1 -0.7 Z" fill="#1f2937" />
        </g>
        {nomePortador && visual.modo !== 'replay' && (
          <text x={bola.x} y={bola.y - 11} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff" stroke="rgba(0,0,0,.7)" strokeWidth="2.2" paintOrder="stroke" style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
            {nomePortador}
          </text>
        )}
      </g>
    </svg>
  )
}
