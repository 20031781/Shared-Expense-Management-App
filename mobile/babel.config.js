module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './src',
                        '@components': './src/components',
                        '@screens': './src/screens',
                        '@services': './src/services',
                        '@store': './src/store',
                        '@navigation': './src/navigation',
                        '@hooks': './src/hooks',
                        '@types': './src/types',
                        '@utils': './src/utils',
                        '@i18n': './src/i18n',
                        '@theme': './src/theme',
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
    };
};
