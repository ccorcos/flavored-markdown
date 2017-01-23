# Parser Combinators and Markdown Parser

This project is an exploration into parser combinators and an attempt to build a markdown parser using parser combinators. 

It just so happens that in the middle of building this project, I discovered two other libraries that make these attempts obsolete.

- [Parsimmon](https://github.com/jneen/parsimmon) is a solid parser combinators library
- [Markdown-It](https://github.com/markdown-it/markdown-it) is an awesome hackable markdown parser.

My goal was to build a markdown parser that renders with React so my approach was to build an AST, but it seems a better approahc is to use markdown-it and generate the AST using an XML parser.
