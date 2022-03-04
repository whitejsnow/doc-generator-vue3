const { getComment } = require('./util');

module.exports = {
  getModule,
};

function getModule(ast, fileName) {
  const body = ast.program.body;
  const leadingComments = body[0] ? body[0].leadingComments : null;
  if (leadingComments) {
    const res = getComment(leadingComments);
    if (!res.module) {
      res.module = fileName;
    }
    return res.module ? res : null;
  }
  return fileName ? { module: fileName } : null;
}
