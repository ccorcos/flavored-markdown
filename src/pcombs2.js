
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
  constructor(value, stream, state) {
    this.value = value
    this.stream = stream
    this.state = state
  }
  map(f) {
    return new Success(f(this.value), this.stream, this.state)
  }
  chain(f) {
    return f(this.value, this.stream, this.state)
  }
  fold(f, s) {
    return s(this.value, this.stream, this.state)
  }
}

class Failure {
  constructor(value, stream, state) {
    this.value = value
    this.stream = stream
    this.state = state
  }
  map(f) {
    return this
  }
  chain(f) {
    return this
  }
  fold(f, s) {
    return f(this.value, this.stream, this.state)
  }
}

class Parser {
  constructor(parse, state) {
    this.parse = parse
    this.state = state
  }
  run(stream, state) {
    return this.parse(stream, state)
  }
  map(f) {
    return new Parser(stream =>
      this.parse(stream, this.state).map(f))
  }
  chain(f) {
    return new Parser(stream =>
      this.parse(stream, this.state)
          .chain((value, stream, state) => f(value).run(stream, state)))
  }
}

const always = (value) => (stream, state) => new Success(value, stream, state)

const never = (value) => (stream, state) => new Failure(value, stream, state)

const any = (stream, state) => new Success(stream.head(), stream.move(1), state)

// any
// eq('x')
// where(x => x === 'c')
// sequence([p1, p2, p3])
//


const string = str => sequence(str.split('')).map(x => x.join(''))
