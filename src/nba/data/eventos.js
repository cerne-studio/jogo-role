import { EVENTOS_BASE } from './eventosBase.js'
import { EVENTOS_NBA_1 } from './eventosNba1.js'
import { EVENTOS_NBA_2 } from './eventosNba2.js'
import { EVENTOS_NBA_3 } from './eventosNba3.js'
import { EVENTOS_NBA_4 } from './eventosNba4.js'
import { EVENTOS_EXTERIOR } from './eventosExterior.js'

export const EVENTOS = [...EVENTOS_BASE, ...EVENTOS_NBA_1, ...EVENTOS_NBA_2, ...EVENTOS_NBA_3, ...EVENTOS_NBA_4, ...EVENTOS_EXTERIOR]
