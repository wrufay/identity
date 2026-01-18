const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .glb files
config.resolver.assetExts.push('glb', 'gltf', 'bin', 'obj', 'mtl');

module.exports = config;
