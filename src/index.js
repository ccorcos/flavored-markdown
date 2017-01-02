import * as p from './pcombs'

// escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
// autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
// url: noop,
// tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
// link: /^!?\[(inside)\]\(href\)/,
// reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
// nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
// strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
// em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
// code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
// br: /^ {2,}\n(?!\s*$)/,
// del: noop,
// text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/



export const italic = p.sequence(function*() {
  yield p.char('*')

  const {value: leadingStars} = yield p.zeroOrMore(p.char('*'))

  // check for end of italic
  const {value: inner} = yield p.oneOrMore(
    p.either([
      // allow escaped stars
      p.string('\\*'),
      p.notChar('*'),
      // allow double star if its not at the of the of the file
      p.sequence(function*() {
        const {value} = yield p.string('**')
        yield p.peek(p.notEof)
        return value
      }),
      // otherwise take the last star
      p.sequence(function*() {
        const {value} = yield p.char('*')
        yield p.peek(p.char('*'))
        return value
      }),
    ])
  )

  // ending of italic
  yield p.char('*')

  return leadingStars.concat(inner).filter(Boolean).join('')
})

export const bold = p.sequence(function*() {
  // starting bold
  yield p.string('**')

  const {value: leadingStars} = yield p.zeroOrMore(p.char('*'))

  // check for end of bold
  const {value: inner} = yield p.oneOrMore(
    p.either([
      // allow escaped stars
      p.string('\\*'),
      p.notChar('*'),
      // skip over single stars
      p.sequence(function*() {
        const {value} = yield p.char('*')
        yield p.peek(p.notChar('*'))
        return value
      }),
      // always match the last double star
      p.sequence(function*() {
        const {value} = yield p.char('*')
        yield p.peek(p.string('**'))
        return value
      }),
    ])
  )

  // ending of bold
  yield p.string('**')

  return leadingStars.concat(inner).filter(Boolean).join('')
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
