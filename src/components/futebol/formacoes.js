// Formações. Cada posição tem:
//   papel  'G' goleiro | 'D' defesa | 'M' meio | 'F' ataque (usado pelo motor)
//   rotulo sigla mostrada no campo e no draft
//   x, y   posição no campo horizontal: x vai do próprio gol (0) ao gol rival (1), y de cima (0) a baixo (1)
// Também define quais posições do FIFA (GK, CB, LB...) podem ocupar cada vaga do draft.

export const ACEITA = {
  GOL: ['GK'],
  ZAG: ['CB'],
  LE: ['LB', 'LWB'],
  LD: ['RB', 'RWB'],
  VOL: ['CDM', 'CM'],
  MC: ['CM', 'CDM', 'CAM'],
  MEI: ['CAM', 'CM', 'CF'],
  ME: ['LM', 'LW', 'LWB'],
  MD: ['RM', 'RW', 'RWB'],
  PE: ['LW', 'LM', 'ST'],
  PD: ['RW', 'RM', 'ST'],
  ATA: ['ST', 'CF', 'LW', 'RW'],
}

const v = (papel, rotulo, x, y) => ({ papel, rotulo, x, y })

export const FORMACOES = {
  '4-3-3': [
    v('G', 'GOL', 0.05, 0.5),
    v('D', 'LE', 0.22, 0.12), v('D', 'ZAG', 0.2, 0.37), v('D', 'ZAG', 0.2, 0.63), v('D', 'LD', 0.22, 0.88),
    v('M', 'MC', 0.45, 0.28), v('M', 'VOL', 0.4, 0.5), v('M', 'MC', 0.45, 0.72),
    v('F', 'PE', 0.72, 0.14), v('F', 'ATA', 0.76, 0.5), v('F', 'PD', 0.72, 0.86),
  ],
  '4-4-2': [
    v('G', 'GOL', 0.05, 0.5),
    v('D', 'LE', 0.22, 0.12), v('D', 'ZAG', 0.2, 0.37), v('D', 'ZAG', 0.2, 0.63), v('D', 'LD', 0.22, 0.88),
    v('M', 'ME', 0.46, 0.1), v('M', 'MC', 0.42, 0.36), v('M', 'MC', 0.42, 0.64), v('M', 'MD', 0.46, 0.9),
    v('F', 'ATA', 0.74, 0.36), v('F', 'ATA', 0.74, 0.64),
  ],
  '4-2-3-1': [
    v('G', 'GOL', 0.05, 0.5),
    v('D', 'LE', 0.22, 0.12), v('D', 'ZAG', 0.2, 0.37), v('D', 'ZAG', 0.2, 0.63), v('D', 'LD', 0.22, 0.88),
    v('M', 'VOL', 0.38, 0.37), v('M', 'VOL', 0.38, 0.63),
    v('M', 'ME', 0.58, 0.16), v('M', 'MEI', 0.6, 0.5), v('M', 'MD', 0.58, 0.84),
    v('F', 'ATA', 0.78, 0.5),
  ],
  '3-5-2': [
    v('G', 'GOL', 0.05, 0.5),
    v('D', 'ZAG', 0.2, 0.25), v('D', 'ZAG', 0.17, 0.5), v('D', 'ZAG', 0.2, 0.75),
    v('M', 'LE', 0.45, 0.08), v('M', 'MC', 0.45, 0.3), v('M', 'VOL', 0.38, 0.5), v('M', 'MC', 0.45, 0.7), v('M', 'LD', 0.45, 0.92),
    v('F', 'ATA', 0.74, 0.36), v('F', 'ATA', 0.74, 0.64),
  ],
  '4-5-1': [
    v('G', 'GOL', 0.05, 0.5),
    v('D', 'LE', 0.22, 0.12), v('D', 'ZAG', 0.2, 0.37), v('D', 'ZAG', 0.2, 0.63), v('D', 'LD', 0.22, 0.88),
    v('M', 'ME', 0.48, 0.1), v('M', 'MC', 0.43, 0.3), v('M', 'VOL', 0.38, 0.5), v('M', 'MC', 0.43, 0.7), v('M', 'MD', 0.48, 0.9),
    v('F', 'ATA', 0.76, 0.5),
  ],
  '5-3-2': [
    v('G', 'GOL', 0.05, 0.5),
    v('D', 'LE', 0.3, 0.08), v('D', 'ZAG', 0.2, 0.28), v('D', 'ZAG', 0.17, 0.5), v('D', 'ZAG', 0.2, 0.72), v('D', 'LD', 0.3, 0.92),
    v('M', 'MC', 0.45, 0.3), v('M', 'VOL', 0.4, 0.5), v('M', 'MC', 0.45, 0.7),
    v('F', 'ATA', 0.74, 0.36), v('F', 'ATA', 0.74, 0.64),
  ],
  '3-4-3': [
    v('G', 'GOL', 0.05, 0.5),
    v('D', 'ZAG', 0.2, 0.25), v('D', 'ZAG', 0.17, 0.5), v('D', 'ZAG', 0.2, 0.75),
    v('M', 'ME', 0.45, 0.1), v('M', 'MC', 0.42, 0.37), v('M', 'MC', 0.42, 0.63), v('M', 'MD', 0.45, 0.9),
    v('F', 'PE', 0.72, 0.14), v('F', 'ATA', 0.76, 0.5), v('F', 'PD', 0.72, 0.86),
  ],
}

export const LISTA_FORMACOES = Object.keys(FORMACOES)

// Um jogador pode ocupar a vaga se alguma das posições dele (lista do FIFA) for aceita pela vaga.
export function podeJogarNoSlot(posicoesDoJogador, slot) {
  const aceitas = ACEITA[slot.rotulo] ?? []
  return posicoesDoJogador.some((p) => aceitas.includes(p))
}
