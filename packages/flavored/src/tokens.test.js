import test from 'ava'
import { tokenize, untokenize } from './tokens'

const md = [
  'this is text',
  '***',
  '## __blah__',
  '```',
  '---',
  '~~',
  '-',
  '2.',
  '  ',
  '![]()>:`code`\n',
  '\\!\\\n',
].join('')

const tokenized = [
  {type: 'text', raw: 'this is text'},
  {type: '*s', length: 3, raw: '***'},
  {type: '#s', length: 2, raw: '##'},
  {type: 'text', raw: ' '},
  {type: '__', raw: '__'},
  {type: 'text', raw: 'blah'},
  {type: '__', raw: '__'},
  {type: '```', raw: '```'},
  {type: '---', raw: '---'},
  {type: '~~', raw: '~~'},
  {type: '-', raw: '-'},
  {type: '#.', raw: '2.'},
  {type: 'indent', raw: '  '},
  {type: '!', raw: '!'},
  {type: '[', raw: '['},
  {type: ']', raw: ']'},
  {type: '(', raw: '('},
  {type: ')', raw: ')'},
  {type: '>', raw: '>'},
  {type: ':', raw: ':'},
  {type: '`', raw: '`'},
  {type: 'text', raw: 'code'},
  {type: '`', raw: '`'},
  {type: '\n', raw: '\n'},
  {type: 'text', raw: '\\!\\\n'},
]

test('tokenize', t => {
  const result = tokenize(md)

  // const util = require('util')
  // console.log(util.inspect(result, {depth: 99}))
  // console.log(util.inspect(tokenized, {depth: 99}))

  t.deepEqual(result, tokenized)
})

test('untokenize', t => {
  t.is(untokenize(tokenized), md)
})
