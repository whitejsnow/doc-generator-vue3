const { getComment } = require('./util');

module.exports = {
  getModule,
};

// const moduleTagReg = /\n\s+\*\s+@module\s+([^\s]+)/;
const COMMENT_BLOCK = 'CommentBlock';

function getModule(ast) {
  const { comments } = ast;
  if (comments) {
    for (let i = 0; i < comments.length; i++) {
      const item = comments[i];
      if (item.type === COMMENT_BLOCK) {
        const res = getComment([item]);
        if (res.module) {
          return res;
        }
      }
    }
  }
  return null;
}
