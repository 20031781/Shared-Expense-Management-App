import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {Button, Input, Loading} from '@/components';
import {useExpensesStore} from '@/store/expenses.store';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useListsStore} from '@/store/lists.store';
import {ExpensePaymentMethod, ListMember, MemberStatus} from '@/types';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

const normalizeDate = (value: Date = new Date()) => {
    const normalized = new Date(value);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
};

const normalizePaymentMethod = (value?: ExpensePaymentMethod | string | null): ExpensePaymentMethod => {
    if (!value) {
        return ExpensePaymentMethod.Card;
    }
    const normalized = value.toString().toLowerCase();
    switch (normalized) {
    case ExpensePaymentMethod.Cash:
        return ExpensePaymentMethod.Cash;
    case ExpensePaymentMethod.Transfer:
        return ExpensePaymentMethod.Transfer;
    case ExpensePaymentMethod.Other:
        return ExpensePaymentMethod.Other;
    default:
        return ExpensePaymentMethod.Card;
    }
};

export const CreateExpenseScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const {listId, expenseId} = route.params;
    const isEditing = Boolean(expenseId);
    const {t, language} = useTranslation();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    useEffect(() => {
        navigation.setOptions({title: t(isEditing ? 'expenses.editTitle' : 'expenses.newExpense')});
    }, [navigation, t, isEditing]);

    const {
        createExpense,
        uploadReceipt,
        isLoading,
        updateExpense,
        fetchExpenseById,
        currentExpense,
    } = useExpensesStore();
    const {members, fetchMembers} = useListsStore();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [receiptUri, setReceiptUri] = useState<string | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [showPayerPicker, setShowPayerPicker] = useState(false);
    const [errors, setErrors] = useState<{
        title?: string;
        amount?: string;
        payer?: string;
        beneficiaries?: string;
    }>({});
    const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(ExpensePaymentMethod.Card);
    const [expenseDate, setExpenseDate] = useState(normalizeDate());
    const [beneficiaryIds, setBeneficiaryIds] = useState<string[]>([]);
    const [showBeneficiaryPicker, setShowBeneficiaryPicker] = useState(false);
    const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
    const [prefillReady, setPrefillReady] = useState(!isEditing);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchMembers(listId);
    }, [listId, fetchMembers]);

    useEffect(() => {
        if (expenseId) {
            fetchExpenseById(expenseId);
        }
    }, [expenseId, fetchExpenseById]);

    useEffect(() => {
        if (!selectedMemberId && members.length > 0) {
            const defaultMember = members.find(m => m.status === MemberStatus.Active) ?? members[0];
            if (defaultMember) {
                setSelectedMemberId(defaultMember.id);
            }
        }
    }, [members, selectedMemberId]);

    useEffect(() => {
        if (beneficiaryIds.length === 0 && members.length > 0 && !isEditing) {
            const activeMembers = members.filter(member => member.status === MemberStatus.Active);
            const source = activeMembers.length > 0 ? activeMembers : members;
            setBeneficiaryIds(source.map(member => member.id));
        }
    }, [beneficiaryIds.length, members, isEditing]);

    const selectedMember = useMemo(() => members.find(m => m.id === selectedMemberId), [members, selectedMemberId]);
    const hasMembers = members.length > 0;
    const paymentOptions = useMemo(() => [
        {key: ExpensePaymentMethod.Card, icon: 'card-outline', label: t('expenses.paymentMethods.card')},
        {key: ExpensePaymentMethod.Cash, icon: 'cash-outline', label: t('expenses.paymentMethods.cash')},
        {
            key: ExpensePaymentMethod.Transfer,
            icon: 'swap-horizontal-outline',
            label: t('expenses.paymentMethods.transfer')
        },
        {key: ExpensePaymentMethod.Other, icon: 'ellipsis-horizontal', label: t('expenses.paymentMethods.other')},
    ], [t]);

    const getMemberLabel = useCallback((member?: ListMember) => {
        if (!member) return t('members.unknown');
        return member.displayName && member.displayName.trim()
            || member.user?.fullName
            || member.email
            || t('members.unknown');
    }, [t]);
    const beneficiarySummary = useMemo(() => {
        if (beneficiaryIds.length === 0) {
            return t('expenses.beneficiariesRequired');
        }
        if (beneficiaryIds.length === members.length) {
            return t('expenses.beneficiariesAll');
        }
        const labels = beneficiaryIds
            .map(id => members.find(member => member.id === id))
            .filter((member): member is ListMember => !!member)
            .map(member => getMemberLabel(member));
        if (labels.length <= 2) {
            return labels.join(', ');
        }
        return t('expenses.beneficiariesCount', {count: labels.length});
    }, [beneficiaryIds, members, t, getMemberLabel]);

    const handleQuickDate = (offsetDays: number) => {
        const nextDate = normalizeDate();
        nextDate.setDate(nextDate.getDate() - offsetDays);
        setExpenseDate(nextDate);
        setShowDatePicker(false);
    };

    const toggleBeneficiary = (memberId: string) => {
        setBeneficiaryIds(prev => prev.includes(memberId)
            ? prev.filter(id => id !== memberId)
            : [...prev, memberId]);
        setErrors(prev => ({...prev, beneficiaries: undefined}));
    };

    const handleSelectAllBeneficiaries = () => {
        setBeneficiaryIds(members.map(member => member.id));
        setErrors(prev => ({...prev, beneficiaries: undefined}));
    };

    useEffect(() => {
        if (!isEditing || !expenseId || !currentExpense || currentExpense.id !== expenseId) return;
        setTitle(currentExpense.title);
        setAmount(currentExpense.amount.toFixed(2));
        setNotes(currentExpense.notes ?? '');
        setSelectedMemberId(currentExpense.paidByMemberId ?? null);
        const parsedDate = new Date(currentExpense.expenseDate);
        setExpenseDate(normalizeDate(parsedDate));
        setPaymentMethod(normalizePaymentMethod(currentExpense.paymentMethod));
        setBeneficiaryIds(currentExpense.beneficiaryMemberIds?.length
            ? currentExpense.beneficiaryMemberIds
            : members.map(member => member.id));
        setExistingReceiptUrl(currentExpense.receiptUrl ?? null);
        setPrefillReady(true);
    }, [isEditing, expenseId, currentExpense, members]);

    const validate = () => {
        const newErrors: {
            title?: string;
            amount?: string;
            payer?: string;
            beneficiaries?: string;
        } = {};

        if (!title.trim()) {
            newErrors.title = t('expenses.titleRequired');
        }

        if (!amount || parseFloat(amount) <= 0) {
            newErrors.amount = t('expenses.amountRequired');
        }

        if (!selectedMemberId) {
            newErrors.payer = t('expenses.payerRequired');
        }

        if (beneficiaryIds.length === 0) {
            newErrors.beneficiaries = t('expenses.beneficiariesRequired');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePickImage = async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(t('common.error'), t('expenses.permissionPhotos'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setReceiptUri(result.assets[0].uri);
        }
    };

    const handleTakePhoto = async () => {
        const {status} = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(t('common.error'), t('expenses.permissionCamera'));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setReceiptUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            const basePayload = {
                title: title.trim(),
                amount: parseFloat(amount),
                currency: 'EUR',
                expenseDate: expenseDate.toISOString(),
                notes: notes.trim() || undefined,
                paidByMemberId: selectedMemberId!,
                paymentMethod,
                beneficiaryMemberIds: beneficiaryIds,
            };

            const expense = isEditing
                ? await updateExpense(expenseId, {
                    title: basePayload.title,
                    amount: basePayload.amount,
                    expenseDate: basePayload.expenseDate,
                    notes: basePayload.notes,
                    paidByMemberId: basePayload.paidByMemberId,
                    paymentMethod: basePayload.paymentMethod,
                    beneficiaryMemberIds: basePayload.beneficiaryMemberIds,
                })
                : await createExpense({
                    listId,
                    ...basePayload,
                });

            if (receiptUri) {
                await uploadReceipt(expense.id, receiptUri);
            }

            Alert.alert(t('common.success'), isEditing ? t('expenses.updatedSuccess') : t('expenses.createdSuccess'), [
                {
                    text: t('common.ok'),
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('common.genericError'));
        }
    };

    const renderMemberOption = (member: ListMember) => {
        const isSelected = member.id === selectedMemberId;
        return <TouchableOpacity
            key={member.id}
            style={[styles.memberOption, isSelected && styles.memberOptionSelected]}
            onPress={() => {
                setSelectedMemberId(member.id);
                setShowPayerPicker(false);
                setErrors(prev => ({...prev, payer: undefined}));
            }}
        >
            <View>
                <Text style={styles.memberEmail}>{getMemberLabel(member)}</Text>
                <Text style={styles.memberMeta}>{(member.splitPercentage ?? 0).toFixed(0)}%</Text>
            </View>
            {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.success}/>}
        </TouchableOpacity>;
    };

    const renderBeneficiaryOption = (member: ListMember) => {
        const isSelected = beneficiaryIds.includes(member.id);
        return <TouchableOpacity
            key={`beneficiary-${member.id}`}
            style={[styles.memberOption, isSelected && styles.memberOptionSelected]}
            onPress={() => toggleBeneficiary(member.id)}
        >
            <View>
                <Text style={styles.memberEmail}>{getMemberLabel(member)}</Text>
                <Text style={styles.memberMeta}>{(member.splitPercentage ?? 0).toFixed(0)}%</Text>
            </View>
            <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={20}
                color={isSelected ? colors.accent : colors.secondaryText}
            />
        </TouchableOpacity>;
    };

    const locale = useMemo(() => language === 'it' ? 'it-IT' : 'en-US', [language]);
    const formattedExpenseDate = useMemo(() => new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(expenseDate), [expenseDate, locale]);
    const normalizedExpenseDate = useMemo(() => expenseDate.toISOString(), [expenseDate]);
    const dateOptions = useMemo(() => {
        const today = normalizeDate();
        return Array.from({length: 60}).map((_, index) => {
            const optionDate = new Date(today);
            optionDate.setDate(today.getDate() - index);
            return {
                iso: optionDate.toISOString(),
                label: new Intl.DateTimeFormat(locale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }).format(optionDate),
                relative: index === 0
                    ? t('expenses.dateToday')
                    : index === 1
                        ? t('expenses.dateYesterday')
                        : t('expenses.dateDaysAgo', {days: index}),
                date: optionDate,
            };
        });
    }, [locale, t]);
    const handleSelectDate = (date: Date) => {
        setExpenseDate(normalizeDate(date));
        setShowDatePicker(false);
    };
    const handleOpenDatePicker = () => setShowDatePicker(true);

    if (!prefillReady) {
        return <Loading/>;
    }

    const hasReceipt = !!receiptUri || !!existingReceiptUrl;

    return <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
        <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{t('expenses.newExpense')}</Text>

            <Input
                label={t('expenses.titleLabel')}
                placeholder={t('expenses.titlePlaceholder')}
                value={title}
                onChangeText={text => {
                    setTitle(text);
                    setErrors(prev => ({...prev, title: undefined}));
                }}
                error={errors.title}
                autoFocus
            />

            <Input
                label={t('expenses.amountLabel')}
                placeholder="0.00"
                value={amount}
                onChangeText={text => {
                    setAmount(text);
                    setErrors(prev => ({...prev, amount: undefined}));
                }}
                error={errors.amount}
                keyboardType="decimal-pad"
            />

            <View style={styles.datePickerSection}>
                <Text style={styles.label}>{t('expenses.dateLabel')}</Text>
                <TouchableOpacity style={styles.datePickerInput} onPress={handleOpenDatePicker}>
                    <Ionicons name="calendar-outline" size={20} color={colors.accent}/>
                    <View style={styles.datePickerTexts}>
                        <Text style={styles.datePickerValue}>{formattedExpenseDate}</Text>
                        <Text style={styles.datePickerHint}>{t('expenses.dateHelper')}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={colors.secondaryText}/>
                </TouchableOpacity>
            </View>
            <View style={styles.dateQuickActions}>
                <TouchableOpacity style={[styles.dateChip, styles.dateChipPrimary]} onPress={() => handleQuickDate(0)}>
                    <Text style={[styles.dateChipText, styles.dateChipPrimaryText]}>{t('expenses.dateToday')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateChip} onPress={() => handleQuickDate(1)}>
                    <Text style={styles.dateChipText}>{t('expenses.dateYesterday')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.paymentSection}>
                <Text style={styles.label}>{t('expenses.paymentMethodLabel')}</Text>
                <Text style={styles.helperText}>{t('expenses.paymentMethodHelper')}</Text>
                <View style={styles.paymentOptions}>
                    {paymentOptions.map(({key, icon, label}) => {
                        const isActive = paymentMethod === key;
                        return <TouchableOpacity
                            key={key}
                            style={[styles.paymentOption, isActive && styles.paymentOptionActive]}
                            onPress={() => setPaymentMethod(key)}
                        >
                            <Ionicons name={icon as any} size={16}
                                      color={isActive ? colors.accentText : colors.accent}/>
                            <Text style={[styles.paymentOptionLabel, isActive && styles.paymentOptionLabelActive]}>
                                {label}
                            </Text>
                        </TouchableOpacity>;
                    })}
                </View>
            </View>

            <View style={styles.payerSection}>
                <Text style={styles.label}>{t('expenses.payerLabel')}</Text>
                <TouchableOpacity
                    style={[styles.payerSelector, !selectedMember && styles.payerSelectorEmpty]}
                    onPress={() => hasMembers && setShowPayerPicker(true)}
                    disabled={!hasMembers}
                >
                    <Text style={selectedMember ? styles.payerValue : styles.payerPlaceholder}>
                        {selectedMember ? getMemberLabel(selectedMember) : t('expenses.payerPlaceholder')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.secondaryText}/>
                </TouchableOpacity>
                {errors.payer && <Text style={styles.errorText}>{errors.payer}</Text>}
                <Text style={styles.helperText}>
                    {hasMembers ? t('expenses.payerHelper') : t('expenses.missingMembersHelper')}
                </Text>
            </View>

            <View style={styles.payerSection}>
                <Text style={styles.label}>{t('expenses.beneficiariesLabel')}</Text>
                <TouchableOpacity
                    style={[styles.payerSelector, beneficiaryIds.length === 0 && styles.payerSelectorEmpty]}
                    onPress={() => hasMembers && setShowBeneficiaryPicker(true)}
                    disabled={!hasMembers}
                >
                    <Text style={beneficiaryIds.length > 0 ? styles.payerValue : styles.payerPlaceholder}>
                        {beneficiaryIds.length > 0 ? beneficiarySummary : t('expenses.beneficiariesPlaceholder')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.secondaryText}/>
                </TouchableOpacity>
                {errors.beneficiaries && <Text style={styles.errorText}>{errors.beneficiaries}</Text>}
                <Text style={styles.helperText}>{t('expenses.beneficiariesHelper')}</Text>
            </View>

            <Input
                label={t('expenses.notesLabel')}
                placeholder={t('expenses.notesPlaceholder')}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
            />

            <View style={styles.receiptSection}>
                <Text style={styles.label}>{t('expenses.receiptLabel')}</Text>

                <View style={styles.receiptButtons}>
                    <TouchableOpacity style={styles.receiptButton} onPress={handleTakePhoto}>
                        <Ionicons name="camera-outline" size={24} color={colors.accent}/>
                        <Text style={styles.receiptButtonText}>{t('expenses.addReceiptCamera')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.receiptButton} onPress={handlePickImage}>
                        <Ionicons name="images-outline" size={24} color={colors.accent}/>
                        <Text style={styles.receiptButtonText}>{t('expenses.addReceiptGallery')}</Text>
                    </TouchableOpacity>
                </View>

                {hasReceipt && <View style={styles.receiptPreview}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success}/>
                    <Text style={styles.receiptPreviewText}>
                        {receiptUri ? t('expenses.receiptAdded') : t('expenses.receiptOnFile')}
                    </Text>
                    {receiptUri && <TouchableOpacity onPress={() => setReceiptUri(null)}>
                        <Ionicons name="close-circle" size={24} color={colors.danger}/>
                    </TouchableOpacity>}
                </View>}
            </View>

            <View style={styles.buttons}>
                <Button
                    title={isEditing ? t('expenses.saveChanges') : t('expenses.createButton')}
                    onPress={handleSubmit}
                    loading={isLoading}
                    disabled={isLoading || !hasMembers || beneficiaryIds.length === 0}
                    style={styles.button}
                />
                <Button
                    title={t('expenses.cancelButton')}
                    onPress={() => navigation.goBack()}
                    variant="secondary"
                    disabled={isLoading}
                    style={styles.button}
                />
            </View>
        </ScrollView>

        <Modal visible={showPayerPicker} animationType="slide" transparent>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('expenses.payerLabel')}</Text>
                        <TouchableOpacity onPress={() => setShowPayerPicker(false)}>
                            <Ionicons name="close" size={24} color={colors.text}/>
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {members.map(renderMemberOption)}
                    </ScrollView>
                </View>
            </View>
        </Modal>

        <Modal visible={showDatePicker} animationType="slide" transparent>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('expenses.dateLabel')}</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Ionicons name="close" size={24} color={colors.text}/>
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {dateOptions.map(option => {
                            const isSelected = option.iso === normalizedExpenseDate;
                            return <TouchableOpacity
                                key={option.iso}
                                style={[styles.memberOption, isSelected && styles.memberOptionSelected]}
                                onPress={() => handleSelectDate(option.date)}
                            >
                                <View>
                                    <Text style={styles.memberEmail}>{option.label}</Text>
                                    <Text style={styles.memberMeta}>{option.relative}</Text>
                                </View>
                                {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.success}/>}
                            </TouchableOpacity>;
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>

        <Modal visible={showBeneficiaryPicker} animationType="slide" transparent>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('expenses.beneficiariesLabel')}</Text>
                        <TouchableOpacity onPress={() => setShowBeneficiaryPicker(false)}>
                            <Ionicons name="close" size={24} color={colors.text}/>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.beneficiaryActions}>
                        <TouchableOpacity onPress={handleSelectAllBeneficiaries}>
                            <Text style={styles.beneficiaryActionText}>{t('expenses.selectAll')}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {members.map(renderBeneficiaryOption)}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    </KeyboardAvoidingView>;
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            padding: 16,
            gap: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
        },
        payerSection: {
            gap: 8,
        },
        label: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        payerSelector: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingVertical: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        payerSelectorEmpty: {
            borderColor: colors.danger,
        },
        payerValue: {
            fontSize: 16,
            color: colors.text,
        },
        payerPlaceholder: {
            fontSize: 16,
            color: colors.secondaryText,
        },
        helperText: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        datePickerSection: {
            gap: 8,
            marginTop: 8,
        },
        datePickerInput: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            gap: 12,
        },
        datePickerTexts: {
            flex: 1,
        },
        datePickerValue: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        datePickerHint: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        paymentSection: {
            gap: 8,
        },
        paymentOptions: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        paymentOption: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
        },
        paymentOptionActive: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
        },
        paymentOptionLabel: {
            color: colors.text,
            fontSize: 13,
            fontWeight: '600',
        },
        paymentOptionLabelActive: {
            color: colors.accentText,
        },
        dateQuickActions: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 8,
        },
        dateChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: colors.surfaceSecondary,
        },
        dateChipPrimary: {
            backgroundColor: colors.accent,
        },
        dateChipText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.secondaryText,
        },
        dateChipPrimaryText: {
            color: colors.accentText,
        },
        errorText: {
            fontSize: 12,
            color: colors.danger,
        },
        receiptSection: {
            gap: 12,
        },
        receiptButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
        },
        receiptButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: colors.accentSoft,
            gap: 8,
        },
        receiptButtonText: {
            color: colors.accent,
            fontWeight: '600',
        },
        receiptPreview: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.successBackground,
            padding: 12,
            borderRadius: 10,
        },
        receiptPreviewText: {
            color: colors.text,
            fontWeight: '600',
            flex: 1,
        },
        buttons: {
            flexDirection: 'row',
            gap: 12,
        },
        button: {
            flex: 1,
        },
        modalBackdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            maxHeight: '60%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 16,
        },
        beneficiaryActions: {
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.surfaceSecondary,
        },
        beneficiaryActionText: {
            color: colors.accent,
            fontWeight: '600',
        },
        modalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.surfaceSecondary,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
        },
        memberOption: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.surfaceSecondary,
        },
        memberOptionSelected: {
            backgroundColor: colors.surfaceSecondary,
        },
        memberEmail: {
            fontSize: 16,
            color: colors.text,
        },
        memberMeta: {
            fontSize: 12,
            color: colors.secondaryText,
        },
    });
