import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Button, Input, Loading} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {MemberStatus} from '@/types';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

const STATUS_OPTIONS: MemberStatus[] = [MemberStatus.Active, MemberStatus.Pending];

export const EditMemberScreen: React.FC = () => {
    const {t} = useTranslation();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const {listId, memberId} = route.params;
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const {members, fetchMembers, updateMember, removeMember, isLoading} = useListsStore();
    const member = members.find((m) => m.id === memberId);
    const formatSplit = (value?: number) => (value ?? 0).toFixed(2);
    const otherMembers = useMemo(() => members.filter((m) => m.id !== memberId), [members, memberId]);

    const [displayName, setDisplayName] = useState(member?.displayName ?? '');
    const [split, setSplit] = useState(formatSplit(member?.splitPercentage));
    const [isValidator, setIsValidator] = useState(member?.isValidator ?? false);
    const [status, setStatus] = useState<MemberStatus>(member?.status ?? MemberStatus.Pending);
    const [errors, setErrors] = useState<{split?: string}>({});

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
        if (member) {
            setDisplayName(member.displayName ?? '');
            setSplit(formatSplit(member.splitPercentage));
            setIsValidator(member.isValidator);
            setStatus(member.status);
        }
    }, [memberId, member]);

    const validate = () => {
        const nextErrors: {split?: string} = {};
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
            Alert.alert(t('common.success'), t('members.editSuccess'), [
                {text: t('common.ok'), onPress: () => navigation.goBack()},
            ]);
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('common.genericError'));
        }
    };

    const confirmRemove = () => {
        if (!member) return;
        Alert.alert(
            t('members.removeTitle'),
            t('members.removeBody', {email: member.email}),
            [
                {text: t('common.cancel'), style: 'cancel'},
                {text: t('members.removeConfirm'), style: 'destructive', onPress: handleRemove},
            ]
        );
    };

    const handleRemove = async () => {
        if (!member) return;
        try {
            await removeMember(listId, member.id);
            Alert.alert(t('common.success'), t('members.removeSuccess'), [
                {text: t('common.ok'), onPress: () => navigation.goBack()},
            ]);
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('common.genericError'));
        }
    };

    if (!member) {
        return <Loading/>;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
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
                onChangeText={(text) => {
                    setSplit(text);
                    setErrors((prev) => ({...prev, split: undefined}));
                }}
                keyboardType="decimal-pad"
                error={errors.split}
            />
            {otherMembers.length > 0 && (
                <Text style={styles.balanceHint}>
                    {t('members.autoBalanceHint', {
                        remaining: splitPreview.remaining,
                        recipients: otherMembers.length,
                        share: splitPreview.share,
                    })}
                </Text>
            )}

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
                {STATUS_OPTIONS.map((option) => {
                    const isActive = status === option;
                    const labelKey = option === MemberStatus.Active ? 'members.statusActive' : 'members.statusPending';
                    return (
                        <TouchableOpacity
                            key={option}
                            style={[styles.statusChip, isActive && styles.statusChipActive]}
                            onPress={() => setStatus(option)}
                        >
                            <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>
                                {t(labelKey)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Button title={t('members.editSubmit')} onPress={handleSave} loading={isLoading} disabled={isLoading}/>
            <Button
                title={t('members.removeButton')}
                onPress={confirmRemove}
                variant="danger"
                disabled={isLoading}
            />
        </ScrollView>
    );
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
