module.exports = {
  getConfig,
};

function getConfig(option) {
  const config = {
    include: '**/*.vue',
    exclude: [],
    outDir: 'docs',
    title: '组件库',
  };
  return Object.assign(config, option);
}
