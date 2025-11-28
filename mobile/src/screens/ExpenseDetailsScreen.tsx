import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';

import {Button, Card, Loading, useDialog} from '@/components';
import {useExpensesStore} from '@/store/expenses.store';
import {useListsStore} from '@/store/lists.store';
import {useAuthStore} from '@/store/auth.store';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';
import {ExpensePaymentMethod, ListMember} from '@/types';
import {getFriendlyErrorMessage} from '@/lib/errors';

export const ExpenseDetailsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const {expenseId, listId} = route.params ?? {};
    const {t} = useTranslation();
    const {showDialog} = useDialog();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {currentExpense, fetchExpenseById, deleteExpense, setCurrentExpense, isLoading} = useExpensesStore();
    const {members, lists, fetchListById} = useListsStore();
    const {user} = useAuthStore();
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeExpenseId, setActiveExpenseId] = useState<string | null>(expenseId ?? null);
    const [listLoaded, setListLoaded] = useState(false);

    useEffect(() => {
        if (expenseId && expenseId !== activeExpenseId) {
            setActiveExpenseId(expenseId);
        }
    }, [expenseId, activeExpenseId]);

    useEffect(() => {
        if (!activeExpenseId) return;
        fetchExpenseById(activeExpenseId);
    }, [activeExpenseId, fetchExpenseById]);

    useEffect(() => {
        if (!listId || listLoaded) return;
        const targetList = lists.find(list => list.id === listId);
        if (!targetList) {
            fetchListById(listId).finally(() => setListLoaded(true));
            return;
        }
        setListLoaded(true);
    }, [listId, listLoaded, lists, fetchListById]);

    useEffect(() => () => setCurrentExpense(null), [setCurrentExpense]);

    const handleOpenReceipt = async () => {
        if (currentExpense?.receiptUrl) {
            await Linking.openURL(currentExpense.receiptUrl);
        }
    };

    const handleConfirmDelete = useCallback(async () => {
        if (!currentExpense) return;
        try {
            setIsDeleting(true);
            await deleteExpense(currentExpense.id);
            showDialog({
                title: t('common.success'),
                message: t('expenses.deleteSuccess'),
                actions: [{
                    label: t('common.ok'),
                    variant: 'primary',
                    onPress: () => {
                        if (!navigation.canGoBack()) {
                            navigation.navigate('Lists');
                        } else {
                            navigation.goBack();
                        }
                    }
                }],
            });
        } catch (error: any) {
            showDialog({
                title: t('common.error'),
                message: getFriendlyErrorMessage(error, t('expenses.deleteError'), t),
            });
        } finally {
            setIsDeleting(false);
        }
    }, [currentExpense, deleteExpense, navigation, showDialog, t]);

    const handleDelete = useCallback(() => {
        if (!currentExpense) return;
        showDialog({
            title: t('expenses.deleteTitle'),
            message: t('expenses.deleteBody', {title: currentExpense.title}),
            actions: [
                {label: t('common.cancel'), variant: 'ghost'},
                {label: t('expenses.deleteConfirm'), variant: 'danger', onPress: handleConfirmDelete},
            ],
        });
    }, [currentExpense, handleConfirmDelete, showDialog, t]);

    if (!currentExpense || isLoading) {
        return <Loading/>;
    }

    const statusKey = (currentExpense.status as string).toLowerCase();
    const statusLabel = t(`expenses.status.${statusKey}`);
    const getMemberLabel = (member?: ListMember | null) => {
        if (!member) return t('members.unknown');
        return member.displayName && member.displayName.trim()
            || member.user?.fullName
            || member.email
            || t('members.unknown');
    };
    const payerMember = currentExpense.paidByMember
        || members.find(m => m.id === currentExpense.paidByMemberId)
        || null;
    const payerName = getMemberLabel(payerMember);

    const creatorName = currentExpense.author?.fullName
        || getMemberLabel(members.find(member => member.userId === currentExpense.authorId) || null);

    const normalizedPaymentMethod = (currentExpense.paymentMethod || ExpensePaymentMethod.Other).toString().toLowerCase();
    const paymentLabel = t(`expenses.paymentMethods.${normalizedPaymentMethod}`);
    const beneficiaryMembers = (currentExpense.beneficiaryMemberIds ?? [])
        .map(id => members.find(member => member.id === id)
            || currentExpense.splits?.find(split => split.memberId === id)?.member
            || null);
    const beneficiaryNames = beneficiaryMembers
        .map(member => getMemberLabel(member))
        .filter(label => !!label);
    const totalKnownMembers = members.length || currentExpense.splits?.length || 0;
    const beneficiaryCount = currentExpense.beneficiaryMemberIds?.length ?? 0;
    const beneficiaryLabel = (() => {
        if (beneficiaryCount === 0) {
            return t('expenses.beneficiariesRequired');
        }
        if (totalKnownMembers > 0 && beneficiaryCount >= totalKnownMembers) {
            return t('expenses.beneficiariesAll');
        }
        if (beneficiaryNames.length === 0) {
            return t('expenses.beneficiariesRequired');
        }
        if (beneficiaryNames.length <= 2) {
            return beneficiaryNames.join(', ');
        }
        return t('expenses.beneficiariesCount', {count: beneficiaryNames.length});
    })();
    const listAdminId = useMemo(() => lists.find(list => list.id === (listId ?? currentExpense?.listId))?.adminId,
        [lists, listId, currentExpense?.listId]);
    const isAdmin = (listAdminId && listAdminId === user?.id) || !!user?.isAdmin;
    const canEdit = isAdmin;
    const canDelete = isAdmin;

    const infoItems = [
        {label: t('expenses.createdByLabel'), value: creatorName},
        {label: t('expenses.paymentMethodLabel'), value: paymentLabel},
        {label: t('expenses.beneficiariesLabel'), value: beneficiaryLabel},
        {label: t('expenses.spentOn', {date: new Date(currentExpense.expenseDate).toLocaleDateString()}), value: ''},
        {
            label: t('expenses.insertedOn', {date: new Date(currentExpense.insertedAt || currentExpense.createdAt).toLocaleDateString()}),
            value: ''
        },
    ];

    const handleEdit = () => navigation.navigate('CreateExpense', {
        listId: currentExpense.listId,
        expenseId: currentExpense.id
    });

    return <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.heroCard}>
            <Text style={styles.title}>{currentExpense.title}</Text>
            <Text style={styles.amount}>{currentExpense.currency} {currentExpense.amount.toFixed(2)}</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel}</Text>
            </View>
            {currentExpense.notes && <Text style={styles.notes}>{currentExpense.notes}</Text>}
        </Card>

        <Card>
            <Text style={styles.sectionTitle}>{t('expenses.details')}</Text>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('expenses.paidByLabel')}</Text>
                <Text style={styles.detailValue}>{payerName}</Text>
            </View>
            {infoItems.map((item, index) => <View key={index} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                {item.value ? <Text style={styles.detailValue}>{item.value}</Text> : null}
            </View>)}
            {currentExpense.receiptUrl && <TouchableOpacity style={styles.receiptButton} onPress={handleOpenReceipt}>
                <Ionicons name="document-text-outline" size={18} color={colors.accent}/>
                <Text style={styles.receiptText}>{t('expenses.openReceipt')}</Text>
            </TouchableOpacity>}
        </Card>

        <View style={styles.actions}>
            {canEdit && <Button
                title={t('expenses.editTitle')}
                onPress={handleEdit}
                variant="secondary"
                style={styles.editButton}
            />}
            {canDelete && <Button
                title={t('expenses.deleteAction')}
                onPress={handleDelete}
                variant="danger"
                loading={isDeleting}
            />}
        </View>
    </ScrollView>;
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            padding: 16,
            gap: 16,
        },
        heroCard: {
            marginHorizontal: 0,
        },
        title: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
        },
        amount: {
            fontSize: 32,
            fontWeight: '800',
            color: colors.accent,
            marginTop: 8,
        },
        badge: {
            alignSelf: 'flex-start',
            backgroundColor: colors.surfaceSecondary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            marginTop: 12,
        },
        badgeText: {
            fontWeight: '600',
            color: colors.secondaryText,
        },
        notes: {
            marginTop: 16,
            fontSize: 16,
            color: colors.secondaryText,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            marginBottom: 12,
            color: colors.text,
        },
        detailRow: {
            marginBottom: 12,
        },
        detailLabel: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        detailValue: {
            fontSize: 16,
            color: colors.text,
            fontWeight: '600',
        },
        receiptButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
        },
        receiptText: {
            color: colors.accent,
            fontWeight: '600',
        },
        actions: {
            marginTop: 8,
            marginHorizontal: 16,
            gap: 12,
        },
        editButton: {
            width: '100%',
        },
    });
