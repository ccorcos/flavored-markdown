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
    return new Success(fn(this.value), this.stream)
  }
  chain(fn) {
    return fn(this.value, this.stream)
  }
  fold(s, f) {
    return s(this.value, this.stream)
  }
  bichain(s, f) {
    return this.chain(s)
  }
}

class Failure {
  constructor(value, stream) {
    this.value = value
    this.stream = stream
  }
  map(fn) {
    return this
  }
  chain(fn) {
    return this
  }
  fold(s, f) {
    return f(this.value, this.stream)
  }
  bichain(s, f) {
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
  fold(s, f) {
    return new Parser(stream =>
      this.parse(stream).fold(s, f))
  }
  chain(f) {
    return new Parser(stream =>
      this.parse(stream).chain((value, stream2) => f(value).run(stream2)))
  }
  bichain(s, f) {
    return new Parser(stream =>
      this.parse(stream).bichain(
        (value, stream2) => s(value).run(stream2),
        (value, stream2) => f(value).run(stream2)
      ))
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

const sequence = (list) =>
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

const not = (parser) =>
  parser.fold(
    (value, stream) => new Failure('not failed', stream),
    (value, stream) => new Success(stream.head(), stream.move(1)),
  )

const zeroOrMore = (parser) =>
  parser.bichain(
    (value) => zeroOrMore(parser).map(rest => [value].concat(rest)),
    (value) => always([])
  )

const oneOrMore = (parser) =>
  parser.chain(result =>
    zeroOrMore(parser).map(rest => [result].concat(rest)))

const chars = c =>
  oneOrMore(eq(c))
  .map(cs => cs.join(''))

const string = (str) =>
  sequence(str.split('').map(eq))
  .map(x => x.join(''))

const nOrMore = (n, parser) => (stream) =>
  sequence(Array(n).fill(parser))
  .chain((values) =>
    zeroOrMore(parser).map(extra => values.concat(extra)))

const between = (l, r) =>
  sequence([l, zeroOrMore(not(r)), r])
  .map(v => v[1])

// HERE!
const maybe = (parser) => (stream) =>
  parser.parse(stream)
  .bichain(
    (value) => always(value),
    (value, stream) => always(value)
  )

const sepBy = (sep, p) =>
  p.chain()

sepBy(sep, p)



peek
maybe
eof
notEof
