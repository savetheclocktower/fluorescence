Fluorescence.addLanguage('javascript', 
{
  fun: {
    pattern: /\b(function)\s+([a-zA-Z_$]\w*)?\s*\((.*?)\)/,
    replacement: "<span class='function'>#{1}</span> <span class='entity'>#{2}</span>(<span class='parameter'>#{3}</span>)"
  },
  
  fun2: {
    pattern: /\b([a-zA-Z_?\.$]+\w*)\s+=\s+\b(function)?\s*\((.*?)\)/,
    replacement: "<span class='entity'>#{1}</span> = <span class='function'>#{2}</span>(<span class='parameter'>#{3}</span>)"
  },
  
  fun3: {
    pattern: /\b(function)\s*\((.*?)\)/,
    replacement: "<span class='function'>#{1}</span>(<span class='parameter'>#{2}</span>)"
  },
  
  variable: {
    pattern: /\bvar\s+([A-Za-z_$]+?)\b/,
    replacement: "var <span class='#{0}'>#{1}</span>"
  },
  
  string: {
    pattern: /'[^']*[^\\]'|"[^"]*[^\\]"/
  },
  
  comment: {
    pattern: /(\/\/[^\n]*\n)|(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)/
  },
  
  control: {
    pattern: /\b(break|case|catch|continue|default|do|else|finally|for|goto|if|import|package|return|switch|throw|try|while|with)\b/
  },
  
  constant: {
    pattern: /\b(false|null|super|this|true)\b/
  },
  
  property: {
    pattern: /\b([A-Za-z_$]+?):\s/,
    replacement: "<span class='#{0}'>#{1}</span>: "
  },
  
  number: {
    pattern: /\b((0(x|X)[0-9a-fA-F]+)|([0-9]+(\.[0-9]+)?))\b/
  }
});