import React, {useMemo, useState} from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,} from 'react-native';
import {Button, Input, useDialog} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

export const CreateListScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const {createList, isLoading} = useListsStore();
    const {t} = useTranslation();
    const {showDialog} = useDialog();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) {
            setError(t('lists.nameRequired'));
            return;
        }

        try {
            const list = await createList(name.trim());
            showDialog({
                title: t('common.success'),
                message: t('lists.createSuccess'),
                actions: [{label: t('common.ok'), variant: 'primary', onPress: () => navigation.navigate('ListDetails', {listId: list.id})}],
            });
        } catch (error: any) {
            showDialog({
                title: t('common.error'),
                message: error.message || t('lists.createError'),
            });
        }
    };

    return <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
        <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{t('lists.createListTitle')}</Text>
            <Text style={styles.subtitle}>{t('lists.createListSubtitle')}</Text>

            <Input
                label={t('lists.nameLabel')}
                placeholder={t('lists.namePlaceholder')}
                value={name}
                onChangeText={text => {
                    setName(text);
                    setError('');
                }}
                error={error}
                autoFocus
            />

            <View style={styles.buttons}>
                <Button
                    title={t('lists.createList')}
                    onPress={handleCreate}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.button}
                />
                <Button
                    title={t('common.cancel')}
                    onPress={() => navigation.goBack()}
                    variant="secondary"
                    disabled={isLoading}
                    style={styles.button}
                />
            </View>
        </ScrollView>
    </KeyboardAvoidingView>;
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            padding: 24,
            gap: 20,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
        },
        subtitle: {
            fontSize: 16,
            color: colors.secondaryText,
        },
        buttons: {
            marginTop: 24,
            gap: 12,
        },
        button: {
            width: '100%',
        },
    });
