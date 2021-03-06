const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { scan } = require('./scan');
const { getConfig } = require('./config');

const DIR_TEMPLATE = '../template';

exports.build = async (config) => {
  const { outDir, title } = getConfig(config);
  const res = scan(config).filter(item => item.name);

  getTemplate().forEach(([relFilePath, absFilePath]) => {
    const dest = path.join(outDir, path.relative(DIR_TEMPLATE, relFilePath));
    mkdirp.sync(path.dirname(dest));
    fs.copyFileSync(absFilePath, dest);
  });

  let html = fs.readFileSync(path.resolve(__dirname, path.join(DIR_TEMPLATE, 'index.html')), 'utf8');
  html = insert(html, res, title);
  fs.writeFileSync(path.join(outDir, './index.html'), html);
};

const insert = (html, json, title) => {
  html = html.replace(/<title>(.*?)<\/title>/, `<title>${title}</title>`);
  const index = html.indexOf('<head>');
  return `${html.slice(0, index + 6)}<script>window.rawData=${JSON.stringify(json)}</script>${html.slice(index + 6)}`;
};

const getTemplate = () => getFiles(DIR_TEMPLATE);

const getFiles = (dir, res = []) => {
  const absDirPath = path.resolve(__dirname, dir);
  const names = fs.readdirSync(absDirPath);
  names.forEach((name) => {
    const absFilePath = path.join(absDirPath, name);
    const relFilePath = path.join(dir, name);
    if (fs.statSync(absFilePath).isDirectory()) {
      getFiles(relFilePath, res);
    } else if (fileReg.test(name)) {
      res.push([relFilePath, absFilePath]);
    }
  });
  return res;
};
const fileReg = /\.(js|css)$/;
