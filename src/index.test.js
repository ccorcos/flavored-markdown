import test from 'ava'
import * as md from './index'
import * as p from './pcombs'

test('italic', t => {
  let result
  result = p.parse(md.italic, "*yes*");
  t.is(result.value, 'yes')

  result = p.parse(md.italic, "***yes***");
  t.is(result.value, '**yes**')

  result = p.parse(md.italic, "* **yes** *");
  t.is(result.value, ' **yes** ')

  result = p.parse(md.italic, "** *yes* **");
  t.truthy(result.fail)

  result = p.parse(md.italic, "* **yes *");
  t.is(result.value, ' **yes ')

  result = p.parse(md.italic, "***yes*");
  t.is(result.value, '**yes')

  result = p.parse(md.italic, "*yes* asdf");
  t.is(result.value, 'yes')

  result = p.parse(md.italic, "*yes\\* asdf*");
  t.is(result.value, 'yes\\* asdf')

  result = p.parse(md.italic, "*yes");
  t.truthy(result.fail)

  result = p.parse(md.italic, "**yes*");
  t.truthy(result.fail)

  result = p.parse(md.italic, "**yes**");
  t.truthy(result.fail)
})


// const neitherChar = (chars) => {
//   return sat(char => !chars.find(char))
// }
//
// // lookahead
// function notString(s) {
//   return (input) => {
//     if (input.atEnd()) {
//       return error(input)
//     }
//     return input.startsWith(s) ? result(null, input, input, null) : error(input)
//   }
// }


// function notString(s) {
//   function notStringP(s) {
//     if (s.length > 0) {
//       return seq(
//         notChar(s[0]),
//         () => seq(notStringP(s.slice(1)))
//       )
//     }
//     return unit("");
//   }
//   return expected(notStringP(s), `"${s}"`);
// }

// export const quotedString = expected(seq(function*() {
//   yield char("\"");
//   const {value: s} = yield many(either(
//     seq(char("\\"), () => item),
//     notChar("\"")
//   ));
//   yield char("\"");
//   return s;
// }), "a quoted string");

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