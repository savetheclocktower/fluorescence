Fluorescence.addLanguage('html', {
	closingTag: {
	  pattern: /(\/?(?:>|&gt;))/,
	  replacement: "<span class=\"tag\">#{1}</span>"
	},
	
	comment: {
		pattern: /&lt;!\s*(--([^-]|[\r\n]|-[^-])*--\s*)&gt;/
	},
	
	tag:  {
	  pattern: /((?:<|&lt;)\/?)([a-zA-Z0-9:]+\s?)/,  
		replacement: "<span class=\"#{0}\">#{1}#{2}</span>"
	},

	string: {
    pattern: /('[^']*[^\\]'|"[^"]*[^\\]")/
	},

	attribute: {
		pattern: /\b([a-zA-Z-:]+)(=)/,
		replacement: "<span class=\"#{0}\">#{1}</span>#{2}"
	},
	
	doctype: {
		pattern: /&lt;!DOCTYPE([^&]|&[^g]|&g[^t])*&gt;/
	} 	
});
