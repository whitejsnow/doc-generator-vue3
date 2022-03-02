module.exports = {
  getProps,
}

const { isObjectExpression } = require('@babel/types');
const {
  getComment,
  stringifyPropertyValue,
  getCompOptionsNode,
  getValueOfObjectNode,
  getGlobalCallArg,
} = require('./util');

function getProps(ast) {
  const propsObj = getPropsObject(ast);
  if (propsObj) {
    return parsePropsObject(propsObj)
  }
  return [];
}
function getPropsObject(ast) {
  const options = getCompOptionsNode(ast);
  if (options) {
    return getValueOfObjectNode(options, 'props');
  }

  return getGlobalCallArg(ast, 'defineProps');
}

function parsePropsObject(node) {
  if (!node || !isObjectExpression(node)) return [];

  return node.properties.map(entry => {
    if (entry.value.type === 'ObjectExpression') {
      const res = {
        name: entry.key.name,
        desc: getComment(entry.leadingComments).desc,
      };
      entry.value.properties.forEach(item => {
        res[item.key.name] = stringifyPropertyValue(item.value);
      })
      return res;
    } else if (entry.value.type === 'Identifier') {
      return {
        name: entry.key.name,
        desc: getComment(entry.leadingComments).desc,
        type: entry.value.name,
      }
    }
  })
}
