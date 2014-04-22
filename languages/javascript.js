(function() {
  function highlightParams(text) {
    function wrapParameter(text) {
      return "<span class='variable parameter'>" + text + "</span>";
    }
    
    return text.split(/,\s*/).map(wrapParameter).join(', ');
  }
  
  var ESCAPES_GRAMMAR = {
    escape: {
      pattern: (/\\./)
    }
  };
  
  Fluorescence.addLanguage('javascript',
  {
    keyword: {
      pattern: (/new(?=\s[A-Za-z_$])/),
      replacement: "<span class='#{0}'>new</span>"
    },
    
    variable: {
      pattern: (/\bvar\s+([A-Za-z_$]+?)\b/),
      replacement: "var <span class='#{0}'>#{1}</span>"
    },
  
    fun: {
      pattern: ((/\b(function)\s+([a-zA-Z_$]\w*)?\s*(\()(.*?)(\))/)),
      replacement: "<span class='function'>#{1}</span> <span class='entity'>#{2}</span>#{3}#{4}#{5}",
    
      beforeCallback: function(r, highlight) {
        r[4] = highlightParams(r[4]);
        return r;
      }
    },
  
    fun2: {
      pattern: (/\b([a-zA-Z_?\.$]+\w*)\s+=\s+\b(function)?\s*\((.*?)\)/),
      replacement: "<span class='entity'>#{1}</span> = <span class='function'>#{2}</span>(<span class='parameter'>#{3}</span>)"
    },
  
    fun3: {
      pattern: (/\b(function)\s*(\()(.*?)(\))/),
      replacement: "<span class='function'>#{1}</span>#{2}#{3}#{4}",
      
      beforeCallback: function(r, highlight) {
        r[3] = highlightParams(r[3]);
        return r;
      }
    },
  
    'single-quoted string': {
      pattern: (/(')([^']*?)(')/),
      replacement: "<span class='#{0}'>#{1}#{2}#{3}</span>",
      beforeCallback: function(r) {
        r[2] = Fluorescence.parse(r[2], ESCAPES_GRAMMAR);
        return r;
      }
    },
    
    'double-quoted string': {
      pattern: (/(")(.*?[^\\])(")/),
      replacement: "<span class='#{0}'>#{1}#{2}#{3}</span>",
      beforeCallback: function(r) {
        r[2] = Fluorescence.parse(r[2], ESCAPES_GRAMMAR);
        return r;
      }
    },
  
    comment: {
      pattern: (/(\/\/[^\n]*\n)|(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)/)
    },
  
    control: {
      pattern: (/\b(break|case|catch|continue|default|do|else|finally|for|goto|if|import|package|return|switch|throw|try|while|with)\b/)
    },
  
    constant: {
      pattern: (/\b(false|null|super|this|true)\b/)
    },
  
    property: {
      pattern: (/\b([A-Za-z_$]+?):\s/),
      replacement: "<span class='#{0}'>#{1}</span>: "
    },
  
    number: {
      pattern: (/\b((0(x|X)[0-9a-fA-F]+)|([0-9]+(\.[0-9]+)?))\b/)
    }
  });
})();