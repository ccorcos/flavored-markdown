import test from 'ava'
import * as md from './index'
import * as p from './pcombs'

const tests = {
  italic: {
    success: {
      'basic case': ['*yes*', 'yes'],
      'match first starting star': ['**yes*', '*yes'],
      'match last ending star': ['*yes**', 'yes*'],
      'triple star': ['***yes***', '**yes**'],
      'quadruple star': ['****yes****', '***yes***'],
      'skip double stars': ['*yes**yes*', 'yes**yes'],
      'dont skip triple stars': ['*yes***yes*', 'yes**'],
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
      'basic case': ['**yes**', 'yes'],
      'match first starting double star': ['***yes**', '*yes'],
      'match last ending double star': ['**yes***', 'yes*'],
      'triple star': ['***yes***', '*yes*'],
      'skip single stars': ['**yes*yes**', 'yes*yes'],
    },
    fail: {
      'missing close': '**no',
      'incomplete close': '**no*',
      'single star': '*no*',
    },
  },
}

const assertions = {
  success: (t, parser, [input, output]) => {
    const result = p.parse(parser, input)
    t.is(result.value, output, result.fail)
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





/*
md language features

wrapped inline text: *,**, ~, ~~, _, __, `, [], (), {}
wrapped block: ```
prefixed block text: >, indentation

normal heading
underline heading
hr
url var def
autolink
paragraph
code block
list
table
link
image
*/