import test from 'ava'
import * as p from './pcombs3'

// export class Stream {
test('Stream head', t => {
  const list = [1,2,3]
  let stream = new p.Stream(list)
  t.is(stream.head(), 1)
  stream = stream.move(1)
  t.is(stream.head(), 2)
  stream = stream.move(1)
  t.is(stream.head(), 3)
  stream = stream.move(1)
  t.throws(() => stream.head())
})

test('Stream cursor', t => {
  const list = [1,2,3]
  let stream = new p.Stream(list, 1)
  t.is(stream.head(), 2)
  stream = stream.move(1)
  t.is(stream.head(), 3)
  stream = stream.move(1)
  // t.throws(() => stream.head())
})

test('Stream cursor and length', t => {
  const list = [1,2,3]
  let stream = new p.Stream(list, 1, 1)
  t.is(stream.head(), 2)
  stream = stream.move(1)
  t.throws(() => stream.head())
})

test('Stream move', t => {
  const list = [1,2,3]
  let stream = new p.Stream(list)
  t.is(stream.head(), 1)
  stream = stream.move(2)
  t.is(stream.head(), 3)
})

test('Stream slice', t => {
  const list = [1,2,3,4,5]
  let stream = new p.Stream(list)
  stream = stream.slice(1, 3)
  t.is(stream.head(), 2)
  stream = stream.move(1)
  t.is(stream.head(), 3)
  stream = stream.move(1)
  t.throws(() => stream.head())
})

test('always', t => {
  p.always('x')
  .run('anything')
  .fold(
    v => t.is('x', v),
    v => t.fail()
  )
})

test('never', t => {
  p.never('x')
  .run('anything')
  .fold(
    v => t.fail(),
    v => t.is('x', v)
  )
})

// test('any', t => {
//   p.any
//   .run('xys')
//   .fold(
//     v => t.is('x', v),
//     v => t.fail()
//   )
// })

