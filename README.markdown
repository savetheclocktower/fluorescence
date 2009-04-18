# Fluorescence

(A code highlighter add-on for [Prototype][prototype])

## What is it?

Fluorescence is an unobtrusive code highlighter. In fact, it's a rewrite of Dan Webb's venerable Unobtrusive Code Highlighter, so it'd be hard for it _not_ to be an unobtrusive code highlighter.

It has been rewritten to be more maintainable and to depend on Prototype (thereby making it smaller).

## How does it work?

### Define a language syntax

A few sample syntaxes are included. Defining a syntax works like this:

    Fluorescence.addLanguage('ruby', {
      module: {
        pattern: /(module)\s*([A-Za-z_]\w*)/,
        replacement: "<span class='keyword'>#{1}</span> <span class='#{0}'>#{2}</span>"
      },
      
      keyword: {
        pattern: /end/
      }
    });
    
Here's what we just did:

  * We defined a rule named `method`. That rule will search for text according to the regular expression specified by `pattern`. It will then replace that text with `replacement`, substituting `#{1}` with capture #1, `#{2}` with capture #2, et cetera. In the replacement string, `#{0}` refers to the name of the rule (`method`), in this case.
  * We defined another rule named `keyword`. This rule does not have a replacement, only a pattern, so Fluorescence will use the default pattern: placing the entire match inside a `span` tag with a class name equal to the name of the rule. In this case: `<span class='keyword'>end</span>`.
  
### Write some CSS for the syntax

This is the easy part: hook into the class names you specified when defining the syntax.

    code {
      background-color: #000;
      color: #fff;
    }

    code .keyword {
      color: #f60;
    }
    
    code .module {
      text-decoration: underline;
    }
    
And so on.

### Annotate your `code` elements with class names

To tell Fluorescence to highlight a block of code, give its `code` element a class name equal to the name of the syntax you've defined. Above, we defined a syntax called `ruby`, so HTML that looks like this:


    <pre><code class="ruby">module Foo
    end</code></pre>
    
    
will get transformed into this:

    <pre><code class="ruby"><span class='keyword'>module</span> <span class='module'>Foo</span>
    <span class='keyword'>end</span></code></pre>
    
and will look like this:

![Code sample][sample]

## Further configuration

Fluorescence performs some voodoo to get all this to work properly in IE — which has trouble when a `code` element is contained by a `pre` element (i.e., the _common, everyday case_). As part of this voodoo, it replaces tabs with spaces. The default tab size is `2`, because I consider that to be _correct_ and any other value to be _wrong and dangerous_. If you disagree, though, you can change this setting:

    <script type="text/javascript">
      Fluorescence.TAB_SIZE = 4;
    </script>

Keep in mind, though, that most browsers have other ideas about how wide a tab should be. Safari treats a tab as `8` spaces. That's enough to make me want to kill someone. It doesn't end up affecting me, though, because I write HTML with "soft" tabs (literal spaces instead of tabs). If you don't do the same, I'd recommend you selectively convert tabs to spaces inside your code blocks before you publish your HTML.

## About

Fluorescence is released under the terms of the [MIT License][mit].

The code is hosted [on GitHub][github]. You can file bugs on the [Lighthouse project][lighthouse].


[sample]: http://andrewdupont.net/fluorescence/images/sample.png
[prototype]: http://prototypejs.org
[lighthouse]: http://andrewdupont.lighthouseapp.com/projects/29492-fluorescence/overview
[github]: http://github.com/savetheclocktower/fluorescence/tree/master
[mit]: http://www.opensource.org/licenses/mit-license.php
