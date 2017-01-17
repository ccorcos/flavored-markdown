import test from 'ava'
import * as b from './block'

// paragraphs should just merge text lines

test('fences', t => {
  b.fences
  .run([
    {type: '```', raw: '```'},
    {type: 'text', raw: 'js'},
    {type: '\n', raw: '\n'},
    {type: 'text', raw: 'const x = 6'},
    {type: '\n', raw: '\n'},
    {type: '```', raw: '```'},
  ])
  .fold(
    v => t.deepEqual(v, {type: 'fences', lang: 'js', text: 'const x = 6'}),
    v => t.fail()
  )
})

test('def', t => {
  b.def
  .run([
    {type: '[', raw: '['},
    {type: 'text', raw: 'name'},
    {type: ']', raw: ']'},
    {type: ':', raw: ':'},
    {type: 'text', raw: ' value'},
  ])
  .fold(
    v => t.deepEqual(v, {type: 'def', name: 'name', value: 'value'}),
    v => t.fail()
  )
})

// simple list
// nested list
// nested block content

// test('list', t => {
//   b.list
//   .run([
//     {type: '-', raw: '-'},
//     {type: 'text', raw: ' first item'},
//     {type: '\n', raw: '\n'},
//     {type: '-', raw: '-'},
//     {type: 'text', raw: 'second item'},
//     {type: '\n', raw: '\n'},
//     {type: 'indent', raw: '  '},
//     {type: 'text', raw: 'still second item'},
//     {type: '\n', raw: '\n'},
//     {type: 'indent', raw: '  '},
//     {type: '#.', raw: '1.'},
//     {type: 'text', raw: 'second nested first item'},
//   ])
//   .fold(
//     v => t.deepEqual(v, {
//       type: 'list',
//       ordered: false,
//       children: [{
//         type: 'listItem',
//         ordered: false,
//         children: [{
//           type: 'paragraph',
//           children: [
//             {type: 'text', raw: ' first item\n'}
//           ]
//         }]
//       }, {
//         type: 'listItem',
//         ordered: false,
//         children: [{
//           type: 'paragraph',
//           children: [
//             {type: 'text', raw: 'second item\nstill second item'}
//           ]
//         }, {
//           type: 'list',
//           ordered: true,
//           children: [{
//             type: 'listItem',
//             ordered: true,
//             children: [{
//               type: 'paragraph',
//               children: [
//                 {type: 'text', raw: 'second nested first item'}
//               ]
//             }]
//           }]
//         }]
//       }]
//     })
//   )
// })

test('simple blockquote', t => {
  b.blockquote
  .run([
    {type: '>', raw: '>'},
    {type: 'text', raw: ' hello'},
    {type: '\n', raw: '\n'},
    {type: '>', raw: '>'},
    {type: 'text', raw: ' world'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'blockquote',
      children: [{
        type: 'paragraph',
        children: [{
          type: 'text',
          raw: ' hello\nworld',
        }]
      }]
    })
  )
})

test('multiline blockquote', t => {
  b.blockquote
  .run([
    {type: '>', raw: '>'},
    {type: 'text', raw: ' hello'},
    {type: '\n', raw: '\n'},
    {type: '>', raw: '>'},
    {type: '\n', raw: '\n'},
    {type: '>', raw: '>'},
    {type: 'text', raw: ' world'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'blockquote',
      children: [{
        type: 'paragraph',
        children: [{
          type: 'text',
          raw: ' hello',
        }]
      }, {
        type: 'paragraph',
        children: [{
          type: 'text',
          raw: ' world',
        }]
      }]
    })
  )
})

test('heading', t => {
  b.heading
  .run([
    {type: '#s', length: 2, raw: '##'},
    {type: 'text', raw: 'hello h2'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'heading',
      size: 2,
      children: [{
        type: 'text',
        raw: 'hello h2',
      }],
    })
  )
})

test('paragraph', t => {
  b.paragraph
  .run([
    {type: 'text', raw: 'a'},
    {type: '\n', raw: '\n'},
    {type: 'text', raw: 'b'},
    {type: '\n', raw: '\n'},
    {type: '\n', raw: '\n'},
    {type: 'text', raw: 'c'},
  ])
  .fold(
    v => t.deepEqual(v, {
      type: 'paragraph',
      children: [{
        type: 'text',
        raw: 'a\nb',
      }]
    })
  )
})

// test('block', t => {
//   b.block([
//     {}
//   ])
// })
