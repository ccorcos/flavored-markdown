import * as p from './pcombs3'

const token = p.either([
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
  p.any.map(raw => ({type: 'char', raw}))
])

export const tokenize = p.zeroOrMore(token)

