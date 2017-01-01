import test from 'ava'
import * as md from './index'
import * as p from './pcombs'

test('italic', t => {
  let result
  result = p.parse(md.italic, "*yes*")
  t.is(result.value, 'yes')

  result = p.parse(md.italic, "***yes***")
  t.is(result.value, '**yes**')

  result = p.parse(md.italic, "* **yes** *")
  t.is(result.value, ' **yes** ')

  result = p.parse(md.italic, "** *yes* **")
  t.truthy(result.fail)

  result = p.parse(md.italic, "* **yes *")
  t.is(result.value, ' **yes ')

  result = p.parse(md.italic, "***yes*")
  t.is(result.value, '**yes')

  result = p.parse(md.italic, "*yes* asdf")
  t.is(result.value, 'yes')

  result = p.parse(md.italic, "*yes\\* asdf*")
  t.is(result.value, 'yes\\* asdf')

  result = p.parse(md.italic, "*yes")
  t.truthy(result.fail)

  result = p.parse(md.italic, "**yes*")
  t.truthy(result.fail)

  result = p.parse(md.italic, "**yes**")
  t.truthy(result.fail)
})

test('bold', t => {
  let result

  result = p.parse(md.bold, "**yes**")
  t.is(result.value, 'yes')

  result = p.parse(md.bold, "*yes*")
  t.truthy(result.fail)

  // result = p.parse(md.bold, "***yes***")
  // t.is(result.value, '*yes*')

  result = p.parse(md.bold, "* **yes** *")
  t.truthy(result.fail)

  // result = p.parse(md.bold, "** *yes* **")
  // t.is(result.value, ' *yes* ')

  result = p.parse(md.bold, "* **yes *")
  t.truthy(result.fail)

  result = p.parse(md.bold, "***yes*")
  t.truthy(result.fail)

  // result = p.parse(md.bold, "***yes**")
  // t.is(result.value, '*yes')

  result = p.parse(md.bold, "**yes** asdf")
  t.is(result.value, 'yes')

  result = p.parse(md.bold, "**yes\\* asdf**")
  t.is(result.value, 'yes\\* asdf')

  result = p.parse(md.bold, "*yes")
  t.truthy(result.fail)

  result = p.parse(md.bold, "**yes*")
  t.truthy(result.fail)
})


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