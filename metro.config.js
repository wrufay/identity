const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add glb and other 3D model extensions as asset types
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;
