(function(F) {
  
  function parseParameters(str, grammar, context) {
    if (!grammar) grammar = PARAMETERS_GRAMMAR;
    // These are way easier to parse individually. Split them up, parse
    // each one, then join them back together.
    //
    // This is a bit hacky because we need to handle the case where there's a
    // comma in a default-value'd hash.
    function hasOnlyLeftBrace (part) {
      return part.include('{') && !part.include('}');
    }
    
    function hasOnlyRightBrace (part) {
      return part.include('}') && !part.include('{');
    }
    
    function findEndOfHash (parts, startIndex) {
      for (var i = startIndex; i < parts.length; i++) {
        if (hasOnlyRightBrace(parts[i])) {
          return i;
        }
      }
    }
    
    function rejoinHash (parts, startIndex, endIndex) {
      var result = [];
      for (var i = startIndex; i <= endIndex; i++) {
        result.push(parts[i]);
      }
      return result.join(',');
    }
    
    var rawParts = str.split(/,/), parameters = [];
    for (var i = 0, rawPart; i < rawParts.length; i++) {
      rawPart = rawParts[i];
      if (hasOnlyLeftBrace(rawPart)) {
        var endIndex = findEndOfHash(rawParts, i + 1);
        parameters.push(rejoinHash(rawParts, i, endIndex));
        i += (endIndex - i);
      } else {
        parameters.push(rawPart);
      }
    }
    
    return parameters.map(function(p) {
      return F.parse(p, grammar, context);
    }).join(',');
  }
  
  // Method parameters.
  var PARAMETERS_GRAMMAR = {
    'parameter-with-default': {
      pattern: (/^(\s*)([A-Za-z0-9_]+)(\s*=\s*)(.*)/),
      replacement: "#{1}<span class='#{0}'><span class='variable parameter'>#{2}</span><span class='keyword punctuation'>#{3}</span>#{4}</span>",
      
      beforeCallback: function(r, context) {
        r[4] = F.parse(r[4], VALUES_GRAMMAR, context);
        return r;
      }
    },
    'variable parameter': {
      pattern: (/^(\s*)([A-Za-z0-9_]+)$/),
      replacement: "#{1}<span class='#{0}'>#{2}</span>"
    }
  };
  
  // Block parameters.
  // Separate grammar for this one because block parameters can't have
  // defaults.
  var BLOCK_PARAMETERS_GRAMMAR = {};
  BLOCK_PARAMETERS_GRAMMAR['variable parameter'] =
   PARAMETERS_GRAMMAR['variable parameter'];
  
  // Values.
  // In other words, (nearly) anything that's valid on the right hand side of
  // an assignment operator.
  var VALUES_GRAMMAR = {
    // Single-quoted strings have no escapes _or_ interpolation, so this is
    // an easy one.
    'single-quoted string': {
      pattern: (/(')([^']*?)(')/),
      replacement: "<span class='#{0}'>#{1}#{2}#{3}</span>"
    },
    
    'double-quoted string': {
      pattern: (/(")(.*?[^\\])(")/),
      replacement: "<span class='#{0}'>#{1}#{2}#{3}</span>",
      beforeCallback: function(r, context) {
        r[2] = F.parse(r[2], ESCAPES_GRAMMAR,       context);
        r[2] = F.parse(r[2], INTERPOLATION_GRAMMAR, context);
      }
    },
    
    // Probably could rewrite the above pattern to catch this, but this is
    // good enough for now.
    'double-quoted string empty': {
      pattern: (/\"\"/)
    },
    
    'percent-q string': {
      // This literal occurs more often with braces, but we can't highlight
      // (e.g)...
      //   %Q{foo#{bar}}
      // ...because regexes famously can't do parentheses-balancing. The
      // TextMate grammar for Ruby does this with begin/end patterns, but we
      // don't have those right now.
      pattern: (/(%Q\[)(.*?[^\\])(\])/),
      replacement: "<span class='#{0}'>#{1}#{2}#{3}</span>",
      beforeCallback: function(r, context) {
        r[2] = F.parse(r[2], ESCAPES_GRAMMAR,       context);
        r[2] = F.parse(r[2], INTERPOLATION_GRAMMAR, context);
      }
    },
    
    'shell-command string': {
      pattern: (/(`)([^`]*?)(`)/),
      replacement: "<span class='#{0}'>#{1}#{2}#{3}</span>",
      beforeCallback: function(r, context) {
        r[2] = F.parse(r[2], ESCAPES_GRAMMAR,       context);
        r[2] = F.parse(r[2], INTERPOLATION_GRAMMAR, context);
      }
    },

    constant: {
      pattern: (/\b(self|nil|true|false)\b/)
    },
    
    'number binary': {
      pattern: (/\b0b[01](?:_[01]|[01])*\b/)
    },
    
    number: {
      pattern: (/\b(\d(?:[_.]\d|\d)*)\b/)
    },
    
    // Namespace operator. We capture this (and pass it along unmodified) so
    // that it won't get matched by the symbol rule.
    not_symbol: {
      pattern: (/(::)/),
      replacement: "#{1}"
    },
    
    symbol: {
      pattern: (/(:[A-Za-z0-9_!?]+)/),
      replacement: "<span class='symbol'>#{1}</span>"
    },
    
    'single-quoted symbol': {
      pattern: (/(:)(')([^']*?)(')/),
      replacement: "<span class='#{0}'>#{1}#{2}#{3}#{4}</span>"
    },
    
    'double-quoted symbol': {
      pattern: (/(:)(")(.*?[^\\])(")/),
      replacement: "<span class='#{0}'>#{1}#{2}#{3}#{4}</span>",
      beforeCallback: function(r, context) {
        r[3] = F.parse(r[3], ESCAPES_GRAMMAR,       context);
        r[3] = F.parse(r[3], INTERPOLATION_GRAMMAR, context);
      }
    },

    regexp: {
      pattern: (/(\/)(.*?)(\/)/),
      replacement: "<span class='regexp'>#{1}#{2}#{3}</span>",
      beforeCallback: function(r, context) {
        r[2] = F.parse(r[2], REGEX_INTERNALS_GRAMMAR, context);
      }
    },
    
    'variable instance-variable': {
      pattern: (/(@)[a-zA-Z_]\w*/)
    }
  };
  
  var ESCAPES_GRAMMAR = {
    escape: {
      pattern: (/\\./)
    }
  };
  
  var REGEX_INTERNALS_GRAMMAR = {
    escape: {
      pattern: (/\\./)
    },
    
    'exclude from group begin': {
      pattern: (/(\\\()/),
      replacement: "#{1}"
    },
    
    'group-begin': {
      pattern: (/(\()/),
      replacement: '<b class="group">#{1}'
    },
    
    'group-end': {
      pattern: (/(\))/),
      replacement: '#{1}</b>'
    }
  };
  
  // Interpolation grammar. Used in strings, shell commands, double-quoted
  // symbols.
  var INTERPOLATION_GRAMMAR = {
    interpolation: {
      pattern: (/(#\{)(.*?)(\})/),
      replacement: "<span class='#{0}'><span class='punctuation'>#{1}</span>#{2}<span class='punctuation'>#{3}</span></span>"
    }
  };
  
  // Main grammar.
  var RUBY_GRAMMAR = {
    method_definition: {
      pattern: (/(def)\s+([A-Za-z0-9_!?.]+)(?:\s*(\()(.*?)(\)))?/),
      replacement: "<span class='keyword'>#{1}</span> <span class='entity'>#{2}</span>#{3}#{4}#{5}",
      beforeCallback: function(r) {
        if (!r[4]) return r;
        r[4] = parseParameters(r[4]);
        return r;
      }
    },
    
    'block block-braces': {
      pattern: (/(\{)(\s*)(\|)([^|]*?)(\|)/),
      replacement: "<span class='#{0}'><span class='punctuation brace'>#{1}</span>#{2}<span class='punctuation pipe'>#{3}</span>#{4}<span class='punctuation pipe'>#{5}</span>",
      
      beforeCallback: function(r, context) {
        var bracesStack = context.get('bracesStack', []);
        bracesStack.push(r[0]);
        r[4] = parseParameters(r[4], BLOCK_PARAMETERS_GRAMMAR, context);
        r[6] = F.parse(r[6], 'ruby');
      }
    },
    
    'block block-do-end': {
      pattern: (/(do)(\s*)(\|)([^|]*?)(\|)([\s\S]+?)(end)/),
      replacement: "<b class='#{0}'>#{1}<span class='keyword'>#{2}</span><span class='punctuation pipe'>#{3}</span>#{4}<span class='punctuation pipe'>#{5}</span>#{6}<span class='keyword'>#{7}</span></span>",
      
      beforeCallback: function(r) {
        r[4] = parseParameters(r[4]);
        r[6] = F.parse(r[6], 'ruby');
      }
    },

    class_definition_with_superclass: {
      pattern: (/(class)\s+([A-Z][A-Za-z0-9_]*)\s*(?:<|&lt;)\s*([A-Z][A-Za-z0-9:_]*)/),
      replacement: "<span class='class-definition-with-superclass'><span class='keyword'>#{1}</span> <span class='class-definition-signature'><span class='class'>#{2}</span> &lt; <span class='class superclass'>#{3}</span></span></span>"
    },
  
    class_or_module_definition: {
      pattern: (/(class|module)\s+([A-Z][A-Za-z0-9_]*)(?=$|\n)/),
      replacement: "<span class='#{1}-definition'><span class='keyword'>#{1}</span> <span class='class-definition-signature'><span class='class'>#{2}</span></span></span>"
    },
    
    // Indented heredocs are easier than normal heredocs because the syntax
    // is unambiguous.
    'heredoc indented string': {
      pattern: (/(&lt;&lt;-)([_\w]+?)\b([\s\S]+?)(\2)/),
      replacement: "<span class='#{0}'><span class='begin'>#{1}#{2}</span>#{3}<span class='end'>#{4}</span></span>",
      beforeCallback: function(r) {
        r[3] = F.parse(r[3], ESCAPES_GRAMMAR);
        r[3] = F.parse(r[3], INTERPOLATION_GRAMMAR);
      }
      
    },
    
    'keyword operator': {
      pattern: (/(=>|=&gt;|>>|&gt;&gt;|<<|&lt;&lt;|=~|\|\|=|==|=|\|\||&&|\+=|-=|\*=|\/=)/),
    },

    keyword: {
      pattern: (/\b(do|end|class|def|if|module|yield|then|else|for|until|unless|while|elsif|case|when|break|retry|redo|rescue|require)\b/)
    },
    
    'keyword special': {
      pattern: (/\b(initialize|new|loop|extend|raise|attr|catch|throw|private|protected|public|module_function|attr_(?:reader|writer|accessor))\b/)
    }
  };
  
  Object.extend(RUBY_GRAMMAR, VALUES_GRAMMAR);
  
  // These need to be lowest possible priority, so we put them in after the
  // values grammar.
  Object.extend(RUBY_GRAMMAR, {
    comment: {
      pattern: (/#[^\n]+/)
    },
    
    'bracket-block-end': {
      pattern: (/(\})/),
      replacement: "#{1}",
      afterCallback: function(r, context) {
        var bracesStack = context.get('bracesStack', []);
        var scope = bracesStack.pop();
        if (!scope) return;
        return r + "</b>";
      }
    }
  });
  
  F.addLanguage('ruby', RUBY_GRAMMAR);
})(Fluorescence);

