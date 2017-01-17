import * as p from 'pcombs'

// create tokens from text
export const tokens = p.either([
  p.whereEq('\\').then(p.any).map(raw => ({type: 'char', raw: raw.join('')})),
  p.chars('*').map(raw => ({type: '*s', length: raw.length, raw})),
  p.chars('#').map(raw => ({type: '#s', length: raw.length, raw})),
  p.string('__').map(raw => ({type: '__', raw})),
  p.string('```').map(raw => ({type: '```', raw})),
  p.string('---').map(raw => ({type: '---', raw})),
  p.string('~~').map(raw => ({type: '~~', raw})),
  p.string('-').map(raw => ({type: '-', raw})),
  p.digit.then(p.whereEq('.')).map(raw => ({type: '#.', raw: raw.join('')})),
  p.string('  ').map(raw => ({type: 'indent', raw})),
  p.whereEq('!').map(raw => ({type: '!', raw})),
  p.whereEq('[').map(raw => ({type: '[', raw})),
  p.whereEq(']').map(raw => ({type: ']', raw})),
  p.whereEq('(').map(raw => ({type: '(', raw})),
  p.whereEq(')').map(raw => ({type: ')', raw})),
  p.whereEq('>').map(raw => ({type: '>', raw})),
  p.whereEq(':').map(raw => ({type: ':', raw})),
  p.whereEq('`').map(raw => ({type: '`', raw})),
  p.whereEq('\n').map(raw => ({type: '\n', raw})),
  p.any.map(raw => ({type: 'char', raw})),
])

// given a list of tokens, convert back to raw text
export const untokenize = list => list.map(c => c.raw).join('')

// parse for tokens
export const tokenOfType = v => p.where(t => t.type === v)

// convert char tokens to text tokens
export const charsToText =
  p.oneOrMore(tokenOfType('char'))
  .map(children => ({
    type: 'text',
    raw: untokenize(children),
  }))

// convert all left over raw tokens to text
export const tokensToText =
  p.oneOrMore(p.where(t => Boolean(t.raw)))
  .map(children => ({
    type: 'text',
    raw: untokenize(children),
  }))

// tokenize a stream of text
// TODO: tokenize should be a function just like inline
export const tokenize = p.scanOver([tokens, charsToText])
