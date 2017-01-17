import test from 'ava'
import util from 'util'
import * as p from 'pcombs'
import * as md from './index'

const text = `
# header

*italics**bold***

\`\`\`
this is some code
\`\`\`

[![](image)](link)

this is a [def][link]

This is \`some code\` with \` lower [precedence\`](than a link).

[boop]: bop

- `

test('tmp', t => {

  console.log(md.split(p.whereEq('a')).run('asdasdasdfasdfasdfasdfddds'))

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
      md.def,
    ])
    .run(text).value
 , false, null))
})
