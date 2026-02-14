module.exports = function (api) {
    api.cache(true);
    return {
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
        plugins: [
            // Required for reanimated
            'react-native-reanimated/plugin',
        ],
    };
};
