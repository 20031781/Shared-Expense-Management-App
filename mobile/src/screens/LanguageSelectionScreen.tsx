import React, {useMemo} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTranslation} from '@i18n';
import {Language} from '@i18n/translations';
import {AppColors, useAppTheme} from '@theme';

const LANGUAGE_OPTIONS: { code: Language; labelKey: string; descriptionKey: string; emoji: string; }[] = [
    {
        code: 'it',
        labelKey: 'settings.italian',
        descriptionKey: 'languageSelection.italianDescription',
        emoji: '🇮🇹'
    },
    {
        code: 'en',
        labelKey: 'settings.english',
        descriptionKey: 'languageSelection.englishDescription',
        emoji: '🇺🇸'
    },
];

export const LanguageSelectionScreen: React.FC = () => {
    const {t, language, setLanguage} = useTranslation();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const handleSelect = async (nextLanguage: Language) => {
        await setLanguage(nextLanguage);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.emoji}>🌍</Text>
                <Text style={styles.title}>{t('languageSelection.title')}</Text>
                <Text style={styles.subtitle}>{t('languageSelection.subtitle')}</Text>
            </View>

            <View style={styles.options}>
                {LANGUAGE_OPTIONS.map((option) => {
                    const isActive = option.code === language;
                    return (
                        <TouchableOpacity
                            key={option.code}
                            onPress={() => handleSelect(option.code)}
                            style={[styles.option, isActive && styles.optionActive]}
                        >
                            <Text style={styles.optionEmoji}>{option.emoji}</Text>
                            <View style={styles.optionCopy}>
                                <Text style={styles.optionTitle}>{t(option.labelKey)}</Text>
                                <Text style={styles.optionSubtitle}>{t(option.descriptionKey)}</Text>
                            </View>
                            {isActive && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.accent}/>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={styles.footer}>{t('languageSelection.footer')}</Text>
        </View>
    );
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: 32,
            justifyContent: 'center',
            gap: 24,
        },
        header: {
            alignItems: 'center',
            gap: 12,
        },
        emoji: {
            fontSize: 48,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: 16,
            color: colors.secondaryText,
            textAlign: 'center',
        },
        options: {
            gap: 16,
        },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.surface,
            gap: 16,
        },
        optionActive: {
            borderColor: colors.accent,
        },
        optionEmoji: {
            fontSize: 32,
        },
        optionCopy: {
            flex: 1,
            gap: 4,
        },
        optionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
        },
        optionSubtitle: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        footer: {
            fontSize: 13,
            color: colors.secondaryText,
            textAlign: 'center',
        },
    });
