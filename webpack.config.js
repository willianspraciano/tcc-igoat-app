const path = require('path');
const createConfigAsync = require('@expo/webpack-config');

module.exports = async (env, argv) => {
  const config = await createConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['react-native-image-colors'],
      },
    },
    argv,
  );
  config.resolve.modules = [
    path.resolve(__dirname, './node_modules'),
    // path.resolve(__dirname, '../node_modules'),
  ];

  return config;
};
