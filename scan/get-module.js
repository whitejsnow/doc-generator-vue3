const { getComment, getCompOptionsNode, getValueOfObjectNode } = require('./util');
const bt = require('@babel/types');

module.exports = {
  getModule,
};

// const moduleTagReg = /\n\s+\*\s+@module\s+([^\s]+)/;
const COMMENT_BLOCK = 'CommentBlock';

function getModule(ast) {
  // 先在 CommentBlock 里找显示声明的 module
  const { comments } = ast;
  if (comments) {
    for (let i = 0; i < comments.length; i++) {
      const item = comments[i];
      if (item.type === COMMENT_BLOCK) {
        const res = getComment([item]);
        if (res.module) {
          return {
            name: res.module,
            desc: res.desc,
          };
        }
      }
    }
  }

  // 在组件选项中取 name 字段
  const options = getCompOptionsNode(ast);
  if (options) {
    const nameNode = getValueOfObjectNode(options, 'name');
    if (bt.isStringLiteral(nameNode) && nameNode.value) {
      return {
        name: nameNode.value,
      };
    }
  }
  return null;
}
