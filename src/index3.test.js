import test from 'ava'
import { tokenize, fences } from './index3'

test('tmp', t => {
  console.log(
    tokenize
    // .chain(p.always)
    // .chain(tokens =>
    //   p.always(p.zeroOrMore(fences).run(tokens))
    // )
    .run(`
# header

*italics**bold***

\`\`\`
this is some code
\`\`\`

   - `)
 )
})
