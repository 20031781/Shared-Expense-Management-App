import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Button, Input, Loading, useDialog} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {MemberStatus} from '@/types';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';
import {useExpensesStore} from '@/store/expenses.store';
import {getFriendlyErrorMessage} from '@/lib/errors';

const STATUS_OPTIONS: MemberStatus[] = [MemberStatus.Active, MemberStatus.Pending];

export const EditMemberScreen: React.FC = () => {
    const {t} = useTranslation();
    const {showDialog} = useDialog();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const {listId, memberId} = route.params;
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const {members, fetchMembers, updateMember, removeMember, isLoading} = useListsStore();
    const {expenses: listExpenses, fetchListExpenses} = useExpensesStore();
    const member = members.find(m => m.id === memberId);
    const formatSplit = (value?: number) => (value ?? 0).toFixed(2);
    const otherMembers = useMemo(() => members.filter(m => m.id !== memberId), [members, memberId]);

    const [displayName, setDisplayName] = useState(member?.displayName ?? '');
    const [split, setSplit] = useState(formatSplit(member?.splitPercentage));
    const [isValidator, setIsValidator] = useState(member?.isValidator ?? false);
    const [status, setStatus] = useState<MemberStatus>(member?.status ?? MemberStatus.Pending);
    const [errors, setErrors] = useState<{ split?: string }>({});

    const splitPreview = useMemo(() => {
        const parsedValue = parseFloat(split);
        const normalized = Number.isNaN(parsedValue) ? 0 : Math.min(Math.max(parsedValue, 0), 100);
        const remaining = Math.max(0, 100 - normalized);
        const share = otherMembers.length > 0 ? remaining / otherMembers.length : 0;
        return {remaining, share};
    }, [split, otherMembers.length]);

    useEffect(() => {
        if (!member) {
            fetchMembers(listId);
        }
    }, [member, fetchMembers, listId]);

    useEffect(() => {
        fetchListExpenses(listId);
    }, [fetchListExpenses, listId]);

    useEffect(() => {
        if (member) {
            setDisplayName(member.displayName ?? '');
            setSplit(formatSplit(member.splitPercentage));
            setIsValidator(member.isValidator);
            setStatus(member.status);
        }
    }, [memberId, member]);

    const assignedExpenseCount = useMemo(() => listExpenses
        .filter(expense => expense.listId === listId)
        .filter(expense =>
            expense.paidByMemberId === memberId
            || expense.paidByMember?.id === memberId
            || expense.beneficiaryMemberIds?.includes(memberId)
            || expense.splits?.some(split => split.memberId === memberId)
        ).length, [listExpenses, listId, memberId]);

    const validate = () => {
        const nextErrors: { split?: string } = {};
        const parsed = parseFloat(split);
        if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
            nextErrors.split = t('members.splitRequired');
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const rebalanceOtherSplits = useCallback(async (targetSplitValue: number) => {
        if (otherMembers.length === 0) return;
        const remaining = Math.max(0, 100 - targetSplitValue);
        const count = otherMembers.length;
        const scaledRemaining = Math.max(0, Math.round(remaining * 100));
        const baseShare = count > 0 ? Math.floor(scaledRemaining / count) : 0;
        let remainder = count > 0 ? scaledRemaining - baseShare * count : 0;

        for (const other of otherMembers) {
            let shareCents = baseShare;
            if (remainder > 0) {
                shareCents += 1;
                remainder -= 1;
            }
            const share = shareCents / 100;
            if (Math.abs((other.splitPercentage ?? 0) - share) < 0.01) {
                continue;
            }
            await updateMember(listId, other.id, {splitPercentage: share});
        }
    }, [otherMembers, updateMember, listId]);

    const handleSave = async () => {
        if (!member) return;
        if (!validate()) return;

        try {
            const trimmedDisplayName = displayName.trim();
            const targetSplit = parseFloat(split);
            await updateMember(listId, member.id, {
                displayName: trimmedDisplayName || undefined,
                splitPercentage: targetSplit,
                isValidator,
                status,
                clearDisplayName: trimmedDisplayName ? undefined : true,
            });
            await rebalanceOtherSplits(targetSplit);
            showDialog({
                title: t('common.success'),
                message: t('members.editSuccess'),
                actions: [{label: t('common.ok'), variant: 'primary', onPress: () => navigation.goBack()}],
            });
        } catch (error: any) {
            showDialog({
                title: t('common.error'),
                message: getFriendlyErrorMessage(error, t('common.genericError'), t),
            });
        }
    };

    const confirmRemove = () => {
        if (!member) return;
        if (assignedExpenseCount > 0) {
            showDialog({
                title: t('members.removeBlockedTitle'),
                message: t('members.removeBlockedBody', {count: assignedExpenseCount}),
                actions: [{label: t('common.ok'), variant: 'primary'}],
            });
            return;
        }
        showDialog({
            title: t('members.removeTitle'),
            message: t('members.removeBody', {email: member.email}),
            actions: [
                {label: t('common.cancel'), variant: 'ghost'},
                {label: t('members.removeConfirm'), variant: 'danger', onPress: handleRemove},
            ],
        });
    };

    const handleRemove = async () => {
        if (!member) return;
        try {
            await removeMember(listId, member.id);
            showDialog({
                title: t('common.success'),
                message: t('members.removeSuccess'),
                actions: [{label: t('common.ok'), variant: 'primary', onPress: () => navigation.goBack()}],
            });
        } catch (error: any) {
            showDialog({
                title: t('common.error'),
                message: getFriendlyErrorMessage(error, t('common.genericError'), t),
            });
        }
    };

    if (!member) {
        return <Loading/>;
    }

    return <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('members.editTitle')}</Text>
        <Text style={styles.subtitle}>{member.email}</Text>

        <Input
            label={t('members.displayNameLabel')}
            placeholder={t('members.displayNamePlaceholder')}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
        />
        <Text style={styles.switchHint}>{t('members.displayNameHint')}</Text>

        <Input
            label={t('members.splitLabel')}
            placeholder="0"
            value={split}
            onChangeText={text => {
                setSplit(text);
                setErrors(prev => ({...prev, split: undefined}));
            }}
            keyboardType="decimal-pad"
            error={errors.split}
        />
        {otherMembers.length > 0 && <Text style={styles.balanceHint}>
            {t('members.autoBalanceHint', {
                remaining: splitPreview.remaining,
                recipients: otherMembers.length,
                share: splitPreview.share,
            })}
        </Text>}

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

        <Text style={styles.sectionLabel}>{t('members.statusLabel')}</Text>
        <Text style={styles.sectionHint}>{t('members.statusHint')}</Text>
        <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(option => {
                const isActive = status === option;
                const labelKey = option === MemberStatus.Active ? 'members.statusActive' : 'members.statusPending';
                return <TouchableOpacity
                    key={option}
                    style={[styles.statusChip, isActive && styles.statusChipActive]}
                    onPress={() => setStatus(option)}
                >
                    <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>
                        {t(labelKey)}
                    </Text>
                </TouchableOpacity>;
            })}
        </View>

        <Button title={t('members.editSubmit')} onPress={handleSave} loading={isLoading} disabled={isLoading}/>
        <Button
            title={t('members.removeButton')}
            onPress={confirmRemove}
            variant="danger"
            disabled={isLoading}
        />
        {assignedExpenseCount > 0 && <Text style={styles.blockedHelper}>
            {t('members.removeBlockedHelper')}
        </Text>}
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
        subtitle: {
            fontSize: 16,
            color: colors.secondaryText,
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
        balanceHint: {
            fontSize: 12,
            color: colors.secondaryText,
            marginTop: -8,
            marginBottom: 8,
        },
        sectionLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        sectionHint: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        blockedHelper: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        statusRow: {
            flexDirection: 'row',
            gap: 12,
        },
        statusChip: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: colors.surfaceSecondary,
            alignItems: 'center',
        },
        statusChipActive: {
            backgroundColor: colors.accent,
        },
        statusChipText: {
            color: colors.secondaryText,
            fontWeight: '600',
        },
        statusChipTextActive: {
            color: colors.accentText,
        },
    });
