import * as p from './pcombs'

export const italic = p.sequence(function*() {
  // starting italics
  yield p.char('*')
  yield p.peek(p.notChar('*'))

  // check for end of italics
  const {value} = yield p.oneOrMore(
    p.either([
      p.notChar('*'),
      p.sequence(function*() {
        yield p.char('*')
        yield p.peek(p.notChar('*'))
      }),
    ])
  )

  return value.filter(Boolean).join('')
})

//
// const bold = seq(function*() {
//   yield char('*')
//   const {value: s} = yield many1(either([
//     seq(char('\\'), () => item),
//     notChar('*')
//   ]))
//   yield char('*')
//   return s
// })
//
//
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
//
//
// // export const quotedString = expected(seq(function*() {
// //   yield char("\"");
// //   const {value: s} = yield many(either(
// //     seq(char("\\"), () => item),
// //     notChar("\"")
// //   ));
// //   yield char("\"");
// //   return s;
// // }), "a quoted string");
//
// /*
// md language features
//
// wrapped inline text: *,**, ~, ~~, _, __, `, [], (), {}
// wrapped block: ```
// prefixed block text: >, indentation
//
// normal heading
// underline heading
// hr
// url var def
// autolink
// paragraph
// code block
// list
// table
// link
// image
// */
//
