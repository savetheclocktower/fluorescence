//= require <prototype>

/*
 * FLUORESCENCE
 * ============
 * 
 * A rewrite of Dan Webb's original Unobtrusive Code Highlighter. Refactored to
 * take advantage of Prototype idioms and to clean out the cruft of legacy
 * browser support.
 * 
 * Tested on:
 *  Firefox 3+
 *  Safari 3+
 * 
 * 
 * Usage:
 *  (1) Include this script on your page.
 *  (2) Include any number of language parsing definitions. Sample definitions
 *      are included.
 *  (3) Assign a class name to any code block you want highlighted. The class
 *      name should be identical to the language definition name passed to
 *      `CodeHighlighter.addStyle`.
 *  (4) Include a stylesheet that highlights your code. You can target parsed
 *      tokens by name: for example, `pre code .string` will highlight anything
 *      with a style rule named "string."
 *
 * Dan's script (and therefore _this_ script) was inspired by star-light,
 * written by the cunning Dean Edwards (http://dean.edwards.name/star-light/).
 *
 */

(function() {
  
  function regexToString(re) {
    var str = re.toString();
    // Trim the regex of its slashes and any trailing flags.
    str = str.replace(/^\//, '').replace(/\/[mgiy]*$/, '');
    return str;
  }
  
  var DEFAULT_TEMPLATE = new Template(
    '<span class="#{className}">#{text}</span>');  
    
  // Private/inner class.
  var Language = Class.create({
    initialize: function(name, rules, options) {
      this.name = name;
      this._makeRules(rules);
      
      this.options = Object.extend(
        Object.clone(Language.DEFAULT_OPTIONS), 
        options || {}
      );
      
      this.elements = [];
      this.pattern = new RegExp(this.rules.pluck('pattern').join('|'),
       this.options.ignoreCase ? "mgi" : "mg");
      
      this.storage = new Hash();
    },
    
    _makeRules: function(rules) {
      // Keep track of how many capture groups we're creating. The rule
      // constructors need to know this in case their patterns have any group
      // backreferences. They'll need to convert (e.g.) \2 to \15.
      var newRules = [], obj, rule, prevCaptureGroups = 0;
      for (var ruleName in rules) {
        obj = rules[ruleName];
        rule = new Rule(ruleName, obj, prevCaptureGroups);
        newRules.push(rule);
        prevCaptureGroups += rule.length;
      }
      
      this.rules = newRules;
    },
    
    set: function(key, value) {
      this.storage.set(key, value);
      return value;
    },
    
    get: function(key, defaultValue) {
      var val = this.storage.get(key);
      if (Object.isUndefined(val)) {
        val = defaultValue;
        this.storage.set(key, val);
      }
      return val;
    },
    
    addElement: function(element) {
      this.elements.push(element);
    },
    
    highlight: function() {
      for (var i = 0, element, parsed; element = $(this.elements[i]); i++) {
        if (Prototype.Browser.IE && element.parentNode.nodeName === 'PRE') {
          element = element.parentNode;
          parsed = this._fixIE(element.innerHTML);
        } else {
          parsed = this.parse(element.innerHTML);
        }
        element.update(parsed);
      }
    },
    
    parse: function(text, context) {
      // Reset the pattern.
      // In Firefox, when `exec` gets called twice in succession on the same
      // regexp with identical strings, it will try to start matching from
      // the `lastIndex` the second time through, instead of from the
      // beginning of the string.
      this.pattern.lastIndex = 0;
      
      if (!context) context = this;
      
      var matches = this.pattern.exec(text);
      if (!matches) return text;
      var parsed = text.replace(this.pattern, function() {
        var i = 0, j = 1, rule, replacements, beforeCallbackResult, afterCallbackResult;
        var length = matches.length;
        while (rule = this.rules[i++]) {
          if (!arguments[j] || arguments[j] === "") {
            j += rule.length;
            continue;
          }
          
          replacements = [rule.name];
          for (var k = 1; k <= rule.length; k++)
            replacements.push(arguments[j + k]);
            
          // We let the user _either_ modify the replacements in-place _or_
          // return an entirely new array. So if the function returns
          // `undefined`, don't re-assign the variable; the replacements were
          // probably modified in-place.
          if (rule.beforeCallback) {
            beforeCallbackResult = rule.beforeCallback(replacements, context);
            if (!Object.isUndefined(beforeCallbackResult))
              replacements = beforeCallbackResult;
          }
          
          var result;
          if (!rule.replacement) {
            result = DEFAULT_TEMPLATE.evaluate({
             className: rule.name, text: arguments[0] });
          } else {
            result = rule.replacement.interpolate(replacements);
          }
          
          if (rule.afterCallback) {
            afterCallbackResult = rule.afterCallback(result, context);
            if (!Object.isUndefined(afterCallbackResult))
            result = afterCallbackResult;
          }
          
          return result;
        }
      }.bind(this));
      
      return parsed;
    },
    
    _fixIE: function(text) {
      var parsed = text.replace(/(<code[^>]*>)([^<]*)<\/code>/, function() {
        return arguments[1] + this.parse(arguments[2]);
      });
      
      // Newline substitution (preserving indentation).
      parsed = parsed.replace(/\n(\s*)/g, function() {
        return "\n" + ("&nbsp;".times(arguments[1].length));
      });
      
      // Tab substitution.
      parsed = parsed.replace(/\t/g, "&nbsp;".times(Fluorescence.TAB_SIZE));
      
      // Empty lines.
      parsed = parsed.replace(/\n(<\/\w+>)?/g, "<br />$1");
      parsed = parsed.replace(/<br \/>[\n\r\s]*<br \/>/g, "<p><br /></p>");
      
      return parsed;
    }
  });
  
  Object.extend(Language, {
    _instances: [],
    
    DEFAULT_OPTIONS: {
      ignoreCase: false
    },
    
    add: function(instance) {
      this._instances.push(instance);
    },
    
    remove: function(instance) {
      this._instances = this._instances.without(instance);
    },
    
    _each: function(iterator) {
      return this._instances._each(iterator);
    }
  });
  
  Object.extend(Language, Enumerable);
  
  
  // Private/inner class.
  var Rule = Class.create({
    initialize: function(name, rule, prevCaptureGroups) {
      this.name = name;
      Object.extend(this, rule);
      
      if (!Object.isString(rule.pattern)) {
        this.pattern = regexToString(rule.pattern);
      } else {
        this.pattern = rule.pattern;
      }
      
      // Alter backreferences so that they point to the right thing. Yes,
      // this is ridiculous.
      this.pattern = this.pattern.replace(/\\(\d+)/, function(m, d) {
        var group = Number(d);
        // Adjust for the number of groups that already exist, plus the
        // surrounding set of parentheses.
        return "\\" + ((prevCaptureGroups + 1) + group);
      });
      
      // Man, I wish we had lookbehind.
      //
      // To figure out how many capturing groups a regex has, we count the
      // raw open parentheses, then we subtract any patterns that can have
      // open parentheses without actually starting groups.
      //
      // This is not bulletproof, but it's as close as I've gotten.
      
      // Count all open parentheses.
      var parens       = (this.pattern.match(/\(/g)   || "").length;
      // Subtract the ones that begin non-capturing groups.
      var nonCapturing = (this.pattern.match(/\(\?/)  || "").length;
      // Subtract the ones that are literal open-parens.
      var escaped      = (this.pattern.match(/\\\(/g) || "").length;
      // Add back the ones that match the pattern `\(?`, because they were
      // counted twice instead of once.
      var nonCapturingEscaped  = (this.pattern.match(/\\\(\?/g) || "").length;
      
      var exceptions = ((nonCapturing + escaped) - nonCapturingEscaped);
      
      // Add one because we're about to surround the whole thing in a
      // capturing group.
      this.length = (parens + 1) - exceptions;
      this.pattern = '(' + this.pattern + ')';
    }
  });
  
  function _setup() {
    var elements = document.getElementsByTagName('code');
    
    for (var i = 0, element; element = $(elements[i]); i++) {
      if (element.className.blank()) continue;
      Language.each( function(set) {
        if (element.hasClassName(set.name))
          set.addElement(element);
      });
    }
    
    Language.invoke('highlight');
  }
  
  window.Fluorescence = {
    TAB_SIZE: 2,
        
    addLanguage: function(name, rules, options) {
      Language.add(new Language(name, rules, options));
      if (Language.size() === 1) {
        document.observe('dom:loaded', _setup);
      }
    },
    
    getLanguage: function(name) {
      var result = Language.detect(function(l) { return l.name === name; });
      return result;
    },
    
    // Utility. Given an "anonymous" grammar (an object that could be passed
    // as the second argument of `addLanguage`), highlights the given text.
    parse: function(text, grammar, context) {
      var language;
      if (Object.isString(grammar)) {
        language = this.getLanguage(grammar);
      } else {
        language = new Language(null, grammar);
      }
      
      // If we don't have a language here, the user probably asked for a
      // named language that hasn't been added. Fail silently.
      if (!language) return text;
      
      return language.parse(text, context);
    }
  };
})();