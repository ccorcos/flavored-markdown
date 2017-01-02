import test from 'ava'
import * as md from './index'
import * as p from './pcombs'

const tests = {
  italic: {
    success: {
      'basic case': ['*yes*', {type: 'italic', text: 'yes'}],
      'match first starting star': ['**yes*', {type: 'italic', text: '*yes'}],
      'match last ending star': ['*yes**', {type: 'italic', text: 'yes*'}],
      'triple star': ['***yes***', {type: 'italic', text: '**yes**'}],
      'quadruple star': ['****yes****', {type: 'italic', text: '***yes***'}],
      'bold must have precedence': ['*yes**yes*', {type: 'italic', text: 'yes*'}],
      'match last ending star': ['*yes***yes*', {type: 'italic', text: 'yes**'}],
      'escaped stars': ['*yes\\*yes*', {type: 'italic', text: 'yes\\*yes'}],
    },
    fail: {
      'missing close': '*no',
      'empty two stars': '**',
      'empty three stars': '***',
      'empty four stars': '****',
    }
  },
  bold: {
    success: {
      'basic case': ['**yes**', {type: 'bold', text: 'yes'}],
      'match first starting double star': ['***yes**', {type: 'bold', text: '*yes'}],
      'match last ending double star': ['**yes***', {type: 'bold', text: 'yes*'}],
      'triple star': ['***yes***', {type: 'bold', text: '*yes*'}],
      'skip single stars': ['**yes*yes**', {type: 'bold', text: 'yes*yes'}],
      'escaped stars': ['**yes\\*\\*yes**', {type: 'bold', text: 'yes\\*\\*yes'}],
    },
    fail: {
      'missing close': '**no',
      'incomplete close': '**no*',
      'single star': '*no*',
    },
  },
  strikethrough: {
    success: {
      'basic case': ['~~yes~~', {type: 'strikethrough', text: 'yes'}],
      'match first starting double tilde': ['~~~yes~~', {type: 'strikethrough', text: '~yes'}],
      'match last ending double tilde': ['~~yes~~~', {type: 'strikethrough', text: 'yes~'}],
      'triple tilde': ['~~~yes~~~', {type: 'strikethrough', text: '~yes~'}],
      'skip single tildes': ['~~yes~yes~~', {type: 'strikethrough', text: 'yes~yes'}],
      'escaped tildes': ['~~yes\\~\\~yes~~', {type: 'strikethrough', text: 'yes\\~\\~yes'}],
    },
    fail: {
      'missing close': '~~no',
      'incomplete close': '~~no~',
      'single tilde': '~no~',
    },
  },
  code: {
    success: {
      'basic case': ['`hello`', {type: 'code', value: 'hello'}],
      'escaped code': ['`hello \\` world`', {type: 'code', value: 'hello \\` world'}],
    },
    fail: {
      'missing close': '`hello',
    }
  },
  link: {
    success: {
      'basic case': ['[blah](link)', {type: 'link', text: 'blah', url: 'link'}],
      'can be empty': ['[]()', {type: 'link', text: '', url: ''}],
      'escaped characters': ['[[\\]]((\\))', {type: 'link', text: '[\\]', url: '(\\)'}],
    },
  },
  image: {
    success: {
      'basic case': ['![blah](link)', {type: 'image', alt: 'blah', url: 'link'}],
    },
  },
  heading: {
    success: {
      'h1 case': ['# h1', {type: 'heading', size: 1, text: 'h1'}],
      'h2 case': ['## h2', {type: 'heading', size: 2, text: 'h2'}],
      'allows space': ['# hello world', {type: 'heading', size: 1, text: 'hello world'}],
      'allows newline': ['# hello world \n', {type: 'heading', size: 1, text: 'hello world'}],
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
  deflink: {
    success: {
      'basic case': ['[name][value]', {type: 'deflink', text: 'name', def: 'value'}],
    },
  },
  fences: {
    success: {
      'basic case': ['```\nthis is code\n```', {type: 'fences', language: '', value: 'this is code'}],
      'language case': ['```js\nthis is code\n```', {type: 'fences', language: 'js', value: 'this is code'}],
    },
  },
}

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

const runAllTests = () => {
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

const runOneTest = ([parserName, assertion, name]) => {
  const parser = md[parserName]
  const assert = assertions[assertion]
  test(`${parserName}: ${name} [${assertion}]`, t => {
    const args = tests[parserName][assertion][name]
    assert(t, parser, args)
  })
}

// runOneTest(['bold', 'success', 'italic inside'])

runAllTests()
