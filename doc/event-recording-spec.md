
Principles and pseudo-spec for event recording

1.  All actions get:
  - ts
  - windowid  (can be Null, e.g., globals)
  - tabid     (can be Null, e.g., window open);
  - group     ('tld')
  - item      ('subdir')

2.  (group,item) is intended to be 'usefully unique', but no guarantees!

3.  (group,item,action) even more sort.  `action` should imply the html/DOM
    actions, or close metaphorical analogues. (`click`, `keypress`, etc.)

4.  other keys are permitted, such as:

  - location / url
  - x,y,z
  - target
  - other ids
  - widget / thingy
  - term
  - private

  Each "group" has a schema of these, and which are permitted

Anti-chosen:

1.  d.what = "content::about:home::restore session"

Easy to grep, but glosses over the domain knowledges, and shoves the
'keying and iterpretation' to the analyst.

2.  d.meta = ['cut','paste'].

Implies that we are exhuastive in getting them right, and that we anticipated
all possible meta-analyses.  Gives illusion of surety.  Instead, we will write
docs about possible known meta analyses,
  e.g., ("CUT" -> command,cut + menu,edit,cut + context-area,cut)

Examples:

    // cut and paste - menu
    d.group = 'menu';
    d.menu = "edit";
    d.item = "cut"
    d.action: "click"

    // cut and paste - command / key
    d.group = 'command';
    d.item = "cut";
    d.action: "keypress"

    // cut and paste - context menu
    d.group = 'context-area';
    d.item = "cut";
    d.action: "click"

    //
    d.group = 'content';
    d.location = "about:home"

    // in content click
    d.group = "content"
    d.action = "click";
    d.x = 124  // evt.x
    d.y = 116  // evt.y



