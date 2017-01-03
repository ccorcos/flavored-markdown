import test from 'ava'
import * as md from './index'
import * as p from './pcombs'

// non-recursive inline parsers
const _inline = {
  _italic: {
    success: {
      'basic case': ['*yes*', 'yes'],
      'match first starting star': ['**yes*', '*yes'],
      'match last ending star': ['*yes**', 'yes*'],
      'triple star': ['***yes***', '**yes**'],
      'quadruple star': ['****yes****', '***yes***'],
      'bold must have precedence': ['*yes**yes*', 'yes*'],
      'match last ending star': ['*yes***yes*', 'yes**'],
      'escaped stars': ['*yes\\*yes*', 'yes\\*yes'],
    },
    fail: {
      'missing close': '*no',
      'empty two stars': '**',
      'empty three stars': '***',
      'empty four stars': '****',
    }
  },
  _bold: {
    success: {
      'basic case': ['**yes**', 'yes'],
      'match first starting double star': ['***yes**', '*yes'],
      'match last ending double star': ['**yes***', 'yes*'],
      'triple star': ['***yes***', '*yes*'],
      'skip single stars': ['**yes*yes**', 'yes*yes'],
      'escaped stars': ['**yes\\*\\*yes**', 'yes\\*\\*yes'],
    },
    fail: {
      'missing close': '**no',
      'incomplete close': '**no*',
      'single star': '*no*',
    },
  },
  _strikethrough: {
    success: {
      'basic case': ['~~yes~~', 'yes'],
      'match first starting double tilde': ['~~~yes~~', '~yes'],
      'match last ending double tilde': ['~~yes~~~', 'yes~'],
      'triple tilde': ['~~~yes~~~', '~yes~'],
      'skip single tildes': ['~~yes~yes~~', 'yes~yes'],
      'escaped tildes': ['~~yes\\~\\~yes~~', 'yes\\~\\~yes'],
    },
    fail: {
      'missing close': '~~no',
      'incomplete close': '~~no~',
      'single tilde': '~no~',
    },
  },
  _code: {
    success: {
      'basic case': ['`hello`', 'hello'],
      'escaped code': ['`hello \\` world`', 'hello \\` world'],
    },
    fail: {
      'missing close': '`hello',
    }
  },
  _link: {
    success: {
      'basic case': ['[blah](link)', {text: 'blah', url: 'link'}],
      'can be empty': ['[]()', {text: '', url: ''}],
      'escaped characters': ['[[\\]]((\\))', {text: '[\\]', url: '(\\)'}],
    },
  },
  image: {
    success: {
      'basic case': ['![blah](link)', {type: 'image', alt: 'blah', url: 'link'}],
    },
  },
  _deflink: {
    success: {
      'basic case': ['[name][value]', {text: 'name', def: 'value'}],
    },
  },
}

// non-recursive line parsers
const _multiline = {
  _listItem: {
    success: {
      'basic unordered case': [
        ['- blah'],
        {
          ordered: false,
          lines: ['blah'],
        },
      ],
      'basic ordered case': [
        ['1. blah'],
        {
          ordered: true,
          lines: ['blah'],
        },
      ],
      'basic multiline case': [
        ['- blah', '  yes'],
        {
          ordered: false,
          lines: ['blah', 'yes'],
        },
      ],
      'multiline skip blanks': [
        ['- blah', '', '  yes'],
        {
          ordered: false,
          lines: ['blah', '', 'yes'],
        },
      ],
      'multiline end at non-indent': [
        ['- blah', '', '  yes', '  - inner item', '- stop here'],
        {
          ordered: false,
          lines: ['blah', '', 'yes', '- inner item'],
        },
      ],
    },
  },
  _list: {
    success: {
      'basic case': [
        ['- one', '- two', '- three'],
        [
          {ordered: false, lines: ['one']},
          {ordered: false, lines: ['two']},
          {ordered: false, lines: ['three']},
        ],
      ],
      'multiline items': [
        ['- one', '  - one one', '- two'],
        [
          {ordered: false, lines: ['one', '- one one']},
          {ordered: false, lines: ['two']},
        ],
      ],
      'skip blanks': [
        ['- one', '', '  - one one', ' ', '- two'],
        [
          {ordered: false, lines: ['one', '', '- one one', '']},
          {ordered: false, lines: ['two']},
        ],
      ],
      'end on unindented': [
        ['- one', '  - one one', '- two', 'stop'],
        [
          {ordered: false, lines: ['one', '- one one']},
          {ordered: false, lines: ['two']},
        ],
      ],
    },
  },
  fences: {
    success: {
      'basic case': [
        ['```', 'this is code', '```'],
        {type: 'fences', language: '', value: 'this is code'}
      ],
      'language case': [
        ['```js', 'this is code', '```'],
        {type: 'fences', language: 'js', value: 'this is code'},
      ],
    },
  },
  _heading: {
    success: {
      'h1 case': ['# h1', {size: 1, text: 'h1'}],
      'h2 case': ['## h2', {size: 2, text: 'h2'}],
      'allows space': ['# hello world', {size: 1, text: 'hello world'}],
      'allows newline': ['# hello world \n', {size: 1, text: 'hello world'}],
    }
  },
  hr: {
    success: {
      'basic case': ['---', {type: 'hr'}],
    },
    fail: {
      'four dashes': '----',
    },
  },
  def: {
    success: {
      'basic case': ['[name]: value', {type: 'def', name: 'name', value: 'value'}],
    },
  },
  _blockquote: {
    success: {
      'basic case': [
        ['> hello'],
        'hello',
      ],
      'multiline case': [
        ['> hello', '> world'],
        'hello\nworld',
      ],
      'blank quote line': [
        ['> hello', '>', '> world'],
        'hello\n\nworld',
      ]
    }
  },
}

