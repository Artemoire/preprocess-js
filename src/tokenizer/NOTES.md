# Assumed value wrappers
- CommentBlock: (/\*)value(\*)
- CommentLine - (//)value
- Identifier - value
- Number - value
- String - ("|')value
- Template - (\`)value(\`)
- TemplateHead - (\`)value(${)
- TemplateTail - (})value(\`)

# Punctuator list
- +,-,*,/ Arithmetic
- = Assign
- !,==,!=,&&,||,<=,>= Logical
- . Member Access
- ; Semicolon
- : Object assign
- => lambda
- &,|,^,~ Bitwise
- , Comma