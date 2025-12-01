const path = require('path');
const tsConfigPaths = require('tsconfig-paths');

// Minimal runtime alias mapping for compiled code in dist/; no need to read tsconfig.json at runtime.
const runtimeBaseUrl = path.resolve(__dirname, 'dist');
const runtimePaths = {
  '@/*': ['*'],
};

tsConfigPaths.register({
  baseUrl: runtimeBaseUrl,
  paths: runtimePaths,
});
