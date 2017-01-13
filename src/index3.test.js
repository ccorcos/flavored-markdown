import test from 'ava'
import util from 'util'
import * as p from './pcombs3'
import * as t from './index3'

const md = `
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
  console.log(t)
  console.log(util.inspect(
    t.multiplePasses([
      t.tokenize,
      t.text,
      t.fences,
      t.image,
      t.link,
      t.deflink,
      t.code,
      t.strikethrough,
    ])
    .run(md).value
 , false, null))
})
