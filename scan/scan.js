const fs = require('fs');
const compiler = require('@vue/compiler-sfc');
const traverse = require('@babel/traverse').default;
const babelParser = require('@babel/parser');
const fg = require('fast-glob');

const { getConfig } = require('./config');
const { getProps } = require('./get-props');
const { getMethods } = require('./get-methods');
const { getContext } = require('./get-events');
const { parseTemplate } = require('./get-slots');
const { getModule } = require('./get-module');

module.exports = {
  scan,
  scanFile,
  scanContent,
};

function scan(config) {
  let { include, exclude } = getConfig(config);

  if (typeof include === 'string') include = [include];
  if (typeof exclude === 'string') exclude = [exclude];
  const patterns = [
    '!node_modules/**/*.vue',
    ...include,
    ...exclude.map(i => `!${i}`),
  ];
  const files = fg.sync(patterns);

  console.log(files);
  const res = files.map(filePath => scanFile(filePath)).filter(item => !!item);
  return res;
}

function scanFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return scanContent(fileContent);
}

function scanContent(fileContent) {
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
