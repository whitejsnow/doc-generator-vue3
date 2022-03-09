const fs = require('fs');
// const babelParser = require('@babel/parser');

module.exports = {
  getASTs,
};

function getASTs(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const reg = /(<script>.+?<\/script>)/gs;
  const res = [];
  let match = reg.exec(content);
  while (match !== null) {
    // const [, name, script] = match;
    const [, script] = match;

    // const ast = babelParser.parse(script, {
    //   sourceType: 'module',
    //   plugins: [
    //     'objectRestSpread',
    //     'decorators-legacy',
    //     'classProperties',
    //   ],
    // });
    res.push(script);

    match = reg.exec(content);
  }
  return res;
}
