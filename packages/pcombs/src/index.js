// A Stream is an abstraction over strings and arrays so that we don't have to
// keep chopping them up everywhere eating up CPU. An iterable is either a
// string or an array. The cursor is an index that marks the beginning of the
// stream and the length is the amount left in the Stream.
export class Stream {
  constructor(iterable, cursor, length) {
    this.iterable = iterable
    this.cursor = cursor || 0
    this.length = length === undefined
                ? iterable.length - this.cursor
                : length
  }
  // Get the first value from the iterable.
  head() {
    if (this.length <= 0) {
      throw new TypeError('index out of range')
    }
    return this.iterable[this.cursor]
  }
  // Consume the stream by moving the cursor.
  move(distance) {
    return new Stream(
      this.iterable,
      this.cursor + distance,
      this.length - distance
    )
  }
  // Same interface as Array.slice but returns a new Stream
  slice(start, stop) {
    if (stop < start) {
      throw new Error('stop < start')
    }
    if (stop && stop > this.length) {
      throw new TypeError('index out of range')
    }
    return new Stream(
      this.iterable,
      this.cursor + start,
      (stop || this.length) - start
    )
  }
}

// The Result of a parser should either be Success of Failure which represents
// a disjoint type just like an Either.
export class Result {
  constructor(value, stream) {
    this.value = value
    this.stream = stream
  }
}

export class Success extends Result {
  map(fn) {
    return new Success(fn(this.value), this.stream)
  }
  bimap(s, f) {
    return new Success(s(this.value), this.stream)
  }
  chain(fn) {
    return fn(this.value, this.stream)
  }
  fold(s, f) {
    return s(this.value, this.stream)
  }
  result() {
    return this.value
  }
}

export class Failure extends Result {
  map(fn) {
    return this
  }
  bimap(s, f) {
    return new Failure(f(this.value), this.stream)
  }
  chain(fn) {
    return this
  }
  fold(s, f) {
    return f(this.value, this.stream)
  }
  result() {
    throw new Error(`Failed parse ${this.value}`)
  }
}

// A Parser contains a function that parses a stream but provides functions for
// mapping and chaining over the Result.
export class Parser {
  constructor(parse) {
    this.parse = parse
  }
  run(iterable) {
    if (iterable instanceof Stream) {
      return this.parse(iterable)
    } else {
      return this.parse(new Stream(iterable))
    }
  }
  map(f) {
    return new Parser(stream => this.parse(stream).map(f))
  }
  bimap(s, f) {
    return new Parser(stream => this.parse(stream).bimap(s, f))
  }
  chain(f) {
    return new Parser(stream => this.parse(stream).chain((v, s) => f(v).run(s)))
  }
  fold(s, f) {
    return new Parser(stream => this.parse(stream).fold(s, f))
  }
  over(p) {
    return this.chain(v => p.run(v).fold(always, never))
  }
  filter(f) {
    return this.map(vs => vs.filter(f))
  }
  reduce(f, i) {
    return this.map(vs => vs.reduce(f, i))
  }
  flatten() {
    return this.reduce((a,b) => a.concat(b), [])
  }
  append(p) {
    return this.chain(vs => p.map(v => vs.concat([v])))
  }
  concat(p) {
    return this.chain(xs => p.map(ys => xs.concat(ys)))
  }
  then(p) {
    return this.chain(l => p.map(r => [l, r]))
  }
  thenLeft(p) {
    return this.chain(l => p.map(() => l))
  }
  thenRight(p) {
    return this.chain(() => p)
  }
  where(f) {
    return this.chain(v =>
      f(v) ? always(v)
           : never(`.where predicate did not match ${v}`)
    )
  }
  static of(value) {
    return new Parser((stream) => new Success(value, stream))
  }
  expected(value) {
    return this.bimap(
      x => x,
      inside => [value, inside]
    )
  }
}

export const always = Parser.of

export const never = value => new Parser(stream => new Failure(value, stream))

export const any = new Parser(stream =>
  stream.length > 0
    ? new Success(stream.head(), stream.move(1))
    : new Failure('any: unexpected end', stream))

export const where = f => any.where(f)

export const end = new Parser(stream =>
  stream.length === 0
    ? new Success(null, stream.move(1))
    : new Failure(`end: expected end`, stream))

export const whereEq = value =>
  where(x => x === value)
  .expected(`whereEq: did not equal ${value}`)

export const sequence = list =>
  list.reduce((acc, parser) => acc.append(parser), always([]))
  .expected('sequence: failed')

export const generate = generator =>
  new Parser(stream => {
    const iter = generator()
    const step = result =>
      result.done ? always(result.value)
                  : result.value.chain(v => step(iter.next(v)))
    return step(iter.next()).run(stream)
  })

export const either = list =>
  new Parser(stream => {
    for (let i = 0; i < list.length; i++) {
      const parser = list[i]
      const result = parser.run(stream)
      if (result instanceof Success) {
        return result
      }
    }
    return new Failure('either: failed', stream)
  })

export const not = parser =>
  new Parser(stream =>
    parser.run(stream)
    .fold(
      (value, s) => new Failure('not: failed', stream),
      (value, s) =>
        stream.length > 0
        ? new Success(stream.head(), stream.move(1))
        : new Failure('not: unexpected end', stream)))

export const zeroOrMore = parser =>
  new Parser(stream =>
    parser.run(stream)
    .fold(
      (value, s) => zeroOrMore(parser).map(rest => [value].concat(rest)).run(s),
      (value, s) => new Success([], stream)))

export const oneOrMore = parser =>
  parser.chain(v => zeroOrMore(parser).map(vs => [v].concat(vs)))

export const nOrMore = (n, parser) =>
  sequence(Array(n).fill(parser)).concat(zeroOrMore(parser))

export const between = (l, p, r) => sequence([l, p, r]).map(v => v[1])

export const sepBy = (sep, parser) =>
  parser.chain(value =>
    maybe(sep)
    .chain(found =>
      found
        ? sepBy(sep, parser).map(rest => [value].concat(rest))
        : always([value])))

export const maybe = parser =>
  new Parser(stream =>
    parser.run(stream)
    .fold(
      (v, s) => new Success(v, s),
      (v) => new Success(null, stream)))

export const lookahead = parser =>
  new Parser(stream =>
    parser.run(stream)
    .fold(
      (v) => new Success(v, stream),
      (v) => new Failure(v, stream)))

export const chars = c => oneOrMore(whereEq(c)).map(cs => cs.join(''))

export const string = (str) =>
  sequence(str.split('').map(whereEq)).map(x => x.join(''))

export const digit =
  either([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => whereEq(d.toString())))

// scan a parser across a stream
export const scan = parser => zeroOrMore(either([parser, any]))

export const scanOver = parsers =>
  parsers.reduce(
    (acc, parser) => acc.over(scan(parser)),
    scan(any)
  )

export const wrapLR = (l, r) => between(l, zeroOrMore(not(r)), r)

export const wrap = (p) => wrapLR(p, p)

export const rest = zeroOrMore(any)
