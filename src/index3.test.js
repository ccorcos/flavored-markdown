import test from 'ava'
import util from 'util'
import * as p from './pcombs3'
import { tokenize, text, fences, multiplePasses } from './index3'

test('tmp', t => {
  console.log(util.inspect(
    multiplePasses([tokenize, text, fences])
    // tokenize
    // .chain(tokens =>
    //   p.zeroOrMore(p.either([fences, p.any]))
    //   .run(tokens)
    //   .fold(p.always, p.never)
    // )
    .run(`
# header

*italics**bold***

\`\`\`
this is some code
\`\`\`

   - `).value
 , false, null))
})
