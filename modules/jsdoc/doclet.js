/**
	@module jsdoc/doclet
	@requires  jsdoc/tag

	@author Michael Mathews <micmath@gmail.com>
	@license Apache License 2.0 - See file 'LICENSE.md' in this project.
 */
(function() {
	var jsdoc = {
	    tag: {
	        Tag: require('jsdoc/tag').Tag,
	        dictionary: require('jsdoc/tag/dictionary')
	    },
	    name: require('jsdoc/name')
	};
	
	/**
	    @constructor
	 */
	exports.Doclet = function (docletSrc, meta) {
	    var newTags = [];
	    
	    this.src = docletSrc;
	    addMeta.call(this, meta);
	    this.tags = [];
	    
	    docletSrc = unwrap(docletSrc);
	    docletSrc = fixDescription(docletSrc);

	    newTags = toTags.call(this, docletSrc);

	    for (var i = 0, leni = newTags.length; i < leni; i++) {
	        this.addTag(newTags[i].title, newTags[i].text);
	    }
	    
	    this.postProcess();
	    
	}
	
	function addMeta(meta) {
	    if (!this.meta) { this.meta = {}; }
	    
	    if (meta.lineno) this.meta.lineno = meta.lineno;
	    if (meta.lineno) this.meta.filename = meta.filename;
	    this.meta.code = (this.meta.code || {});
	    if (meta.id) this.meta.code.id = meta.id;
	    if (meta.code) {
	        if (meta.code.name) this.meta.code.name = meta.code.name;
	        if (meta.code.type) this.meta.code.type = meta.code.type;
	        if (meta.code.val)  this.meta.code.val = meta.code.val;
	    }
	}
	
	exports.Doclet.prototype.postProcess = function() {
	    if (!this.preserveName) { jsdoc.name.resolve(this); }
	    if (this.name && !this.longname) { this.longname = this.name; }
	}
	
	exports.Doclet.prototype.addTag = function(title, text) {
        var tagDef = jsdoc.tag.dictionary.lookUp(title),
	        newTag = new jsdoc.tag.Tag(title, text, this.meta);
	    
	    if (tagDef.onTagged) {
	        if (tagDef.onTagged(this, newTag) !== false) { // onTagged handler prevents tag being added bt returning false
	            this.tags.push(newTag);
	        }
	    }
	    else {
	        this.tags.push(newTag);
	    }
	    
	    applyTag.call(this, newTag);
	}
	
	exports.Doclet.prototype.augment = function(base) {
	    if (!this.mixins) { this.mixins = []; }
        this.mixins.push( {source: source, target: (target||'this')} );
	}
	
	exports.Doclet.prototype.setMemberof = function(sid) {
	    this.memberof = sid;
	}
	
	exports.Doclet.prototype.borrow = function(source, target) {
	    if (!this.borrowed) { this.borrowed = []; }
        this.borrowed.push( {from: source, as: (target||'this')} );
	}
	
	function applyTag(tag) {
	    if (tag.title === 'name') {
            this.name = tag.value;
        }
        
        if (tag.title === 'kind') {
            this.kind = tag.value;
        }
        
        if (tag.title === 'description') {
            this.description = tag.value;
        }
        
        if (tag.title === 'scope') {
            this.scope = tag.value;
        }
	}
	
	/**
	    Convert the raw source of the doclet comment into an array of Tag objects.
	    @private
	 */
	function toTags(docletSrc) {
	    var tagSrcs,
	        tags = [];
	    
	    docletSrc = unwrap(docletSrc);
	    tagSrcs = split(docletSrc);
	    
	    for each(tagSrc in tagSrcs) {
	        tags.push( {title: tagSrc.title, text: tagSrc.text} );
	    }
	    
	    return tags;
	}
	
	function unwrap(docletSrc) {
	    if (!docletSrc) { return ''; }
	
		// note: keep trailing whitespace for @examples
		// extra opening/closing stars are ignored
		// left margin is considered a star and a space
		// use the /m flag on regex to avoid having to guess what this platform's newline is
		docletSrc =
			docletSrc.replace(/^\/\*\*+/, '') // remove opening slash+stars
			.replace(/\**\*\/$/, "\\Z")       // replace closing star slash with end-marker
			.replace(/^\s*(\* ?|\\Z)/gm, '')  // remove left margin like: spaces+star or spaces+end-marker
			.replace(/\s*\\Z$/g, '');         // remove end-marker

		return docletSrc;
	}
	
	function fixDescription(docletSrc) {
	    if (!/^\s*@/.test(docletSrc)) {
			docletSrc = '@description ' + docletSrc;
		}
		return docletSrc;
	}
	
	function split(docletSrc) {
		var tagSrcs = [];

		// split out the basic tags, keep surrounding whitespace
		// like: @tagTitle tagBody
		docletSrc
		.replace(/^(\s*)@(\S)/gm, '$1\\@$2') // replace splitter ats with an arbitrary sequence
		.split('\\@')                        // then split on that arbitrary sequence
		.forEach(function($) {
		    if ($) {
                parsedTag = $.match(/^(\S+)(:?\s+(\S[\s\S]*))?/);
                
                 if (parsedTag) {
                    var [, tagTitle, tagText] = parsedTag;
                    
                    if (tagTitle) {
                        tagSrcs.push({
                            title: tagTitle,
                            text: tagText
                        });
                    }
                }
            }
		});
		
		return tagSrcs;
	}
	
})();