import * as p from 'pcombs'
import { tokenOfType, untokenize, tokensToText } from './tokens'

export const code =
  p.wrap(tokenOfType('`'))
  .map(children => ({
    type: 'code',
    text: untokenize(children).trim(),
  }))

export const link =
  p.sequence([
    p.wrapLR(tokenOfType('['), tokenOfType(']')),
    p.wrapLR(tokenOfType('('), tokenOfType(')')),
  ])
  .map(([children, url]) => ({
    type: 'link',
    url: untokenize(url).trim(),
    children: inlineAfter(link, children),
  }))

export const image =
  p.sequence([
    tokenOfType('!'),
    p.wrapLR(tokenOfType('['), tokenOfType(']')),
    p.wrapLR(tokenOfType('('), tokenOfType(')')),
  ])
  .map(([_, alt, url]) => ({
    type: 'image',
    alt: untokenize(alt).trim(),
    url: untokenize(url).trim(),
  }))

export const deflink =
  p.sequence([
    p.wrapLR(tokenOfType('['), tokenOfType(']')),
    p.wrapLR(tokenOfType('['), tokenOfType(']')),
  ])
  .map(([children, def]) => ({
    type: 'deflink',
    def: untokenize(def).trim(),
    children: inlineAfter(deflink, children),
  }))

export const strikethrough =
  p.wrap(tokenOfType('~~'))
  .map(children => ({
    type: 'strikethrough',
    children: inlineAfter(strikethrough, children),
  }))

export const underline =
  p.wrap(tokenOfType('__'))
  .map(children => ({
    type: 'underline',
    children: inlineAfter(underline, children),
  }))

export const italicBold = p.never('not implemented yet')

const precedence = [
  code,
  image,
  link,
  deflink,
  italicBold,
  strikethrough,
  underline,
  tokensToText,
]

export const inlineAfter = (parser, tokenList) =>
  p.scanOver(precedence.slice(precedence.indexOf(parser) + 1))
  .run(tokenList)
  .fold(
    v => v,
    e => {
      throw new Error(`Unexpected error: ${e}`)
    })

export const inline = tokenList => inlineAfter(null, tokenList)
