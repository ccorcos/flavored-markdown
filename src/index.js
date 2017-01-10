import * as p from './pcombs'

const charRun = c =>
  p.sequence(function*() {
    const {value} = yield p.oneOrMore(p.item(c))
    return value.slice(1).join('')
  })

const charRunWrap = c =>
  p.sequence(function*() {
    const {value: left} = yield charRun(c)
    const {value: inner} = yield p.oneOrMore(
      p.either([
        p.string('\\' + c),
        p.notItem(c),
        p.sequence(function*() {
          const {value} = yield p.string(c + c)
          yield p.peek(p.notItem('*'))
          return value
        }),
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
    yield p.item(c)
    const {value} = yield charRun(c)
    return value
  })

const doubleCharRunWrap = c =>
  p.sequence(function*() {
    const {value: left} = yield doubleCharRun(c)
    const {value: inner} = yield p.oneOrMore(
      p.either([
        p.string('\\' + c),
        p.notItem(c),
        p.sequence(function*() {
          const {value} = yield p.item(c)
          yield p.peek(p.notItem(c))
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
    yield p.item(l)
    const {value: text} = yield p.zeroOrMore(
      p.either([
        p.string('\\' + r),
        p.notItem(r),
      ])
    )
    yield p.item(r)
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
  yield p.item('!')
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
  const {value: spaces} = yield p.zeroOrMore(p.item(' '))
  const {value: ordered} = yield listStart
  const {value: chars} = yield p.zeroOrMore(p.any)
  return {
    indent: spaces.length,
    text: chars.join(''),
    ordered,
  }
})

const blank = p.map(
  p.sequence(function*() {
    yield p.zeroOrMore(p.item(' '))
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
      const {value: text} = yield p.zeroOrMore(p.any)
      return text.join('').trim()
    })
  ])

export const _listItem = p.sequence(function*() {
  const {value: start} = yield p.chain(p.any, listItemLine)
  const {value: rest} = yield p.zeroOrMore(
    p.chain(p.any, indentedMoreThan(start.indent))
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
  const {value: lang} = yield p.chain(p.any, p.sequence(function*() {
    yield p.string('```')
    const {value: lang} = yield p.zeroOrMore(p.any)
    return lang.join('').trim()
  }))
  const {value: codeLines} = yield p.zeroOrMore(
    p.chain(p.any, p.sequence(function*() {
      const {value: start} = yield p.notString('```')
      const {value: rest} = yield p.zeroOrMore(p.any)
      // console.log(rest)
      return start + rest.join('')
    }))
  )
  yield p.chain(p.any, p.string('```'))
  return {
    type: 'fences',
    language: lang,
    value: codeLines.join('\n').trim(),
  }
})

export const _heading = p.sequence(function*() {
  const {value: head} = yield p.oneOrMore(p.item('#'))
  const {value: rest} = yield p.zeroOrMore(p.any)
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
  const {value: rest} = yield p.oneOrMore(p.any)
  return {
    type: 'def',
    name,
    value: rest.join('').trim(),
  }
})

const prefixed = parser =>
  p.sequence(function*() {
    yield parser
    const {value: text} = yield p.zeroOrMore(p.any)
    return text.join('').trim()
  })

export const _blockquote = p.map(
  p.oneOrMore(
    p.chain(
      p.any,
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

const precedence = [
  code,
  image,
  link,
  deflink,
  bold,
  italic,
  strikethrough,
]














// TODO:
// we need to rewrite all of the inline parsers to take in a list of tokens
// and reduce them. then we need to run a single pass for each type of inline
// token.

const onePass = parser => {

}

const example = [
  {type: 'text', value: 'hello *'},
  {type: 'bold'},
  {type: 'text', value: ' yeah yeah*'},
  {type: 'link'},
]

const bold = () => {
  const c = '*'
  return p.sequence(function*() {
    const {value: left} = yield doubleCharRun(c)
    const {value: inner} = yield p.oneOrMore(
      p.either([
        p.string('\\' + c),
        p.notItem(c),
        p.sequence(function*() {
          const {value} = yield p.item(c)
          yield p.peek(p.notItem(c))
          return value
        })
      ])
    )
    const {value: right} = yield doubleCharRun(c)
    return left + inner.join('') + right
  })
}



export const bold = p.map(
  _bold,
  text => ({
    type: 'bold',
    children: p.parse(_inline(bold), text).value,
  })
)














export const _inline = (after) => {
  const parsers = precedence.slice(precedence.indexOf(after) + 1)
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


// approach 1: unfold tokens
// const italic = p.generate(function*() {
//   const {value: before} = yield p.zeroOrMore(notTextToken)
//   const {value: tokens} = yield p.chain(textToken, p.generate(function*() {
//     const {value: text} = yield zeroOrMore(p.notItem('*'))
//     const start = yield p.item('`')
//     if (start.fail) {
//       return [{value: {type: 'text', value: text}}]
//     }
//     const {value: inside} = yield zeroOrMore(p.notItem('*'))
//     const end = yield p.item('`')
//     if (end.fail) {
//       return [
//         {type: 'text', value: text},
//         {type: 'italic', incomplete: true, children: [
//           {type: 'text', value: inside},
//         ]}
//       ]
//     }
//     const {value: rest} = yield zeroOrMore(p.any)
//     return [
//       {type: 'text', value: text},
//       {type: 'italic', children: [
//         {type: 'text', value: inside},
//       ]},
//       {type: 'text', value: rest},
//     ]
//   }))
//   if (tokens[tokens.length - 1].incomplete) {
//     const {value: moreChildren} = yield p.zeroOrMore(notTextToken)
//     yield p.chain(textToken, p.generate(function*() {
//       const {value: inside} = yield zeroOrMore(p.notItem('*'))
//       const end = yield p.item('*')
//       if (end.fail) {
//         // of vey
//       }
//       // get everything after
//       // push children...
//     }))
//   } else {
//     return {stream: barf, value: tokens}
//   }
// })







// TODO

// Start over fresh. Use FlowType!

// different stream types:
// string stream and array stream should have their own concat methods
// so we dont have to keep mapping over zeroOrMore

// more functions:
// chars
// items
// nOrMore

const token = p.either([
  p.chars('*'),
  p.chars('#'),
  p.string('```'),
  p.string('---')
  p.string('~~')
  p.string('- '),
  p.any([p.digit, p.item(' ')]),
  p.nOrMore(2, p.item(' ')),
  p.item('!'),
  p.item('['),
  p.item(']'),
  p.item('('),
  p.item(')'),
  p.item('`'),
  p.item('\n'),
])

const tokenize = s => {
  const tokens = []
  let stream = s
  let acc = []
  while (stream.length !== 0) {
    const result = token(stream)
    if (result.fail) {
      acc.push(stream.head())
      stream = stream.move(1)
    } else {
      if (acc.length > 0) {
        tokens.push(acc.join(''))
        acc = []
      }
      tokens.push(result.value)
      stream = result.stream
    }
  }
  if (acc.length > 0) {
    tokens.push(acc.join(''))
  }
  return tokens
}

const code = p.sequence(function*() {
  yield p.item('`'),
  const {value} = yield p.zeroOrMore(p.notItem('`'))
  yield p.item('`')
  return {
    type: 'code',
    value: value.join(''),
  }
})

const onePass = parser =>
  p.zeroOrMore(p.either([parser, p.any]))
