const { scanFold, scanFile } = require('./scan/scan');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const build = async (foldPath, dest) => {
  const res = scanFold(foldPath);

  getFiles('./dist').forEach(([relFilePath, absFilePath]) => {
    const finalDest = path.join(dest, path.relative('dist', relFilePath));
    mkdirp.sync(path.dirname(finalDest));
    fs.copyFileSync(absFilePath, finalDest);
  })

  let html = fs.readFileSync(path.resolve(__dirname, './dist/index.html'));
  html = insert(html, res);
  fs.writeFileSync(path.join(dest, './index.html'), html)
}

exports.build = build;
exports.scanFile = scanFile;
exports.scanFold = scanFold;

const insert = (html, json) => {
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
