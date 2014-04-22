(function() {
  
  var ATTRIBUTES_GRAMMAR = {
    string: {
      pattern: (/('[^']*[^\\]'|"[^"]*[^\\]")/)
    },

    attribute: {
      pattern: (/\b([a-zA-Z-:]+)(=)/),
      replacement: "<span class='attribute-with-equals-sign'><span class='#{0}'>#{1}</span><span class='punctuation'>#{2}</span></span>"
    }
  };
  
  var HTML_GRAMMAR = {
    doctype: {
      pattern: (/&lt;!DOCTYPE([^&]|&[^g]|&g[^t])*&gt;/)
    },
    
    'embedded javascript-embedded': {
      pattern: (/(&lt;)(script|SCRIPT)(\s+.*?)?(&gt;)([\s\S]*?)(&lt;\/)(script)(&gt;)/),
      replacement: "<span class='element'><span class='punctuation'>#{1}</span><span class='tag'>#{2}</span>#{3}<span class='punctuation'>#{4}</span></span>#{5}<span class='element closing-element'><span class='punctuation'>#{6}</span><span class='tag'>#{7}</span><span class='punctuation'>#{8}</span></span>",
      
      beforeCallback: function(r) {
        r[3] = r[3] ? Fluorescence.parse(r[3], ATTRIBUTES_GRAMMAR) : "";
        r[5] = Fluorescence.parse(r[5], 'javascript');
      }
    },
    
    tag: {
      pattern: (/((?:<|&lt;))([a-zA-Z0-9:]+\s*)(.*?)(\/)?(&gt;)/),
      replacement: "<span class='element'><span class='punctuation'>#{1}</span><span class='tag'>#{2}</span>#{3}<span class='punctuation'>#{4}#{5}</span></span>",
      
      beforeCallback: function(r) {
        r[3] = Fluorescence.parse(r[3], ATTRIBUTES_GRAMMAR);
      }
    },
    
    'tag closing-tag': {
      pattern: (/(&lt;\/)([a-zA-Z0-9:]+)(&gt;)/),
      replacement: "<span class='element closing-element'><span class='punctuation'>#{1}</span><span class='tag'>#{2}</span><span class='punctuation'>#{3}</span></span>"
    },
    
    comment: {
      pattern: (/&lt;!\s*(--([^-]|[\r\n]|-[^-])*--\s*)&gt;/)
    }
  };
  
  Fluorescence.addLanguage('html', HTML_GRAMMAR);
})();