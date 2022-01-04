const path = require('path');
const jsdoc = require('jsdoc-api');
const fs = require('fs');
const compiler = require('@vue/compiler-sfc');
const babel = require('@babel/core');
const vueseParser = require('@vuese/parser').parser;

exports.scanFold = scanFold;
exports.scanFile = scanFile;

function scanFold(foldPath) {
  const vueFiles = getVueFiles(foldPath);
  console.log(vueFiles)
  const res = vueFiles.map(filePath => scanFile(filePath));
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
  let scriptContent = (out.descriptor.scriptSetup || out.descriptor.script).content;
  scriptContent = babel.transformSync(scriptContent, {
    plugins: ['@babel/plugin-transform-typescript'],
  }).code;
  const jsdocRes = jsdoc.explainSync({
    source: scriptContent,
  });
  const resolveRes = {};
  jsdocRes.forEach((item) => {
    resolveDoclet(item, resolveRes);
  });
  const vueseRes = vueseParser(`<template>${out.descriptor.template.content}</template>`);
  resolveRes.slots = vueseRes.slots;
  resolveRes.slots && resolveRes.slots.forEach(slot => {
    slot.desc = slot.describe;
    delete slot.describe;
  })
  return resolveRes;
}

function resolveDoclet(doclet, res) {
  const { name, kind, params, description, longname, meta, undocumented } = doclet;

  switch (kind) {
    case 'module': {
      res.name = name;
      res.desc = description;
      break;
    }
    case 'member': {
      if (!res.props) res.props = [];
      if (longname.includes('~')) {
        const [propName, propDescriptor] = longname.split('~')[1].split('.');
        let propObj = res.props.find(item => item.name === propName);
        if (!propDescriptor) {
          if (undocumented) {
            return;
          }
          if (!propObj) {
            propObj = {
              name: propName,
            };
            if (description) {
              propObj.desc = description;
            }
            if (meta.code.type === 'Identifier') {
              propObj.type = meta.code.value;
            }
            res.props.push(propObj);
          }
        }
        if (propDescriptor && 'value' in meta.code && propObj) {
          const v = meta.code.value;
          propObj[propDescriptor] = propDescriptor === 'type' ? v : JSON.stringify(v);
        }
      }
      break;
    }
    case 'function': {
      if (undocumented) return;
      if (!res.methods) res.methods = [];
      res.methods.push({
        name,
        desc: description,
        params: params && params.map((item) => {
          const type = (item.type && item.type.names && item.type.names) || '';
          return {
            name: item.name,
            desc: item.description,
            type,
            defaultvalue: item.defaultvalue,
            optional: item.optional,
          };
        }),
      });
      break;
    }
    case 'event': {
      if (!res.events) res.events = [];
      const [eventName, eventDesc] = name.split(' ');
      res.events.push({
        name: eventName || '',
        desc: eventDesc || eventName || '',
        params: params && params.map((item) => {
          const type = (item.type && item.type.names && item.type.names) || '';
          return {
            name: item.name,
            desc: item.description,
            type,
          };
        }),
      });
      break;
    }
  }
}
