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
    return new Parser(stream =>
      this.parse(stream).map(f))
  }
  bimap(s, f) {
    return new Parser(stream =>
      this.parse(stream).bimap(s, f))
  }
  chain(f) {
    return new Parser(stream =>
      this.parse(stream)
      .chain((v, s) => f(v).run(s)))
  }
  fold(s, f) {
    return new Parser(stream =>
      this.parse(stream).fold(s, f))
  }
  bichain(s, f) {
    return new Parser(stream =>
      this.parse(stream).fold(
        (v, s) => s(v).run(s),
        (v, s) => f(v).run(s)
      ))
  }
  static of(value) {
    return new Parser((stream) =>
      new Success(value, stream))
  }
  expected(value) {
    return this.bimap(
      x => x,
      inside => [value, inside]
    )
  }
}

export const always = Parser.of

export const never = value =>
  new Parser(stream =>
    new Failure(value, stream))

export const any = new Parser(stream =>
  stream.length > 0
    ? new Success(stream.head(), stream.move(1))
    : new Failure('any: unexpected end', stream))

export const end = new Parser(stream =>
  stream.length === 0
    ? new Success(null, stream)
    : new Failure(`end: expected end but found ${stream.head()}`, stream))

export const where = predicate =>
  new Parser(stream => {
    if (stream.length > 0) {
      const value = stream.head()
      if (predicate(value)) {
        return new Success(value, stream.move(1))
      } else {
        return new Failure(`where: predicate did not match ${value}`, stream)
      }
    } else {
      return new Failure('where: unexpected end', stream)
    }
  })

export const whereEq = value =>
  where(x => x === value)
  .expected(`whereEq: did not equal ${value}`)

export const sequence = list =>
  list.slice(1).reduce(
    (acc, parser) =>
      acc.chain(values =>
        parser.map(value =>
          value === null
            ? values
            : values.concat([value]))),
    list[0].map(value =>
      value === null
        ? []
        : [value]))
  .expected('sequence: failed')

export const either = list =>
  list.slice(1).reduce(
    (acc, parser) =>
      acc.bichain(
        v => always(v),
        v => parser),
    list[0])
  .expected('either: failed')

export const not = parser =>
  parser.fold(
    (value, stream) => new Failure('not: failed', stream),
    (value, stream) => new Success(stream.head(), stream.move(1)))

export const zeroOrMore = parser =>
  parser.bichain(
    value => zeroOrMore(parser).map(rest => [value].concat(rest)),
    value => always([]))

export const oneOrMore = parser =>
  parser.chain(result =>
    zeroOrMore(parser).map(rest => [result].concat(rest)))

export const nOrMore = (n, parser) =>
  sequence(Array(n).fill(parser))
  .chain(values =>
    zeroOrMore(parser).map(more => values.concat(more)))

export const between = (l, p, r) =>
  sequence([l, p, r]).map(v => v[1])

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

export const peek = parser =>
  new Parser(stream =>
    parser.run(stream)
    .fold(
      (v) => new Success(v, stream),
      (v) => new Failure(v, stream)))

export const chars = c =>
  oneOrMore(whereEq(c))
  .map(cs => cs.join(''))

export const string = (str) =>
  sequence(str.split('').map(eq))
  .map(x => x.join(''))
