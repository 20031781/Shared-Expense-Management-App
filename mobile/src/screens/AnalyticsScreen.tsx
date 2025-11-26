import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions,
} from 'react-native';

import {Button, Card, Input, Loading} from '@/components';
import {useExpensesStore} from '@/store/expenses.store';
import {useListsStore} from '@/store/lists.store';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';
import {Expense, ListMember} from '@/types';
import expensesService from '@/services/expenses.service';
import listsService from '@/services/lists.service';
import {useFocusEffect} from '@react-navigation/native';
import {buildSplitSummary} from '@/lib/split';
import {
    VictoryArea,
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictoryLine,
    VictoryPie,
    VictoryScatter,
    VictoryTheme,
    VictoryTooltip,
    VictoryVoronoiContainer,
} from 'victory-native';
import {getFriendlyErrorMessage} from '@/lib/errors';
import {useSettingsStore, ChartAnimationSpeed} from '@/store/settings.store';

class ChartBoundary extends React.PureComponent<{ fallback: React.ReactNode }, { hasError: boolean }> {
    state = {hasError: false};

    static getDerivedStateFromError(): { hasError: boolean } {
        return {hasError: true};
    }

    componentDidCatch(error: unknown) {
        console.error('[Analytics] chart render failed', error);
    }

    componentDidUpdate(prevProps: Readonly<{ fallback: React.ReactNode }>) {
        if (this.state.hasError && this.props.children !== prevProps.children) {
            // consente un nuovo tentativo di render se i dati cambiano
            this.setState({hasError: false});
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback as React.ReactNode;
        }
        return this.props.children as React.ReactNode;
    }
}

const TIMEFRAME_OPTIONS = ['7', '30', '90', 'all', 'custom'] as const;
type Timeframe = typeof TIMEFRAME_OPTIONS[number];
type DateRangeInput = { from?: string; to?: string };

const CHART_SPEED_DURATION: Record<ChartAnimationSpeed, number> = {
    fast: 600,
    medium: 1100,
    slow: 1700,
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const buildCurrencyTicks = (maxValue: number, maxTicks: number): number[] => {
    const safeMax = Math.max(0, maxValue);
    if (safeMax === 0) {
        return [0, 1];
    }
    const safeMaxTicks = Math.max(2, Math.min(maxTicks, 8));
    const desiredTicks = Math.max(3, safeMaxTicks);
    const baseStep = Math.max(safeMax / Math.max(1, desiredTicks - 1), 0.1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(baseStep)));
    const normalized = baseStep / magnitude;
    let step: number;
    if (normalized >= 5) {
        step = 5 * magnitude;
    } else if (normalized >= 2) {
        step = 2 * magnitude;
    } else {
        step = magnitude;
    }
    const ticks: number[] = [0];
    for (let value = step; value < safeMax * 1.05 && ticks.length < safeMaxTicks; value += step) {
        ticks.push(Number(value.toFixed(2)));
    }
    const roundedMax = Number(safeMax.toFixed(2));
    if (ticks[ticks.length - 1] < roundedMax) {
        ticks.push(roundedMax);
    }
    return ticks.filter((value, index, arr) => {
        if (index === 0) return true;
        const previous = arr[index - 1];
        return Math.abs(value - previous) >= step * 0.6;
    });
};

const parseDateInput = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return undefined;
    const date = new Date(Date.UTC(year, month - 1, day));
    return isNaN(date.getTime()) ? undefined : date;
};

const formatDateInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) {
        return digits;
    }
    if (digits.length <= 6) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
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
    const {width: windowWidth} = useWindowDimensions();
    const chartWidth = useMemo(() => Math.max(320, windowWidth - 48), [windowWidth]);
    const maxCurrencyTicks = useMemo(() => Math.max(3, Math.min(7, Math.floor((chartWidth - 120) / 70))), [chartWidth]);
    const baseTrendTickCount = useMemo(() => Math.max(3, Math.floor(chartWidth / 90)), [chartWidth]);

    const [timeframe, setTimeframe] = useState<Timeframe>('30');
    const [customRange, setCustomRange] = useState<DateRangeInput>({from: '', to: ''});
    const [appliedCustomRange, setAppliedCustomRange] = useState<DateRangeInput | null>(null);
    const [customError, setCustomError] = useState<string | null>(null);
    const [rangeSummary, setRangeSummary] = useState<{ fromDate?: Date; toDate?: Date; daySpan?: number }>({
        fromDate: DEFAULT_RANGE.fromDate,
        toDate: DEFAULT_RANGE.toDate,
        daySpan: DEFAULT_RANGE.daySpan,
    });
    const [currentRange, setCurrentRange] = useState<ResolvedRange>(DEFAULT_RANGE);
    const [selectedListId, setSelectedListId] = useState<string>(ALL_LISTS_OPTION);
    const [isListDropdownVisible, setIsListDropdownVisible] = useState(false);
    const [listInsights, setListInsights] = useState<{ expenses: Expense[]; members: ListMember[] }>({
        expenses: [],
        members: [],
    });
    const [listInsightsLoading, setListInsightsLoading] = useState(false);
    const [listInsightsError, setListInsightsError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [memberChartMode, setMemberChartMode] = useState<'bar' | 'pie' | 'trend'>('bar');
    const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
    const [activeTrendPoint, setActiveTrendPoint] = useState<{ x: number; y: number } | null>(null);
    const chartAnimationSpeed = useSettingsStore(state => state.chartAnimationSpeed);
    const chartFade = useRef(new Animated.Value(1)).current;

    const isValidExpense = useCallback((expense: Expense) => {
        const amount = Number(expense.amount);
        const dateValue = new Date(expense.expenseDate);
        return Number.isFinite(amount) && !Number.isNaN(dateValue.getTime());
    }, []);

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

    const chartModeOptions = useMemo(() => [
        {key: 'bar', label: t('analytics.chartModeBar')},
        {key: 'pie', label: t('analytics.chartModePie')},
        {key: 'trend', label: t('analytics.chartModeTrend')},
    ] as const, [t]);

    const chartAnimationDuration = CHART_SPEED_DURATION[chartAnimationSpeed] ?? CHART_SPEED_DURATION.medium;
    const chartContainerAnimation = useMemo(() => ({
        duration: chartAnimationDuration,
        easing: 'quadInOut',
        onLoad: {duration: chartAnimationDuration},
    }), [chartAnimationDuration]);
    const chartSeriesAnimation = useMemo(() => ({
        duration: chartAnimationDuration,
        easing: 'quadInOut',
    }), [chartAnimationDuration]);

    const barTooltip = useMemo(() => (
        <VictoryTooltip
            flyoutStyle={{fill: colors.surface, stroke: colors.border}}
            style={{fontSize: 12, fill: colors.text}}
            constrainToVisibleArea
            renderInPortal={false}
            activateOnPressIn
            activateOnTouchStart
            activateOnPressOut={false}
            activateOnTouchEnd={false}
            active
        />
    ), [colors]);

    const barEvents = useMemo(() => ([{
        target: 'data',
        eventHandlers: {
            onPressIn: (_evt, props) => {
                const nextIndex = typeof props.index === 'number' ? props.index : null;
                setActiveBarIndex(nextIndex);
            },
            onPressOut: () => {
                setActiveBarIndex(null);
            },
            onTouchStart: (_evt, props) => {
                const nextIndex = typeof props.index === 'number' ? props.index : null;
                setActiveBarIndex(nextIndex);
            },
            onTouchEnd: () => {
                setActiveBarIndex(null);
            },
        },
    }]), []);

    const selectedList = useMemo(() => lists.find(list => list.id === selectedListId), [lists, selectedListId]);

    const handleSelectListId = useCallback((listId: string) => {
        setSelectedListId(current => current === listId ? current : listId);
        setListInsights({expenses: [], members: []});
        setListInsightsError(null);
        setListInsightsLoading(listId !== ALL_LISTS_OPTION);
        setActiveBarIndex(null);
        setActiveTrendPoint(null);
        setIsListDropdownVisible(false);
    }, [setListInsightsError]);

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
        if (selectedListId !== ALL_LISTS_OPTION && !lists.some(list => list.id === selectedListId)) {
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

    useFocusEffect(
        useCallback(() => {
            if (timeframe === 'custom' && !appliedCustomRange) {
                return;
            }
            loadExpenses(timeframe, timeframe === 'custom' ? appliedCustomRange : null).catch(() => undefined);
        }, [timeframe, appliedCustomRange, loadExpenses])
    );

    const isCustomRangeMissing = timeframe === 'custom' && !appliedCustomRange;

    const fetchListInsights = useCallback(async (listId: string, range: ResolvedRange) => {
        setListInsightsLoading(true);
        setListInsightsError(null);
        try {
            const [membersData, expensesData] = await Promise.all([
                listsService.getListMembers(listId),
                expensesService.getListExpenses(listId, range.fromIso, range.toIso),
            ]);
            const normalizedMembers = Array.isArray(membersData) ? membersData : [];
            const normalizedExpenses = Array.isArray(expensesData) ? expensesData : [];
            setListInsights({members: normalizedMembers, expenses: normalizedExpenses});
        } catch (error: any) {
            setListInsightsError(getFriendlyErrorMessage(error, t('common.genericError'), t));
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
        setListInsightsLoading(true);
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

    const handleRefresh = useCallback(async () => {
        if (isCustomRangeMissing) {
            return;
        }
        setIsRefreshing(true);
        try {
            const range = await loadExpenses(timeframe, timeframe === 'custom' ? appliedCustomRange : undefined);
            if (selectedListId !== ALL_LISTS_OPTION) {
                await fetchListInsights(selectedListId, range);
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [isCustomRangeMissing, loadExpenses, timeframe, appliedCustomRange, selectedListId, fetchListInsights]);

    const handleRetryListInsights = () => {
        if (selectedListId === ALL_LISTS_OPTION || isCustomRangeMissing) {
            return;
        }
        fetchListInsights(selectedListId, currentRange).catch(() => undefined);
    };

    const safeUserExpenses = useMemo(() => userExpenses.filter(isValidExpense), [userExpenses, isValidExpense]);
    const safeListExpenses = useMemo(() => listInsights.expenses.filter(isValidExpense), [listInsights.expenses, isValidExpense]);
    const visibleExpenses = useMemo(() => selectedListId === ALL_LISTS_OPTION ? safeUserExpenses : safeListExpenses, [selectedListId, safeUserExpenses, safeListExpenses]);

    const currency = useMemo(() => visibleExpenses[0]?.currency || 'EUR', [visibleExpenses]);

    const memberMap = useMemo(() => {
        const map = new Map<string, ListMember>();
        listInsights.members.forEach(member => map.set(member.id, member));
        return map;
    }, [listInsights.members]);

    const getMemberLabel = useCallback((member?: ListMember) => {
        if (!member) return t('members.unknown');
        return member.displayName && member.displayName.trim()
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
        const timestamps = visibleExpenses.map(expense => new Date(expense.expenseDate).getTime());
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        const diffDays = Math.max(1, Math.round((max - min) / MS_PER_DAY) + 1);
        return totalSpent / diffDays;
    }, [totalSpent, visibleExpenses, rangeSummary.daySpan]);

    const listMap = useMemo(() => {
        const map = new Map<string, string>();
        lists.forEach(list => map.set(list.id, list.name));
        return map;
    }, [lists]);

    const groupBy = useCallback((items: Expense[], keyGetter: (item: Expense) => string) => {
        const map = new Map<string, number>();
        items.forEach(expense => {
            const key = keyGetter(expense);
            if (!key) return;
            map.set(key, (map.get(key) ?? 0) + expense.amount);
        });
        return Array.from(map.entries()).map(([label, amount]) => ({
            label,
            amount
        })).sort((a, b) => b.amount - a.amount);
    }, []);

    const listBreakdown = useMemo(() => groupBy(safeUserExpenses, expense => listMap.get(expense.listId) || t('lists.details')), [safeUserExpenses, groupBy, listMap, t]);

    const memberBreakdown = useMemo(() => {
        if (selectedListId === ALL_LISTS_OPTION) return [];
        const accumulator = new Map<string, number>();
        safeListExpenses.forEach(expense => {
            if (!expense.paidByMemberId) return;
            accumulator.set(expense.paidByMemberId, (accumulator.get(expense.paidByMemberId) ?? 0) + expense.amount);
        });
        return Array.from(accumulator.entries()).map(([memberId, amount]) => ({memberId, amount}))
            .sort((a, b) => b.amount - a.amount);
    }, [selectedListId, safeListExpenses]);

    const memberChartMax = memberBreakdown.reduce((max, item) => Math.max(max, item.amount), 0) || 1;
    const memberAxisTicks = useMemo(() => buildCurrencyTicks(memberChartMax, maxCurrencyTicks), [memberChartMax, maxCurrencyTicks]);
    const totalMemberAmount = useMemo(() => memberBreakdown.reduce((sum, item) => sum + item.amount, 0), [memberBreakdown]);

    const memberChartColors = useMemo(() => [
        colors.accent,
        colors.success,
        colors.warning,
        colors.danger,
        colors.secondaryText,
    ], [colors]);

    const memberChartData = useMemo(() => memberBreakdown.map(item => {
        const label = getMemberLabel(memberMap.get(item.memberId));
        return {
            x: label,
            y: item.amount,
            label: `${label}\n${currency} ${item.amount.toFixed(2)}`,
        };
    }), [memberBreakdown, memberMap, getMemberLabel, currency]);

    const memberPieData = useMemo(() => memberChartData.map(datum => ({
        ...datum,
        percentage: totalMemberAmount === 0 ? 0 : Math.round((datum.y / totalMemberAmount) * 100),
    })), [memberChartData, totalMemberAmount]);

    const memberTrendData = useMemo(() => {
        if (selectedListId === ALL_LISTS_OPTION) {
            return [];
        }
        const map = new Map<string, number>();
        safeListExpenses.forEach(expense => {
            const date = new Date(expense.expenseDate);
            if (!Number.isFinite(date.getTime())) return;
            const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
            map.set(key, (map.get(key) ?? 0) + expense.amount);
        });
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, amount]) => {
                const [year, month, day] = key.split('-').map(Number);
                const date = Date.UTC(year, (month ?? 1) - 1, day ?? 1);
                return {x: date, y: amount};
            });
    }, [selectedListId, safeListExpenses]);
    const memberTrendMax = useMemo(() => memberTrendData.reduce((max, point) => Math.max(max, point.y), 0), [memberTrendData]);
    const trendAxisTicks = useMemo(() => buildCurrencyTicks(memberTrendMax, maxCurrencyTicks), [memberTrendMax, maxCurrencyTicks]);
    const trendAxisTickCount = useMemo(() => Math.min(baseTrendTickCount, Math.max(2, memberTrendData.length)), [baseTrendTickCount, memberTrendData.length]);

    const trendTickFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric'
    }), []);

    useEffect(() => {
        if ((memberChartMode === 'bar' || memberChartMode === 'pie') && memberBreakdown.length === 0 && memberTrendData.length > 0) {
            setMemberChartMode('trend');
        } else if (memberChartMode === 'trend' && memberTrendData.length === 0 && memberBreakdown.length > 0) {
            setMemberChartMode('bar');
        }
    }, [memberChartMode, memberBreakdown.length, memberTrendData.length]);

    useEffect(() => {
        setActiveTrendPoint(null);
    }, [memberTrendData]);

    useEffect(() => {
        chartFade.stopAnimation();
        chartFade.setValue(0.1);
        Animated.timing(chartFade, {
            toValue: 1,
            duration: Math.max(220, Math.round(chartAnimationDuration * 0.6)),
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, [memberChartMode, chartFade, chartAnimationDuration]);

    const splitSummary = useMemo(() => {
        if (selectedListId === ALL_LISTS_OPTION) {
            return {rows: [], settlements: [], reason: 'no-expenses' as const};
        }
        return buildSplitSummary(safeListExpenses, listInsights.members);
    }, [selectedListId, safeListExpenses, listInsights.members]);

    const dailyTotals = useMemo(() => {
        const map = new Map<string, number>();
        visibleExpenses.forEach(expense => {
            const dateKey = new Date(expense.expenseDate).toLocaleDateString();
            map.set(dateKey, (map.get(dateKey) ?? 0) + expense.amount);
        });
        return map;
    }, [visibleExpenses]);

    const topDay = useMemo(() => {
        let best: { date: string; amount: number } | null = null;
        dailyTotals.forEach((amount, date) => {
            if (!best || amount > best.amount) {
                best = {date, amount};
            }
        });
        return best;
    }, [dailyTotals]);

    if (isInitialLoading) {
        return <Loading/>;
    }

    const renderBreakdown = (title: string, data: { label: string; amount: number }[]) => {
        const localMax = data.reduce((max, item) => Math.max(max, item.amount), 0) || 1;
        return <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {data.length === 0 ?
                <Text style={styles.emptyText}>{t('analytics.empty')}</Text> : data.map((item, index) => <View
                    key={`${title}-${item.label}-${index}`} style={styles.chartRow}>
                    <View style={styles.chartLabelWrapper}>
                        <Text style={styles.chartLabel}>{item.label}</Text>
                        <Text style={styles.chartValue}>{currency} {item.amount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.chartBarWrapper}>
                        <View
                            style={[styles.chartBar, {width: `${Math.max((item.amount / localMax) * 100, 5)}%`}]}
                        />
                    </View>
                </View>)}
        </Card>;
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

    return <>
        <Modal
            visible={isListDropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsListDropdownVisible(false)}
        >
            <TouchableWithoutFeedback onPress={() => setIsListDropdownVisible(false)}>
                <View style={styles.dropdownBackdrop}>
                    <TouchableWithoutFeedback>
                        <View style={styles.dropdownCard}>
                            <ScrollView>
                                {lists.length === 0 ? <Text style={styles.dropdownEmptyText}>
                                    {t('analytics.listPickerDropdownEmpty')}
                                </Text> : lists.map(list => <TouchableOpacity
                                    key={list.id}
                                    style={styles.dropdownOption}
                                    onPress={() => handleSelectListId(list.id)}
                                >
                                    <Text style={styles.dropdownOptionText}>{list.name}</Text>
                                </TouchableOpacity>)}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh}/>}
        >
            <View style={styles.header}>
                <Text style={styles.title}>{t('analytics.title')}</Text>
                <Text style={styles.subtitle}>{t('analytics.subtitle')}</Text>
            </View>

            <View style={styles.filters}>
                {TIMEFRAME_OPTIONS.map(option => <TouchableOpacity
                    key={option}
                    style={[styles.filterChip, timeframe === option && styles.filterChipActive]}
                    onPress={() => setTimeframe(option)}
                >
                    <Text style={[styles.filterChipText, timeframe === option && styles.filterChipTextActive]}>
                        {chipLabels[option]}
                    </Text>
                </TouchableOpacity>)}
            </View>

            {timeframe === 'custom' && <Card style={styles.card}>
                <Text style={styles.sectionTitle}>{t('analytics.customTitle')}</Text>
                <Input
                    label={t('analytics.customFrom')}
                    placeholder="YYYY-MM-DD"
                    value={customRange.from}
                    onChangeText={text => setCustomRange(prev => ({...prev, from: formatDateInput(text)}))}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    maxLength={10}
                />
                <Input
                    label={t('analytics.customTo')}
                    placeholder="YYYY-MM-DD"
                    value={customRange.to}
                    onChangeText={text => setCustomRange(prev => ({...prev, to: formatDateInput(text)}))}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    maxLength={10}
                />
                {customError && <Text style={styles.error}>{customError}</Text>}
                <Button
                    title={t('analytics.customApply')}
                    onPress={handleApplyCustom}
                    style={styles.customButton}
                    disabled={!customRange.from || !customRange.to}
                />
            </Card>}

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>{t('analytics.listPickerLabel')}</Text>
                <View style={styles.listPickerRow}>
                    <TouchableOpacity
                        style={[styles.listChip, selectedListId === ALL_LISTS_OPTION && styles.listChipActive]}
                        onPress={() => handleSelectListId(ALL_LISTS_OPTION)}
                    >
                        <Text
                            style={[styles.listChipText, selectedListId === ALL_LISTS_OPTION && styles.listChipTextActive]}>
                            {t('analytics.listPickerAll')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.dropdownTrigger, selectedListId !== ALL_LISTS_OPTION && styles.dropdownTriggerActive]}
                        onPress={() => setIsListDropdownVisible(true)}
                        disabled={lists.length === 0}
                    >
                        <Text
                            style={[styles.dropdownTriggerText, selectedListId !== ALL_LISTS_OPTION && styles.dropdownTriggerTextActive]}
                            numberOfLines={1}
                        >
                            {selectedListId === ALL_LISTS_OPTION
                                ? t('analytics.listPickerDropdownPlaceholder')
                                : selectedList?.name || t('analytics.listPickerFallback')}
                        </Text>
                        <Text
                            style={[styles.dropdownTriggerIcon, selectedListId !== ALL_LISTS_OPTION && styles.dropdownTriggerIconActive]}
                        >
                            ⌄
                        </Text>
                    </TouchableOpacity>
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
                {topDay && <Text style={styles.topDay}>{t('analytics.topDay', {
                    date: topDay.date,
                    amount: `${currency} ${topDay.amount.toFixed(2)}`
                })}</Text>}
            </Card>

            {selectedListId === ALL_LISTS_OPTION && renderBreakdown(t('analytics.byList'), listBreakdown)}

            {selectedListId === ALL_LISTS_OPTION && <Card style={styles.card}>
                <Text style={styles.sectionTitle}>{t('analytics.listInsightsPlaceholderTitle')}</Text>
                <Text style={styles.emptyText}>{t('analytics.listPickerHelper')}</Text>
            </Card>}

            {selectedListId !== ALL_LISTS_OPTION && <>
                {isCustomRangeMissing && <Card style={styles.card}>
                    <Text
                        style={styles.sectionTitle}>{selectedList?.name || t('analytics.listPickerFallback')}</Text>
                    <Text style={styles.emptyText}>{t('analytics.listPickerApplyCustom')}</Text>
                </Card>}

                {!isCustomRangeMissing && listInsightsLoading && <Card style={styles.card}>
                    <View style={styles.loadingRow}>
                        <ActivityIndicator color={colors.accent}/>
                        <Text style={styles.loadingText}>{t('analytics.listInsightsLoading')}</Text>
                    </View>
                </Card>}

                {!isCustomRangeMissing && !listInsightsLoading && listInsightsError && <Card style={styles.card}>
                    <Text style={styles.error}>{listInsightsError}</Text>
                    <Button
                        title={t('common.retry')}
                        onPress={handleRetryListInsights}
                        style={styles.retryButton}
                    />
                </Card>}

                {!isCustomRangeMissing && !listInsightsLoading && !listInsightsError && <>
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>{t('analytics.memberChartModesTitle')}</Text>
                        <Text style={styles.chartModeHelper}>{t('analytics.chartModeHelper')}</Text>
                        <View style={styles.chartModeSelector}>
                            {chartModeOptions.map(option => {
                                const isActive = memberChartMode === option.key;
                                return <TouchableOpacity
                                    key={option.key}
                                    style={[styles.chartModeChip, isActive && styles.chartModeChipActive]}
                                    onPress={() => setMemberChartMode(option.key)}
                                >
                                    <Text
                                        style={[styles.chartModeChipLabel, isActive && styles.chartModeChipLabelActive]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>;
                            })}
                        </View>
                        <ChartBoundary
                            key={selectedListId}
                            fallback={<Text style={styles.error}>{t('analytics.chartFallback')}</Text>}
                        >
                            <Animated.View style={[styles.chartCanvas, {opacity: chartFade}]}>
                                {memberChartMode === 'bar' && (memberChartData.length === 0 ? <Text
                                    style={styles.emptyText}>{t('analytics.memberChartEmpty')}</Text> : <VictoryChart
                                    animate={chartContainerAnimation}
                                    theme={VictoryTheme.material}
                                    minDomain={{y: 0}}
                                    width={chartWidth}
                                    domainPadding={{x: [12, 36], y: 8}}
                                    padding={{top: 16, bottom: 48, left: 88, right: 32}}
                                    height={260}
                                >
                                    <VictoryAxis
                                        fixLabelOverlap
                                        style={{
                                            axis: {stroke: colors.surfaceSecondary},
                                            tickLabels: {fill: colors.secondaryText, fontSize: 12},
                                            grid: {stroke: 'transparent'},
                                        }}
                                    />
                                    <VictoryAxis
                                        dependentAxis
                                        fixLabelOverlap
                                        tickValues={memberAxisTicks}
                                        tickFormat={value => `${currency} ${value.toFixed(0)}`}
                                        style={{
                                            axis: {stroke: colors.surfaceSecondary},
                                            tickLabels: {fill: colors.secondaryText, fontSize: 12},
                                            grid: {stroke: colors.surfaceSecondary, opacity: 0.2},
                                        }}
                                    />
                                    <VictoryBar
                                        animate={chartSeriesAnimation}
                                        data={memberChartData}
                                        horizontal
                                        barWidth={22}
                                        labels={({datum, index}) => activeBarIndex === index ? datum.label : undefined}
                                        labelComponent={barTooltip}
                                        events={barEvents}
                                        cornerRadius={{top: 6, bottom: 6}}
                                        style={{
                                            data: {
                                                fill: ({index}) => memberChartColors[index % memberChartColors.length],
                                                stroke: colors.background,
                                                strokeWidth: 1,
                                                opacity: ({index}) => activeBarIndex === null || activeBarIndex === index ? 1 : 0.6,
                                            },
                                            labels: {fill: colors.text, fontSize: 12},
                                        }}
                                    />
                                </VictoryChart>)}
                                {memberChartMode === 'pie' && (memberPieData.length === 0 ? <Text
                                    style={styles.emptyText}>{t('analytics.memberChartEmpty')}</Text> : <VictoryPie
                                    data={memberPieData}
                                    colorScale={memberChartColors}
                                    innerRadius={70}
                                    padAngle={1.5}
                                    height={260}
                                    width={chartWidth}
                                    animate={chartSeriesAnimation}
                                    labels={({datum}) => `${datum.x}\n${currency} ${datum.y.toFixed(2)} (${datum.percentage}%)`}
                                    style={{
                                        labels: {fill: colors.text, fontSize: 12},
                                    }}
                                />)}
                                {memberChartMode === 'trend' && (memberTrendData.length === 0 ? <Text
                                    style={styles.emptyText}>{t('analytics.memberTrendEmpty')}</Text> : <VictoryChart
                                    theme={VictoryTheme.material}
                                    animate={chartContainerAnimation}
                                    padding={{top: 16, bottom: 56, left: 56, right: 32}}
                                    height={260}
                                    width={chartWidth}
                                    domainPadding={{x: 16, y: 16}}
                                    containerComponent={<VictoryVoronoiContainer
                                        voronoiDimension="x"
                                        activateData
                                        labels={({datum}) => `${currency} ${datum.y.toFixed(2)}`}
                                        labelComponent={<VictoryTooltip
                                            flyoutStyle={{fill: colors.surface, stroke: colors.border}}
                                            style={{fontSize: 12, fill: colors.text}}
                                            renderInPortal={false}
                                            pointerLength={0}
                                            activateOnPressIn={false}
                                            activateOnTouchStart={false}
                                            activateOnPressOut={false}
                                            activateOnTouchEnd={false}
                                        />}
                                        onActivated={points => setActiveTrendPoint(points[0] ? {x: points[0].x as number, y: points[0].y as number} : null)}
                                        onDeactivated={() => setActiveTrendPoint(null)}
                                    />}
                                >
                                    <VictoryAxis
                                        fixLabelOverlap
                                        tickCount={trendAxisTickCount}
                                        tickFormat={value => trendTickFormatter.format(new Date(value))}
                                        style={{
                                            axis: {stroke: colors.surfaceSecondary},
                                            tickLabels: {fill: colors.secondaryText, fontSize: 12, angle: -25, padding: 20},
                                        }}
                                    />
                                    <VictoryAxis
                                        dependentAxis
                                        fixLabelOverlap
                                        tickValues={trendAxisTicks}
                                        tickFormat={value => `${currency} ${value.toFixed(0)}`}
                                        style={{
                                            axis: {stroke: colors.surfaceSecondary},
                                            tickLabels: {fill: colors.secondaryText, fontSize: 12},
                                            grid: {stroke: colors.surfaceSecondary, opacity: 0.2},
                                        }}
                                    />
                                    <VictoryArea
                                        animate={chartSeriesAnimation}
                                        data={memberTrendData}
                                        interpolation="monotoneX"
                                        style={{
                                            data: {
                                                fill: colors.accentSoft,
                                                stroke: colors.accent,
                                                strokeWidth: 2,
                                            },
                                        }}
                                    />
                                    {activeTrendPoint && <VictoryLine
                                        data={[
                                            {x: activeTrendPoint.x, y: 0},
                                            {x: activeTrendPoint.x, y: Math.max(memberTrendMax, trendAxisTicks[trendAxisTicks.length - 1] ?? 0)},
                                        ]}
                                        style={{data: {stroke: colors.accent, strokeWidth: 1.5, strokeDasharray: '5,4'}}}
                                        animate={chartSeriesAnimation}
                                    />}
                                    <VictoryScatter
                                        data={activeTrendPoint ? [activeTrendPoint] : []}
                                        size={8}
                                        symbol="circle"
                                        style={{
                                            data: {
                                                fill: colors.accent,
                                                stroke: colors.background,
                                                strokeWidth: 2,
                                            },
                                        }}
                                        labels={({datum}) => `${currency} ${datum.y.toFixed(2)}`}
                                        labelComponent={<VictoryTooltip
                                            flyoutStyle={{fill: colors.surface, stroke: colors.border}}
                                            style={{fontSize: 12, fill: colors.text}}
                                            renderInPortal={false}
                                            pointerLength={0}
                                            activateOnPressIn={false}
                                            activateOnTouchStart={false}
                                            activateOnPressOut={false}
                                            activateOnTouchEnd={false}
                                            active
                                        />}
                                    />
                                </VictoryChart>)}
                            </Animated.View>
                        </ChartBoundary>
                    </Card>

                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>{t('analytics.memberBreakdownTitle')}</Text>
                        {memberBreakdown.length === 0 ? <Text
                            style={styles.emptyText}>{t('analytics.memberChartEmpty')}</Text> : memberBreakdown.map(item =>
                            <View key={item.memberId} style={styles.chartRow}>
                                <View style={styles.chartLabelWrapper}>
                                    <Text
                                        style={styles.chartLabel}>{getMemberLabel(memberMap.get(item.memberId))}</Text>
                                    <Text
                                        style={styles.chartValue}>{currency} {item.amount.toFixed(2)}</Text>
                                </View>
                                <View style={styles.chartBarWrapper}>
                                    <View
                                        style={[styles.chartBar, {width: `${Math.max((item.amount / memberChartMax) * 100, 5)}%`}]}
                                    />
                                </View>
                            </View>)}
                    </Card>

                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>{t('lists.splitSectionTitle')}</Text>
                        <Text style={styles.splitHelper}>{t('lists.splitOptimizedHint')}</Text>
                        {splitSummary.reason === 'no-expenses' &&
                            <Text style={styles.emptyText}>{t('lists.splitSectionEmpty')}</Text>}
                        {splitSummary.reason === 'no-members' &&
                            <Text style={styles.emptyText}>{t('lists.splitSectionNeedMembers')}</Text>}
                        {splitSummary.reason === 'no-split' &&
                            <Text style={styles.emptyText}>{t('lists.splitSectionNeedPercentages')}</Text>}
                        {splitSummary.reason === null && <>
                            {splitSummary.rows.map(row => <View key={row.member.id} style={styles.splitRow}>
                                <View style={styles.splitMemberInfo}>
                                    <Text
                                        style={styles.splitMemberName}>{getMemberLabel(row.member)}</Text>
                                    <Text
                                        style={styles.splitMemberShare}>{t('lists.splitShareLabel', {value: row.percentage})}</Text>
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
                            </View>)}
                            <View style={styles.settlementsWrapper}>
                                <Text
                                    style={styles.settlementsTitle}>{t('lists.splitSettlementsTitle')}</Text>
                                {splitSummary.settlements.length === 0 ? <Text
                                    style={styles.emptyText}>{t('lists.splitSettlementsEmpty')}</Text> : splitSummary.settlements.map((settlement, index) =>
                                    <Text
                                        key={`${settlement.from.id}-${settlement.to.id}-${index}`}
                                        style={styles.settlementText}
                                    >
                                        {t('lists.splitSettlement', {
                                            from: getMemberLabel(settlement.from),
                                            to: getMemberLabel(settlement.to),
                                            amount: `${currency} ${settlement.amount.toFixed(2)}`,
                                        })}
                                    </Text>)}
                            </View>
                        </>}
                    </Card>
                </>}
            </>}
        </ScrollView>
    </>;
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
        listPickerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
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
        dropdownTrigger: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.surfaceSecondary,
            backgroundColor: colors.surface,
        },
        dropdownTriggerActive: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
        },
        dropdownTriggerText: {
            flex: 1,
            fontSize: 14,
            color: colors.text,
            marginRight: 8,
        },
        dropdownTriggerTextActive: {
            color: colors.accentText,
        },
        dropdownTriggerIcon: {
            fontSize: 16,
            color: colors.secondaryText,
        },
        dropdownTriggerIconActive: {
            color: colors.accentText,
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
        chartModeHelper: {
            fontSize: 12,
            color: colors.secondaryText,
            marginBottom: 12,
        },
        chartModeSelector: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
        },
        chartModeChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.surfaceSecondary,
            backgroundColor: colors.surfaceSecondary,
        },
        chartModeChipActive: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
        },
        chartModeChipLabel: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.secondaryText,
        },
        chartModeChipLabelActive: {
            color: colors.accentText,
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
        chartCanvas: {
            minHeight: 220,
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
        dropdownBackdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            padding: 24,
        },
        dropdownCard: {
            borderRadius: 16,
            backgroundColor: colors.surface,
            maxHeight: '70%',
            padding: 12,
        },
        dropdownOption: {
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: colors.surfaceSecondary,
        },
        dropdownOptionText: {
            fontSize: 16,
            color: colors.text,
        },
        dropdownEmptyText: {
            fontSize: 14,
            color: colors.secondaryText,
            paddingVertical: 16,
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
