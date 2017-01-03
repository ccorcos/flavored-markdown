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
        p.string(c + c),
        // p.sequence(function*() {
        //   const {value} = yield p.string(c + c)
        //   yield p.peek(p.notChar('*'))
        //   return value
        // }),
      ])
    )
    const {value: right} = yield charRun(c)
    return left + inner.join('') + right
  })

export const _italic = charRunWrap('*')

export const italic = p.map(
  _italic,
  text => ({
    type: 'italic',
    children: p.parse(_inline(italic), text).value,
  })
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

export const _bold = doubleCharRunWrap('*')

export const bold = p.map(
  _bold,
  text => ({
    type: 'bold',
    children: p.parse(_inline(bold), text).value,
  })
)

export const _strikethrough = doubleCharRunWrap('~')

export const strikethrough = p.map(
  _strikethrough,
  text => ({
    type: 'strikethrough',
    children: p.parse(_inline(strikethrough), text).value,
  })
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

export const _code = wrapChar('`')

export const code = p.map(
  _code,
  text => ({
    type: 'code',
    value: text,
  })
)

export const _link = p.sequence(function*() {
  const {value: text} = yield wrapLeftRight('[', ']')
  const {value: url} = yield wrapLeftRight('(', ')')
  return {text, url}
})

export const link = p.map(
  _link,
  ({text, url}) => ({
    type: 'link',
    url,
    children: p.parse(_inline(link), text).value,
  })
)

export const image = p.sequence(function*() {
  yield p.char('!')
  const {value: {text, url}} = yield _link
  return {type: 'image', alt: text, url}
})

export const _deflink = p.sequence(function*() {
  const {value: text} = yield wrapLeftRight('[', ']')
  const {value: def} = yield wrapLeftRight('[', ']')
  return {text, def}
})

export const deflink = p.map(
  _deflink,
  ({text, def}) => ({
    type: 'deflink',
    def,
    children: p.parse(_inline(deflink), text).value,
  })
)

const olStart = p.sequence(function*() {
  yield p.digit
  yield p.string('. ')
})

const ulStart = p.string('- ')

// map over result with true if its ordered
const listStart = p.either([
  p.map(ulStart, () => false),
  p.map(olStart, () => true)
])

const listItemLine = p.sequence(function*() {
  const {value: spaces} = yield p.zeroOrMore(p.char(' '))
  const {value: ordered} = yield listStart
  const {value: chars} = yield p.zeroOrMore(p.item)
  return {
    indent: spaces.length,
    text: chars.join(''),
    ordered,
  }
})

const blank = p.map(
  p.sequence(function*() {
    yield p.zeroOrMore(p.char(' '))
    yield p.eof
  }),
  () => ''
)

const indentSize = 2

const nChars = (c, n) => Array(n).fill(c).join('')

const indentedMoreThan = n =>
  p.either([
    blank,
    p.sequence(function*() {
      yield p.string(nChars(' ', n + indentSize))
      const {value: text} = yield p.zeroOrMore(p.item)
      return text.join('').trim()
    })
  ])

export const _listItem = p.sequence(function*() {
  const {value: start} = yield p.chain(p.item, listItemLine)
  const {value: rest} = yield p.zeroOrMore(
    p.chain(p.item, indentedMoreThan(start.indent))
  )
  const lines = [start.text].concat(rest)
  return {
    ordered: start.ordered,
    lines,
  }
})

export const _list = p.oneOrMore(_listItem)

export const list = p.map(
  _list,
  items => ({
    type: 'list',
    ordered: items[0].ordered,
    children: items.map(({ordered, lines}) => ({
      type: 'listItem',
      ordered,
      children: lines => lines.length === 1
              ? [p.parse(inline, lines[0]).value]
              : p.parse(blocks, lines).value,
    }))
  })
)

export const fences = p.sequence(function*() {
  const {value: lang} = yield p.chain(p.item, p.sequence(function*() {
    yield p.string('```')
    const {value: lang} = yield p.zeroOrMore(p.item)
    return lang.join('').trim()
  }))
  const {value: codeLines} = yield p.zeroOrMore(
    p.chain(p.item, p.sequence(function*() {
      const {value: start} = yield p.notString('```')
      const {value: rest} = yield p.zeroOrMore(p.item)
      // console.log(rest)
      return start + rest.join('')
    }))
  )
  yield p.chain(p.item, p.string('```'))
  return {
    type: 'fences',
    language: lang,
    value: codeLines.join('\n').trim(),
  }
})

export const _heading = p.sequence(function*() {
  const {value: head} = yield p.oneOrMore(p.char('#'))
  const {value: rest} = yield p.zeroOrMore(p.item)
  const text = rest.join('').trim()
  return {size: head.length, text}
})

export const heading = p.map(
  _heading,
  ({size, text}) => ({
    type: 'heading',
    size,
    children: p.parse(inline, text).value
  })
)

export const hr = p.sequence(function*() {
  yield p.string('---')
  yield p.eof
  return {type: 'hr'}
})

export const def = p.sequence(function*() {
  const {value: name} = yield wrapLeftRight('[', ']')
  yield p.string(':')
  const {value: rest} = yield p.oneOrMore(p.item)
  return {
    type: 'def',
    name,
    value: rest.join('').trim(),
  }
})

const prefixed = parser =>
  p.sequence(function*() {
    yield parser
    const {value: text} = yield p.zeroOrMore(p.item)
    return text.join('').trim()
  })

export const _blockquote = p.map(
  p.oneOrMore(
    p.chain(
      p.item,
      prefixed(p.string('>'))
    )
  ),
  list => list.map(s => s.trim()).join('\n')
)

export const blockquote = p.map(
  _blockquote,
  text => ({
    type: 'blockquote',
    children: p.parse(inline, text).value
  })
)

const character = p.map(
  p.item,
  c => ({type: 'char', value: c})
)

const precedence = [
  code,
  image,
  link,
  deflink,
  bold,
  italic,
  strikethrough,
  character,
]

const isCharToken = ({type}) => type === 'char'

const charTokens = p.oneOrMore(p.itemIs(isCharToken))

const charTokensToTextToken = chars => ({
  type: 'text',
  value: chars.map(c => c.value).join('')
})

const slurpCharTokens = p.map(charTokens, charTokensToTextToken)

const charsToText = p.zeroOrMore(
  p.either([
    slurpCharTokens,
    p.item,
  ])
)

export const _inline = (after) => {
  const parsers = precedence.filter(x => x !== after)
  return p.map(
    p.zeroOrMore(p.either(parsers)),
    tokens => p.parse(charsToText, tokens).value
  )
}

export const inline = _inline()


// // clean up for windows, etc.
// const clean = string =>
//   string.replace(/\r\n|\r/g, '\n')
//         .replace(/\t/g, indentSize)
//         .replace(/\u00a0/g, ' ')
//         .replace(/\u2424/g, '\n');
//
//
// export const parse = (string) => {
//   const lines = clean(string).split('\n')
// }
//
//
//
// const inlineParsers = [
//   code,
//   bold,
//   italic,
//   strikethrough,
//   link,
//   deflink,
//   image,
// ]
//
// const blockParsers = [
//   list
//   heading,
//   hr,
//   def,
//   fences,
//   blockquote,
//   //table,
// ]
//
//
//
