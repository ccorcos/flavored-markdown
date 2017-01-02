import test from 'ava'
import * as p from './pcombs'

test('Parse HTTP Header', t => {
  const parser = p.sequence(function*() {
    const {value: method} = yield p.regex(/^[A-Z]+/)
    yield p.oneOrMore(p.char(' '))
    const {value: path} = yield p.oneOrMore(p.notChar(' '))
    yield p.oneOrMore(p.char(' '))
    yield p.string("HTTP/")
    const {value: version} = yield p.sequence(function*() {
      const {value: left} = yield p.oneOrMore(p.digit)
      yield p.char(".")
      const {value: right} = yield p.oneOrMore(p.digit)
      return `${left.join('')}.${right.join('')}`
    })
    return {method, path: path.join(''), version}
  })

  const result = p.parse(parser, "GET /lol.gif HTTP/1.0")

  t.deepEqual(result.value, {
    method: "GET",
    path: "/lol.gif",
    version: "1.0"
  })
})

test('Stream', t => {
  let s = p.Stream('1234', 0)
  t.is(s.slice(0), '1234')
  t.is(s.slice(0,2), '12')
  t.is(s.slice(0,1), '1')
  t.is(s.slice(1,2), '2')
  t.is(s.length, 4)
  s = s.move(1)
  t.is(s.slice(0), '234')
  t.is(s.slice(0,2), '23')
  t.is(s.slice(0,1), '2')
  t.is(s.slice(1,2), '3')
  t.is(s.length, 3)
})

test('either', t => {
  const parser = p.either([p.char('a'), p.char('b')])
  let result
  result = p.parse(parser, 'a')
  t.is(result.value, 'a')
  result = p.parse(parser, 'b')
  t.is(result.value, 'b')
  result = p.parse(parser, 'c')
  t.truthy(result.fail)
})

test('zeroOrMore(either)', t => {
  const parser = p.zeroOrMore(p.either([p.char('a'), p.char('b')]))
  let result
  result = p.parse(parser, 'abab')
  t.is(result.value.join(''), 'abab')
  result = p.parse(parser, 'abbaabc')
  t.is(result.value.join(''), 'abbaab')
  result = p.parse(parser, 'cba')
  t.is(result.value.join(''), '')
})

test('peek', t => {
  const parser = p.sequence(function*() {
    const {value} = yield p.char('a')
    yield p.peek(p.notChar('c'))
    return value
  })
  let result
  result = p.parse(parser, 'ab')
  t.is(result.value, 'a')
  result = p.parse(p.item, result.stream)
  t.is(result.value, 'b')
  result = p.parse(parser, 'ac')
  t.truthy(result.fail)
})

test('quoted string', t => {
  const parser = p.sequence(function*() {
    yield p.char('"')
    const {value} = yield p.zeroOrMore(
      p.either([
        p.string('\\"'),
        p.notChar('"'),
      ])
    )
    yield p.char('"')
    return value.join('').replace(/\\"/g, '"')
  })
  let result
  result = p.parse(parser, '""')
  t.is(result.value, '')
  result = p.parse(parser, '"asdf"')
  t.is(result.value, 'asdf')
  result = p.parse(parser, '"as\\"df"')
  t.is(result.value, 'as"df')
})

// TODO map over parse result somehow?

test('zeroOrMore either peek', t => {
  // parse sentences that end with !!
  const parser = p.sequence(function*() {
    const {value} = yield p.zeroOrMore(
      p.either([
        p.string('\\!'),
        p.notChar('!'),
        p.sequence(function*() {
          const {value} = yield p.char('!')
          yield p.peek(p.notChar('!'))
          return value
        }),
      ])
    )
    yield p.string('!!')
    return value.join('')
  })

  let result
  result = p.parse(parser, 'hello!!')
  t.is(result.value, 'hello')
  result = p.parse(parser, 'hello! world!!')
  t.is(result.value, 'hello! world')
  result = p.parse(parser, 'hello!\\! world!!')
  t.is(result.value, 'hello!\\! world')
  result = p.parse(parser, 'hello! world!')
  t.truthy(result.fail)
})