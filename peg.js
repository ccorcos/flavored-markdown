`
star = "*"
not_star = [^\*]

star_star = star star
not_star_star = not_star not_star

escape = "//" .

newline = [\n]
not_newline = [^\n]

newline_newline = newline newline
not_newline_newline = not_newline not_newline

// bold and italic
wrap_star = star (not_star / escape)+ star
wrap_star_star = star_star (not_star_star / escape)+ star_star



// blockquote
gt = ">"
gt_line = gt_start not_newline* newline
gt_block = gt_line+

tilde = "~"
not_tilde = [^~]

tilde_tilde = tilde tilde
not_tilde_tilde = not_tilde not_tilde

// stikethrough
wrap_tilde = tilde (not_tilde / escape)+ tilde
wrap_tilde_tilde = tilde_tilde (not_tilde_tilde / escape)+ tilde_tilde

underscore = "_"
not_underscore = [^_]

underscore_underscore = underscore underscore
not_underscore_underscore = not_underscore not_underscore

// underline
wrap_underscore = underscore (not_underscore / escape)+ underscore
wrap_underscore_underscore = underscore_underscore (not_underscore_underscore / escape)+ underscore_underscore



h = #{1,6}
heading =

normal heading
underline heading

hr

def

strikethrough
underline
autolink

paragraph
text
inline code
code block
list
table
link
image

`