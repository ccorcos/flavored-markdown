import * as p from './pcombs3'

export const onePass = parser =>
  p.zeroOrMore(p.either([parser, p.any]))

export const multiplePasses = parsers =>
  parsers.map(onePass).reduce((acc, parser) =>
    acc.chain(inside => parser.run(inside).fold(p.always, p.never)))

export const tokenize = p.either([
  p.whereEq('\\').chain(() => p.any).map(raw => ({type: 'char', raw})),
  p.chars('*').map(raw => ({type: 'stars', length: raw.length, raw})),
  p.chars('#').map(raw => ({type: 'heading', length: raw.length, raw})),
  p.string('```').map(raw => ({type: 'fence', raw})),
  p.string('---').map(raw => ({type: 'hr', raw})),
  p.string('~~').map(raw => ({type: 'del', raw})),
  p.string('- ').map(raw => ({type: 'ul', raw})),
  p.sequence([p.digit, p.whereEq('.'), p.whereEq(' ')]).map(raw => ({type: 'ol', raw})),
  p.oneOrMore(p.string('  ')).map(raw => ({type: 'indent', size: raw.length, raw: raw.join('')})),
  p.whereEq('!').map(raw => ({type: '!', raw})),
  p.whereEq('[').map(raw => ({type: '[', raw})),
  p.whereEq(']').map(raw => ({type: ']', raw})),
  p.whereEq('(').map(raw => ({type: '(', raw})),
  p.whereEq(')').map(raw => ({type: ')', raw})),
  p.whereEq('`').map(raw => ({type: '`', raw})),
  p.whereEq('\n').map(raw => ({type: '\n', raw})),
  p.any.map(raw => ({type: 'char', raw})),
])

const tokenType = v => p.where(t => t.type === v)
const untokenize = list => list.map(c => c.raw).join('')

export const text =
  p.oneOrMore(tokenType('char'))
  .map(chars => ({
    type: 'text',
    raw: untokenize(chars),
  }))

const wrapLR = (l, r) => p.between(l, p.zeroOrMore(p.not(r)), r)

const wrap = (t) => wrapLR(t, t)

const tokenWrapLR = (l, r) => wrapLR(tokenType(l), tokenType(r))

const tokenWrap = t => tokenWrapLR(t, t)

// TODO: recursively parse inline
const inline = x => x

export const fences =
  tokenWrap('fence')
  .map(children => ({
    type: 'fences',
    raw: untokenize(children),
  }))

export const code =
  tokenWrap('`')
  .map(children => ({
    type: 'code',
    raw: untokenize(children),
  }))

export const link =
  p.sequence([
    tokenWrapLR('[', ']').map(inline),
    tokenWrapLR('(', ')'),
  ])
  .map(([children, url]) => ({
    type: 'link',
    url: untokenize(url),
    children,
  }))

export const image =
  tokenType('!')
  .chain(() => link)
  .map(({url, children}) => ({
    type: 'image',
    alt: untokenize(children),
    url,
  }))

export const deflink =
  p.sequence([
    tokenWrapLR('[', ']').map(inline),
    tokenWrapLR('[', ']'),
  ])
  .map(([children, def]) => ({
    type: 'deflink',
    children,
    def: untokenize(def),
  }))

export const strikethrough =
  tokenWrap('del')
  .map(children => ({
    type: 'fences',
    raw: inline(children),
  }))


// export const italic = p.map(
// export const bold = p.map(

// export const list = p.map(
// export const fences = p.sequence(function*() {
// export const heading = p.map(
// export const hr = p.sequence(function*() {
// export const def = p.sequence(function*() {
// export const blockquote = p.map(
// export const bold = p.map(
// export const inline = _inline()
