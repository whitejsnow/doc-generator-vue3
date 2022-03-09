const path = require('path');
const { getASTs } = require('../util');
const { scanContent } = require('../../scan/scan');

const contents = getASTs(path.resolve(__dirname, '../comp/prop.vue'));

describe('test props', () => {
  test('defineProps CallExpression', () => {
    const content = contents[0];

    const res = scanContent(content, false);

    expect(res.props).toEqual([{ name: 'a', desc: '', type: 'String' }]);
  });
});
