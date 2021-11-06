module.exports = function override(config, env) {
  // esquery exports a broken ESModule. This makes sure it will be imported correctly
  config.resolve.mainFields = ["main"];
  // Do not parse typescript when bundling code
  config.module.rules.noParse = [
    require.resolve("typescript/lib/typescript.js"),
  ];
  return config;
};
