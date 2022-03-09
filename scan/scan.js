const path = require('path');
const fs = require('fs');
const compiler = require('@vue/compiler-sfc');
const traverse = require('@babel/traverse').default;
const babelParser = require('@babel/parser');

const { getProps } = require('./get-props');
const { getMethods } = require('./get-methods');
const { getContext } = require('./get-events');
const { parseTemplate } = require('./get-slots');
const { getModule } = require('./get-module');

module.exports = {
  scanFold,
  scanFile,
  scanContent,
};

function scanFold(foldPath) {
  const vueFiles = getVueFiles(foldPath);
  console.log(vueFiles);
  const res = vueFiles.map(filePath => scanFile(filePath)).filter(item => !!item);
  return res;
}

function getVueFiles(dir, res = []) {
  const names = fs.readdirSync(dir);
  names.forEach((name) => {
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
  return scanContent(fileContent);
}

function scanContent(fileContent, needModule = true) {
  const out = compiler.parse(fileContent);
  const script = out.descriptor.scriptSetup || out.descriptor.script;

  let props;
  let methods;
  let events;
  let slots;
  let module;

  if (script) {
    const astJS = babelParser.parse(script.content, {
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

    module = getModule(astJS);
    if (needModule && !module) {
      return {};
    }

    const [getEvents, eventVisitor] = getContext(astJS);
    if (eventVisitor) {
      traverse(astJS, eventVisitor);
    }
    props = getProps(astJS);
    methods = getMethods(astJS);
    events = getEvents();
  }

  if (out.descriptor.template) {
    slots = parseTemplate(out.descriptor.template.ast);
  }

  return {
    name: module ? module.name : null,
    desc: module ? module.desc : null,
    props,
    methods,
    events,
    slots,
  };
}
