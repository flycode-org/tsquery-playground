const webpack = require('webpack');

module.exports = function override(config, env) {
  // esquery exports a broken ESModule. This makes sure it will be imported correctly
  config.resolve.mainFields = ['main'];
  // Do not parse typescript when bundling code
  config.module.rules.noParse = [require.resolve('typescript/lib/typescript.js')];
  // Ignore errors raised when bundling typescript
  config.plugins.push(
    new webpack.ContextReplacementPlugin(/\/typescript\//, (data) => {
      for (const dependency of data.dependencies) {
        delete dependency.critical;
      }
      return data;
    }),
    new webpack.IgnorePlugin(/perf_hooks/),
  );
  return config;
};
