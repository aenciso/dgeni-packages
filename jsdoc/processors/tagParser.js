var TagCollection = require('../lib/TagCollection');
var Tag = require('../lib/Tag');

var END_OF_LINE = /\r?\n/;
var TAG_MARKER = /^\s*@(\S+)\s*(.*)$/;
var CODE_FENCE = /^\s*```/;


/**
 * Create a new tagParser that can parse a set of jsdoc-style tags from a document
 * @param  {Array} tagDefMap A map of tag definitions keyed on tagName/aliasName.
 */
module.exports = {
  name: 'tagParser',
  exports: {
    tagParser: ['factory', function tagParserFactory(tagDefMap) {

      /**
       * tagParser
       * @param  {string} content      The text to parse for tags
       * @param  {number} startingLine The line in the doc file where this text begins
       * @return {TagCollection}       A collection of tags that were parsed
       */
      return function tagParser(content, startingLine) {
        var lines = content.split(END_OF_LINE);
        var lineNumber = 0;
        var line, match, tagDef;
        var descriptionLines = [];
        var current;          // The current that that is being extracted
        var inCode = false;   // Are we inside a fenced, back-ticked, code block
        var tags = new TagCollection();        // Contains all the tags that have been found


        // Extract the description block
        do {
          line = lines[lineNumber];

          if ( CODE_FENCE.test(line) ) {
            inCode = !inCode;
          }

          // We ignore tags if we are in a code block
          match = TAG_MARKER.exec(line);
          tagDef = match && tagDefMap[match[1]];
          if ( !inCode && match && ( !tagDef || !tagDef.ignore ) ) {
            // Only store tags that are unknown or not ignored
            current = new Tag(tagDef, match[1], match[2], startingLine + lineNumber);
            break;
          }

          lineNumber += 1;
          descriptionLines.push(line);

        } while(lineNumber < lines.length);
        tags.description = descriptionLines.join('\n');

        lineNumber += 1;

        // Extract the tags
        while(lineNumber < lines.length) {
          line = lines[lineNumber];

          if ( CODE_FENCE.test(line) ) {
            inCode = !inCode;
          }

          // We ignore tags if we are in a code block
          match = TAG_MARKER.exec(line);
          tagDef = match && tagDefMap[match[1]];
          if ( !inCode && match && (!tagDef || !tagDef.ignore) ) {
            tags.addTag(current);
            current = new Tag(tagDef, match[1], match[2], startingLine + lineNumber);
          } else {
            current.description = current.description ? (current.description + '\n' + line) : line;
          }

          lineNumber += 1;
        }
        if ( current ) {
          tags.addTag(current);
        }

        return tags;
      };
    }]
  }
};