import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {Button, Card, Input, Loading} from '@/components';
import {useExpensesStore} from '@/store/expenses.store';
import {useListsStore} from '@/store/lists.store';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';
import {Expense} from '@/types';

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
    const [rangeSummary, setRangeSummary] = useState<{fromDate?: Date; toDate?: Date; daySpan?: number}>({});

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

    const loadExpenses = useCallback(async (target: Timeframe, custom?: DateRangeInput | null) => {
        const range = resolveRange(target, custom || undefined);
        await fetchUserExpenses(range.fromIso, range.toIso);
        setRangeSummary({fromDate: range.fromDate, toDate: range.toDate, daySpan: range.daySpan});
    }, [fetchUserExpenses]);

    useEffect(() => {
        if (lists.length === 0) {
            fetchLists();
        }
    }, [lists.length, fetchLists]);

    useEffect(() => {
        if (timeframe !== 'custom') {
            loadExpenses(timeframe).catch(() => undefined);
        } else if (!appliedCustomRange) {
            setRangeSummary({});
        }
    }, [timeframe, loadExpenses, appliedCustomRange]);

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
        if (timeframe === 'custom' && !appliedCustomRange) {
            return;
        }
        await loadExpenses(timeframe, timeframe === 'custom' ? appliedCustomRange : undefined);
    };

    const isInitialLoading = userExpensesLoading && userExpenses.length === 0;

    const totalSpent = useMemo(() => userExpenses.reduce((sum, expense) => sum + expense.amount, 0), [userExpenses]);

    const averageDaily = useMemo(() => {
        const days = rangeSummary.daySpan;
        if (days && days > 0) {
            return totalSpent / days;
        }
        if (userExpenses.length === 0) return 0;
        const timestamps = userExpenses.map((expense) => new Date(expense.expenseDate).getTime());
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        const diffDays = Math.max(1, Math.round((max - min) / MS_PER_DAY) + 1);
        return totalSpent / diffDays;
    }, [totalSpent, userExpenses, rangeSummary.daySpan]);

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

    const payerBreakdown = useMemo(() => groupBy(userExpenses, (expense) => (
        expense.paidByMember?.displayName
        || expense.paidByMember?.user?.fullName
        || expense.paidByMember?.email
        || expense.author?.fullName
        || t('members.unknown')
    )), [userExpenses, groupBy, t]);

    const listBreakdown = useMemo(() => groupBy(userExpenses, (expense) => (
        listMap.get(expense.listId) || t('lists.details')
    )), [userExpenses, groupBy, listMap, t]);

    const chartMax = Math.max(
        payerBreakdown[0]?.amount ?? 0,
        listBreakdown[0]?.amount ?? 0,
        1,
    );

    const dailyTotals = useMemo(() => {
        const map = new Map<string, number>();
        userExpenses.forEach((expense) => {
            const dateKey = new Date(expense.expenseDate).toLocaleDateString();
            map.set(dateKey, (map.get(dateKey) ?? 0) + expense.amount);
        });
        return map;
    }, [userExpenses]);

    const topDay = useMemo(() => {
        let best: {date: string; amount: number} | null = null;
        dailyTotals.forEach((amount, date) => {
            if (!best || amount > best.amount) {
                best = {date, amount};
            }
        });
        return best;
    }, [dailyTotals]);

    const currency = userExpenses[0]?.currency || 'EUR';

    if (isInitialLoading) {
        return <Loading/>;
    }

    const renderBreakdown = (title: string, data: {label: string; amount: number}[]) => (
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
                                style={[styles.chartBar, {width: `${Math.max((item.amount / chartMax) * 100, 5)}%`} ]}
                            />
                        </View>
                    </View>
                ))
            )}
        </Card>
    );

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
            {renderBreakdown(t('analytics.byList'), listBreakdown)}
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
        filterChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: colors.surfaceSecondary,
        },
        filterChipActive: {
            backgroundColor: colors.accent,
        },
        filterChipText: {
            fontWeight: '600',
            color: colors.secondaryText,
        },
        filterChipTextActive: {
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
    });
