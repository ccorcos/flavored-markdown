import * as p from 'pcombs'
import { tokenOfType, untokenize } from './tokens'
import { inline } from './inline'

const endOfLine = p.either([p.end, tokenOfType('\n')])

const restOfLine =
  p.zeroOrMore(p.not(endOfLine))
  .append(endOfLine)
  .filter(x => x !== null)

const indentedBlock =
  p.zeroOrMore(
    p.either([
      tokenOfType('\n').map(v => [v]),
      tokenOfType('indent').thenRight(restOfLine),
    ])
  ).flatten()

export const fences =
  tokenOfType('```')
  .thenRight(restOfLine)
  .chain(lang =>
    p.zeroOrMore(restOfLine.where(v => v.length === 0 || v[0].type !== '```'))
    .flatten()
    .chain(children =>
      tokenOfType('```')
      .map(() => ({
        type: 'fences',
        lang: untokenize(lang).trim(),
        text: untokenize(children).trim(),
      }))
    )
  )

export const def =
  p.sequence([
    p.wrapLR(tokenOfType('['), tokenOfType(']')),
    tokenOfType(':'),
    restOfLine,
  ])
  .map(([name, _, value]) => ({
    type: 'def',
    name: untokenize(name).trim(),
    value: untokenize(value).trim(),
  }))

const all = (fn, list) =>
  list.reduce((acc, v) => acc && fn(v), true)

const flattenParagraph = children => {
  if (children.length === 1) {
    if (children[0].type === 'paragraph') {
      return children[0].children
    }
  }
  if (children.length > 1) {
    if (children[0].type === 'paragraph') {
      if (all(v => v.type === 'list', children.slice(1))) {
        return children[0].children.concat(children.slice(1))
      }
    }
  }
  return children
}

const listItem =
  p.either([
    tokenOfType('-'),
    tokenOfType('#.'),
  ])
  .then(restOfLine.concat(indentedBlock))
  .map(([start, children]) => ({
      type: 'listItem',
      ordered: start.type === '#.',
      children: flattenParagraph(block(children)),
    })
  )

export const list =
  p.oneOrMore(listItem)
  .map(children => ({
    type: 'list',
    ordered: children[0].ordered,
    children,
  }))

const blockquoteLine = tokenOfType('>').thenRight(restOfLine)

export const blockquote =
  p.oneOrMore(blockquoteLine)
  .flatten()
  .map(children => ({
    type: 'blockquote',
    children: block(children),
  }))

export const heading =
  tokenOfType('#s')
  .then(restOfLine)
  .map(([{length}, children]) => ({
    type: 'heading',
    size: length,
    children: inline(children)
  }))

const endOfParagraph =
  p.either([
    p.end,
    p.nOrMore(2, tokenOfType('\n')),
    p.where(t => !Boolean(t.raw)),
  ])

export const paragraph =
  p.oneOrMore(p.not(endOfParagraph))
  .thenLeft(p.maybe(p.nOrMore(2, tokenOfType('\n'))))
  .map(children => ({
    type: 'paragraph',
    children: inline(children),
  }))

// TODO: accordion
// + this is a question
// | this is the answer
// | that gets collapsed

const line = restOfLine.map(children => ({type: 'line', children}))

const precedence = [
  list,
  blockquote,
  heading,
  def,
  fences,
  line,
]

// TODO: need to separate paragraphs based on blank lines
const linesToParagraph =
  p.oneOrMore(tokenOfType('line'))
  .map(lines => lines.map(line => line.children))
  .flatten()
  .map(children => ({
    type: 'paragraph',
    children: inline(children),
  }))

export const block = (tokenList) =>
  p.scanOver(precedence)
  .over(p.scan(linesToParagraph))
  .run(tokenList).result()
