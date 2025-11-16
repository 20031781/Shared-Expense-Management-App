import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {availableLanguages, useTranslation} from '@i18n';

export const SettingsScreen: React.FC = () => {
    const {language, setLanguage, t} = useTranslation();

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{t('settings.languageLabel')}</Text>
            <Text style={styles.description}>{t('settings.languageDescription')}</Text>
            <View style={styles.section}>
                {availableLanguages.map(({code, labelKey}) => {
                    const isActive = language === code;
                    return (
                        <TouchableOpacity
                            key={code}
                            style={[styles.option, isActive && styles.optionActive]}
                            onPress={() => setLanguage(code)}
                        >
                            <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                                {t(labelKey)}
                            </Text>
                            {isActive && <Ionicons name="checkmark-circle" size={20} color="#34C759"/>}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F2F2F7',
    },
    header: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#6C6C70',
        marginBottom: 16,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 8,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomColor: '#E5E5EA',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    optionActive: {
        backgroundColor: '#F0FBF4',
    },
    optionLabel: {
        fontSize: 16,
        color: '#1C1C1E',
    },
    optionLabelActive: {
        fontWeight: '700',
        color: '#0A7C4A',
    },
});
