/**
 * 从 jsdoc 源码复制而来，用于解析 @param 的内容
 * 修改内容：
 *   1. parse 函数最终输出的对象 text 字段更名为 desc
 *   2. parse 函数最终输出的对象删除掉 typeExpression 和 parsedType 字段
 */

const catharsis = require('catharsis');

const DESCRIPTION = '(?:(?:[ \\t]*\\-\\s*|\\s+)(\\S[\\s\\S]*))?$';
const REGEXP_DESCRIPTION = new RegExp(DESCRIPTION);
const REGEXP_NAME_DESCRIPTION = new RegExp(`^(\\[[^\\]]+\\]|\\S+)${DESCRIPTION}`);


/**
 * Split a string that starts with a name and ends with a description into separate parts.
 * @param {string} str - The string that contains the name and description.
 * @returns {object} An object with `name` and `description` properties.
 */
const splitNameAndDescription = (str) => {
  // Like: `name`, `[name]`, `name text`, `[name] text`, `name - text`, or `[name] - text`.
  // To ensure that we don't get confused by leading dashes in Markdown list items, the hyphen
  // must be on the same line as the name.

  // Optional values get special treatment,
  let result = null;

  if (str[0] === '[') {
    result = splitNameMatchingBrackets(str);
    if (result !== null) {
      return result;
    }
  }

  str.match(REGEXP_NAME_DESCRIPTION);

  return {
    name: RegExp.$1,
    description: RegExp.$2,
  };
};


/**
 * Split a string that starts with a name and ends with a description into its parts. Allows the
 * default value (if present) to contain brackets. Returns `null` if the name contains mismatched
 * brackets.
 *
 * @param {string} nameDesc
 * @returns {?Object} Hash with "name" and "description" properties.
 */
function splitNameMatchingBrackets(nameDesc) {
  const buffer = [];
  let c;
  let stack = 0;
  let stringEnd = null;

  for (var i = 0; i < nameDesc.length; ++i) {
    c = nameDesc[i];
    buffer.push(c);

    if (stringEnd) {
      if (c === '\\' && i + 1 < nameDesc.length) {
        buffer.push(nameDesc[++i]);
      } else if (c === stringEnd) {
        stringEnd = null;
      }
    } else if (c === '"' || c === '\'') {
      stringEnd = c;
    } else if (c === '[') {
      ++stack;
    } else if (c === ']') {
      if (--stack === 0) {
        break;
      }
    }
  }

  if (stack || stringEnd) {
    return null;
  }

  nameDesc.substr(i).match(REGEXP_DESCRIPTION);

  return {
    name: buffer.join(''),
    description: RegExp.$1,
  };
}


/**
 * Check whether a string contains a boolean or numeric value, and convert the string to the
 * appropriate type if necessary.
 *
 * @private
 * @param {string} str - The string to convert.
 * @return {(string|number|boolean)} The converted value.
 */
function castString(str) {
  let number;
  let result;

  switch (str) {
    case 'true':
      result = true;
      break;

    case 'false':
      result = false;
      break;

    case 'NaN':
      result = NaN;
      break;

    case 'null':
      result = null;
      break;

    case 'undefined':
      result = undefined;
      break;

    default:
      if (typeof str === 'string') {
        if (str.includes('.')) {
          number = parseFloat(str);
        } else {
          number = parseInt(str, 10);
        }

        if (String(number) === str && !isNaN(number)) {
          result = number;
        } else {
          result = str;
        }
      }
  }

  return result;
}

/**
 * Check whether a string represents another primitive type, and convert the string to the
 * appropriate type if necessary.
 *
 * If an object or array is passed to this method, the object or array's values are recursively
 * converted to the appropriate types. The original object or array is not modified.
 *
 * @private
 * @param {(string|Object|Array)} item - The item whose type or types will be converted.
 * @return {*?} The converted value.
 */
