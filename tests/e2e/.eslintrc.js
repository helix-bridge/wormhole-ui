// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const synpressPath = path.join(process.cwd(), '/node_modules/@synthetixio/synpress');

module.exports = {
  extends: `${synpressPath}/.eslintrc.js`,
};
