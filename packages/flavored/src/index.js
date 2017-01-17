import { tokenize } from './tokens'
import { block } from './block'

const preprocess = string =>
  string
  .trim()
  .split('\n')
  .map(line => line.trim())
  .join('\n')

export const parse = string => block(tokenize(preprocess(string)))

// TODO: tail call optimize?
const renderer = opts => {
  const render = token =>
    token.children ? opts[token.type]({...token, children: token.children.map(render)})
                   : opts[token.type](token)
  return children => opts.root({children: children.map(render)})
}

const prettify = renderer({
  root: ({children}) => children.join('\n\n')
  fences: ({lang, text}) => ['```' + lang, text, '```'].join('\n'),
  def: ({name, value}) => `[${name}]: ${value}`,
  // TODO: here!
  listItem: (token) => {},
  list: (token) => {},
  blockquote: (token) => {},
  heading: (token) => {},
  paragraph: (token) => {},
  code: (token) => {},
  link: (token) => {},
  image: (token) => {},
  deflink: (token) => {},
  strikethrough: (token) => {},
  underline: (token) => {},
  text: (token) => {},
})