const cast = (item) => {
  let result;

  if (Array.isArray(item)) {
    result = [];
    for (let i = 0, l = item.length; i < l; i++) {
      result[i] = cast(item[i]);
    }
  } else if (typeof item === 'object' && item !== null) {
    result = {};
    Object.keys(item).forEach((prop) => {
      result[prop] = cast(item[prop]);
    });
  } else if (typeof item === 'string') {
    result = castString(item);
  } else {
    result = item;
  }

  return result;
};


/**
 * Create a regexp that matches a specific inline tag, or all inline tags.
 *
 * @private
 * @memberof module:@jsdoc/tag.inline
 * @param {?string} tagName - The inline tag that the regexp will match. May contain regexp
 * characters. If omitted, matches any string.
 * @param {?string} prefix - A prefix for the regexp. Defaults to an empty string.
 * @param {?string} suffix - A suffix for the regexp. Defaults to an empty string.
 * @returns {RegExp} A regular expression that matches the requested inline tag.
 */
function regExpFactory(tagName = '\\S+', prefix = '', suffix = '') {
  return new RegExp(`${prefix}\\{@${tagName}\\s+((?:.|\n)+?)\\}${suffix}`, 'i');
}

/**
 * Replace all instances of multiple inline tags with other text.
 *
 * @param {string} string - The string in which to replace the inline tags.
 * @param {Object} replacers - The functions that are used to replace text in the string. The keys
 * must contain tag names (for example, `link`), and the values must contain functions with the
 * type {@link module:@jsdoc/tag.inline.InlineTagReplacer}.
 * @return {module:@jsdoc/tag.inline.InlineTagResult} The updated string, as well as information
 * about the inline tags that were found.
 */
const replaceInlineTags = (string, replacers) => {
  const tagInfo = [];

  function replaceMatch(replacer, tag, match, text) {
    const matchedTag = {
      completeTag: match,
      tag,
      text,
    };

    tagInfo.push(matchedTag);

    return replacer(string, matchedTag);
  }

  string = string || '';

  Object.keys(replacers).forEach((replacer) => {
    const tagRegExp = regExpFactory(replacer);
    let matches;
    let previousString;

    // call the replacer once for each match
    do {
      matches = tagRegExp.exec(string);
      if (matches) {
        previousString = string;
        string = replaceMatch(replacers[replacer], replacer, matches[0], matches[1]);
      }
    } while (matches && previousString !== string);
  });

  return {
    tags: tagInfo,
    newString: string.trim(),
  };
};

/**
 * Replace all instances of an inline tag with other text.
 *
 * @param {string} string - The string in which to replace the inline tag.
 * @param {string} tag - The name of the inline tag to replace.
 * @param {module:@jsdoc/tag.inline.InlineTagReplacer} replacer - The function that is used to
 * replace text in the string.
 * @return {module:@jsdoc/tag.inline.InlineTagResult} The updated string, as well as information
 * about the inline tags that were found.
 */
const replaceInlineTag = (string, tag, replacer) => {
  const replacers = {};

  replacers[tag] = replacer;

  return replaceInlineTags(string, replacers);
};

/**
 * Extract inline tags from a string, replacing them with an empty string.
 *
 * @param {string} string - The string from which to extract text.
 * @param {?string} tag - The inline tag to extract.
 * @return {module:@jsdoc/tag.inline.InlineTagResult} The updated string, as well as information
 * about the inline tags that were found.
 */
const extractInlineTag = (string, tag) => replaceInlineTag(string, tag, (str, { completeTag }) => str.replace(completeTag, ''));


/**
 * Information about a type expression extracted from tag text.
 *
 * @typedef TypeExpressionInfo
 * @memberof module:@jsdoc/tag.type
 * @property {string} expression - The type expression.
 * @property {string} text - The updated tag text.
 */

/** @private */
function unescapeBraces(text) {
  return text.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
}

/**
 * Extract a type expression from the tag text.
 *
 * @private
 * @param {string} string - The tag text.
 * @return {module:@jsdoc/tag.type.TypeExpressionInfo} The type expression and updated tag text.
 */
