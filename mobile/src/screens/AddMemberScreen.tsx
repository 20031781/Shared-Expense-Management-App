import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Button, Input} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

export const AddMemberScreen: React.FC = () => {
    const {t} = useTranslation();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const {listId} = route.params;

    const {addMember, isLoading} = useListsStore();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isValidator, setIsValidator] = useState(false);
    const [errors, setErrors] = useState<{ email?: string }>({});

    const validate = () => {
        const nextErrors: { email?: string } = {};
        if (!email.trim()) {
            nextErrors.email = t('members.emailRequired');
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            await addMember(listId, email.trim(), displayName.trim() || undefined, isValidator);
            Alert.alert(t('common.success'), t('members.successBody'), [
                {text: t('common.ok'), onPress: () => navigation.goBack()},
            ]);
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('common.genericError'));
        }
    };

    return <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('members.title')}</Text>
        <Text style={styles.description}>{t('members.splitInfo')}</Text>
        <Input
            label={t('members.displayNameLabel')}
            placeholder={t('members.displayNamePlaceholder')}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
        />
        <Text style={styles.hint}>{t('members.displayNameHint')}</Text>
        <Input
            label={t('members.emailLabel')}
            placeholder="john@example.com"
            value={email}
            onChangeText={value => {
                setEmail(value);
                setErrors(prev => ({...prev, email: undefined}));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
        />
        <View style={styles.switchCard}>
            <View style={styles.switchTextWrapper}>
                <Text style={styles.switchLabel}>{t('members.validatorLabel')}</Text>
                <Text style={styles.switchHint}>{t('members.validatorHint')}</Text>
            </View>
            <Switch
                value={isValidator}
                onValueChange={setIsValidator}
                trackColor={{false: colors.surfaceSecondary, true: colors.accent}}
                thumbColor={isValidator ? colors.accentText : colors.surface}
            />
        </View>
        <Button title={t('members.submit')} onPress={handleSubmit} loading={isLoading} disabled={isLoading}/>
        <Button
            title={t('common.cancel')}
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.cancelButton}
            disabled={isLoading}
        />
    </ScrollView>;
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            flexGrow: 1,
            padding: 20,
            gap: 16,
            backgroundColor: colors.background,
        },
        title: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
        },
        description: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        hint: {
            fontSize: 12,
            color: colors.secondaryText,
            marginTop: -8,
        },
        switchCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.surface,
        },
        switchTextWrapper: {
            flex: 1,
            paddingRight: 12,
            gap: 4,
        },
        switchLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        switchHint: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        cancelButton: {
            marginTop: 8,
        },
    });
