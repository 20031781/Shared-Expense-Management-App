import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {Button, Card, Input, Loading} from '@/components';
import {useExpensesStore} from '@/store/expenses.store';
import {useListsStore} from '@/store/lists.store';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';
import {Expense, ListMember} from '@/types';
import expensesService from '@/services/expenses.service';
import listsService from '@/services/lists.service';

const TIMEFRAME_OPTIONS = ['7', '30', '90', 'all', 'custom'] as const;
type Timeframe = typeof TIMEFRAME_OPTIONS[number];
type DateRangeInput = {from?: string; to?: string};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const parseDateInput = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return undefined;
    const date = new Date(Date.UTC(year, month - 1, day));
    return isNaN(date.getTime()) ? undefined : date;
};

const resolveRange = (range: Timeframe, custom?: DateRangeInput) => {
    if (range === 'custom') {
        const fromDate = parseDateInput(custom?.from);
        const toDate = parseDateInput(custom?.to);
        if (toDate) {
            toDate.setUTCHours(23, 59, 59, 999);
        }
        return {
            fromIso: fromDate ? fromDate.toISOString() : undefined,
            toIso: toDate ? toDate.toISOString() : undefined,
            fromDate,
            toDate,
            daySpan: fromDate && toDate ? Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / MS_PER_DAY)) : undefined,
        };
    }

    if (range === 'all') {
        return {
            fromIso: undefined,
            toIso: undefined,
            fromDate: undefined,
            toDate: undefined,
            daySpan: undefined,
        };
    }

    const days = parseInt(range, 10);
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - (days - 1));

    return {
        fromIso: fromDate.toISOString(),
        toIso: toDate.toISOString(),
        fromDate,
        toDate,
        daySpan: days,
    };
};

type ResolvedRange = ReturnType<typeof resolveRange>;
const DEFAULT_RANGE: ResolvedRange = resolveRange('30');
const ALL_LISTS_OPTION = '__all__';

