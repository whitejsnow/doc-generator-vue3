module.exports = {
  getComment,
  stringifyPropertyValue,
  isCall,
  getCompOptionsNode,
  getValueOfObjectNode,
  getGlobalCallArg,
  getFunctionDefinitions,
  getPropertyOfObjectNode,
};

const bt = require('@babel/types');
const { parse: parseTag } = require('./jsdoc-tag');

function getComment(commentNode) {
  if (!commentNode || !commentNode.length) {
    return { desc: '' };
  }

  let comments;
  if (commentNode[0].type === 'CommentBlock') {
    const raw = commentNode[0].value;
    const reg = /\*(.+?)\n/g;
    comments = [];
    for (let res = reg.exec(raw); res; res = reg.exec(raw)) {
      comments.push(res[1].trim());
    }
  } else {
    const commentLines = commentNode.filter(item => item.type === 'CommentLine');
    comments = commentLines.map(item => item.value.trim());
  }

  const params = [];
  const desc = [];
  let event;
  let methodTag;
  let module;
  comments.forEach((line) => {
    if (line.startsWith('@param ')) {
      params.push(parseTag(line.substring(6)));
    } else if (line.startsWith('@event ')) {
      const res = line.split(' ');
      if (res[1]) {
        event = res[1];
      }
      if (res[2]) {
        desc.push(res[2]);
      }
    } else if (line === '@method') {
      methodTag = true;
    } else if (line.startsWith('@module ')) {
      module = line.split(' ')[1];
    } else {
      desc.push(line);
    }
  });
  return {
    desc: desc.join(' '),
    methodTag,
    params,
    event,
    module,
  };
}

function stringifyPropertyValue(node) {
  switch (node.type) {
    case 'Identifier':
      return node.name;
    case 'BooleanLiteral':
    case 'NumericLiteral':
      return String(node.value);
    case 'StringLiteral':
      return JSON.stringify(node.value);
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
      && node.callee.property.name === funcName;
  }
  return bt.isCallExpression(node)
    && bt.isIdentifier(node.callee)
    && node.callee.name === funcName;
}

function getCompOptionsNode(ast) {
  const { body } = ast.program;
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

// function getProps(ast) {
//   const options = getCompOptionsNode(ast);
//   if (options) {
//     return getValueOfObjectNode(options, 'prop');
//   }

//   return getGlobalCallArg(ast, 'defineProps');
// }

function getGlobalCallArg(ast, calleeName) {
  const { body } = ast.program;
  const result = body.map((item) => {
    let callExp;
    if (bt.isExpressionStatement(item)) {
      callExp = item.expression;
      // const { expression } = item;
      // if (isCall(expression, calleeName)) {
      //   if (bt.isObjectExpression(expression.arguments[0])) {
      //     return expression.arguments[0];
      //   }
      // }
    } else if (bt.isVariableDeclaration(item)) {
      const declaration = item.declarations[0];
      callExp = declaration ? declaration.init : null;
    }
    if (callExp && isCall(callExp, calleeName)) {
      return callExp.arguments[0];
    }
    return null;
  });

  return result.find(item => item);
}

function getFunctionDefinitions(body) {
  return body.map((node) => {
    if (bt.isFunctionDeclaration(node)) {
      if (bt.isIdentifier(node.id) && typeof node.id.name === 'string') {
        // function fn() {}
        return {
          name: node.id.name,
          comment: getComment(node.leadingComments),
        };
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
              comment: getComment(node.leadingComments),
            };
          }
        }
      }
    }
    return null;
  }).filter(item => item);
}
