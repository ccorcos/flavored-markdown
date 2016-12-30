'use strict'

const marked = require('marked')

// const hljs = require('highlight.js')

const string = `

# Heading1

## Heading2

Here is *italics* and **bold** and \`inline code\`.
Here is a newline in the same paragraph.

Here is a new paragraph.

\`\`\`
here is code
multiline
\`\`\`

and then with a language

\`\`\`js
this is js
\`\`\`

> this is a block quote
> and it can span multiple lines

and a break

---

- list item 1
  - nested 1 1
- list item 2

some ~deleted test~

[a link](http://www.google.com)

![an image](https://avatars0.githubusercontent.com/u/1794527?v=3&s=460)

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

`

const options = {
  renderer: new marked.Renderer(),
  gfm: true, // github flavored markdown
  tables: true, // github tables
  breaks: false, // don't allow single line breaks
  pedantic: false, // ignore old markdown conventions
  sanitize: true, // ignore all HTML
  smartLists: true, // better lists
  smartypants: true, // better dashes and quotes
  mangle: false, // dont mangle links
  // highlight: function (code) {
  //   return hljs.highlightAuto(code).value
  // }
}

marked(string, )


const renderer = new marked.Renderer()

renderer.code =

// code(string code, string language)
// blockquote(string quote)
// html(string html)
// heading(string text, number level)
// hr()
// list(string body, boolean ordered)
// listitem(string text)
// paragraph(string text)
// table(string header, string body)
// tablerow(string content)
// tablecell(string content, object flags)
// flags has the following properties:
//
// {
//     header: true || false,
//     align: 'center' || 'left' || 'right'
// }
// Inline level renderer methods
//
// strong(string text)
// em(string text)
// codespan(string code)
// br()
// del(string text)
// link(string href, string title, string text)
// image(string href, string title, string text)


marked.Parser.prototype.parse = function(src) {
  this.inline = new marked.InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

// const tokens = marked.lexer(string)
// console.log(tokens)
// require('marked').lexer('> i am using marked.')
