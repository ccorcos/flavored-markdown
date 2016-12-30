const Either = require('data.either')

const match = (regex, str) =>
  Either.fromNullable(str.match(regex))
  .map(m => ({
    result: m.slice(0)
    rest: str.slice(m[0].length)
  }))

const heading = str =>
  match(/^ *(#{1,6}) *([^\n]*)/, str)
  .map(({rest, result: [str, size, title]}) => ({
    token: {
      type: 'heading',
      size: size.length,
      title: title.trim()
    },
    rest,
  }))

const italic = str =>
  match(/^(\*)(([^\*\\]|\\.)+)(\*)/, str)
  .map({rest, result: [str, s1, inside, s2]} => ({
    token: {
      type: 'italic',
      text: inside,
    },
    rest,
  }))

const bold =
  match(/^(\*\*)([^\*]+)(\*\*)/, str)
  .map({rest, result:[str, s1, inside, s2]} => ({
    token: {
      type: 'bold',
      text: inside,
    }
  }))

const bold =
  match(/^(\*\*)([^\*]+)(\*\*)/, str)
  .map({rest, result:[str, s1, inside, s2]} => ({
    token: {
      type: 'bold',
      text: inside,
    }
  }))



const rules = {
  heading: [
    zeroOrMore(space),
    oneOrMore(hashtag),
    zeroOrMore(space),
    zeroOrMore(not(newline)),
  ],
  italic: [
    star,
    oneOrMore(not(star)),
    star,
  ],
  bold: [
    twoOf(star),
    oneOrMore(not(twoOf(star))),
    twoOf(star),
  ],
  strikethrough: [
    oneOrTwo(tilde),
    oneOrMore(not(tilde)),
    twoOf(star),
  ]


  // *, **, ~~, __, [](), ![](), [][], []:, []{}, -+*, 123, >, `, ```,
}



var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};
