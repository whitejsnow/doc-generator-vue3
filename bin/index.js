#!/usr/bin/env node
const path = require('path');
const { Command } = require('commander');
const fg = require('fast-glob');
const { build } = require('../index');

const program = new Command();

program.command('gen').action(() => {
  const options = program.opts();
  const config = getConfig(options);
  build(config);
});
program.option('-c, --config <config>');

program.parse();

function getConfig(options) {
  if (options.config) {
    try {
      const config = require(path.resolve(options.config));
      console.log('config file: ', options.config);
      return config;
    } catch (e) {
      console.error('failed to load config: ', e);
      return;
    }
  }

  const configFile = fg.sync(['./doc-gen.config.[jt]s'])[0];
  if (configFile) {
    console.log('config file: ', configFile);
    return require(path.resolve(configFile));
  }
  console.log('no config file found, use default config');
}
