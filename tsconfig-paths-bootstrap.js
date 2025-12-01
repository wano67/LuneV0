const tsConfigPaths = require('tsconfig-paths');

tsConfigPaths.register({
  baseUrl: __dirname + '/dist',
  paths: {
    '@/*': ['*'],
  },
});

module.exports = {};