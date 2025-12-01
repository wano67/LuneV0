const path = require('path');
const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('./tsconfig.json');

const tsconfigPaths = tsConfig?.compilerOptions?.paths || {};

// On mappe les alias TS vers le code compilé dans dist/
const runtimeBaseUrl = path.resolve(__dirname, 'dist');

const runtimePaths = Object.fromEntries(
  Object.entries(tsconfigPaths).map(([alias, targets]) => [
    alias,
    targets.map((target) => target.replace(/^\.?\/?src\//, ''))
  ])
);

tsConfigPaths.register({
  baseUrl: runtimeBaseUrl,
  paths: Object.keys(runtimePaths).length ? runtimePaths : tsconfigPaths
});