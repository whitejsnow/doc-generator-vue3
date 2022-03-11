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

const TYPE = 'type';

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
        if (item.key.name === TYPE) {
          res.type = getType(item.value);
        } else {
          res[item.key.name] = stringifyPropertyValue(item.value);
        }
      });
      return res;
    }
    const type = getType(entry.value);
    if (type) {
      return {
        name: entry.key.name,
        desc: getComment(entry.leadingComments).desc,
        type,
      };
    }
    return null;
  }).filter(item => item);
}

function getType(node) {
  if (bt.isIdentifier(node)) {
    return node.name;
  }
  if (bt.isArrayExpression(node)) {
    return node.elements.filter(item => bt.isIdentifier(item)).map(item => item.name);
  }
  return null;
}
