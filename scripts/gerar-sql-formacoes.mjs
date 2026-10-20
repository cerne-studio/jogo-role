// Gera o SQL de fd_formacoes e fd_aceita a partir de src/components/futebol/formacoes.js (fonte única da verdade).
import { FORMACOES, ACEITA } from '../src/components/futebol/formacoes.js'

const q = (s) => `'${s}'`
console.log('create or replace function fd_aceita(r text)\nreturns text[]\nlanguage sql\nimmutable\nas $$\n  select case r')
for (const [rot, pos] of Object.entries(ACEITA)) console.log(`    when ${q(rot)} then array[${pos.map(q).join(', ')}]`)
console.log("    else array[]::text[] end\n$$;\n")
console.log('insert into fd_formacoes (nome, slots) values')
console.log(Object.entries(FORMACOES).map(([n, s]) => `  (${q(n)}, array[${s.map((x) => q(x.rotulo)).join(', ')}])`).join(',\n'))
console.log('on conflict (nome) do update set slots = excluded.slots;')