// test('any fails at end', t => {
//   p.any
//   .run('')
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('end passes at end', t => {
//   p.end
//   .run('')
//   .fold(
//     v => t.pass(),
//     v => t.fail()
//   )
// })
//
// test('end fails not at end', t => {
//   p.end
//   .run('x')
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('where passes', t => {
//   p.where(x => x.type === 'yes')
//   .run([{type: 'yes'}])
//   .fold(
//     v => t.is(v.type, 'yes'),
//     v => t.fail()
//   )
// })
//
// test('where fails', t => {
//   p.where(x => x.type === 'yes')
//   .run([{type: 'no'}])
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('whereEq', t => {
//   p.whereEq('x')
//   .run('xyz')
//   .fold(
//     v => t.is(v, 'x'),
//     v => t.fail()
//   )
// })
//
// test('sequence passes', t => {
//   p.sequence([
//     p.whereEq('x'),
//     p.whereEq('y'),
//     p.whereEq('z'),
//   ])
//   .run('xyz')
//   .fold(
//     v => t.deepEqual(v, ['x', 'y', 'z']),
//     v => t.fail()
//   )
// })
//
// test('sequence fails', t => {
//   p.sequence([
//     p.whereEq('x'),
//     p.whereEq('y'),
//     p.whereEq('z'),
//   ])
//   .run('xy_')
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('either', t => {
//   const parser = p.either([
//     p.whereEq('x'),
//     p.whereEq('y'),
//   ])
//
//   parser.run('x')
//   .fold(
//     v => t.is(v, 'x'),
//     v => t.fail()
//   )
//
//   parser.run('y')
//   .fold(
//     v => t.is(v, 'y'),
//     v => t.fail()
//   )
//
//   parser.run('z')
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('either backtracks', t => {
//   const parser = p.either([
//     p.sequence([
//       p.whereEq('x'),
//       p.whereEq('y'),
//     ]),
//     p.whereEq('y'),
//   ])
//
//   parser.run('xy')
//   .fold(
//     v => t.deepEqual(v, ['x', 'y']),
//     v => t.fail()
//   )
//
//   parser.run('y')
//   .fold(
//     v => t.is(v, 'y'),
//     v => t.fail()
//   )
// })
//
// test('not', t => {
//   p.not(p.whereEq('x'))
//   .run('y')
//   .fold(
//     v => t.is(v, 'y'),
//     v => t.fail()
//   )
//
//   p.not(p.whereEq('x'))
//   .run('x')
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('zeroOrMore', t => {
//   p.zeroOrMore(p.whereEq('x'))
//   .run('xxxy')
//   .fold(
//     v => t.deepEqual(v, ['x', 'x', 'x']),
//     v => t.fail()
//   )
//
//   p.zeroOrMore(p.whereEq('x'))
//   .run('yyyy')
//   .fold(
//     v => t.deepEqual(v, []),
//     v => t.fail()
//   )
// })
//
// test('oneOrMore', t => {
//   p.oneOrMore(p.whereEq('x'))
//   .run('xxxy')
//   .fold(
//     v => t.deepEqual(v, ['x', 'x', 'x']),
//     v => t.fail()
//   )
//
//   p.oneOrMore(p.whereEq('x'))
//   .run('yyyy')
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('nOrMore', t => {
//   p.nOrMore(2, p.whereEq('x'))
//   .run('xxxy')
//   .fold(
//     v => t.deepEqual(v, ['x', 'x', 'x']),
//     v => t.fail()
//   )
//
//   p.nOrMore(2, p.whereEq('x'))
//   .run('xyyy')
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('between', t => {
//   p.between(
//     p.whereEq('['),
//     p.zeroOrMore(p.not(p.whereEq(']'))),
//     p.whereEq(']')
//   )
//   .run('[abcd]')
//   .fold(
//     v => t.deepEqual(v, ['a', 'b', 'c', 'd']),
//     v => t.fail()
//   )
// })
//
// test('sepBy', t => {
//   const parser = p.sepBy(p.whereEq(','), p.whereEq('x'))
//
//   parser.run('x')
//   .fold(
//     v => t.deepEqual(v, ['x']),
//     v => t.fail()
//   )
//
//   parser.run('x,x,x')
//   .fold(
//     v => t.deepEqual(v, ['x', 'x', 'x']),
//     v => t.fail()
//   )
// })
//
// test('maybe', t => {
//   const parser = p.maybe(p.whereEq('x'))
//
//   parser.run('x')
//   .fold(
//     v => t.is(v, 'x'),
//     v => t.fail()
//   )
//
//   parser.run('y')
//   .fold(
//     v => t.is(v, null),
//     v => t.fail()
//   )
// })
//
// test('maybe backtracks', t => {
//   const parser = p.sequence([
//     p.maybe(p.whereEq('x')),
//     p.whereEq('y'),
//   ])
//
//   parser.run('xy')
//   .fold(
//     v => t.deepEqual(v, ['x', 'y']),
//     v => t.fail()
//   )
//
//   parser.run('y')
//   .fold(
//     v => t.deepEqual(v, ['y']),
//     v => t.fail()
//   )
// })
//
// test('peek', t => {
//   const parser =
//     p.whereEq('x')
//     .chain(v =>
//       p.peek(p.whereEq('y'))
//       .map(() => v))
//
//   parser.run('xy')
//   .fold(
//     v => t.is(v, 'x'),
//     v => t.fail()
//   )
//
//   parser.run('xx')
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('peek backtracks', t => {
//   const parser =
//     p.whereEq('x')
//     .chain(v =>
//       p.peek(p.whereEq('y'))
//       .map(() => v))
//     .chain(v =>
//       p.whereEq('y'))
//
//   parser.run('xy')
//   .fold(
//     v => t.is(v, 'y'),
//     v => t.fail()
//   )
//
//   parser.run('xx')
//   .fold(
//     v => t.fail(),
//     v => t.pass()
//   )
// })
//
// test('chars', t => {
//   p.chars('x')
//   .run('xxxxy')
//   .fold(
//     v => t.is(v, 'xxxx'),
//     v => t.fail()
//   )
// })
//
// test('string', t => {
//   p.chars('xyz')
//   .run('xyz')
//   .fold(
//     v => t.is(v, 'xyz'),
//     v => t.fail()
//   )
// })
//
// test('Parser map', t => {
//   p.any
//   .map(parseInt)
//   .run('2')
//   .fold(
//     v => t.is(v, 2),
//     v => t.fail()
//   )
// })
//
// test('Parser bimap', t => {
//   const parser = p.any.bimap(parseInt, 'NaN')
//
//   parser
//   .run('2')
//   .fold(
//     v => t.is(v, 2),
//     v => t.fail()
//   )
//
//   parser
//   .run('x')
//   .fold(
//     v => t.fail(),
//     v => t.is('NaN', v)
//   )
// })