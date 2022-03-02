module.exports = {
  getComment,
  stringifyPropertyValue,
  isCall,
  getCompOptionsNode,
  getValueOfObjectNode,
  getProps,
  getGlobalCallArg,
  getFunctionDefinitions,
  getPropertyOfObjectNode,
}

const bt = require('@babel/types');

const methodReg = /\n\s*\*\s*@method\s*\n/;
const methodTag = '@method';

function getComment(commentNode) {
  if (!commentNode || !commentNode.length) {
    return { desc: [] };
  }

  if (commentNode[0].type === 'CommentBlock') {
    const raw = commentNode[0].value;
    const reg = /\*(.+?)\n/g;
    const comments = [];
    for (let res = reg.exec(raw); res; res = reg.exec(raw)) {
      comments.push(res[1].trim());
    }
    return {
      desc: comments.join(),
      methodTag: methodReg.test(raw),
    };
  }

  const commentLines = commentNode.filter(item => item.type === 'CommentLine');
  return {
    desc: commentLines.map(item => item.value.trim()).join(),
    methodTag: commentLines.some(item => item.value.trim() === methodTag),
  };
}

function stringifyPropertyValue(node) {
  switch (node.type) {
    case 'Identifier':
      return node.name;
    case 'BooleanLiteral':
      return String(node.value);
    case 'ArrowFunctionExpression':
      return '';
    default:
      return '';
  }
}

function isCall(node, funcName, obj) {
  if (!funcName) return false;
  if (obj) {
    return bt.isCallExpression(node)
      && bt.isMemberExpression(node.callee)
      && bt.isIdentifier(node.callee.object)
      && node.callee.object.name === obj
      && bt.isIdentifier(node.callee.property)
      && node.callee.property.name === funcName
  }
  return bt.isCallExpression(node)
    && bt.isIdentifier(node.callee)
    && node.callee.name === funcName
}

function getCompOptionsNode(ast) {
  const body = ast.program.body;
  const declarationNode = body.find(item => bt.isExportDefaultDeclaration(item));
  if (!declarationNode) return null;
  const { declaration } = declarationNode;

  if (isCall(declaration, 'defineComponent')) {
    if (bt.isObjectExpression(declaration.arguments[0])) {
      return declaration.arguments[0];
    }
  } else if (bt.isObjectExpression(declaration)) {
    return declaration;
  }
  return null;
}

function getValueOfObjectNode(node, key) {
  const propertyNode = getPropertyOfObjectNode(node, key);
  return propertyNode ? propertyNode.value : null;
}
function getPropertyOfObjectNode(node, key) {
  return node.properties.find(item => bt.isIdentifier(item.key) && item.key.name === key);
}

function getProps(ast) {
  const options = getCompOptionsNode(ast);
  if (options) {
    return getValueOfObjectNode(options, 'prop');
  }

  return getGlobalCallArg(ast, 'defineProps');
}

function getGlobalCallArg(ast, calleeName) {
  const body = ast.program.body;
  const result = body.map(item => {
    if (bt.isExpressionStatement(item)) {
      const { expression } = item;
      if (isCall(expression, calleeName)) {
        if (bt.isObjectExpression(expression.arguments[0])) {
          return expression.arguments[0];
        }
      }
    }
    return null;
  });

  return result.find(item => item);
}

function getFunctionDefinitions(body) {
  return body.map(node => {
    if (bt.isFunctionDeclaration(node)) {
      if (bt.isIdentifier(node.id) && typeof node.id.name === 'string') {
        // function fn() {}
        return {
          name: node.id.name,
          desc: getComment(node.leadingComments).desc,
        }
      }
    }
    if (bt.isVariableDeclaration(node)) {
      const declaration = node.declarations[0];
      if (bt.isVariableDeclarator(declaration)) {
        if (bt.isIdentifier(declaration.id) && typeof declaration.id.name === 'string') {
          if (bt.isFunctionExpression(declaration.init) || bt.isArrowFunctionExpression(declaration.init)) {
            // const fn = function() {}
            // const fn = () => {}
            return {
              name: declaration.id.name,
              desc: getComment(node.leadingComments).desc,
            }
          }
        }
      }
    }
    return null;
  }).filter(item => item)
}