function extractTypeExpression(string) {
  let completeExpression;
  let count = 0;
  let position = 0;
  let expression = '';
  const startIndex = string.search(/\{[^@]/);
  let textStartIndex;

  if (startIndex !== -1) {
    // advance to the first character in the type expression
    position = textStartIndex = startIndex + 1;
    count++;

    while (position < string.length) {
      switch (string[position]) {
        case '\\':
          // backslash is an escape character, so skip the next character
          position++;
          break;
        case '{':
          count++;
          break;
        case '}':
          count--;
          break;
        default:
        // do nothing
      }

      if (count === 0) {
        completeExpression = string.slice(startIndex, position + 1);
        expression = string.slice(textStartIndex, position).trim();
        break;
      }

      position++;
    }
  }

  string = completeExpression ? string.replace(completeExpression, '') : string;

  return {
    expression: unescapeBraces(expression),
    newString: string.trim(),
  };
}

/** @private */
function getTagInfo(tagValue, canHaveName, canHaveType) {
  let name = '';
  let typeExpression = '';
  let text = tagValue;
  let expressionAndText;
  let nameAndDescription;
  let typeOverride;

  if (canHaveType) {
    expressionAndText = extractTypeExpression(text);
    typeExpression = expressionAndText.expression;
    text = expressionAndText.newString;
  }

  if (canHaveName) {
    nameAndDescription = splitNameAndDescription(text);
    name = nameAndDescription.name;
    text = nameAndDescription.description;
  }

  // an inline @type tag, like {@type Foo}, overrides the type expression
  if (canHaveType) {
    typeOverride = extractInlineTag(text, 'type');
    if (typeOverride.tags && typeOverride.tags[0]) {
      typeExpression = typeOverride.tags[0].text;
    }
    text = typeOverride.newString;
  }

  return {
    name,
    typeExpression,
    desc: text,
  };
}

/**
 * Information provided in a JSDoc tag.
 *
 * @typedef {Object} TagInfo
 * @memberof module:@jsdoc/tag.type
 * @property {string} TagInfo.defaultvalue - The default value of the member.
 * @property {string} TagInfo.name - The name of the member (for example, `myParamName`).
 * @property {boolean} TagInfo.nullable - Indicates whether the member can be set to `null` or
 * `undefined`.
 * @property {boolean} TagInfo.optional - Indicates whether the member is optional.
 * @property {string} TagInfo.text - Descriptive text for the member (for example, `The user's email
 * address.`).
 * @property {Array.<string>} TagInfo.type - The type or types that the member can contain (for
 * example, `string` or `MyNamespace.MyClass`).
 * @property {string} TagInfo.typeExpression - The type expression that was parsed to identify the
 * types.
 * @property {boolean} TagInfo.variable - Indicates whether the number of members that are provided
 * can vary (for example, in a function that accepts any number of parameters).
 */

/**
 * Extract JSDoc-style type information from the name specified in the tag info, including the
 * member name; whether the member is optional; and the default value of the member.
 *
 * @private
 * @param {module:@jsdoc/tag.type.TagInfo} tagInfo - Information contained in the tag.
 * @return {module:@jsdoc/tag.type.TagInfo} Updated information from the tag.
 */
function parseName(tagInfo) {
  // like '[foo]' or '[ foo ]' or '[foo=bar]' or '[ foo=bar ]' or '[ foo = bar ]'
  // or 'foo=bar' or 'foo = bar'
  if (/^(\[)?\s*(.+?)\s*(\])?$/.test(tagInfo.name)) {
    tagInfo.name = RegExp.$2;
    // were the "optional" brackets present?
    if (RegExp.$1 && RegExp.$3) {
      tagInfo.optional = true;
    }

    // like 'foo=bar' or 'foo = bar'
    if (/^(.+?)\s*=\s*(.+)$/.test(tagInfo.name)) {
      tagInfo.name = RegExp.$1;
      tagInfo.defaultvalue = cast(RegExp.$2);
    }
  }

  return tagInfo;
}

/** @private */
function getTypeStrings(parsedType, isOutermostType) {
  let applications;
  let typeString;

  let types = [];

  const TYPES = catharsis.Types;

  switch (parsedType.type) {
    case TYPES.AllLiteral:
      types.push('*');
      break;
    case TYPES.FunctionType:
      types.push('function');
      break;
    case TYPES.NameExpression:
      types.push(parsedType.name);
      break;
    case TYPES.NullLiteral:
      types.push('null');
      break;
    case TYPES.RecordType:
      types.push('Object');
      break;
    case TYPES.TypeApplication:
      // if this is the outermost type, we strip the modifiers; otherwise, we keep them
      if (isOutermostType) {
        applications = parsedType.applications
          .map(application => catharsis.stringify(application))
          .join(', ');
        typeString = `${getTypeStrings(parsedType.expression)[0]}.<${applications}>`;

        types.push(typeString);
      } else {
        types.push(catharsis.stringify(parsedType));
      }
      break;
    case TYPES.TypeUnion:
      parsedType.elements.forEach((element) => {
        types = types.concat(getTypeStrings(element));
      });
      break;
    case TYPES.UndefinedLiteral:
      types.push('undefined');
      break;
    case TYPES.UnknownLiteral:
      types.push('?');
      break;
    default:
      // this shouldn't happen
      throw new Error(`unrecognized type ${parsedType.type} in parsed type: ${parsedType}`);
  }

  return types;
}

/**
 * Extract JSDoc-style and Closure Compiler-style type information from the type expression
 * specified in the tag info.
 *
 * @private
 * @param {module:@jsdoc/tag.type.TagInfo} tagInfo - Information contained in the tag.
 * @return {module:@jsdoc/tag.type.TagInfo} Updated information from the tag.
 */
function parseTypeExpression(tagInfo) {
  let parsedType;

  // don't try to parse empty type expressions
  if (!tagInfo.typeExpression) {
    return tagInfo;
  }

  try {
    parsedType = catharsis.parse(tagInfo.typeExpression, {
      jsdoc: true,
      useCache: false,
    });
  } catch (e) {
    // always re-throw so the caller has a chance to report which file was bad
    throw new Error(`Invalid type expression "${tagInfo.typeExpression}": ${e.message}`);
  }

  tagInfo.type = tagInfo.type.concat(getTypeStrings(parsedType, true));
  tagInfo.parsedType = parsedType;

  // Catharsis and JSDoc use the same names for 'optional' and 'nullable'...
  ['optional', 'nullable'].forEach((key) => {
    if (parsedType[key] !== null && parsedType[key] !== undefined) {
      tagInfo[key] = parsedType[key];
    }
  });

  // ...but not 'variable'.
  if (parsedType.repeatable !== null && parsedType.repeatable !== undefined) {
    tagInfo.variable = parsedType.repeatable;
  }

  return tagInfo;
}

// TODO: allow users to add/remove type parsers (perhaps via plugins)
const typeParsers = [parseName, parseTypeExpression];

/**
 * Parse the value of a JSDoc tag.
 *
 * @param {string} tagValue - The value of the tag. For example, the tag `@param {string} name` has
 * a value of `{string} name`.
 * @param {boolean} canHaveName - Indicates whether the value can include a symbol name.
 * @param {boolean} canHaveType - Indicates whether the value can include a type expression that
 * describes the symbol.
 * @return {module:@jsdoc/tag.type.TagInfo} Information obtained from the tag.
 * @throws {Error} Thrown if a type expression cannot be parsed.
 */
exports.parse = (tagValue, canHaveName = true, canHaveType = true) => {
  let tagInfo;

  if (typeof tagValue !== 'string') {
    tagValue = '';
  }

  tagInfo = getTagInfo(tagValue, canHaveName, canHaveType);
  tagInfo.type = tagInfo.type || [];

  typeParsers.forEach((parser) => {
    tagInfo = parser(tagInfo);
  });

  // if we wanted a type, but the parsers didn't add any type names, use the type expression
  if (canHaveType && !tagInfo.type.length && tagInfo.typeExpression) {
    tagInfo.type = [tagInfo.typeExpression];
  }

  delete tagInfo.typeExpression;
  delete tagInfo.parsedType;
  return tagInfo;
};
