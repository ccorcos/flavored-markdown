

// tokenize markdown (how does unfold work again?)
// pass over with link
// pass over with bold/italics


// https://github.com/sighingnow/parsec.py/blob/master/src/parsec/__init__.py
// https://github.com/mattbierner/bennu/blob/master/lib/parse.kep


// combine results together

const chars = c =>
  p.oneOrMore(p.eq(c))
  .map(cs => cs.join(''))

const string = (str) =>
  p.enumerate(str.split('').map(p.eq))
  .map(x => x.join(''))

const nOrMore = (n, parser) => (stream) =>
  p.enumerate(Array(n).fill(parser))
  .chain((values) =>
    p.zeroOrMore(parser).map(extra => values.concat(extra)))

const token = p.either([
  p.chars('*').map(s => ({type: 'stars', length: s.length})),
  p.chars('#').map(s => ({type: 'header', length: s.length})),
  p.string('```').map(() => ({type: 'fences'})),
  p.string('---').map(() => ({type: 'hr'})),
  p.string('~~').map(() => ({type: 'del'})),
  p.string('- ').map(() => ({type: 'ul'})),
  p.enumerate([p.digit, p.eq(' ')]).map(() => ({type: 'ol'})),
  p.nOrMore(2, p.eq(' ')).map(s => ({type: 'indent', length: Math.floor(s.length / 2)})),
  p.eq('!').map(type => ({type})),
  p.eq('[').map(type => ({type})),
  p.eq(']').map(type => ({type})),
  p.eq('(').map(type => ({type})),
  p.eq(')').map(type => ({type})),
  p.eq('`').map(type => ({type})),
  p.eq('\n').map(() => ({type: 'newline'})),
  p.any.map(char => ({type: 'char', char}))
])

const prop = (key) => (obj) => obj[key]
const propEq = (key, value) => (obj) => obj[key] === value

const charsToText =
  p.oneOrMore(
    p.where(propEq('type', 'char'))
    .map(prop('char'))
  ).map(chars =>
    ({type: 'text', value: chars.join('')}))

const result = (result) => (stream) => result

const tokenize =
  p.zeroOrMore(token)
  .chain(tokens => p.result(p.either([charsToText, p.any]).run(tokens)))

const between = (l, r) =>
  p.enumerate([l, p.zeroOrMore(p.not(r)), t])
  .map(v => v[1])

const link =
  p.zeroOrMore(
    p.either([
      p.enumerate([
        p.between(
          p.where(propEq('type', '[')),
          p.where(propEq('type', ']'))
        ),
        p.between(
          p.where(propEq('type', '(')),
          p.where(propEq('type', ')'))
        )
      ]),
      p.any,
    ])
  )

const stars =
  p.where(propEq('type', 'stars'))
  .map(t => t.length)
  .chain(start =>
    p.zerOrMore(p.not(p.where(propEq('type', 'stars')))))
    .chain(inside1 =>
      p.where(propEq('type', 'stars')).map(t => t.length)
      .chain(stop1 => {
        if (start === stop1) {
          return p.success({type: 'star-wrap', size: stop1, children: inside1})
        } else if (start > stop) {
          return
          p.success({type: 'star-wrap', size: start, children: inside})
        }
      }))


















oneOf
noneOf

ntimes(2, p)
betweenTimes(min, max, p)
between(open, close, p)
sepBy(sep, p)




class Stream {
  constructor(iterable, cursor=0) {
    this.iterable = iterable
    this.cursor = cursor
    this.length = iterable.length - cursor
  }
  head() {
    return this.iterable[0]
  }
  move(distance) {
    return new Stream(this.iterable, this.cursor + distance)
  }
  slice(start, stop) {
    if (this.cursor + (stop || 0) > this.iterable.length) {
      throw new TypeError('index out of range')
    }
    const result = []
    const begin = this.cursor + start
    const end = stop ? this.cursor + stop : this.iterable.length
    for (let i = begin; i < end; i++) {
      result.push(this.iterable[i])
    }
    return result
  }
}

class Success {
  constructor(value, stream) {
    this.value = value
    this.stream = stream
  }
  map(fn) {
    return new Success(fn(this.value, this.stream), this.stream)
  }
  chain(fn) {
    return fn(this.value, this.stream)
  }
  fold(s, f) {
    return s(this.value, this.stream)
  }
}

class Failure {
  constructor(value, stream) {
    this.value = value
    this.stream = stream
  }
  map(f) {
    return this
  }
  chain(f) {
    return this
  }
  fold(s, f) {
    return f(this.value, this.stream)
  }
}

class Parser {
  constructor(parse) {
    this.parse = parse
  }
  run(stream) {
    return this.parse(stream)
  }
  map(f) {
    return new Parser(stream =>
      this.parse(stream).map(f))
  }
  chain(f) {
    return new Parser(stream =>
      this.parse(stream).chain((value, stream2) => f(value).run(stream2)))
  }
  result(v) {
    return this.map(() => v)
  }
}

const always = (value) => (stream) => new Success(value, stream)

const never = (value) => (stream) => new Failure(value, stream)

const any = (stream) => new Success(stream.head(), stream.move(1))

const where = (pred) => (stream) => pred(stream.head())
                                  ? new Success(stream.head(), stream.move(1))
                                  : new Failure('predicate failed', stream)

const eq = value => where(x => x === value)

const enumerate = (list) => (stream) =>
  list.slice(1).reduce(
    (acc, p) => acc.chain((vs, s) => p.map(v => vs.concat(v)))
    list[0].map(v => [v])
  )

const either = (list) => (stream) => {
  for (let i = 0; i < list.length; i++) {
    const result = list[i].run(stream)
    if (result instanceof Success) {
      return result
    }
  }
  return new Failure('either did not match', stream)
}
