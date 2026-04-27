const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');
config.resolver.resolverMainFields = ['browser', 'main', 'react-native'];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