// inline recursive parsers
const inline = {
  code: {
    success: {
      'basic case': [
        '`this is code`',
        {
          type: 'code',
          value: 'this is code',
        }
      ]
    }
  },
  bold: {
    success: {
      'basic case': [
        '**this is bold**',
        {
          type: 'bold',
          children: [{
            type: 'text',
            value: 'this is bold'
          }],
        }
      ],
    },
  },
  italic: {
    success: {
      'basic case': [
        '*this is italic*',
        {
          type: 'italic',
          children: [{
            type: 'text',
            value: 'this is italic'
          }],
        }
      ],
    },
  },
  strikethrough: {
    success: {
      'basic case': [
        '~~this is strikethrough~~',
        {
          type: 'strikethrough',
          children: [{
            type: 'text',
            value: 'this is strikethrough',
          }],
        }
      ],
    },
  },
  link: {
    success: {
      'basic case': [
        '[hello](world)',
        {
          type: 'link',
          url: 'world',
          children: [{
            type: 'text',
            value: 'hello',
          }]
        }
      ],
    },
  },
  deflink: {
    success: {
      'basic case': [
        '[hello][world]',
        {
          type: 'deflink',
          def: 'world',
          children: [{
            type: 'text',
            value: 'hello',
          }]
        }
      ],
    },
  },
  inline: {
    success: {
      'bold inside italic': [
        '***bold** italic*',
        [{
          type: 'italic',
          children: [{
            type: 'bold',
            children: [{
              type: 'text',
              value: 'bold',
            }],
          }, {
            type: 'text',
            value: ' italic',
          }]
        }]
      ],
      'italic inside bold': [
        '***italic* bold**',
        [{
          type: 'bold',
          children: [{
            type: 'italic',
            children: [{
              type: 'text',
              value: 'italic',
            }],
          }, {
            type: 'text',
            value: ' bold',
          }]
        }]
      ],
    }
  }
}

// code,
// bold,
// italic,
// strikethrough,
// image,
// link,
// deflink,
// character,

const assertions = {
  success: (t, parser, [input, output]) => {
    const result = p.parse(parser, input)
    t.deepEqual(result.value, output, result.fail)
  },
  fail: (t, parser, input) => {
    const result = p.parse(parser, input)
    t.truthy(result.fail, result.value)
  },
}

const runTests = (tests) => {
  Object.keys(tests).forEach(parserName => {
    const parser = md[parserName]
    Object.keys(tests[parserName]).forEach(assertion => {
      const assert = assertions[assertion]
      Object.keys(tests[parserName][assertion]).forEach(name => {
        test(`${parserName}: ${name} [${assertion}]`, t => {
          const args = tests[parserName][assertion][name]
          assert(t, parser, args)
        })
      })
    })
  })
}

const runOneTest = (tests, [parserName, assertion, name]) => {
  const parser = md[parserName]
  const assert = assertions[assertion]
  test(`${parserName}: ${name} [${assertion}]`, t => {
    const args = tests[parserName][assertion][name]
    assert(t, parser, args)
  })
}

const tests = {
  ..._inline,
  ..._multiline,
  ...inline,
}

// runOneTest(tests, ['inline', 'success', 'bold inside italic'])
runTests(tests)
