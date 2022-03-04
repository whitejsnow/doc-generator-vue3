module.exports = {
  getContext,
};

const bt = require('@babel/types');
const traverse = require('@babel/traverse').default;
const { getComment, getCompOptionsNode, isCall } = require('./util');

function collect(node, arr, commentNode) {
  const firstArg = node.arguments[0];
  if (firstArg) {
    let name = bt.isStringLiteral(firstArg) ? firstArg.value : null;
    const comment = getComment(commentNode);
    if (!name) {
      name = comment.event;
    }
    if (name && !arr.some(item => item.name === name)) {
      arr.push({
        name,
        desc: comment.desc,
        params: comment.params,
      });
    }
  }
}

function getContext(ast) {
  const events = [];

  const options = getCompOptionsNode(ast);

  // vue2
  // this.$emit()
  if (options) {
    return [
      () => events,
      {
        CallExpression(path) {
          const { node } = path;
          if (
            bt.isMemberExpression(node.callee)
            && bt.isThisExpression(node.callee.object)
            && bt.isIdentifier(node.callee.property)
            && node.callee.property.name === '$emit'
            && bt.isExpressionStatement(path.parentPath.node)
          ) {
            collect(node, events, path.parentPath.node.leadingComments);
          }
        },
        ObjectMethod(path) {
          const { node } = path;
          if (bt.isIdentifier(node.key) && node.key.name === 'setup') {
            path.skip();
            parseEventsInSetup(path, events);
          }
        },
      },
    ];
  }

  // vue3
  // const emit = defineEmits()
  // emit('some-event')
  const { body } = ast.program;
  const defineEmitsNode = body.find(node => bt.isVariableDeclaration(node)
      && bt.isIdentifier(node.declarations[0].id)
      && bt.isCallExpression(node.declarations[0].init)
      && bt.isIdentifier(node.declarations[0].init.callee)
      && node.declarations[0].init.callee.name === 'defineEmits');
  if (!defineEmitsNode) {
    return [() => events];
  }
  const emitIdentifier = defineEmitsNode.declarations[0].id.name;

  return [
    () => events,
    {
      CallExpression(path) {
        const { node } = path;
        if (bt.isIdentifier(node.callee) && node.callee.name === emitIdentifier) {
          collect(node, events, path.parentPath.node.leadingComments);
        }
      },
    },
  ];
}

function parseEventsInSetup(path, events) {
  const { node } = path;

  const ctxParamNode = node.params[1];
  if (bt.isIdentifier(ctxParamNode)) {
    const ctxIdentifier = ctxParamNode.name;

    traverse(node, {
      CallExpression(path) {
        const { node } = path;
        if (isCall(node, 'emit', ctxIdentifier)) {
          collect(node, events, path.parentPath.node.leadingComments);
        }
      },
    }, path.scope);
  } else if (bt.isObjectPattern(ctxParamNode)) {
    const p = ctxParamNode.properties.find(p => bt.isObjectProperty(p) && p.key.name === 'emit' && bt.isIdentifier(p.value));
    const exposeIdentifier = p ? p.value.name : null;

    traverse(node, {
      CallExpression(path) {
        const { node } = path;
        if (isCall(node, exposeIdentifier)) {
          collect(node, events, path.parentPath.node.leadingComments);
        }
      },
    }, path.scope);
  }
  return events;
}
