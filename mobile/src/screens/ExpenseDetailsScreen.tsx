import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';

import {Card, Loading, Button} from '@/components';
import {useExpensesStore} from '@/store/expenses.store';
import {useListsStore} from '@/store/lists.store';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

export const ExpenseDetailsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const {expenseId} = route.params;
    const {t} = useTranslation();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {currentExpense, fetchExpenseById, deleteExpense, setCurrentExpense, isLoading} = useExpensesStore();
    const {members} = useListsStore();
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchExpenseById(expenseId);
        return () => setCurrentExpense(null);
    }, [expenseId, fetchExpenseById, setCurrentExpense]);

    const handleOpenReceipt = async () => {
        if (currentExpense?.receiptUrl) {
            await Linking.openURL(currentExpense.receiptUrl);
        }
    };

    const handleDelete = () => {
        if (!currentExpense) return;
        Alert.alert(
            t('expenses.deleteTitle'),
            t('expenses.deleteBody', {title: currentExpense.title}),
            [
                {text: t('common.cancel'), style: 'cancel'},
                {
                    text: t('expenses.deleteConfirm'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await deleteExpense(currentExpense.id);
                            Alert.alert(t('common.success'), t('expenses.deleteSuccess'));
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert(t('common.error'), error?.message || t('expenses.deleteError'));
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    if (!currentExpense || isLoading) {
        return <Loading/>;
    }

    const statusKey = (currentExpense.status as string).toLowerCase();
    const statusLabel = t(`expenses.status.${statusKey}`);
    const payerName = currentExpense.paidByMember?.displayName
        || currentExpense.paidByMember?.user?.fullName
        || members.find(m => m.id === currentExpense.paidByMemberId)?.displayName
        || currentExpense.paidByMember?.email
        || t('members.unknown');

    const infoItems = [
        {label: t('expenses.spentOn', {date: new Date(currentExpense.expenseDate).toLocaleDateString()}), value: ''},
        {label: t('expenses.insertedOn', {date: new Date(currentExpense.insertedAt || currentExpense.createdAt).toLocaleString()}), value: ''},
    ];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Card style={styles.heroCard}>
                <Text style={styles.title}>{currentExpense.title}</Text>
                <Text style={styles.amount}>{currentExpense.currency} {currentExpense.amount.toFixed(2)}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{statusLabel}</Text>
                </View>
                {currentExpense.notes && (
                    <Text style={styles.notes}>{currentExpense.notes}</Text>
                )}
            </Card>

            <Card>
                <Text style={styles.sectionTitle}>{t('expenses.details')}</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('expenses.paidByLabel')}</Text>
                    <Text style={styles.detailValue}>{payerName}</Text>
                </View>
                {infoItems.map((item, index) => (
                    <View key={index} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{item.label}</Text>
                    </View>
                ))}
                {currentExpense.receiptUrl && (
                    <TouchableOpacity style={styles.receiptButton} onPress={handleOpenReceipt}>
                        <Ionicons name="document-text-outline" size={18} color={colors.accent}/>
                        <Text style={styles.receiptText}>{t('expenses.openReceipt')}</Text>
                    </TouchableOpacity>
                )}
            </Card>

            <View style={styles.actions}>
                <Button
                    title={t('expenses.deleteAction')}
                    onPress={handleDelete}
                    variant="danger"
                    loading={isDeleting}
                />
            </View>
        </ScrollView>
    );
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
        },
    });
