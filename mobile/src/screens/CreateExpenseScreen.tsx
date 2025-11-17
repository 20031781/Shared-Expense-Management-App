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
import {Button, Input} from '@/components';
import {useExpensesStore} from '@/store/expenses.store';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useListsStore} from '@/store/lists.store';
import {ListMember, MemberStatus} from '@/types';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

export const CreateExpenseScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const {listId} = route.params;
    const {t} = useTranslation();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const {createExpense, uploadReceipt, isLoading} = useExpensesStore();
    const {members, fetchMembers} = useListsStore();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [receiptUri, setReceiptUri] = useState<string | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [showPayerPicker, setShowPayerPicker] = useState(false);
    const [errors, setErrors] = useState<{ title?: string; amount?: string; payer?: string }>({});

    useEffect(() => {
        fetchMembers(listId);
    }, [listId]);

    useEffect(() => {
        if (!selectedMemberId && members.length > 0) {
            const defaultMember = members.find((m) => m.status === MemberStatus.Active) ?? members[0];
            if (defaultMember) {
                setSelectedMemberId(defaultMember.id);
            }
        }
    }, [members, selectedMemberId]);

    const selectedMember = useMemo(() => members.find((m) => m.id === selectedMemberId), [members, selectedMemberId]);
    const hasMembers = members.length > 0;
    const getMemberLabel = useCallback((member?: ListMember) => {
        if (!member) return t('members.unknown');
        return (member.displayName && member.displayName.trim())
            || member.user?.fullName
            || member.email
            || t('members.unknown');
    }, [t]);

    const validate = () => {
        const newErrors: { title?: string; amount?: string; payer?: string } = {};

        if (!title.trim()) {
            newErrors.title = t('expenses.titleRequired');
        }

        if (!amount || parseFloat(amount) <= 0) {
            newErrors.amount = t('expenses.amountRequired');
        }

        if (!selectedMemberId) {
            newErrors.payer = t('expenses.payerRequired');
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

    const handleCreate = async () => {
        if (!validate()) return;

        try {
            const expense = await createExpense({
                listId,
                title: title.trim(),
                amount: parseFloat(amount),
                currency: 'EUR',
                expenseDate: new Date().toISOString(),
                notes: notes.trim() || undefined,
                paidByMemberId: selectedMemberId!,
            });

            if (receiptUri) {
                await uploadReceipt(expense.id, receiptUri);
            }

            Alert.alert(t('common.success'), t('expenses.createdSuccess'), [
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
        return (
            <TouchableOpacity
                key={member.id}
                style={[styles.memberOption, isSelected && styles.memberOptionSelected]}
                onPress={() => {
                    setSelectedMemberId(member.id);
                    setShowPayerPicker(false);
                    setErrors((prev) => ({...prev, payer: undefined}));
                }}
            >
                <View>
                    <Text style={styles.memberEmail}>{getMemberLabel(member)}</Text>
                    <Text style={styles.memberMeta}>{(member.splitPercentage ?? 0).toFixed(0)}%</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.success}/>}
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{t('expenses.newExpense')}</Text>

                <Input
                    label={t('expenses.titleLabel')}
                    placeholder={t('expenses.titlePlaceholder')}
                    value={title}
                    onChangeText={(text) => {
                        setTitle(text);
                        setErrors((prev) => ({...prev, title: undefined}));
                    }}
                    error={errors.title}
                    autoFocus
                />

                <Input
                    label={t('expenses.amountLabel')}
                    placeholder="0.00"
                    value={amount}
                    onChangeText={(text) => {
                        setAmount(text);
                        setErrors((prev) => ({...prev, amount: undefined}));
                    }}
                    error={errors.amount}
                    keyboardType="decimal-pad"
                />

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

                    {receiptUri && (
                        <View style={styles.receiptPreview}>
                            <Ionicons name="checkmark-circle" size={24} color={colors.success}/>
                            <Text style={styles.receiptPreviewText}>{t('expenses.receiptAdded')}</Text>
                            <TouchableOpacity onPress={() => setReceiptUri(null)}>
                                <Ionicons name="close-circle" size={24} color={colors.danger}/>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.buttons}>
                    <Button
                        title={t('expenses.createButton')}
                        onPress={handleCreate}
                        loading={isLoading}
                        disabled={isLoading || !hasMembers}
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
        </KeyboardAvoidingView>
    );
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
