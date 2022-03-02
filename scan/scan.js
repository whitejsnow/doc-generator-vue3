const path = require('path');
const fs = require('fs');
const compiler = require('@vue/compiler-sfc');
// const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;
const babelParser = require('@babel/parser');
const { compile } = require('vue-template-compiler/build');

const { getProps } = require('./get-props');
const { getMethods } = require('./get-methods');
const { getContext } = require('./get-events');
const { parseTemplate } = require('./get-slots');


exports.scanFold = scanFold;
exports.scanFile = scanFile;

function demo() {
  const res1 = scanFile('./scan/demo_option.vue');
  fs.writeFileSync('./scan/res_option.json', JSON.stringify(res1));
  const res2 = scanFile('./scan/demo_setup.vue');
  fs.writeFileSync('./scan/res_setup.json', JSON.stringify(res2));
}
demo();


function scanFold(foldPath) {
  const vueFiles = getVueFiles(foldPath);
  console.log(vueFiles);
  const res = vueFiles.map(filePath => scanFile(filePath)).filter(item => !!item);
  return res;
}

function getVueFiles(dir, res = []) {
  const names = fs.readdirSync(dir);
  names.forEach(name => {
    const filePath = path.join(dir, name);
    if (fs.statSync(filePath).isDirectory()) {
      getVueFiles(filePath, res);
    } else if (name.endsWith('.vue')) {
      res.push(filePath);
    }
  });
  return res;
}

function scanFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const out = compiler.parse(fileContent);
  const scriptContent = (out.descriptor.scriptSetup || out.descriptor.script).content;

  const astJS = babelParser.parse(scriptContent, {
    sourceType: 'module',
    plugins: [
      'objectRestSpread',
      'dynamicImport',
      'decorators-legacy',
      'classProperties',
      'typescript',
      'jsx',
    ],
  });
  const astTemplate = compile(out.descriptor.template.content, {
    comments: true,
  }).ast;

  const [getEvents, eventVisitor] = getContext(astJS);

  traverse(astJS, eventVisitor);

  return {
    props: getProps(astJS),
    methods: getMethods(astJS),
    events: getEvents(),
    slots: parseTemplate(astTemplate),
  };
}
