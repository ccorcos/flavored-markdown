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

// TODO: enforce beginning of line
// export const fences =
//   p.wrap(tokenOfType('```'))
//   .over(
//     p.sequence([
//       restOfLine,
//       p.rest,
//     ])
//   )
//   .map(([lang, children]) => ({
//     type: 'fences',
//     lang: untokenize(lang).trim(),
//     code: untokenize(children).trim(),
//   }))

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

const listItem =
  p.either([
    tokenOfType('-'),
    tokenOfType('#.'),
  ])
  .then(restOfLine.concat(indentedBlock),)
  .map(([start, children]) => ({
      type: 'listItem',
      ordered: start.type === '#.',
      children: block(children),
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
    p.nOrMore(2, tokenOfType('\n'))
  ])

export const paragraph =
  p.zeroOrMore(p.not(endOfParagraph))
  .thenLeft(endOfParagraph)
  .map(children => ({
    type: 'paragraph',
    children: inline(children),
  }))

// TODO: accordion
// + this is a question
// | this is the answer
// | that gets collapsed

const precedence = [
  list,
  blockquote,
  heading,
  def,
  fences,
  paragraph,
]

export const block = (tokenList) =>
  p.scanOver(precedence).run(tokenList).result()
