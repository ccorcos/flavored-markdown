import * as p from './pcombs'

const charRun = c =>
  p.sequence(function*() {
    const {value} = yield p.oneOrMore(p.char(c))
    return value.slice(1).join('')
  })

const charRunWrap = c =>
  p.sequence(function*() {
    const {value: left} = yield charRun(c)
    const {value: inner} = yield p.oneOrMore(
      p.either([
        p.string('\\' + c),
        p.notChar(c),
      ])
    )
    const {value: right} = yield charRun(c)
    return left + inner.join('') + right
  })

export const italic = p.map(
  charRunWrap('*'),
  text => ({type: 'italic', text})
)

const doubleCharRun = c =>
  p.sequence(function*() {
    yield p.char(c)
    const {value} = yield charRun(c)
    return value
  })

const doubleCharRunWrap = c =>
  p.sequence(function*() {
    const {value: left} = yield doubleCharRun(c)
    const {value: inner} = yield p.oneOrMore(
      p.either([
        p.string('\\' + c),
        p.notChar(c),
        p.sequence(function*() {
          const {value} = yield p.char(c)
          yield p.peek(p.notChar(c))
          return value
        })
      ])
    )
    const {value: right} = yield doubleCharRun(c)
    return left + inner.join('') + right
  })

export const bold = p.map(
  doubleCharRunWrap('*'),
  text => ({type: 'bold', text})
)
export const strikethrough = p.map(
  doubleCharRunWrap('~'),
  text => ({type: 'strikethrough', text})
)

const wrapLeftRight = (l, r) =>
  p.sequence(function*() {
    yield p.char(l)
    const {value: text} = yield p.zeroOrMore(
      p.either([
        p.string('\\' + r),
        p.notChar(r),
      ])
    )
    yield p.char(r)
    return text.join('')
  })

const wrapChar = c => wrapLeftRight(c, c)

export const code = p.map(
  wrapChar('`'),
  value => ({type: 'code', value})
)

export const link = p.sequence(function*() {
  const {value: text} = yield wrapLeftRight('[', ']')
  const {value: url} = yield wrapLeftRight('(', ')')
  return {type: 'link', text, url}
})

export const image = p.sequence(function*() {
  yield p.char('!')
  const {value: {text, url}} = yield link
  return {type: 'image', alt: text, url}
})

export const heading = p.sequence(function*() {
  yield p.zeroOrMore(p.char(' '))
  const {value: head} = yield p.oneOrMore(p.char('#'))
  yield p.zeroOrMore(p.char(' '))
  const {value: text} = yield p.zeroOrMore(p.notChar('\n'))
  yield p.maybe(p.char('\n'))
  return {type: 'heading', size: head.length, text: text.join('').trim()}
})

export const hr = p.sequence(function*() {
  yield p.string('---')
  yield p.either([
    p.char('\n'),
    p.eof,
  ])
  return {type: 'hr'}
})

export const def = p.sequence(function*() {
  const {value: name} = yield wrapLeftRight('[', ']')
  yield p.string(': ')
  const {value} = yield p.oneOrMore(p.notChar('\n'))
  yield p.maybe(p.char('\n'))
  return {type: 'def', name, value: value.join('').trim()}
})

export const deflink = p.sequence(function*() {
  const {value: text} = yield wrapLeftRight('[', ']')
  const {value: def} = yield wrapLeftRight('[', ']')
  return {type: 'deflink', text, def}
})

export const fences = p.sequence(function*() {
  yield p.string('```')
  const {value: lang} = yield p.zeroOrMore(p.notChar('\n'))
  const {value: inner} = yield p.oneOrMore(
    p.either([
      p.notChar('`'),
      p.sequence(function*() {
        yield p.peek(p.notString('```'))
        const {value} = yield p.item
        return value
      })
    ])
  )
  yield p.string('```')
  return {
    type: 'fences',
    language: lang.join('').trim(),
    value: inner.join('').trim(),
  }
})

// const indent = p.sequence(function*() {
//   const {value} = yield p.zeroOrMore(p.char(' '))
//   const {value: text} = yield p.zeroOrMore(p.notChar('\n'))
//   return {text: text.join('').trim(), size: value.length}
// })
//
// const prefixed = parser =>
//   p.sequence(function*() {
//     yield parser
//     const {value: text} = yield p.zeroOrMore(p.notChar('\n'))
//     return text.join('').trim()
//   })
//
// const blockquote = prefixed('> ')
//
// const unorderedList = p.either([
//   prefixed(p.string('- ')),
//   prefixed(p.string('* ')),
//   prefixed(p.string('+ ')),
// ])
//
// const orderedList = prefixed(
//   p.sequence(function*() {
//     yield p.oneOrMore(p.digit)
//     yield p.either([
//       p.char(')'),
//       p.char('.'),
//     ])
//     yield p.char(' ')
//   })
// )


// const precedence = [
//   p.map(star2, merge({type: 'bold'})),
//   star,
//   underscore2,
//   underscore,
//   tilde2,
//   tilde,
//   tick,
//   image,
//   link,
//   deflink,
// ]
//
// // TODO we need to know what token we're getting back!
// const inline = p.sequence(function*() {
//   const {which} = p.either(precedence)
//   // tail call to recursively parse the inside with a given precedence
// })
