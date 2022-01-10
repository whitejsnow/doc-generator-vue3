const { scanFold, scanFile } = require('./scan/scan');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const DEFAULT_DOC_TITLE = '组件库';

const build = async ({inputDir, outDir, docTitle = DEFAULT_DOC_TITLE}) => {
  const res = scanFold(inputDir);

  getFiles('./dist').forEach(([relFilePath, absFilePath]) => {
    const dest = path.join(outDir, path.relative('dist', relFilePath));
    mkdirp.sync(path.dirname(dest));
    fs.copyFileSync(absFilePath, dest);
  })

  let html = fs.readFileSync(path.resolve(__dirname, './dist/index.html'), 'utf8');
  html = insert(html, res, docTitle);
  fs.writeFileSync(path.join(outDir, './index.html'), html)
}

exports.build = build;
exports.scanFile = scanFile;
exports.scanFold = scanFold;

const insert = (html, json, docTitle) => {
  html = html.replace(/<title>(.*?)<\/title>/, `<title>${docTitle}</title>`)
  const index = html.indexOf('<head>');
  return html.slice(0, index + 6) + `<script>window.rawData=${JSON.stringify(json)}</script>` + html.slice(index + 6);
}

const getFiles = (dir, res = []) => {
  const absDirPath = path.resolve(__dirname, dir);
  const names = fs.readdirSync(absDirPath);
  names.forEach(name => {
    const absFilePath = path.join(absDirPath, name);
    const relFilePath = path.join(dir, name);
    if (fs.statSync(absFilePath).isDirectory()) {
      getFiles(relFilePath, res);
    } else if (fileReg.test(name)) {
      res.push([relFilePath, absFilePath]);
    }
  });
  return res;
}
const fileReg = /\.(js|css)$/;
