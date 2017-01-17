import test from 'ava'
import * as i from './inline'

test('code', t => {
  i.code
  .run([
    {type: '`', raw: '`'},
    {type: 'text', raw: 'function'},
    {type: '(', raw: '('},
    {type: ')', raw: ')'},
    {type: '`', raw: '`'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'code',
      text: 'function()'
    }),
    v => t.fail()
  )
})

test('link', t => {
  i.link
  .run([
    {type: '[', raw: '['},
    {type: 'text', raw: 'name'},
    {type: ']', raw: ']'},
    {type: '(', raw: '('},
    {type: 'text', raw: 'url'},
    {type: ')', raw: ')'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'link',
      url: 'url',
      children: [{type: 'text', raw: 'name'}]
    }),
    v => t.fail()
  )
})

test('image', t => {
  i.image
  .run([
    {type: '!', raw: '!'},
    {type: '[', raw: '['},
    {type: 'text', raw: 'name'},
    {type: ']', raw: ']'},
    {type: '(', raw: '('},
    {type: 'text', raw: 'url'},
    {type: ')', raw: ')'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'image',
      alt: 'name',
      url: 'url',
    }),
    v => t.fail()
  )
})

test('deflink', t => {
  i.deflink
  .run([
    {type: '[', raw: '['},
    {type: 'text', raw: 'name'},
    {type: ']', raw: ']'},
    {type: '[', raw: '['},
    {type: 'text', raw: 'def'},
    {type: ']', raw: ']'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'deflink',
      def: 'def',
      children: [{type: 'text', raw: 'name'}]
    }),
    v => t.fail()
  )
})

test('strikethrough', t => {
  i.strikethrough
  .run([
    {type: '~~', raw: '~~'},
    {type: 'text', raw: 'hello'},
    {type: '~~', raw: '~~'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'strikethrough',
      children: [{type: 'text', raw: 'hello'}]
    }),
    v => t.fail()
  )
})

test('underline', t => {
  i.underline
  .run([
    {type: '__', raw: '__'},
    {type: 'text', raw: 'hello'},
    {type: '__', raw: '__'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'underline',
      children: [{type: 'text', raw: 'hello'}]
    }),
    v => t.fail()
  )
})

// test('italicBold', t => {
//   i.italicBold
//   .run([
//     {type: '__', raw: '__'},
//     {type: 'text', raw: 'hello'},
//     {type: '__', raw: '__'},
//   ])
//   .fold(
//     v => t.deepEqual({
//       type: 'italicBold',
//       children: [{type: 'text', raw: 'hello'}]
//     }),
//     v => t.fail()
//   )
// })

test('inline', t => {

  const tokenList = [
    {type: '__', raw: '__'},
    {type: 'text', raw: 'underline'},
    {type: '~~', raw: '~~'},
    {type: 'text', raw: 'and strikethrough'},
    {type: '~~', raw: '~~'},
    {type: '`', raw: '`'},
    {type: 'text', raw: 'code'},
    {type: '__', raw: '__'},
    {type: 'text', raw: 'precedence'},
    {type: '`', raw: '`'},
    {type: '__', raw: '__'},
  ]

  const expected = [
    {
      type: 'underline',
      children: [
        {type: 'text', raw: 'underline'},
        {
          type: 'strikethrough',
          children: [
            {type: 'text', raw: 'and strikethrough'},
          ]
        },
        {type: 'code', text: 'code__precedence'}
      ]
    }
  ]

  const result = i.inline(tokenList)

  // const util = require('util')
  // console.log(util.inspect(expected, {depth: 99}))
  // console.log(util.inspect(result, {depth: 99}))

  t.deepEqual(result, expected)
})
