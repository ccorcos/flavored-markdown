import test from 'ava'
import * as p from './index'

test('map', t => {
  p.any
  .map(parseInt)
  .run('2')
  .fold(
    v => t.is(v, 2),
    v => t.fail()
  )
})

test('bimap', t => {
  const parser = p.whereEq('x').bimap(
    () => 'yes',
    () => 'no'
  )

  parser
  .run('x')
  .fold(
    v => t.is(v, 'yes'),
    v => t.fail()
  )

  parser
  .run('y')
  .fold(
    v => t.fail(),
    v => t.is(v, 'no')
  )
})

test('chain', t => {
  const parser =
    p.whereEq('x')
      .chain(x =>
        p.whereEq('y')
        .map(y => [x, y]))

  parser
  .run('xy')
  .fold(
    v => t.deepEqual(v, ['x', 'y']),
    v => t.fail()
  )

  parser
  .run('xx')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('over', t => {
  const parser =
    p.oneOrMore(
      p.not(p.whereEq('z')))
    .over(
      p.oneOrMore(
        p.either([
          p.whereEq('x'),
          p.whereEq('y'),
        ])))

  parser
  .run('xyxyzyxyx')
  .fold(
    v => t.deepEqual(v, ['x', 'y', 'x', 'y']),
    v => t.fail()
  )

  parser
  .run('xyxyababzyxyx')
  .fold(
    v => t.deepEqual(v, ['x', 'y', 'x', 'y']),
    v => t.fail()
  )

  parser
  .run('zyxyx')
  .fold(
    v => t.fail(),
    v => t.pass()
  )

  parser
  .run('ababzyxyx')
  .fold(
    v => t.fail(),
    v => t.pass()
  )
})

test('filter', t => {
  const parser =
    p.zeroOrMore(
      p.either([
        p.whereEq('x'),
        p.whereEq('y'),
        p.whereEq('z'),
      ])
    )
    .filter(v => v !== 'x')

  parser
  .run('xyxyz')
  .fold(
    v => t.deepEqual(v, ['y', 'y', 'z']),
    v => t.fail()
  )
})

test('reduce', t => {
  const parser =
    p.zeroOrMore(
      p.either([
        p.whereEq('x'),
        p.whereEq('y'),
        p.whereEq('z'),
      ])
    )
    .filter(v => v !== 'x')
    .reduce((a, b) => a + b, '')

  parser
  .run('xyxyz')
  .fold(
    v => t.deepEqual(v, 'yyz'),
    v => t.fail()
  )
})

test('flatten', t => {
  const parser =
    p.sequence([
      p.zeroOrMore(p.whereEq('x')),
      p.zeroOrMore(p.whereEq('y')),
    ])
    .flatten()

  parser
  .run('xxy')
  .fold(
    v => t.deepEqual(v, ['x', 'x', 'y']),
    v => t.fail()
  )
})

test('append', t => {
  const parser =
    p.zeroOrMore(p.whereEq('x'))
    .append(p.whereEq('y'))

  parser
  .run('xxy')
  .fold(
    v => t.deepEqual(v, ['x', 'x', 'y']),
    v => t.fail()
  )
})

test('concat', t => {
  const parser =
    p.zeroOrMore(p.whereEq('x'))
    .concat(p.zeroOrMore(p.whereEq('y')))

  parser
  .run('xxy')
  .fold(
    v => t.deepEqual(v, ['x', 'x', 'y']),
    v => t.fail()
  )
})

test('then', t => {
  const parser =
    p.whereEq('x')
    .then(p.whereEq('y'))
    .then(p.whereEq('z'))

  parser
  .run('xyz')
  .fold(
    v => t.deepEqual(v, [['x', 'y'], 'z']),
    v => t.fail()
  )
})

test('thenLeft', t => {
  const parser =
    p.whereEq('x')
    .thenLeft(p.whereEq('y'))
    .then(p.whereEq('z'))

  parser
  .run('xyz')
  .fold(
    v => t.deepEqual(v, ['x', 'z']),
    v => t.fail()
  )
})

test('thenRight', t => {
  const parser =
    p.whereEq('x')
    .thenRight(p.whereEq('y'))
    .then(p.whereEq('z'))

  parser
  .run('xyz')
  .fold(
    v => t.deepEqual(v, ['y', 'z']),
    v => t.fail()
  )
})
