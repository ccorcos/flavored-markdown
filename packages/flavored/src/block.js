import * as p from 'pcombs'
import { tokenOfType, tokenize } from './tokens'
import { inline } from './inline'

const endOfLine = p.either([p.end, tokenOfType('\n')])

const restOfLine = p.zeroOrMore(p.not(endOfLine)).append(endOfLine)

const indentedBlock =
  p.zeroOrMore(
    p.either([
      // blank line
      tokenOfType('\n').map(v => [v]),
      // intented line
      tokenOfType('indent').thenRight(restOfLine),
    ])
  ).flatten()

// TODO: enforce beginning of line
export const fences =
  p.wrap(tokenOfType('```'))
  .over(
    p.sequence([
      restOfLine,
      p.rest,
    ])
  )
  .map(([lang, children]) => ({
    type: 'fences',
    lang: untokenize(lang),
    code: untokenize(children),
  }))

export const def =
  p.sequence([
    p.wrapLR(tokenOfType('['), tokenOfType(']')),
    tokenOfType(':'),
    restOfLine,
  ])
  .map(([name, _, value]) => ({
    type: 'def',
    name: untokenize(name),
    url: untokenize(value),
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
      children: block(children)
    }))
  )

export const list =
  p.oneOrMore(listItem)
  .map(children => ({
    type: 'list',
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
  p.zeroMore(p.not(endOfParagraph))
  .append(endOfParagraph)
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

export const block = (tokenList) => p.scanOver(precedence)
