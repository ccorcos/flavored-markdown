import test from 'ava'
import { tokenize } from './index3'

test('tmp', t => {
  console.log(tokenize.run(`
# header

*italics**bold***

\`\`\`
this is some code
\`\`\`

   - `))
})
