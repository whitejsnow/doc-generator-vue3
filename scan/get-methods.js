// const traverse = require("@babel/traverse").default;
const bt = require('@babel/types');
const {
  getCompOptionsNode,
  getValueOfObjectNode,
  getGlobalCallArg,
  getComment,
  getFunctionDefinitions,
  isCall,
  getPropertyOfObjectNode,
} = require('./util');

module.exports = {
  getMethods,
};

function getMethods(ast) {
  const options = getCompOptionsNode(ast);
  if (options) {
    const methodsInOption = getValueOfObjectNode(options, 'methods');
    const setupNode = getPropertyOfObjectNode(options, 'setup');

    const optionResult = parseMethodsObject(methodsInOption, [], true);
    const setupResult = parseMethodsInSetup(setupNode);
    return optionResult.concat(setupResult);
  }
  const methodsInDefineExpose = getGlobalCallArg(ast, 'defineExpose');
  const fnInContext = getFunctionDefinitions(ast.program.body);
  return parseMethodsObject(methodsInDefineExpose, fnInContext);
}

function parseMethodsObject(node, fnInContext = [], needMethodTag = false) {
  if (!node || !bt.isObjectExpression(node)) return [];

  const res = [];
  node.properties.forEach((entry) => {
    if (!entry.key) return;

    const { name } = entry.key;
    let item;
    if (entry.leadingComments) {
      const comment = getComment(entry.leadingComments);
      if (!needMethodTag || (needMethodTag && comment.methodTag)) {
        item = comment;
      }
    } else {
      const fn = fnInContext.find(fn => fn.name === name);
      item = fn ? fn.comment : null;
    }
    if (item) {
      res.push({
        name,
        desc: item.desc,
        params: item.params,
      });
    }
  });
  return res;
}

function parseMethodsInSetup(node) {
  if (!node) return [];

  const ctxParamNode = node.params[1];
  const { body } = node.body;
  let exposed;
  if (bt.isIdentifier(ctxParamNode)) {
    const ctxIdentifier = ctxParamNode.name;

    const callNode = body.find(item => bt.isExpressionStatement(item) && isCall(item.expression, 'expose', ctxIdentifier));
    if (callNode) {
      exposed = callNode.expression.arguments[0];
    }
  } else if (bt.isObjectPattern(ctxParamNode)) {
    const p = ctxParamNode.properties.find(p => bt.isObjectProperty(p) && p.key.name === 'expose' && bt.isIdentifier(p.value));
    const exposeIdentifier = p ? p.value.name : null;

    const callNode = body.find(item => bt.isExpressionStatement(item) && isCall(item.expression, exposeIdentifier));
    if (callNode) {
      exposed = callNode.expression.arguments[0];
    }
  }
  if (exposed) {
    const fnInContext = getFunctionDefinitions(body);
    return parseMethodsObject(exposed, fnInContext);
  }
  return [];
}
