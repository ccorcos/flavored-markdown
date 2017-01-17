import { tokenize } from './tokens'
import { block } from './block'

const preprocess = string =>
  string
  .trim()
  .split('\n')
  .map(line => line.trim())
  .join('\n')

export const parse = string =>
  tokenize
  .over(block)
  .run(preprocess(string))
  .result()
  // unescape
