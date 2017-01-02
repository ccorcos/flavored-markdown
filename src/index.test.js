import test from 'ava'
import * as md from './index'
import * as p from './pcombs'

const tests = {
  italic: {
    success: {
      'basic case': ['*yes*', 'yes'],
      'trailing text': ['*yes* asdf', 'yes'],
      'bold inside': ['* **yes** *', ' **yes** '],
      'bold immediately inside': ['***yes***', '**yes**'],
      'incomplete bold inside': ['***yes*', '**yes'],
      'escaped star': ['*yes\\*asdf*', 'yes\\*asdf'],
      // '': ['**yes*', '*yes'],
      // '': ['*yes**', 'yes*'],
    },
    fail: {
      'missing close': '*no',
      'bold not italic': '**no**',
      'incomplete bold': '**no*',
      'incomplete italic with bold inside': '* **no**',
    }
  },
  bold: {
    success: {
      'basic case': ['**yes**', 'yes'],
      'trailing text': ['**yes** asdf', 'yes'],
      'italic inside': ['** *yes* **', ' *yes* '],
      'italic immediately inside': ['***yes***', '*yes*'],
      'incomplete italic inside': ['***yes**', '*yes'],
      'escaped star': ['**yes\\*asdf**', 'yes\\*asdf'],
    },
    fail: {
      'missing close': '**no',
      'incomplete close': '**no*',
      'italic not bold': '*no*'
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