export const AnalyticsScreen: React.FC = () => {
    const {t} = useTranslation();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {fetchUserExpenses, userExpenses, userExpensesLoading} = useExpensesStore();
    const {lists, fetchLists} = useListsStore();

    const [timeframe, setTimeframe] = useState<Timeframe>('30');
    const [customRange, setCustomRange] = useState<DateRangeInput>({from: '', to: ''});
    const [appliedCustomRange, setAppliedCustomRange] = useState<DateRangeInput | null>(null);
    const [customError, setCustomError] = useState<string | null>(null);
    const [rangeSummary, setRangeSummary] = useState<{fromDate?: Date; toDate?: Date; daySpan?: number}>({
        fromDate: DEFAULT_RANGE.fromDate,
        toDate: DEFAULT_RANGE.toDate,
        daySpan: DEFAULT_RANGE.daySpan,
    });
    const [currentRange, setCurrentRange] = useState<ResolvedRange>(DEFAULT_RANGE);
    const [selectedListId, setSelectedListId] = useState<string>(ALL_LISTS_OPTION);
    const [listInsights, setListInsights] = useState<{expenses: Expense[]; members: ListMember[]}>({
        expenses: [],
        members: [],
    });
    const [listInsightsLoading, setListInsightsLoading] = useState(false);
    const [listInsightsError, setListInsightsError] = useState<string | null>(null);

    useEffect(() => {
        if (customError) {
            setCustomError(null);
        }
    }, [customRange.from, customRange.to, customError]);

    const chipLabels = useMemo<Record<Timeframe, string>>(() => ({
        '7': t('lists.filter7'),
        '30': t('lists.filter30'),
        '90': t('lists.filter90'),
        'all': t('lists.filterAll'),
        'custom': t('analytics.filterCustom'),
    }), [t]);

    const listOptions = useMemo(() => [
        {id: ALL_LISTS_OPTION, name: t('analytics.listPickerAll')},
        ...lists.map((list) => ({id: list.id, name: list.name})),
    ], [lists, t]);

    const selectedList = useMemo(() => (
        lists.find((list) => list.id === selectedListId)
    ), [lists, selectedListId]);

    const loadExpenses = useCallback(async (target: Timeframe, custom?: DateRangeInput | null): Promise<ResolvedRange> => {
        const range = resolveRange(target, custom || undefined);
        setCurrentRange(range);
        await fetchUserExpenses(range.fromIso, range.toIso);
        setRangeSummary({fromDate: range.fromDate, toDate: range.toDate, daySpan: range.daySpan});
        return range;
    }, [fetchUserExpenses]);

    useEffect(() => {
        if (lists.length === 0) {
            fetchLists();
        }
    }, [lists.length, fetchLists]);

    useEffect(() => {
        if (selectedListId !== ALL_LISTS_OPTION && !lists.some((list) => list.id === selectedListId)) {
            setSelectedListId(ALL_LISTS_OPTION);
        }
    }, [lists, selectedListId]);

    useEffect(() => {
        if (timeframe !== 'custom') {
            loadExpenses(timeframe).catch(() => undefined);
        } else if (!appliedCustomRange) {
            setRangeSummary({});
        }
    }, [timeframe, loadExpenses, appliedCustomRange]);

    const isCustomRangeMissing = timeframe === 'custom' && !appliedCustomRange;

    const fetchListInsights = useCallback(async (listId: string, range: ResolvedRange) => {
        setListInsightsLoading(true);
        setListInsightsError(null);
        try {
            const [membersData, expensesData] = await Promise.all([
                listsService.getListMembers(listId),
                expensesService.getListExpenses(listId, range.fromIso, range.toIso),
            ]);
            setListInsights({members: membersData, expenses: expensesData});
        } catch (error: any) {
            setListInsightsError(error?.message || t('common.genericError'));
        } finally {
            setListInsightsLoading(false);
        }
    }, [t]);

    const shouldLoadInsights = selectedListId !== ALL_LISTS_OPTION && !isCustomRangeMissing;

    useEffect(() => {
        if (selectedListId === ALL_LISTS_OPTION || !shouldLoadInsights) {
            if (selectedListId === ALL_LISTS_OPTION || isCustomRangeMissing) {
                setListInsights({expenses: [], members: []});
                setListInsightsError(null);
                setListInsightsLoading(false);
            }
            return;
        }
        fetchListInsights(selectedListId, currentRange).catch(() => undefined);
    }, [selectedListId, shouldLoadInsights, currentRange, fetchListInsights, isCustomRangeMissing]);

    const handleApplyCustom = async () => {
        const trimmedFrom = customRange.from?.trim();
        const trimmedTo = customRange.to?.trim();
        const fromDate = parseDateInput(trimmedFrom);
        const toDate = parseDateInput(trimmedTo);
        if (!fromDate || !toDate || fromDate > toDate) {
            setCustomError(t('analytics.customError'));
            return;
        }
        setCustomError(null);
        await loadExpenses('custom', {from: trimmedFrom, to: trimmedTo});
        setAppliedCustomRange({from: trimmedFrom, to: trimmedTo});
    };

    const handleRefresh = async () => {
        if (isCustomRangeMissing) {
            return;
        }
        const range = await loadExpenses(timeframe, timeframe === 'custom' ? appliedCustomRange : undefined);
        if (selectedListId !== ALL_LISTS_OPTION) {
            await fetchListInsights(selectedListId, range);
        }
    };

    const handleRetryListInsights = () => {
        if (selectedListId === ALL_LISTS_OPTION || isCustomRangeMissing) {
            return;
        }
        fetchListInsights(selectedListId, currentRange).catch(() => undefined);
    };

    const visibleExpenses = useMemo(() => (
        selectedListId === ALL_LISTS_OPTION ? userExpenses : listInsights.expenses
    ), [selectedListId, userExpenses, listInsights.expenses]);

    const memberMap = useMemo(() => {
        const map = new Map<string, ListMember>();
        listInsights.members.forEach((member) => map.set(member.id, member));
        return map;
    }, [listInsights.members]);

    const getMemberLabel = useCallback((member?: ListMember) => {
        if (!member) return t('members.unknown');
        return (member.displayName && member.displayName.trim())
            || member.user?.fullName
            || member.email
            || t('members.unknown');
    }, [t]);

    const isInitialLoading = (
        selectedListId === ALL_LISTS_OPTION ? userExpensesLoading : listInsightsLoading
    ) && visibleExpenses.length === 0;

    const totalSpent = useMemo(() => visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0), [visibleExpenses]);

    const averageDaily = useMemo(() => {
        const days = rangeSummary.daySpan;
        if (days && days > 0) {
            return totalSpent / days;
        }
        if (visibleExpenses.length === 0) return 0;
        const timestamps = visibleExpenses.map((expense) => new Date(expense.expenseDate).getTime());
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        const diffDays = Math.max(1, Math.round((max - min) / MS_PER_DAY) + 1);
        return totalSpent / diffDays;
    }, [totalSpent, visibleExpenses, rangeSummary.daySpan]);

    const listMap = useMemo(() => {
        const map = new Map<string, string>();
        lists.forEach((list) => map.set(list.id, list.name));
        return map;
    }, [lists]);

    const groupBy = useCallback((items: Expense[], keyGetter: (item: Expense) => string) => {
        const map = new Map<string, number>();
        items.forEach((expense) => {
            const key = keyGetter(expense);
            if (!key) return;
            map.set(key, (map.get(key) ?? 0) + expense.amount);
        });
        return Array.from(map.entries()).map(([label, amount]) => ({label, amount})).sort((a, b) => b.amount - a.amount);
    }, []);

    const payerBreakdown = useMemo(() => groupBy(visibleExpenses, (expense) => (
        expense.paidByMember?.displayName
        || expense.paidByMember?.user?.fullName
        || expense.paidByMember?.email
        || expense.author?.fullName
        || t('members.unknown')
    )), [visibleExpenses, groupBy, t]);

    const listBreakdown = useMemo(() => groupBy(userExpenses, (expense) => (
        listMap.get(expense.listId) || t('lists.details')
    )), [userExpenses, groupBy, listMap, t]);

    const memberBreakdown = useMemo(() => {
        if (selectedListId === ALL_LISTS_OPTION) return [];
        const accumulator = new Map<string, number>();
        listInsights.expenses.forEach((expense) => {
            if (!expense.paidByMemberId) return;
            accumulator.set(expense.paidByMemberId, (accumulator.get(expense.paidByMemberId) ?? 0) + expense.amount);
        });
        return Array.from(accumulator.entries()).map(([memberId, amount]) => ({memberId, amount}))
            .sort((a, b) => b.amount - a.amount);
    }, [selectedListId, listInsights.expenses]);

    const memberChartMax = memberBreakdown.reduce((max, item) => Math.max(max, item.amount), 0) || 1;

    const listTotalAmount = useMemo(() => listInsights.expenses.reduce((sum, expense) => sum + expense.amount, 0), [listInsights.expenses]);

    const splitSummary = useMemo(() => {
        if (selectedListId === ALL_LISTS_OPTION) {
            return {rows: [], settlements: [], reason: 'no-expenses' as const};
        }
        if (listInsights.expenses.length === 0 || listTotalAmount <= 0) {
            return {rows: [], settlements: [], reason: 'no-expenses' as const};
        }
        const membersWithSplit = listInsights.members.filter((member) => (member.splitPercentage ?? 0) > 0);
        if (membersWithSplit.length === 0) {
            return {rows: [], settlements: [], reason: 'no-members' as const};
        }
        const totalSplit = membersWithSplit.reduce((sum, member) => sum + (member.splitPercentage ?? 0), 0);
        if (totalSplit <= 0) {
            return {rows: [], settlements: [], reason: 'no-split' as const};
        }
        const paidMap = new Map<string, number>();
        listInsights.expenses.forEach((expense) => {
            if (!expense.paidByMemberId) return;
            paidMap.set(expense.paidByMemberId, (paidMap.get(expense.paidByMemberId) ?? 0) + expense.amount);
        });
        const rows = membersWithSplit.map((member) => {
            const percentage = member.splitPercentage ?? 0;
            const share = listTotalAmount * (percentage / totalSplit);
            const paid = paidMap.get(member.id) ?? 0;
            const net = paid - share;
            return {member, share, paid, net, percentage};
        }).sort((a, b) => b.net - a.net);

        const creditors = rows.filter((row) => row.net > 0).map((row) => ({member: row.member, amount: row.net}));
        const debtors = rows.filter((row) => row.net < 0).map((row) => ({member: row.member, amount: Math.abs(row.net)}));
        const settlements: {from: ListMember; to: ListMember; amount: number}[] = [];
        let creditorIndex = 0;
        let debtorIndex = 0;
        while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
            const creditor = creditors[creditorIndex];
            const debtor = debtors[debtorIndex];
            const amount = Math.min(creditor.amount, debtor.amount);
            settlements.push({from: debtor.member, to: creditor.member, amount});
            creditor.amount -= amount;
            debtor.amount -= amount;
            if (creditor.amount < 0.01) creditorIndex++;
            if (debtor.amount < 0.01) debtorIndex++;
        }

        return {rows, settlements, reason: null as const};
    }, [selectedListId, listInsights.expenses, listInsights.members, listTotalAmount]);

    const dailyTotals = useMemo(() => {
        const map = new Map<string, number>();
        visibleExpenses.forEach((expense) => {
            const dateKey = new Date(expense.expenseDate).toLocaleDateString();
            map.set(dateKey, (map.get(dateKey) ?? 0) + expense.amount);
        });
        return map;
    }, [visibleExpenses]);

    const topDay = useMemo(() => {
        let best: {date: string; amount: number} | null = null;
        dailyTotals.forEach((amount, date) => {
            if (!best || amount > best.amount) {
                best = {date, amount};
            }
        });
        return best;
    }, [dailyTotals]);

    const currency = visibleExpenses[0]?.currency || 'EUR';

    if (isInitialLoading) {
        return <Loading/>;
    }

    const renderBreakdown = (title: string, data: {label: string; amount: number}[]) => {
        const localMax = data.reduce((max, item) => Math.max(max, item.amount), 0) || 1;
        return (
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {data.length === 0 ? (
                    <Text style={styles.emptyText}>{t('analytics.empty')}</Text>
                ) : (
                    data.map((item, index) => (
                        <View key={`${title}-${item.label}-${index}`} style={styles.chartRow}>
                            <View style={styles.chartLabelWrapper}>
                                <Text style={styles.chartLabel}>{item.label}</Text>
                                <Text style={styles.chartValue}>{currency} {item.amount.toFixed(2)}</Text>
                            </View>
                            <View style={styles.chartBarWrapper}>
                                <View
                                    style={[styles.chartBar, {width: `${Math.max((item.amount / localMax) * 100, 5)}%`} ]}
                                />
                            </View>
                        </View>
                    ))
                )}
            </Card>
        );
    };

    const renderRangeLabel = () => {
        if (!rangeSummary.fromDate && !rangeSummary.toDate) {
            return t('analytics.rangeAll');
        }
        const from = rangeSummary.fromDate?.toLocaleDateString();
        const to = rangeSummary.toDate?.toLocaleDateString();
        if (from && to) {
            return t('analytics.rangeBetween', {from, to});
        }
        return from || to || t('analytics.rangeAll');
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={(
                <RefreshControl refreshing={userExpensesLoading && userExpenses.length > 0} onRefresh={handleRefresh}/>
            )}
        >
            <View style={styles.header}>
                <Text style={styles.title}>{t('analytics.title')}</Text>
                <Text style={styles.subtitle}>{t('analytics.subtitle')}</Text>
            </View>

            <View style={styles.filters}>
                {TIMEFRAME_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[styles.filterChip, timeframe === option && styles.filterChipActive]}
                        onPress={() => setTimeframe(option)}
                    >
                        <Text style={[styles.filterChipText, timeframe === option && styles.filterChipTextActive]}>
                            {chipLabels[option]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {timeframe === 'custom' && (
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('analytics.customTitle')}</Text>
                    <Input
                        label={t('analytics.customFrom')}
                        placeholder="YYYY-MM-DD"
                        value={customRange.from}
                        onChangeText={(text) => setCustomRange((prev) => ({...prev, from: text}))}
                        autoCapitalize="none"
                        keyboardType="numbers-and-punctuation"
                    />
                    <Input
                        label={t('analytics.customTo')}
                        placeholder="YYYY-MM-DD"
                        value={customRange.to}
                        onChangeText={(text) => setCustomRange((prev) => ({...prev, to: text}))}
                        autoCapitalize="none"
                        keyboardType="numbers-and-punctuation"
                    />
                    {customError && <Text style={styles.error}>{customError}</Text>}
                    <Button
                        title={t('analytics.customApply')}
                        onPress={handleApplyCustom}
                        style={styles.customButton}
                        disabled={!customRange.from || !customRange.to}
                    />
                </Card>
            )}

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>{t('analytics.listPickerLabel')}</Text>
                <View style={styles.listPickerChips}>
                    {listOptions.map((option) => {
                        const isActive = option.id === selectedListId;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.listChip, isActive && styles.listChipActive]}
                                onPress={() => setSelectedListId(option.id)}
                            >
                                <Text style={[styles.listChipText, isActive && styles.listChipTextActive]}>
                                    {option.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <Text style={styles.listPickerHint}>
                    {selectedListId === ALL_LISTS_OPTION
                        ? t('analytics.listPickerHelper')
                        : t('analytics.listPickerSelected', {name: selectedList?.name || t('analytics.listPickerFallback')})}
                </Text>
            </Card>

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>{t('analytics.summaryTitle')}</Text>
                <Text style={styles.rangeLabel}>{renderRangeLabel()}</Text>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{t('analytics.total')}</Text>
                        <Text style={styles.summaryValue}>{currency} {totalSpent.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{t('analytics.averageDaily')}</Text>
                        <Text style={styles.summaryValue}>{currency} {averageDaily.toFixed(2)}</Text>
                    </View>
                </View>
                {topDay && (
                    <Text style={styles.topDay}>{t('analytics.topDay', {date: topDay.date, amount: `${currency} ${topDay.amount.toFixed(2)}`})}</Text>
                )}
            </Card>

            {renderBreakdown(t('analytics.byPayer'), payerBreakdown)}
            {selectedListId === ALL_LISTS_OPTION && renderBreakdown(t('analytics.byList'), listBreakdown)}

            {selectedListId === ALL_LISTS_OPTION && (
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('analytics.listInsightsPlaceholderTitle')}</Text>
                    <Text style={styles.emptyText}>{t('analytics.listPickerHelper')}</Text>
                </Card>
            )}

            {selectedListId !== ALL_LISTS_OPTION && (
                <>
                    {isCustomRangeMissing && (
                        <Card style={styles.card}>
                            <Text style={styles.sectionTitle}>{selectedList?.name || t('analytics.listPickerFallback')}</Text>
                            <Text style={styles.emptyText}>{t('analytics.listPickerApplyCustom')}</Text>
                        </Card>
                    )}

                    {!isCustomRangeMissing && listInsightsLoading && (
                        <Card style={styles.card}>
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color={colors.accent}/>
                                <Text style={styles.loadingText}>{t('analytics.listInsightsLoading')}</Text>
                            </View>
                        </Card>
                    )}

                    {!isCustomRangeMissing && !listInsightsLoading && listInsightsError && (
                        <Card style={styles.card}>
                            <Text style={styles.error}>{listInsightsError}</Text>
                            <Button
                                title={t('common.retry')}
                                onPress={handleRetryListInsights}
                                style={styles.retryButton}
                            />
                        </Card>
                    )}

                    {!isCustomRangeMissing && !listInsightsLoading && !listInsightsError && (
                        <>
                            <Card style={styles.card}>
                                <Text style={styles.sectionTitle}>{t('analytics.memberBreakdownTitle')}</Text>
                                {memberBreakdown.length === 0 ? (
                                    <Text style={styles.emptyText}>{t('analytics.memberChartEmpty')}</Text>
                                ) : (
                                    memberBreakdown.map((item) => (
                                        <View key={item.memberId} style={styles.chartRow}>
                                            <View style={styles.chartLabelWrapper}>
                                                <Text style={styles.chartLabel}>{getMemberLabel(memberMap.get(item.memberId))}</Text>
                                                <Text style={styles.chartValue}>{currency} {item.amount.toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.chartBarWrapper}>
                                                <View
                                                    style={[styles.chartBar, {width: `${Math.max((item.amount / memberChartMax) * 100, 5)}%`} ]}
                                                />
                                            </View>
                                        </View>
                                    ))
                                )}
                            </Card>

                            <Card style={styles.card}>
                                <Text style={styles.sectionTitle}>{t('lists.splitSectionTitle')}</Text>
                                <Text style={styles.splitHelper}>{t('lists.splitOptimizedHint')}</Text>
                                {splitSummary.reason === 'no-expenses' && (
                                    <Text style={styles.emptyText}>{t('lists.splitSectionEmpty')}</Text>
                                )}
                                {splitSummary.reason === 'no-members' && (
                                    <Text style={styles.emptyText}>{t('lists.splitSectionNeedMembers')}</Text>
                                )}
                                {splitSummary.reason === 'no-split' && (
                                    <Text style={styles.emptyText}>{t('lists.splitSectionNeedPercentages')}</Text>
                                )}
                                {splitSummary.reason === null && (
                                    <>
                                        {splitSummary.rows.map((row) => (
                                            <View key={row.member.id} style={styles.splitRow}>
                                                <View style={styles.splitMemberInfo}>
                                                    <Text style={styles.splitMemberName}>{getMemberLabel(row.member)}</Text>
                                                    <Text style={styles.splitMemberShare}>{t('lists.splitShareLabel', {value: row.percentage})}</Text>
                                                </View>
                                                <View style={styles.splitAmountBlock}>
                                                    <Text
                                                        style={[styles.splitAmount, row.net < 0 ? styles.splitOwes : styles.splitReceives]}
                                                    >
                                                        {currency} {Math.abs(row.net).toFixed(2)}
                                                    </Text>
                                                    <Text style={styles.splitHint}>
                                                        {row.net < 0 ? t('lists.splitNetGive') : t('lists.splitNetReceive')}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                        <View style={styles.settlementsWrapper}>
                                            <Text style={styles.settlementsTitle}>{t('lists.splitSettlementsTitle')}</Text>
                                            {splitSummary.settlements.length === 0 ? (
                                                <Text style={styles.emptyText}>{t('lists.splitSettlementsEmpty')}</Text>
                                            ) : (
                                                splitSummary.settlements.map((settlement, index) => (
                                                    <Text
                                                        key={`${settlement.from.id}-${settlement.to.id}-${index}`}
                                                        style={styles.settlementText}
                                                    >
                                                        {t('lists.splitSettlement', {
                                                            from: getMemberLabel(settlement.from),
                                                            to: getMemberLabel(settlement.to),
                                                            amount: `${currency} ${settlement.amount.toFixed(2)}`,
                                                        })}
                                                    </Text>
                                                ))
                                            )}
                                        </View>
                                    </>
                                )}
                            </Card>
                        </>
                    )}
                </>
            )}
        </ScrollView>
    );
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            padding: 16,
            gap: 16,
        },
        header: {
            gap: 4,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
        },
        subtitle: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        filters: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 16,
        },
        listPickerChips: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        filterChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: colors.surfaceSecondary,
        },
        filterChipActive: {
            backgroundColor: colors.accent,
        },
        listChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: colors.surfaceSecondary,
        },
        listChipActive: {
            backgroundColor: colors.accent,
        },
        filterChipText: {
            fontWeight: '600',
            color: colors.secondaryText,
        },
        filterChipTextActive: {
            color: colors.accentText,
        },
        listChipText: {
            fontWeight: '600',
            color: colors.secondaryText,
        },
        listChipTextActive: {
            color: colors.accentText,
        },
        card: {
            marginHorizontal: 0,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            marginBottom: 12,
            color: colors.text,
        },
        emptyText: {
            color: colors.secondaryText,
        },
        chartRow: {
            marginBottom: 16,
            gap: 6,
        },
        chartLabelWrapper: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        chartLabel: {
            fontSize: 14,
            color: colors.text,
        },
        chartValue: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        chartBarWrapper: {
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.surfaceSecondary,
            overflow: 'hidden',
        },
        chartBar: {
            height: '100%',
            borderRadius: 4,
            backgroundColor: colors.accent,
        },
        summaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 12,
        },
        summaryItem: {
            flex: 1,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.surfaceSecondary,
        },
        summaryLabel: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        summaryValue: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
        },
        rangeLabel: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        listPickerHint: {
            marginTop: 8,
            fontSize: 12,
            color: colors.secondaryText,
        },
        topDay: {
            marginTop: 12,
            fontSize: 14,
            color: colors.secondaryText,
        },
        error: {
            color: colors.danger,
        },
        customButton: {
            marginTop: 8,
        },
        loadingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 8,
        },
        loadingText: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        retryButton: {
            marginTop: 12,
        },
        splitHelper: {
            fontSize: 12,
            color: colors.secondaryText,
            marginBottom: 8,
        },
        splitRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 8,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: colors.surfaceSecondary,
        },
        splitMemberInfo: {
            flex: 1,
            gap: 4,
        },
        splitMemberName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        splitMemberShare: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        splitAmountBlock: {
            alignItems: 'flex-end',
        },
        splitAmount: {
            fontSize: 16,
            fontWeight: '700',
        },
        splitOwes: {
            color: colors.danger,
        },
        splitReceives: {
            color: colors.success,
        },
        splitHint: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        settlementsWrapper: {
            gap: 6,
            marginTop: 8,
        },
        settlementsTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.text,
        },
        settlementText: {
            fontSize: 13,
            color: colors.text,
        },
    });
