import test from 'ava'
import * as b from './block'

test('fences', t => {
  const tokens = [
    {type: '```', raw: '```'},
    {type: 'text', raw: 'js'},
    {type: '\n', raw: '\n'},
    {type: 'text', raw: 'const x = 6'},
    {type: '\n', raw: '\n'},
    {type: '```', raw: '```'},
  ]

  const expected = {type: 'fences', lang: 'js', text: 'const x = 6'}

  b.fences
  .run(tokens)
  .fold(
    v => t.deepEqual(v, expected),
    v => t.fail()
  )
})

test('def', t => {
  const tokens = [
    {type: '[', raw: '['},
    {type: 'text', raw: 'name'},
    {type: ']', raw: ']'},
    {type: ':', raw: ':'},
    {type: 'text', raw: ' value'},
  ]

  const expected = {type: 'def', name: 'name', value: 'value'}

  b.def
  .run(tokens)
  .fold(
    v => t.deepEqual(v, expected),
    v => t.fail()
  )
})

test('simple list', t => {
  const tokens = [
    {type: '-', raw: '-'},
    {type: 'text', raw: 'first'},
    {type: '\n', raw: '\n'},
    {type: '-', raw: '-'},
    {type: 'text', raw: 'second'},
  ]

  const expected = {
    type: 'list',
    ordered: false,
    children: [{
      type: 'listItem',
      ordered: false,
      children: [{
        type: 'text',
        raw: 'first\n',
      }]
    }, {
      type: 'listItem',
      ordered: false,
      children: [{
        type: 'text',
        raw: 'second',
      }]
    }]
  }

  b.list
  .run(tokens)
  .fold(
    v => t.deepEqual(v, expected),
    v => t.fail()
  )
})

test('nested list', t => {
  const tokens = [
    {type: '-', raw: '-'},
    {type: 'text', raw: 'first'},
    {type: '\n', raw: '\n'},
    {type: 'indent', raw: '  '},
    {type: '#.', raw: '1.'},
    {type: 'text', raw: 'first first'},
    {type: '\n', raw: '\n'},
    {type: '-', raw: '-'},
    {type: 'text', raw: 'second'},
    {type: '\n', raw: '\n'},
  ]

  const expected = {
    type: 'list',
    ordered: false,
    children: [{
      type: 'listItem',
      ordered: false,
      children: [{
        type: 'text',
        raw: 'first\n',
      }, {
        type: 'list',
        ordered: true,
        children: [{
          type: 'listItem',
          ordered: true,
          children: [{
            type: 'text',
            raw: 'first first\n',
          }]
        }]
      }]
    }, {
      type: 'listItem',
      ordered: false,
      children: [{
        type: 'text',
        raw: 'second\n',
      }]
    }]
  }

  b.list
  .run(tokens)
  .fold(
    v => t.deepEqual(v, expected),
    v => t.fail()
  )
})

test('multiline list', t => {
  const tokens = [
    {type: '-', raw: '-'},
    {type: 'text', raw: ' first item'},
    {type: '\n', raw: '\n'},
    {type: '-', raw: '-'},
    {type: 'text', raw: 'second item'},
    {type: '\n', raw: '\n'},
    {type: 'indent', raw: '  '},
    {type: 'text', raw: 'still second item'},
    {type: '\n', raw: '\n'},
    {type: '\n', raw: '\n'},
    {type: 'indent', raw: '  '},
    {type: 'text', raw: 'now its a paragraph'},
    {type: '\n', raw: '\n'},
    {type: 'indent', raw: '  '},
    {type: '#.', raw: '1.'},
    {type: 'text', raw: 'second nested first item'},
  ]

  const expected = {
    type: 'list',
    ordered: false,
    children: [{
      type: 'listItem',
      ordered: false,
      children: [{type: 'text', raw: ' first item\n'}]
    }, {
      type: 'listItem',
      ordered: false,
      children: [{
        type: 'paragraph',
        children: [{
          type: 'text',
          raw: 'second item\nstill second item\n',
        }]
      }, {
        type: 'paragraph',
        children: [{
          type: 'text',
          raw: 'now its a paragraph\n',
        }]
      }, {
        type: 'list',
        ordered: true,
        children: [{
          type: 'listItem',
          ordered: true,
          children: [
            {type: 'text', raw: 'second nested first item'}
          ]
        }]
      }]
    }]
  }

  b.list
  .run(tokens)
  .fold(
    v => t.deepEqual(v, expected),
    v => t.fail()
  )

})

test('simple blockquote', t => {
  const tokens = [
    {type: '>', raw: '>'},
    {type: 'text', raw: ' hello'},
    {type: '\n', raw: '\n'},
    {type: '>', raw: '>'},
    {type: 'text', raw: ' world'},
  ]

  const expected = {
    type: 'blockquote',
    children: [{
      type: 'paragraph',
      children: [{
        type: 'text',
        raw: ' hello\n world',
      }]
    }]
  }

  b.blockquote
  .run(tokens)
  .fold(
    v => t.deepEqual(v, expected),
    () => t.fail()
  )
})

test('multiline blockquote', t => {
  const tokens = [
    {type: '>', raw: '>'},
    {type: 'text', raw: ' hello'},
    {type: '\n', raw: '\n'},
    {type: '>', raw: '>'},
    {type: '\n', raw: '\n'},
    {type: '>', raw: '>'},
    {type: 'text', raw: ' world'},
  ]

  const expected = {
    type: 'blockquote',
    children: [{
      type: 'paragraph',
      children: [{
        type: 'text',
        raw: ' hello\n',
      }]
    }, {
      type: 'paragraph',
      children: [{
        type: 'text',
        raw: ' world',
      }]
    }]
  }

  b.blockquote
  .run(tokens)
  .fold(
    v => t.deepEqual(v, expected),
    v => t.fail()
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
    }),
    v => t.fail()
  )
})

test('block precedence', t => {
  const tokens = [
    {type: 'text', raw: 'this will be a paragraph'},
    {type: '\n', raw: '\n'},
    {type: '#.', raw: '1.'},
    {type: 'text', raw: 'ordered list'},
    {type: '\n', raw: '\n'},
    {type: '>', raw: '>'},
    {type: 'text', raw: 'quote'},
  ]

  const expected = [
    {type: 'paragraph', children: [{type: 'text', raw: 'this will be a paragraph\n'}]},
    {type: 'list', ordered: true, children: [
      {type: 'listItem', ordered: true, children: [{type: 'text', raw: 'ordered list\n'}]},
    ]},
    {type: 'blockquote', children: [{type: 'paragraph', children: [
      {type: 'text', raw: 'quote'},
    ]}]}
  ]

  const result = b.block(tokens)

  t.deepEqual(result, expected)
})
