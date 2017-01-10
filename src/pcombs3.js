
// A Stream is an abstraction over strings and arrays so that we don't have to
// keep chopping them up everywhere eating up CPU.
class Stream {
  // An iterable is either a string or and array. The cursor is an index
  // that marks the beginning of the stream and the length is the amount left
  // in the Stream.
  constructor(iterable, cursor, length) {
    this.iterable = iterable
    this.cursor = cursor || 0
    this.length = length || iterable.length - cursor
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
  // Slice the stream returning a new stream. Same interface as Array.slice
  slice(start, stop) {
    if (stop && stop > this.length) {
      throw new TypeError('index out of range')
    }
    return new Stream(
      this.iterable,
      this.cursor + start,
      this.cursor + (stop || this.length)
    )
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
