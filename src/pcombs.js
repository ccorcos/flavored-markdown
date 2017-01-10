// parser combinators, a.k.a. pcombs
// inspired by https://github.com/bodil/eulalie

// Keep track of a string and a cursor to avoid having to chop up strings
export const Stream = (iterable, cursor=0) => ({
  iterable,
  cursor,
  length: iterable.length - cursor,
  head: () => iterable[cursor],
  move: distance => Stream(iterable, cursor + distance),
  slice: (start, end) => {
    if (cursor + (end || 0) > iterable.length) {
      throw new TypeError('index out of range')
    }
    return iterable.slice(
      cursor + start,
      end ? cursor + end : undefined
    )
  },
})

// a parser gets a stream and must return one of two things:
// success: {stream, value}
// fail: {stream, fail}

// emit a value without consuming the stream
export const unit = v => s => ({stream: s, value: v})

// fail with a message without consuming the stream
export const fail = m => s => ({stream: s, fail: m || true})

// consume one character
export const any = s => s.length > 0
                  ? {stream: s.move(1), value: s.head()}
                  : {stream: s, fail: 'any unexpected end of file'}

// map over a parser with a better error message
export const expected = (parser, message) => s => {
  const result = parser(s)
  if (result.fail) {
    return {
      stream: result.stream,
      fail: [message, result.fail].join('\n> ')
    }
  } else {
    return result
  }
}

// map over the resulting value of the parse
export const map = (parser, fn) => s => {
  const result = parser(s)
  if (result.fail) {
    return result
  }
  return {
    stream: result.stream,
    value: fn(result.value),
  }
}

// parse the result of the first parser with a second parser
export const chain = (parser, fn) => s => {
  const result = parser(s)
  if (result.fail) {
    return result
  }
  const inner = fn(Stream(result.value, 0))
  if (inner.fail) {
    return {
      fail: inner.fail,
      stream: s,
    }
  }
  return {
    stream: result.stream,
    value: inner.value,
  }
}

// consume a character given it passes the predicate function
export const is = predicate => s => {
  if (s.length > 0) {
    const c = s.head()
    return predicate(c)
         ? {stream: s.move(1), value: c}
         : {stream: s, fail: `is(predicate) does not match '${c}'`}
  } else {
    return {stream: s, fail: `is(predicate) unexpected end of file`}
  }
}

// parse a single item
export const item = c => expected(
  is(v => v === c),
  `item('${c}') did not match`
)

export const notItem = c => expected(
  is(v => v !== c),
  `notItem('${c}') not match`
)

// parse a digit
export const digit = expected(
  is(c => /^\d/.test(c)),
  `digit did not match`
)

// parse a string
export const string = str => s => {
  if (s.length >= str.length) {
    const sub = s.slice(0, str.length)
    return sub === str
         ? {stream: s.move(str.length), value: str}
         : {stream: s, fail: `string('${str}') is not '${sub}'`}
  } else {
    return {stream: s, fail: `string('${str}') unexpected end of file`}
  }
}

export const notString = str => s => {
  const end = s.length >= str.length ? str.length : s.length
  const sub = s.slice(0, end)
  return sub !== str
       ? {stream: s.move(end), value: sub}
       : {stream: s, fail: `notString('${str}') is '${sub}'`}
}

// match a regex against the stream
// WARNING: this is inefficient!
// http://stackoverflow.com/questions/41412117/how-to-match-regex-with-starting-index-in-the-middle-of-a-string
// make sure to use ^
export const regex = re => s => {
  const result = s.slice(0).match(re)
  if (result) {
    const value = result[0]
    return {
      stream: s.move(value.length),
      value,
    }
  } else {
    return {
      stream: s,
      fail: `regex(${re.toString()}) failed`,
    }
  }
}

// given a generator that yields parsers, iterate through calling next
// with the result of the previous parse until we return a final parse result
export const generate = generator => s => {
  const iter = generator()
  let result = {stream: s}
  while (true) {
    const next = iter.next(result)
    if (next.done) {
      return next.value
    }
    result = next.value(result.stream)
  }
}

// parse a sequence given generator that emits parsers
// exactly like generate, but fails for you if any parser fails and only
// requires you to return the value of a successful parse
export const sequence = generator => s => {
  const iter = generator()
  let result = {stream: s}
  while (true) {
    const next = iter.next(result)
    if (next.done) {
      return {stream: result.stream, value: next.value}
    }
    result = next.value(result.stream)
    if (result.fail) {
      return result
    }
  }
}

// parse either of the given parsers
export const either = parsers => s => {
  for (let i = 0; i < parsers.length; i++) {
    const parser = parsers[i]
    const result = parser(s)
    if (!result.fail) {
      return result
    }
  }
  return {fail: 'either did not match', stream: s}
}

// parse zero of more of a given parser
export const zeroOrMore = parser => s => {
  let stream = s
  const acc = []
  while (true) {
    const result = parser(stream)
    if (result.fail) {
      return {stream: result.stream, value: acc}
    }
    stream = result.stream
    acc.push(result.value)
  }
}

// parse one of more of a given parser
export const oneOrMore = parser => s => {
  const first = parser(s)
  if (first.fail) {
    return first
  }
  const rest = zeroOrMore(parser)(first.stream)
  return {
    stream: rest.stream,
    value: [first.value].concat(rest.value)
  }
}

// peek will parse ahead but will not consume anything
export const peek = parser => s => {
  const result = parser(s)
  if (result.fail) {
    return {stream: s, fail: result.fail}
  } else {
    return {stream: s, value: undefined}
  }
}

export const maybe = parser => s => {
  const result = parser(s)
  if (result.fail) {
    return {stream: s}
  } else {
    return result
  }
}

export const eof = s => s.length === 0
                 ? {stream: s}
                 : {stream: s, fail: 'eof not end of file'}

export const notEof = s => s.length > 0
                 ? {stream: s}
                 : {stream: s, fail: 'notEof is end of file'}

export const parse = (parser, string) => parser(Stream(string, 0))
