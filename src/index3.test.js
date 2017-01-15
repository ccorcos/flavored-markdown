import test from 'ava'
import util from 'util'
import * as p from './pcombs3'
import * as md from './index3'

const text = `
# header

*italics**bold***

\`\`\`
this is some code
\`\`\`

[![](image)](link)

this is a [def][link]

This is \`some code\` with \` lower [precedence\`](than a link).

- `

test('tmp', t => {
  console.log(util.inspect(
    md.multiplePasses([
      md.tokenize,
      md.text,
      md.fences,
      md.image,
      md.link,
      md.deflink,
      md.code,
      md.strikethrough,
    ])
    .run(text).value
 , false, null))
})
