// tsconfig-paths-bootstrap.js
const tsconfigPaths = require('tsconfig-paths');
const path = require('path');

// On configure les alias pour le code *compilé* dans dist/
tsconfigPaths.register({
  baseUrl: path.resolve(__dirname, 'dist'),
  paths: {
    // "@/api/plugins/error-handler" -> "dist/api/plugins/error-handler.js"
    '@/*': ['*'],
  },
});