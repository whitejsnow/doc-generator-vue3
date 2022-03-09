module.exports = {
  getProps,
};
// todo type: Array<>

const bt = require('@babel/types');
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
    return parsePropsObject(propsObj);
  }
  return [];
}
function getPropsObject(ast) {
  const options = getCompOptionsNode(ast);
  const propsObj = options
    ? getValueOfObjectNode(options, 'props')
    : getGlobalCallArg(ast, 'defineProps');

  if (bt.isObjectExpression(propsObj)) {
    return propsObj;
  }
  return null;
}

function parsePropsObject(node) {
  if (!node || !bt.isObjectExpression(node)) return [];

  return node.properties.map((entry) => {
    if (bt.isObjectExpression(entry.value)) {
      const res = {
        name: entry.key.name,
        desc: getComment(entry.leadingComments).desc,
      };
      entry.value.properties.forEach((item) => {
        res[item.key.name] = stringifyPropertyValue(item.value);
      });
      return res;
    }
    if (bt.isIdentifier(entry.value)) {
      return {
        name: entry.key.name,
        desc: getComment(entry.leadingComments).desc,
        type: entry.value.name,
      };
    }
    return null;
  }).filter(item => item);
}
