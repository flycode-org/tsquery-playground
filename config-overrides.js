module.exports = function override(config, env) {
  // esquery exports a broken ESModule. This makes sure it will be imported correctly
  config.resolve.mainFields = ["main"];
  return config;
};
