// parser combinators, a.k.a. pcombs
// inspired by https://github.com/bodil/eulalie

// Keep track of a string and a cursor to avoid having to chop up strings
export const Stream = (string, cursor=0) => Object.freeze({
  string,
  cursor,
  length: string.length - cursor,
  slice: (start, end) => {
    if (cursor + (end || 0) > string.length) {
      throw new TypeError('index out of range')
    }
    return string.slice(
      cursor + start,
      end ? cursor + end : undefined
    )
  },
  move: distance => Stream(string, cursor + distance),
})

// a parser gets a stream and must return one of two things:
// success: {stream, value}
// fail: {stream, fail}

// emit a value without consuming the stream
export const unit = v => s => ({stream: s, value: v})

// fail with a message without consuming the stream
export const fail = m => s => ({stream: s, fail: m || true})

// consume one character
export const item = s => s.length > 0
                  ? {stream: s.move(1), value: s.slice(0,1)}
                  : {stream: s, fail: 'item unexpected end of file'}

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

// consume a character given it passes the predicate function
export const charIs = predicate => s => {
  if (s.length > 0) {
    const c = s.slice(0,1)
    return predicate(c)
         ? {stream: s.move(1), value: c}
         : {stream: s, fail: `charIs(${predicate}) does not match '${c}'`}
  } else {
    return {stream: s, fail: `charIs(${predicate}) unexpected end of file`}
  }
}

// parse a single character
export const char = c => expected(
  charIs(v => v === c),
  `char('${c}') did not match'`
)

export const notChar = c => expected(
  charIs(v => v !== c),
  `notChar('${c}') not match`
)

// parse a digit
export const digit = expected(
  charIs(c => /^\d/.test(c)),
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
  if (s.length > str.length) {
    const sub = s.slice(0, str.length)
    return sub !== str
         ? {stream: s.move(str.length), value: str}
         : {stream: s, fail: `notString('${str}') is '${sub}'`}
  } else {
    return {stream: s, fail: `notString('${str}') unexpected end of file`}
  }
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

// parse a sequence given generator that emits parsers
export const sequence = generator => s => {
  const iter = generator()
  let value = undefined
  let stream = s
  while (true) {
    const next = iter.next({stream, value})
    if (next.done) {
      return {stream, value: next.value}
    }
    const result = next.value(stream)
    if (result.fail) {
      return result
    }
    stream = result.stream
    value = result.value
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

export const eof = s => s.length === 0
                 ? {stream: s}
                 : {stream: s, fail: 'eof not end of file'}

export const parse = (parser, string) => parser(Stream(string, 0))