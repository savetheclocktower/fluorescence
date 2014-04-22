# Fluorescence

(A code highlighter add-on for [Prototype][prototype])

## What is it?

Fluorescence is an unobtrusive code highlighter. In fact, it's a rewrite of Dan Webb's venerable Unobtrusive Code Highlighter, so it'd be hard for it _not_ to be an unobtrusive code highlighter.

It has been rewritten to be more maintainable and to depend on Prototype (thereby making it smaller).

## How does it work?

### Define a language syntax

A few sample syntaxes are included. Defining a syntax works like this:

```javascript
Fluorescence.addLanguage('ruby', {
  module: {
    pattern: /(module)\s*([A-Za-z_]\w*)/,
    replacement: "<span class='keyword'>#{1}</span> <span class='#{0}'>#{2}</span>"
  },
      
  keyword: {
    pattern: /end/
  }
});
```
    
Here's what we just did:

  * We defined a rule named `module`. That rule will search for text according to the regular expression specified by `pattern`. It will then replace that text with `replacement`, substituting `#{1}` with capture #1, `#{2}` with capture #2, et cetera. In the replacement string, `#{0}` refers to the name of the rule (`module`, in this case).
  * We defined another rule named `keyword`. This rule does not have a replacement, only a pattern, so Fluorescence will use the default pattern: placing the entire match inside a `span` tag with a class name equal to the name of the rule. In this case: `<span class='keyword'>end</span>`.
  
### Write some CSS for the syntax

This is the easy part: hook into the class names you specified when defining the syntax.

```css
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
```
    
And so on.

### Annotate your `code` elements with class names

To tell Fluorescence to highlight a block of code, give its `code` element a class name equal to the name of the syntax you've defined. Above, we defined a syntax called `ruby`, so HTML that looks like this:

```html
<pre><code class="ruby">module Foo
end</code></pre>
```
    
will get transformed into this:

```html<pre><code class="ruby"><span class='keyword'>module</span> <span class='module'>Foo</span>
<span class='keyword'>end</span></code></pre>
```
    
and will look like this:

![Code sample][sample]


### Advanced usage

Here's the problem with regular expressions in JavaScript: they're not very powerful. Fluorescence is meant to be a spiritual sibling of [TextMate grammars][], but TextMate has the powerful [Oniguruma library][oniguruma], which supports a lot of stuff that JS regexps don't — most notably positive and negative lookbehind.

Lookbehind is crucial for any rules that rely on contextual clues. For instance, if we want to give special highlighting to function parameters in Ruby, we'd want to write a pattern that will match _only_ text inside function definitions. With lookbehind, we can make sure that we're (e.g.) matching only text that's on the same line as a `def` keyword and after an open parenthesis. Without lookbehind, we're hosed.

On the other hand, Fluorescence syntaxes are just JavaScript. Much of what we can't do with pure regular expressions can be done with code. To that end, Fluorescence lets you define callbacks to hook into the replacement process.

```javascript
Fluorescence.addLanguage('ruby', {
  method_definition: {
    // Match the whole line, broadly capturing anything inside parentheses.
    pattern: (/(def)\s+([A-Za-z0-9_!?]+)\s*(\()(.*?)(\))/),
        
    // The end of this replacement looks funny. It's because capture
    // group #4 will be transformed _before_ it reaches this replacement.
    replacement: "<span class='keyword'>#{1}</span> <span class='entity'>#{2}</span>#{3}#{4}#{5}"
        
    beforeCallback: function(replacements, highlight) {
      // Here we get a chance to modify the array of replacements before
      // the replacement actually happens. We want to manually highlight the
      // method parameters, which reside in replacement #4.
      var raw = replacements[4];
          
      // Split it on commas so that we can deal with each parameter
      // individually. (This is a naive way of doing it, but it's good
      // enough for this example.)
      var parts = replacements[4].split(/,\s*/);
          
      // Extract this for simplicity's sake.
      function wrapParameter(param) {
        return "<span class='variable parameter'>" + param + "</span>";
      }
          
      parts = parts.map(function(part) {
        // Ordinary parameters are easy. But some parameters might have
        // default values, and we want to highlight those values too.
        var defaultValuePattern = /^([A-Za-z0-9_]+)(\s*=\s*)(.*)/;
        if (defaultValuePattern.test(part)) {
          // This param has a default value.
          part = part.gsub(defaultValuePattern, function (match) {
            // The part before the equals sign is easy. But the part
            // after the equals sign could be a string, or a number, or
            // an object, or nil... so the second argument to
            // `beforeCallback` is a function that will apply the entire
            // syntax to whatever text you give it.
            //
            // Yes, this is recursive. Yes, you should be careful.
            var name = wrapParameter(match[1]);
            var value = highlight(match[3]);
            return name + match[2] + value;
          });
        } else {
          part = wrapParameter(part);
        }
      });
          
      // Now put it back together and stuff it into the `replacements`
      // array.
      replacements[4] = parts.join(', ');
      
      // Whatever you return here will be used as the new set of
      // replacements. Or you can return nothing and simply modify the
      // replacements in-place, as we've done here.
    },
    
    afterCallback: function(text) {
      // The after callback is much simpler; it lets you act on the text
      // after it's already been transformed. Included in this example
      // just for illustration.
      return text;
    }
  }
});
```    
The inline comments make this an intimidating code block, but here's all you need to know:

