import test from 'node:test'
import assert from 'node:assert/strict'
import { coresDaPartida, contraste, escudoAleatorio, escudoDoTime, escudoValido, siglaDe } from './escudo.js'

test('escudo sorteado com semente é estável e válido', () => {
  const a = escudoAleatorio('b44', 'INT')
  assert.deepEqual(a, escudoAleatorio('b44', 'INT'))
  assert.ok(escudoValido(a))
  assert.equal(a.sigla, 'INT')
  const outros = new Set(Array.from({ length: 40 }, (_, i) => JSON.stringify(escudoAleatorio(`clube-${i}`))))
  assert.ok(outros.size > 30, 'escudos de clubes diferentes devem variar')
})

test('sem semente sorteia de verdade e sempre dá escudo válido', () => {
  for (let i = 0; i < 50; i++) assert.ok(escudoValido(escudoAleatorio(null, 'XYZ')))
})

test('escudo do time: usa o montado pelo jogador, senão gera um estável pelo id', () => {
  const meu = { forma: 'redondo', padrao: 'metade', simbolo: 'estrela', cor1: '#2563eb', cor2: '#facc15', sigla: 'AB' }
  assert.deepEqual(escudoDoTime({ id: 'h1', escudo: meu }), meu)
  assert.deepEqual(escudoDoTime({ id: 'h1', sigla: 'HH' }), escudoDoTime({ id: 'h1', sigla: 'HH' }))
  assert.equal(escudoValido({ ...meu, cor1: 'azul' }), false)
  assert.equal(escudoValido({ ...meu, sigla: 'ABCD' }), false)
})

test('siglas', () => {
  assert.equal(siglaDe('Murilo FC'), 'MUR')
  assert.equal(siglaDe('Real Madrid'), 'RMA')
  assert.equal(siglaDe('Ña'), 'NA')
})

test('cores da partida: times parecidos ganham cores diferentes', () => {
  const e = { forma: 'classico', padrao: 'liso', simbolo: 'raio', cor1: '#2563eb', cor2: '#facc15', sigla: 'AAA' }
  const { A, B } = coresDaPartida(e, { ...e, sigla: 'BBB' })
  assert.ok(contraste(A.face, B.face) >= 1.7)
})
