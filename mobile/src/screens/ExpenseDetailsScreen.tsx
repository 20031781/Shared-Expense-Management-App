import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Animated,
    Easing,
    Linking,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
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
    const {expenseId, listId, expenseIds: routeExpenseIds} = route.params ?? {};
    const {t} = useTranslation();
    const {showDialog} = useDialog();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {currentExpense, fetchExpenseById, deleteExpense, setCurrentExpense, isLoading, expenses} = useExpensesStore();
    const {members} = useListsStore();
    const {user} = useAuthStore();
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeExpenseId, setActiveExpenseId] = useState<string | null>(expenseId ?? null);
    const [expenseSequence, setExpenseSequence] = useState<string[]>(routeExpenseIds ?? []);
    const swipeTranslate = useRef(new Animated.Value(0)).current;
    const swipeOpacity = useRef(new Animated.Value(1)).current;
    const {width: windowWidth} = useWindowDimensions();

    useEffect(() => {
        if (expenseId && expenseId !== activeExpenseId) {
            setActiveExpenseId(expenseId);
        }
    }, [expenseId, activeExpenseId]);

    useEffect(() => {
        if (!activeExpenseId) return;
        fetchExpenseById(activeExpenseId);
    }, [activeExpenseId, fetchExpenseById]);

    useEffect(() => () => setCurrentExpense(null), [setCurrentExpense]);

    useEffect(() => {
        swipeTranslate.stopAnimation();
        swipeTranslate.setValue(0);
        swipeOpacity.setValue(1);
    }, [activeExpenseId, swipeOpacity, swipeTranslate]);

    useEffect(() => {
        if (routeExpenseIds?.length) {
            setExpenseSequence(routeExpenseIds);
            return;
        }
        const targetListId = listId || currentExpense?.listId;
        if (!targetListId) {
            return;
        }
        const ids = expenses.filter(expense => expense.listId === targetListId).map(expense => expense.id);
        if (ids.length > 0) {
            setExpenseSequence(ids);
        }
    }, [routeExpenseIds, expenses, listId, currentExpense?.listId]);

    const navigationContext = useMemo(() => {
        const index = expenseSequence.findIndex(id => id === activeExpenseId);
        return {
            index,
            previous: index > 0 ? expenseSequence[index - 1] : null,
            next: index >= 0 && index < expenseSequence.length - 1 ? expenseSequence[index + 1] : null,
        };
    }, [expenseSequence, activeExpenseId]);

    const handleNavigateRelative = useCallback((direction: 'previous' | 'next') => {
        const targetId = direction === 'next' ? navigationContext.next : navigationContext.previous;
        if (!targetId || targetId === activeExpenseId) {
            return false;
        }
        setActiveExpenseId(targetId);
        navigation.setParams({expenseId: targetId});
        return true;
    }, [navigationContext, activeExpenseId, navigation]);

    const resetSwipePosition = useCallback(() => {
        Animated.parallel([
            Animated.spring(swipeTranslate, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 6,
            }),
            Animated.timing(swipeOpacity, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    }, [swipeTranslate, swipeOpacity]);

    const runSwipeTransition = useCallback((direction: 'previous' | 'next') => {
        const exitOffset = direction === 'next' ? -windowWidth : windowWidth;
        Animated.parallel([
            Animated.timing(swipeTranslate, {
                toValue: exitOffset,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(swipeOpacity, {
                toValue: 0.2,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(() => {
            const didNavigate = handleNavigateRelative(direction);
            if (!didNavigate) {
                resetSwipePosition();
                return;
            }
            const entryOffset = -exitOffset;
            swipeTranslate.setValue(entryOffset);
            swipeOpacity.setValue(0.25);
            Animated.parallel([
                Animated.spring(swipeTranslate, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 12,
                    stiffness: 120,
                }),
                Animated.timing(swipeOpacity, {
                    toValue: 1,
                    duration: 240,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start();
        });
    }, [handleNavigateRelative, swipeOpacity, swipeTranslate, windowWidth, resetSwipePosition]);

    const panResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
            && Math.abs(gestureState.dx) > 24,
        onPanResponderMove: (_, gestureState) => {
            swipeTranslate.setValue(gestureState.dx);
            const fade = Math.max(0.35, 1 - Math.abs(gestureState.dx) / windowWidth);
            swipeOpacity.setValue(fade);
        },
        onPanResponderRelease: (_, gestureState) => {
            const threshold = 60;
            if (gestureState.dx < -threshold && navigationContext.next) {
                runSwipeTransition('next');
            } else if (gestureState.dx > threshold && navigationContext.previous) {
                runSwipeTransition('previous');
            } else {
                resetSwipePosition();
            }
        },
        onPanResponderTerminate: resetSwipePosition,
    }), [navigationContext.next, navigationContext.previous, resetSwipePosition, runSwipeTransition, swipeTranslate, swipeOpacity, windowWidth]);

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
    const payerName = currentExpense.paidByMember?.displayName
        || currentExpense.paidByMember?.user?.fullName
        || members.find(m => m.id === currentExpense.paidByMemberId)?.displayName
        || currentExpense.paidByMember?.email
        || t('members.unknown');

    const normalizedPaymentMethod = (currentExpense.paymentMethod || ExpensePaymentMethod.Other).toString().toLowerCase();
    const paymentLabel = t(`expenses.paymentMethods.${normalizedPaymentMethod}`);
    const getMemberLabel = (member?: ListMember | null) => {
        if (!member) return t('members.unknown');
        return member.displayName && member.displayName.trim()
            || member.user?.fullName
            || member.email
            || t('members.unknown');
    };
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
    const canEdit = user?.id === currentExpense.authorId || !!user?.isAdmin;
    const canDelete = canEdit;

    const infoItems = [
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

    return <Animated.View
        style={[styles.swipeContainer, {transform: [{translateX: swipeTranslate}], opacity: swipeOpacity}]}
        {...panResponder.panHandlers}
    >
        <ScrollView contentContainerStyle={styles.container}>
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
    </ScrollView>
    </Animated.View>;
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        swipeContainer: {
            flex: 1,
        },
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
