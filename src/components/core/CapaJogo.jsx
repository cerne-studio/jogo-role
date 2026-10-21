// Faixa com a arte do jogo no topo das telas de sala/configuração. Não deforma a imagem (object-cover) e some
// atrás do conteúdo se faltar espaço. `foco` ajusta qual parte da arte fica visível no corte.
export default function CapaJogo({ src, foco = '50% 50%', className = '' }) {
  if (!src) return null
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <img src={src} alt="" decoding="async" className="aspect-[3/1] w-full object-cover" style={{ objectPosition: foco }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas/70 to-transparent" />
    </div>
  )
}