* If a rule has a `beforeCallback` property, that function will be called before substitution. It takes two parameters: the proposed array of replacements and a function for re-applying the syntax to arbitrary text. If it returns an array, Fluorescence will consider that the revised array of replacements. Otherwise, you can simply modify the replacements array in-place.
* If a rule has an `afterCallback` property, that function will be called after substitution. It takes one parameter: the substituted text produced by application of the rule. It should return a string; Fluoresence will use that string as the replacement for the pattern matched in the raw source text.

### Ostentatiously advanced usage

There are a couple of methods that let you parse arbitrary text with an arbitrary grammar. Instead of giving a grammar a name, as with `Fluorescence.addLanguage`, you can pass any grammar-like object into `Fluorescence.parse`:

    var ESCAPES_GRAMMAR = {
      escape: {
        pattern: (/\\./) // A backslash followed by any single character
      }
    };
    
    // String escapes make this ugly here, but we're turning:
    //   "Lorem \"ipsum\" dolor"
    // into:
    //   "Lorem <span class='escape'>\"</span>ipsum<span class='escape'>\"</span> dolor"
    console.log(Fluorescence.parse("\"Lorem \\"ipsum\\" dolor", ESCAPES));
    //-> "Lorem <span class='escape'>\"</span>ipsum<span class='escape'>\"</span> dolor"

In this example, we're taking a rule that _should not_ be applied globally (escape sequences) and applying it to arbitrary text. In practice, we can reference it from a main grammar:

    Fluorescence.addLanguage('ruby', {
      string: {
        pattern: (/(")(.*?[^\\])(")/),
        replacement: "<span class='#{0}'>#{1}#{2}#{3}</span>",
        beforeCallback: function(r) {
          // Group 2 is the stuff within the quotation marks; apply the
          // escape rule from above.
          r[2] = Fluorescence.parse(r[2], ESCAPES_GRAMMAR);
          return r;
        }
      },
      // ...  
    });
    
With this technique, you can exert more fine-grained control over which rules apply in which contexts. See `languages/ruby.js` for an example; it defines several internal grammars, some which are added to the main grammar and some which are not.

If you want to parse some text with a named language, pass the language's name as the second argument to `Fluorescence.parse`:

    Fluorescence.addLanguage('html', {
      // ...
      js_embedded: {
        pattern: (/(&lt;)(script)(\s+.*?)?(&gt;)(.*?)(&lt;\/script&gt;)/),
        replacement: "<span class='element'>#{1}<span class='element-name'>#{2}</span>#{3}#{4}</span>#{4}<span class='element'>#{5}</span>",
        
        beforeCallback: function(r) {
          // Group 3 is the attribute collection, if it exists.
          r[2] = doMagicalParsingOfAttributes(r[5]);
          // Group 5 is raw JavaScript; highlight it.
          r[5] = Fluorescence.parse(r[5], 'javascript');
          return r;
        }
      }
    });


## Further configuration

Fluorescence performs some voodoo to get all this to work properly in IE — which has trouble when a `code` element is contained by a `pre` element (i.e., the _common, everyday case_). As part of this voodoo, it replaces tabs with spaces. The default tab size is `2`, because I consider that to be _correct_ and any other value to be _wrong and dangerous_. If you disagree, though, you can change this setting:

    <script type="text/javascript">
      Fluorescence.TAB_SIZE = 4;
    </script>

Keep in mind, though, that most browsers have other ideas about how wide a tab should be. Safari treats a tab as _eight spaces_. That's enough to make me want to kill someone. It doesn't end up affecting me, though, because I write HTML with "soft" tabs (literal spaces instead of tabs). If you don't do the same, I'd recommend you selectively convert tabs to spaces inside your code blocks before you publish your HTML.

## Caveats

When you define a language, you give it rules, and each rule has one regular expression. When Fluorescence processes that language, it assembles each regular expression into **one giant regular expression**. Each pattern gets concatenated together as an alternation (`|`).

When Fluorescence parses a block of text, it executes that one regex against the text over and over again. At each step, it figures out which rule was matched, applies the replacement text, then continues from the end of the previous match.

This means that **all else being equal, earlier rules will match before later rules**.

It also means that **you shouldn't put flags on your regular expressions**. The language's giant regular expression will have the multiline and global flags set; if you also want it to have the case-insensitive flag set, pass `{ ignoreCase: true }` as the third argument to `Fluorescence.addLanguage`.

Sadly, this further means that **case insensitivity is all-or-nothing within a language**. In some languages, like HTML, this is probably OK; in more complicated stuff like JavaScript, total case insensitivity won't work at all. If an individual rule needs case-insensitivity, you'll have to get creative in how you write its regular expression.

## About

Fluorescence is released under the terms of the [MIT License][mit].

The code is hosted [on GitHub][github]. You can file bugs on the [Lighthouse project][lighthouse].


[oniguruma]: http://en.wikipedia.org/wiki/Oniguruma
[textmate grammars]: http://manual.macromates.com/en/language_grammars
[sample]: http://andrewdupont.net/fluorescence/images/sample.png
[prototype]: http://prototypejs.org
[lighthouse]: http://andrewdupont.lighthouseapp.com/projects/29492-fluorescence/overview
[github]: http://github.com/savetheclocktower/fluorescence/tree/master
[mit]: http://www.opensource.org/licenses/mit-license.php
