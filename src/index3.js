import * as p from './pcombs3'

export const onePass = parser =>
  p.zeroOrMore(p.either([parser, p.any]))

export const multiplePasses = parsers =>
  parsers.map(onePass).reduce((acc, parser) =>
    acc.chain(inside => parser.run(inside).fold(p.always, p.never)))

export const tokenize = p.either([
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

const type = v => p.where(t => t.type === v)

export const text =
  p.oneOrMore(p.where(t => t.type === 'char'))
  .map(list => ({
    type: 'text',
    raw: list.map(c => c.raw).join(''),
  }))

export const fences =
  p.between(
    p.where(({type}) => type === 'fence'),
    p.zeroOrMore(p.not(p.where(({type}) => type === 'fence'))),
    p.where(({type}) => type === 'fence')
  ).map(children => ({
    type: 'fences',
    raw: children.map(x => x.raw).join(''),
  }))



// export const italic = p.map(
// export const bold = p.map(
// export const strikethrough = p.map(
// export const code = p.map(
// export const link = p.map(
// export const image = p.sequence(function*() {
// export const deflink = p.map(

// export const list = p.map(
// export const fences = p.sequence(function*() {
// export const heading = p.map(
// export const hr = p.sequence(function*() {
// export const def = p.sequence(function*() {
// export const blockquote = p.map(
// export const bold = p.map(
// export const inline = _inline()
