import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Button, Card, Loading} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {useExpensesStore} from '@/store/expenses.store';
import {useAuthStore} from '@/store/auth.store';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Expense, ExpensePaymentMethod, ExpenseStatus, ListMember, MemberStatus} from '@/types';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';
import listsService from '@/services/lists.service';
import {Swipeable} from 'react-native-gesture-handler';
import {buildSplitSummary} from '@/lib/split';

type SummaryFilter = '7' | '30' | '90' | 'all';

export const ListDetailsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const {listId} = route.params;
    const {t} = useTranslation();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const {user} = useAuthStore();
    const {currentList, members, fetchListById, fetchMembers} = useListsStore();
    const {expenses, fetchListExpenses, deleteExpense} = useExpensesStore();

    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'expenses' | 'members'>('expenses');
    const [summaryRange, setSummaryRange] = useState<SummaryFilter>('30');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

    useEffect(() => loadData(), [listId]);

    const loadData = async () =>
        await Promise.all([
            fetchListById(listId),
            fetchMembers(listId),
            fetchListExpenses(listId),
        ]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleAddExpense = () => navigation.navigate('CreateExpense', {listId});

    const handleAddMember = () => navigation.navigate('AddMember', {listId});

    const handleEditMember = (member: ListMember) => navigation.navigate('EditMember', {listId, memberId: member.id});

    const handleExpensePress = (expense: Expense) => navigation.navigate('ExpenseDetails', {expenseId: expense.id});

    const handleEditExpense = (expense: Expense) => {
        closeSwipe(expense.id);
        navigation.navigate('CreateExpense', {listId, expenseId: expense.id});
    };

    const getMemberLabel = useCallback((member?: ListMember) => {
        if (!member) return t('members.unknown');
        return member.displayName && member.displayName.trim()
            || member.user?.fullName
            || member.email
            || t('members.unknown');
    }, [t]);

    const filteredExpenses = useMemo(() => {
        if (summaryRange === 'all') return expenses;
        const days = parseInt(summaryRange, 10);
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - days);
        return expenses.filter(expense => new Date(expense.expenseDate) >= threshold);
    }, [expenses, summaryRange]);

    const totalAmount = useMemo(() => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0), [filteredExpenses]);

    const memberMap = useMemo(() => {
        const map = new Map<string, ListMember>();
        members.forEach(member => map.set(member.id, member));
        return map;
    }, [members]);

    const perMemberBreakdown = useMemo(() => {
        const accumulator = new Map<string, number>();
        filteredExpenses.forEach(expense => {
            if (!expense.paidByMemberId) return;
            accumulator.set(expense.paidByMemberId, (accumulator.get(expense.paidByMemberId) ?? 0) + expense.amount);
        });
        return Array.from(accumulator.entries()).map(([memberId, amount]) => ({
            member: memberMap.get(memberId),
            amount,
            memberId,
        })).sort((a, b) => b.amount - a.amount);
    }, [filteredExpenses, memberMap]);

    const chartMax = perMemberBreakdown.reduce((max, item) => Math.max(max, item.amount), 0) || 1;

    const splitSummary = useMemo(() => buildSplitSummary(expenses, members), [expenses, members]);

    const resolveBeneficiariesLabel = useCallback((expense: Expense) => {
        const ids = expense.beneficiaryMemberIds?.length > 0
            ? expense.beneficiaryMemberIds
            : members.map(member => member.id);
        const names = ids
            .map(id => memberMap.get(id))
            .filter((member): member is ListMember => !!member)
            .map(member => getMemberLabel(member));
        if (names.length === 0 || !expense.beneficiaryMemberIds?.length || names.length === members.length) {
            return t('expenses.beneficiariesAll');
        }
        if (names.length <= 2) {
            return names.join(', ');
        }
        return t('expenses.beneficiariesCount', {count: names.length});
    }, [memberMap, getMemberLabel, members, t]);

    if (!currentList) {
        return <Loading/>;
    }

    const isAdmin = currentList.adminId === user?.id || !!user?.isAdmin;
    const currency = expenses[0]?.currency ?? 'EUR';

    const closeSwipe = (id: string) => {
        const ref = swipeableRefs.current[id];
        if (ref) {
            ref.close();
        }
    };

    const performDelete = async (expense: Expense) => {
        try {
            setDeletingId(expense.id);
            await deleteExpense(expense.id);
            Alert.alert(t('common.success'), t('expenses.deleteSuccess'));
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.message || t('expenses.deleteError'));
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteExpense = (expense: Expense) => {
        closeSwipe(expense.id);
        Alert.alert(
            t('expenses.deleteTitle'),
            t('expenses.deleteBody', {title: expense.title}),
            [
                {text: t('common.cancel'), style: 'cancel'},
                {
                    text: t('expenses.deleteConfirm'),
                    style: 'destructive',
                    onPress: () => performDelete(expense),
                },
            ]
        );
    };

    const renderExpense = (expense: Expense) => {
        const payer = expense.paidByMemberId ? memberMap.get(expense.paidByMemberId) : undefined;
        const statusKey = (expense.status as string).toLowerCase();
        const statusLabel = t(`expenses.status.${statusKey}`);
        const awaitingValidation = statusKey === 'submitted';
        const normalizedPaymentMethod = (expense.paymentMethod || ExpensePaymentMethod.Other).toString().toLowerCase();
        const paymentLabel = t(`expenses.paymentMethods.${normalizedPaymentMethod}`);
        const beneficiaryLabel = resolveBeneficiariesLabel(expense);
        const canEditExpense = expense.authorId === user?.id || isAdmin;
        return <View key={expense.id} style={styles.expenseSwipeWrapper}>
            <Swipeable
                ref={ref => {
                    if (ref) {
                        swipeableRefs.current[expense.id] = ref;
                    } else {
                        delete swipeableRefs.current[expense.id];
                    }
                }}
                renderLeftActions={canEditExpense ? () => <TouchableOpacity
                    style={styles.editAction}
                    onPress={() => handleEditExpense(expense)}
                >
                    <Ionicons name="create-outline" size={20} color={colors.accentText}/>
                    <Text style={styles.editActionText}>{t('expenses.editAction')}</Text>
                </TouchableOpacity> : undefined}
                renderRightActions={() => <TouchableOpacity
                    style={styles.deleteAction}
                    onPress={() => handleDeleteExpense(expense)}
                    disabled={deletingId === expense.id}
                >
                    {deletingId === expense.id ? <ActivityIndicator color={colors.accentText}/> : <>
                        <Ionicons name="trash" size={20} color={colors.accentText}/>
                        <Text style={styles.deleteActionText}>{t('expenses.deleteAction')}</Text>
                    </>}
                </TouchableOpacity>}
                overshootRight={false}
            >
                <Card
                    onPress={() => handleExpensePress(expense)}
                    style={[styles.expenseCard, awaitingValidation && styles.pendingExpenseCard]}
                >
                    <View style={styles.expenseItem}>
                        <View style={styles.expenseInfo}>
                            <Text style={styles.expenseTitle}>{expense.title}</Text>
                            <Text style={styles.expenseMeta}>
                                {t('expenses.spentOn', {date: new Date(expense.expenseDate).toLocaleDateString()})}
                            </Text>
                            <Text style={styles.expenseMeta}>
                                {t('expenses.insertedOn', {date: new Date(expense.insertedAt || expense.createdAt).toLocaleString()})}
                            </Text>
                            {payer && <Text
                                style={styles.expensePayer}>{t('expenses.paidBy', {name: getMemberLabel(payer)})}</Text>}
                            <View style={styles.expenseTags}>
                                <View style={styles.expenseTag}>
                                    <Ionicons name="card-outline" size={14} color={colors.secondaryText}/>
                                    <Text style={styles.expenseTagText}>{paymentLabel}</Text>
                                </View>
                                <View style={styles.expenseTag}>
                                    <Ionicons name="people-outline" size={14} color={colors.secondaryText}/>
                                    <Text style={styles.expenseTagText}>{beneficiaryLabel}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.expenseRight}>
                            <Text style={styles.expenseAmount}>
                                {currency} {expense.amount.toFixed(2)}
                            </Text>
                            <View style={[styles.statusBadge, styles[`status${statusKey}`]]}>
                                <Text style={styles.statusText}>{statusLabel}</Text>
                            </View>
                            {awaitingValidation &&
                                <Text style={styles.pendingStatusText}>{t('expenses.pendingValidation')}</Text>}
                        </View>
                    </View>
                </Card>
            </Swipeable>
        </View>;
    };

    const renderMember = (member: ListMember) => {
        const normalizedStatus = (typeof member.status === 'string'
            ? member.status.toLowerCase()
            : MemberStatus.Pending) as MemberStatus;
        const isActive = normalizedStatus === MemberStatus.Active;
        const label = getMemberLabel(member);
        return <Card key={member.id} style={styles.memberCard}>
            <View style={styles.memberItem}>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberEmail}>{label}</Text>
                    <View style={styles.memberBadges}>
                        <Text style={styles.memberSplit}>
                            {t('members.splitValue', {value: member.splitPercentage ?? 0})}
                        </Text>
                        {member.isValidator && <View style={styles.validatorBadge}>
                            <Ionicons name="shield-checkmark" size={14} color={colors.success}/>
                            <Text style={styles.validatorText}>{t('members.validatorBadge')}</Text>
                        </View>}
                    </View>
                </View>
                <View style={styles.memberActions}>
                    <View style={styles.memberStatusBlock}>
                        <View style={styles.memberStatusWrapper}>
                            <View
                                style={[styles.statusDot, isActive ? styles.activeStatus : styles.pendingStatus]}/>
                            <Text style={styles.memberStatusText}>
                                {isActive ? t('members.statusActiveShort') : t('members.statusPendingShort')}
                            </Text>
                        </View>
                    </View>
                    {isAdmin && <TouchableOpacity
                        onPress={() => handleEditMember(member)}
                        style={styles.memberActionButton}
                    >
                        <Ionicons name="create-outline" size={18} color={colors.accent}/>
                    </TouchableOpacity>}
                </View>
            </View>
        </Card>;
    };

    const handleShareInvite = async () => {
        if (!currentList) return;
        try {
            const whatsappUrl = await listsService.generateWhatsAppInvite(currentList.id, currentList.name);
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
            } else {
                Alert.alert(
                    t('lists.inviteFallbackTitle'),
                    t('lists.inviteFallbackBody', {code: currentList.inviteCode})
                );
            }
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('lists.inviteShareError'));
        }
    };

    return <View style={styles.container}>
        <ScrollView
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
            }
        >
            <View style={styles.header}>
                <Text style={styles.listName}>{currentList.name}</Text>
                {isAdmin && <TouchableOpacity onPress={handleShareInvite} style={styles.inviteButton}>
                    <Ionicons name="share-outline" size={24} color={colors.accent}/>
                </TouchableOpacity>}
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>{t('lists.summaryTitle')}</Text>
                    <View style={styles.filterRow}>
                        {(['7', '30', '90', 'all'] as SummaryFilter[]).map(filter => <TouchableOpacity
                            key={filter}
                            style={[styles.filterChip, summaryRange === filter && styles.filterChipActive]}
                            onPress={() => setSummaryRange(filter)}
                        >
                            <Text
                                style={[styles.filterChipText, summaryRange === filter && styles.filterChipTextActive]}
                            >
                                {filter === 'all' ? t('lists.filterAll') : filter === '7' ? t('lists.filter7') : filter === '30' ? t('lists.filter30') : t('lists.filter90')}
                            </Text>
                        </TouchableOpacity>)}
                    </View>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('lists.totalSpent')}</Text>
                    <Text style={styles.totalValue}>{currency} {totalAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.chartContainer}>
                    {perMemberBreakdown.length === 0 ? <Text
                        style={styles.chartEmpty}>{t('lists.chartEmpty')}</Text> : perMemberBreakdown.map(item => {
                        const memberLabel = getMemberLabel(item.member);
                        return <View key={item.memberId} style={styles.chartRow}>
                            <Text style={styles.chartLabel}>{memberLabel}</Text>
                            <View style={styles.chartBarWrapper}>
                                <View
                                    style={[
                                        styles.chartBar,
                                        {width: `${Math.max((item.amount / chartMax) * 100, 5)}%`},
                                    ]}
                                />
                            </View>
                            <Text style={styles.chartValue}>{currency} {item.amount.toFixed(2)}</Text>
                        </View>;
                    })}
                </View>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
                    onPress={() => setActiveTab('expenses')}
                >
                    <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
                        {t('lists.expensesTab', {count: expenses.length})}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'members' && styles.activeTab]}
                    onPress={() => setActiveTab('members')}
                >
                    <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
                        {t('lists.membersTab', {count: members.length})}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'expenses' ? <>
                    {expenses.length === 0 ? <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>💸</Text>
                        <Text style={styles.emptyText}>{t('lists.emptyExpenses')}</Text>
                        <Button title={t('lists.addExpense')} onPress={handleAddExpense}/>
                    </View> : expenses.map(renderExpense)}
                </> : <>
                    {members.length === 0 ? <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyText}>{t('lists.emptyMembers')}</Text>
                        {isAdmin && <Button title={t('lists.addMember')} onPress={handleAddMember}/>}
                    </View> : <>
                        <View style={styles.statusLegendCard}>
                            <Text style={styles.statusLegendTitle}>{t('members.statusLegendTitle')}</Text>
                            <View style={styles.statusLegendRow}>
                                <View style={styles.statusLegendItem}>
                                    <View style={[styles.statusDot, styles.activeStatus]}/>
                                    <View style={styles.statusLegendCopy}>
                                        <Text
                                            style={styles.legendLabel}>{t('members.statusActiveShort')}</Text>
                                        <Text
                                            style={styles.legendDescription}>{t('members.statusLegendActive')}</Text>
                                    </View>
                                </View>
                                <View style={styles.statusLegendItem}>
                                    <View style={[styles.statusDot, styles.pendingStatus]}/>
                                    <View style={styles.statusLegendCopy}>
                                        <Text
                                            style={styles.legendLabel}>{t('members.statusPendingShort')}</Text>
                                        <Text
                                            style={styles.legendDescription}>{t('members.statusLegendPending')}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        {!isAdmin && <Text style={styles.membersReadOnly}>{t('members.readOnlyNotice')}</Text>}
                        {members.map(renderMember)}
                    </>}
                </>}
            </View>
        </ScrollView>

        {activeTab === 'expenses' && <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
            <Ionicons name="add" size={32} color={colors.accentText}/>
        </TouchableOpacity>}

        {activeTab === 'members' && isAdmin && <TouchableOpacity style={styles.fab} onPress={handleAddMember}>
            <Ionicons name="person-add" size={24} color={colors.accentText}/>
        </TouchableOpacity>}
    </View>;
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
        },
        listName: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
        },
        inviteButton: {
            padding: 8,
            borderRadius: 12,
            backgroundColor: colors.accentSoft,
        },
        summaryCard: {
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.surface,
            gap: 12,
        },
        summaryHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        summaryTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
        },
        filterRow: {
            flexDirection: 'row',
            gap: 8,
        },
        filterChip: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: colors.surfaceSecondary,
        },
        filterChipActive: {
            backgroundColor: colors.accent,
        },
        filterChipText: {
            color: colors.secondaryText,
            fontSize: 12,
            fontWeight: '600',
        },
        filterChipTextActive: {
            color: colors.accentText,
        },
        totalRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        totalLabel: {
            fontSize: 16,
            color: colors.secondaryText,
        },
        totalValue: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
        },
        chartContainer: {
            gap: 12,
        },
        chartEmpty: {
            textAlign: 'center',
            color: colors.secondaryText,
            fontSize: 14,
        },
        chartRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        chartLabel: {
            flex: 1,
            fontSize: 14,
            color: colors.text,
        },
        chartBarWrapper: {
            flex: 2,
            height: 10,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 8,
            overflow: 'hidden',
        },
        chartBar: {
            height: '100%',
            backgroundColor: colors.success,
            borderRadius: 8,
        },
        chartValue: {
            width: 90,
            textAlign: 'right',
            fontSize: 12,
            color: colors.text,
        },
        tabs: {
            flexDirection: 'row',
            marginHorizontal: 16,
            marginBottom: 12,
            borderRadius: 12,
            backgroundColor: colors.surfaceSecondary,
        },
        tab: {
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderRadius: 12,
        },
        activeTab: {
            backgroundColor: colors.surface,
        },
        tabText: {
            fontSize: 14,
            color: colors.secondaryText,
            fontWeight: '600',
        },
        activeTabText: {
            color: colors.accent,
        },
        content: {
            padding: 16,
            gap: 12,
        },
        empty: {
            alignItems: 'center',
            padding: 24,
            gap: 12,
        },
        emptyIcon: {
            fontSize: 32,
        },
        emptyText: {
            fontSize: 16,
            color: colors.secondaryText,
            textAlign: 'center',
        },
        expenseCard: {
            marginHorizontal: 0,
        },
        expenseSwipeWrapper: {
            marginHorizontal: 16,
        },
        pendingExpenseCard: {
            backgroundColor: colors.pendingSurface,
        },
        expenseItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
        },
        expenseInfo: {
            flex: 1,
            gap: 4,
        },
        expenseTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        expenseMeta: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        expenseTags: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 6,
        },
        expenseTag: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: colors.surfaceSecondary,
        },
        expenseTagText: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        expensePayer: {
            fontSize: 12,
            color: colors.success,
            fontWeight: '600',
        },
        expenseRight: {
            alignItems: 'flex-end',
            gap: 8,
        },
        expenseAmount: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
        },
        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
        },
        statusdraft: {
            backgroundColor: colors.surfaceSecondary,
        },
        statussubmitted: {
            backgroundColor: colors.pendingSurface,
        },
        statusvalidated: {
            backgroundColor: colors.successBackground,
        },
        statusrejected: {
            backgroundColor: colors.dangerBackground,
        },
        statusText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.text,
        },
        pendingStatusText: {
            fontSize: 12,
            color: colors.secondaryText,
            textAlign: 'right',
        },
        memberCard: {
            marginHorizontal: 0,
        },
        memberItem: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
        },
        memberInfo: {
            flex: 1,
        },
        memberEmail: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        memberBadges: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 4,
        },
        statusLegendCard: {
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.surfaceSecondary,
            marginBottom: 12,
            marginHorizontal: 16,
            gap: 12,
        },
        statusLegendTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
        },
        statusLegendRow: {
            gap: 10,
        },
        statusLegendItem: {
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
        },
        statusLegendCopy: {
            flex: 1,
        },
        legendLabel: {
            fontWeight: '600',
            color: colors.text,
        },
        legendDescription: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        membersReadOnly: {
            fontSize: 12,
            color: colors.warning,
            marginBottom: 8,
            marginHorizontal: 16,
        },
        memberSplit: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        validatorBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: colors.successBackground,
            borderRadius: 12,
        },
        validatorText: {
            fontSize: 12,
            color: colors.success,
        },
        memberActions: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
        },
        memberStatusBlock: {
            alignItems: 'flex-end',
        },
        memberStatusWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        memberStatusText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.secondaryText,
        },
        memberActionButton: {
            padding: 4,
            borderRadius: 8,
            backgroundColor: colors.surfaceSecondary,
        },
        statusDot: {
            width: 12,
            height: 12,
            borderRadius: 6,
        },
        activeStatus: {
            backgroundColor: colors.success,
        },
        pendingStatus: {
            backgroundColor: colors.warning,
        },
        fab: {
            position: 'absolute',
            right: 16,
            bottom: 16,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 4,
            shadowColor: colors.shadow,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        deleteAction: {
            width: 90,
            marginVertical: 8,
            backgroundColor: colors.danger,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            flexDirection: 'column',
            gap: 4,
        },
        editAction: {
            width: 90,
            marginVertical: 8,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            flexDirection: 'column',
            gap: 4,
        },
        deleteActionText: {
            color: colors.accentText,
            fontSize: 12,
            fontWeight: '600',
        },
        editActionText: {
            color: colors.accentText,
            fontSize: 12,
            fontWeight: '600',
        },
    });
