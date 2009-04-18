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
  
  var DEFAULT_TEMPLATE = new Template(
    '<span class="#{className}">#{text}</span>');  
  
  // Private/inner class.
  var Language = Class.create({
    initialize: function(name, rules, options) {
      this.name    = name;
      this.rules   = this._makeRules(rules);
      this.options = Object.extend(
        Object.clone(Language.DEFAULT_OPTIONS), 
        options || {}
      );
      
      this.elements = [];
      this.pattern = new RegExp(this.rules.pluck('pattern').join('|'),
       this.options.ignoreCase ? "gi" : "g");
    },
    
    _makeRules: function(rules) {
      var newRules = [];
      for (var ruleName in rules) {
        newRules.push(new Rule(ruleName, rules[ruleName]));
      }
      return newRules;
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
    
    parse: function(text) {
      var matches = this.pattern.exec(text);
      var parsed = text.replace(this.pattern, function() {
        var i = 0, j = 1, rule, replacements;
        var length = matches.length;
        console.log(matches);
        while (rule = this.rules[i++]) {
          if (!arguments[j] || arguments[j] === "") {
            j += rule.length;
            continue;
          }
          
          if (!rule.replacement) {
            return DEFAULT_TEMPLATE.evaluate({
             className: rule.name, text: arguments[0] });
          } else {
            replacements = [rule.name];
            for (var k = 1; k <= rule.length; k++)
              replacements.push(arguments[j + k]);
              
            return rule.replacement.interpolate(replacements);
          }
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
    initialize: function(name, rule) {
      this.name = name;
      Object.extend(this, rule);
      
      if (!Object.isString(rule.pattern)) {
        this.pattern = rule.pattern.toString().substr(1, String(rule.pattern).length - 2);
      } else {
        this.pattern = rule.pattern;
      }
      
      this.length = (this.pattern.match(/(^|[^\\])\([^?]/g) || "").length + 1;
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
    }
  };  
})();