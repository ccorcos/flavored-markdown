import test from 'ava'
import * as p from './index'

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

test('any', t => {
  p.any
  .run('xys')
  .fold(
    v => t.is('x', v),
    v => t.fail()
  )
})

test('any fails at end', t => {
  p.any
  .run('')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('end passes at end', t => {
  p.end
  .run('')
  .fold(
    v => t.pass(),
    v => t.fail()
  )
})

test('end fails not at end', t => {
  p.end
  .run('x')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('end doesnt happen twice', t => {
  p.sequence([
    p.end,
    p.end,
  ])
  .run('')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('where passes', t => {
  p.where(x => x.type === 'yes')
  .run([{type: 'yes'}])
  .fold(
    v => t.is(v.type, 'yes'),
    v => t.fail()
  )
})

test('where fails', t => {
  p.where(x => x.type === 'yes')
  .run([{type: 'no'}])
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('whereEq', t => {
  p.whereEq('x')
  .run('xyz')
  .fold(
    v => t.is(v, 'x'),
    v => t.fail()
  )
})

test('chain always', t => {
  p.whereEq('x')
  .chain(p.always)
  .run('xyz')
  .fold(
    v => t.is(v, 'x'),
    v => t.fail()
  )
})

test('sequence passes', t => {
  const parser = p.sequence([
    p.whereEq('x'),
    p.whereEq('y'),
    p.whereEq('z'),
  ])

  parser
  .run('xyz')
  .fold(
    v => t.deepEqual(v, ['x', 'y', 'z']),
    v => t.fail()
  )

  parser
  .run('xyzx')
  .fold(
    v => t.deepEqual(v, ['x', 'y', 'z']),
    v => t.fail()
  )
})

test('sequence fails', t => {
  p.sequence([
    p.whereEq('x'),
    p.whereEq('y'),
    p.whereEq('z'),
  ])
  .run('xy_')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('either', t => {
  const parser = p.either([
    p.whereEq('x'),
    p.whereEq('y'),
  ])

  parser.run('x')
  .fold(
    v => t.is(v, 'x'),
    v => t.fail()
  )

  parser.run('y')
  .fold(
    v => t.is(v, 'y'),
    v => t.fail()
  )

  parser.run('z')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('either backtracks', t => {
  const parser = p.either([
    p.sequence([
      p.whereEq('x'),
      p.whereEq('y'),
    ]),
    p.whereEq('y'),
  ])

  parser.run('xy')
  .fold(
    v => t.deepEqual(v, ['x', 'y']),
    v => t.fail()
  )

  parser.run('y')
  .fold(
    v => t.is(v, 'y'),
    v => t.fail()
  )
})

test('not', t => {
  p.not(p.whereEq('x'))
  .run('y')
  .fold(
    v => t.is(v, 'y'),
    v => t.fail()
  )

  p.not(p.whereEq('x'))
  .run('x')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('not consumes once', t => {
  const parser = p.not(p.sequence([
    p.whereEq('x'),
    p.whereEq('x'),
  ]))
  .chain(v => p.whereEq('y').map(() => v))

  parser
  .run('ay')
  .fold(
    v => t.is(v, 'a'),
    v => t.fail()
  )

  parser
  .run('xxy')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('zeroOrMore', t => {
  const parser = p.zeroOrMore(p.whereEq('x'))

  parser.run('xxxy')
  .fold(
    v => t.deepEqual(v, ['x', 'x', 'x']),
    v => t.fail()
  )

  p.zeroOrMore(p.whereEq('x'))
  .run('yyyy')
  .fold(
    v => t.deepEqual(v, []),
    v => t.fail()
  )
})

test('zeroOrMore consumes the right amount', t => {
  const parser =
    p.zeroOrMore(p.whereEq('x'))
    .chain(() => p.whereEq('y'))

  parser.run('xxxy')
  .fold(
    v => t.is(v, 'y'),
    v => t.fail()
  )

  parser.run('y')
  .fold(
    v => t.is(v, 'y'),
    v => t.fail()
  )

  parser.run('xy')
  .fold(
    v => t.is(v, 'y'),
    v => t.fail()
  )

  parser.run('z')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('oneOrMore', t => {
  p.oneOrMore(p.whereEq('x'))
  .run('xxxy')
  .fold(
    v => t.deepEqual(v, ['x', 'x', 'x']),
    v => t.fail()
  )

  p.oneOrMore(p.whereEq('x'))
  .run('yyyy')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('oneOrMore sequence', t => {
  const parser = p.oneOrMore(p.string('abc')).chain(v => p.end.map(() => v))

  parser
  .run('abc')
  .fold(
    () => t.pass(),
    () => t.fail()
  )

  parser
  .run('abcabc')
  .fold(
    v => t.deepEqual(v, ['abc', 'abc']),
    () => t.fail()
  )

  parser
  .run('abcd')
  .fold(
    () => t.fail(),
    () => t.pass()
  )

  parser
  .run('abca')
  .fold(
    () => t.fail(),
    () => t.pass()
  )
})

test('nOrMore', t => {
  p.nOrMore(2, p.whereEq('x'))
  .run('xxxy')
  .fold(
    v => t.deepEqual(v, ['x', 'x', 'x']),
    v => t.fail()
  )

  p.nOrMore(2, p.whereEq('x'))
  .run('xyyy')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('between', t => {
  p.between(
    p.whereEq('['),
    p.zeroOrMore(p.not(p.whereEq(']'))),
    p.whereEq(']')
  )
  .run('[abcd]')
  .fold(
    v => t.deepEqual(v, ['a', 'b', 'c', 'd']),
    v => t.fail()
  )
})

test('sepBy', t => {
  const parser = p.sepBy(p.whereEq(','), p.whereEq('x'))

  parser.run('x')
  .fold(
    v => t.deepEqual(v, ['x']),
    v => t.fail()
  )

  parser.run('x,x,x')
  .fold(
    v => t.deepEqual(v, ['x', 'x', 'x']),
    v => t.fail()
  )
})

test('maybe', t => {
  const parser = p.maybe(p.whereEq('x'))

  parser.run('x')
  .fold(
    v => t.is(v, 'x'),
    v => t.fail()
  )

  parser.run('y')
  .fold(
    v => t.is(v, null),
    v => t.fail()
  )
})

test('maybe backtracks', t => {
  const parser = p.sequence([
    p.maybe(p.whereEq('x')),
    p.whereEq('y'),
  ])

  parser.run('xy')
  .fold(
    v => t.deepEqual(v, ['x', 'y']),
    v => t.fail()
  )

  parser.run('y')
  .fold(
    v => t.deepEqual(v, [null, 'y']),
    v => t.fail()
  )
})

test('lookahead', t => {
  const parser =
    p.whereEq('x')
    .chain(v =>
      p.lookahead(p.whereEq('y'))
      .map(() => v))

  parser.run('xy')
  .fold(
    v => t.is(v, 'x'),
    v => t.fail()
  )

  parser.run('xx')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('lookahead backtracks', t => {
  const parser =
    p.whereEq('x')
    .chain(v =>
      p.lookahead(p.whereEq('y'))
      .map(() => v))
    .chain(v =>
      p.whereEq('y'))

  parser.run('xy')
  .fold(
    v => t.is(v, 'y'),
    v => t.fail()
  )

  parser.run('xx')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('chars', t => {
  p.chars('x')
  .run('xxxxy')
  .fold(
    v => t.is(v, 'xxxx'),
    v => t.fail()
  )
})

test('string', t => {
  p.string('xyz')
  .run('xyz')
  .fold(
    v => t.is(v, 'xyz'),
    v => t.fail()
  )

  p.string('xyz')
  .run('xy_')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('digit', t => {
  p.digit
  .run('1')
  .fold(
    v => t.pass(),
    v => t.fail()
  )
})

test('scan', t => {
  p.scan(p.whereEq('x').map(v => v.toUpperCase()))
  .run('wxyz')
  .fold(
    v => t.deepEqual(v, ['w', 'X', 'y', 'z']),
    v => t.pass()
  )
})

test('scanOver', t => {
  p.scanOver([
    p.string('xy'),
    p.whereEq('x').map(v => v.toUpperCase()),
  ])
  .run('wxyzx')
  .fold(
    v => t.deepEqual(v, ['w', 'xy', 'z', 'X']),
    v => t.pass()
  )
})

test('wrapLR', t => {
  p.wrapLR(p.whereEq('x'), p.whereEq('z'))
  .run('xyyz')
  .fold(
    v => t.deepEqual(v, ['y', 'y']),
    v => t.pass()
  )
})

test('wrap', t => {
  p.wrap(p.whereEq('x'))
  .run('xyzx')
  .fold(
    v => t.deepEqual(v, ['y', 'z']),
    v => t.pass()
  )
})

test('rest', t => {
  p.rest
  .run('xyz')
  .fold(
    v => t.deepEqual(v, ['x', 'y', 'z']),
    v => t.pass()
  )
})

test('generate', t => {
  p.generate(function*() {
    yield p.whereEq('x')
    const ys = yield p.zeroOrMore(p.whereEq('y'))
    yield p.whereEq('x')
    return ys.length
  })
  .run('xyyyx')
  .fold(
    v => t.is(v, 3),
    v => t.fail()
  )
})
