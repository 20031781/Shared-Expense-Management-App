import React, {useState} from 'react';
import {Alert, StyleSheet, Switch, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Button, Input} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {useTranslation} from '@i18n';

export const AddMemberScreen: React.FC = () => {
    const {t} = useTranslation();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const {listId} = route.params;

    const {addMember, isLoading} = useListsStore();

    const [email, setEmail] = useState('');
    const [split, setSplit] = useState('50');
    const [isValidator, setIsValidator] = useState(false);
    const [errors, setErrors] = useState<{email?: string; split?: string}>({});

    const validate = () => {
        const nextErrors: {email?: string; split?: string} = {};
        if (!email.trim()) {
            nextErrors.email = t('members.emailRequired');
        }
        const parsedSplit = parseFloat(split);
        if (Number.isNaN(parsedSplit) || parsedSplit < 0 || parsedSplit > 100) {
            nextErrors.split = t('members.splitRequired');
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            await addMember(listId, email.trim(), parseFloat(split), isValidator);
            Alert.alert(t('common.success'), t('members.successBody'), [
                {text: t('common.ok'), onPress: () => navigation.goBack()},
            ]);
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('common.genericError'));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('members.title')}</Text>
            <Input
                label={t('members.emailLabel')}
                placeholder="john@example.com"
                value={email}
                onChangeText={(value) => {
                    setEmail(value);
                    setErrors((prev) => ({...prev, email: undefined}));
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <Input
                label={t('members.splitLabel')}
                placeholder="50"
                value={split}
                onChangeText={(value) => {
                    setSplit(value);
                    setErrors((prev) => ({...prev, split: undefined}));
                }}
                error={errors.split}
                keyboardType="numeric"
            />
            <View style={styles.switchRow}>
                <View>
                    <Text style={styles.switchLabel}>{t('members.validatorLabel')}</Text>
                    <Text style={styles.switchHint}>{t('members.validatorHint')}</Text>
                </View>
                <Switch value={isValidator} onValueChange={setIsValidator}/>
            </View>
            <Button title={t('members.submit')} onPress={handleSubmit} loading={isLoading} disabled={isLoading}/>
            <Button
                title={t('common.cancel')}
                onPress={() => navigation.goBack()}
                variant="secondary"
                style={styles.cancelButton}
                disabled={isLoading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#FFFFFF',
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        color: '#1C1C1E',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    switchHint: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
    cancelButton: {
        marginTop: 8,
    },
});
