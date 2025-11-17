import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Button, Card, Input, Loading, OnboardingChecklist} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {List} from '@/types';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

export const ListsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const {lists, isLoading, fetchLists, deleteList, joinList} = useListsStore();
    const [refreshing, setRefreshing] = useState(false);
    const [isJoinModalVisible, setJoinModalVisible] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [joinError, setJoinError] = useState<string | undefined>();
    const [joining, setJoining] = useState(false);
    const {t} = useTranslation();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const loadLists = useCallback(async () => {
        await fetchLists();
    }, [fetchLists]);

    useEffect(() => {
        loadLists();
    }, [loadLists]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadLists();
        setRefreshing(false);
    }, [loadLists]);

    const handleCreateList = useCallback(() => navigation.navigate('CreateList'), [navigation]);

    const handleListPress = useCallback((list: List) => navigation.navigate('ListDetails', {listId: list.id}), [navigation]);

    const handleJoinList = () => {
        setJoinError(undefined);
        setInviteCode('');
        setJoinModalVisible(true);
    };

    const closeJoinModal = () => {
        setJoinModalVisible(false);
        setJoinError(undefined);
        setInviteCode('');
    };

    const handleConfirmJoin = async () => {
        const trimmed = inviteCode.trim();
        if (!trimmed) {
            setJoinError(t('lists.joinCodeRequired'));
            return;
        }

        try {
            setJoining(true);
            await joinList(trimmed.toUpperCase());
            Alert.alert(t('common.success'), t('lists.joinSuccess'));
            closeJoinModal();
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('lists.joinError'));
        } finally {
            setJoining(false);
        }
    };

    const handleDeleteList = (list: List) =>
        Alert.alert(
            t('lists.deleteTitle'),
            t('lists.deleteBody', {name: list.name}),
            [
                {text: t('common.cancel'), style: 'cancel'},
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteList(list.id);
                            Alert.alert(t('common.success'), t('lists.deleteSuccess'));
                        } catch (error: any) {
                            Alert.alert(t('common.error'), error.message ?? t('lists.deleteError'));
                        }
                    },
                },
            ]
        );

    const renderList = ({item}: { item: List }) => <Card onPress={() => handleListPress(item)}>
        <View style={styles.listItem}>
            <View style={styles.listInfo}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => handleDeleteList(item)}
                style={styles.deleteButton}
            >
                <Ionicons name="trash-outline" size={20} color={colors.danger}/>
            </TouchableOpacity>
        </View>
    </Card>;

    const firstListId = lists[0]?.id;

    const goToFirstListDetails = useCallback(() => {
        if (firstListId) {
            navigation.navigate('ListDetails', {listId: firstListId});
        }
    }, [firstListId, navigation]);

    const goToFirstExpense = useCallback(() => {
        if (firstListId) {
            navigation.navigate('CreateExpense', {listId: firstListId});
        }
    }, [firstListId, navigation]);

    const onboardingSteps = useMemo(() => [
        {
            id: 'create',
            title: t('lists.onboardingStepCreateTitle'),
            description: t('lists.onboardingStepCreateDescription'),
            actionLabel: t('lists.onboardingStepCreateAction'),
            onPress: handleCreateList,
            completed: lists.length > 0,
        },
        {
            id: 'invite',
            title: t('lists.onboardingStepInviteTitle'),
            description: t('lists.onboardingStepInviteDescription'),
            actionLabel: t('lists.onboardingStepInviteAction'),
            onPress: firstListId ? goToFirstListDetails : undefined,
            disabled: !firstListId,
            hint: t('lists.onboardingStepInviteHint'),
        },
        {
            id: 'expense',
            title: t('lists.onboardingStepExpenseTitle'),
            description: t('lists.onboardingStepExpenseDescription'),
            actionLabel: t('lists.onboardingStepExpenseAction'),
            onPress: firstListId ? goToFirstExpense : undefined,
            disabled: !firstListId,
            hint: t('lists.onboardingStepExpenseHint'),
        },
    ], [firstListId, goToFirstExpense, goToFirstListDetails, handleCreateList, lists.length, t]);

    const renderEmpty = () => <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>{t('lists.emptyTitle')}</Text>
        <Text style={styles.emptyText}>{t('lists.emptySubtitle')}</Text>
        <View style={styles.onboardingWrapper}>
            <OnboardingChecklist
                title={t('lists.onboardingTitle')}
                subtitle={t('lists.onboardingSubtitle')}
                helper={t('lists.onboardingHelper')}
                steps={onboardingSteps}
            />
        </View>
        <Button
            title={t('lists.createList')}
            onPress={handleCreateList}
            style={styles.emptyButton}
        />
    </View>;

    if (isLoading && lists.length === 0) {
        return <Loading/>;
    }

    return <View style={styles.container}>
        <FlatList
            data={lists}
            renderItem={renderList}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
            }
            ListEmptyComponent={renderEmpty}
        />
        <View style={styles.fab}>
            <TouchableOpacity
                style={styles.fabButton}
                onPress={handleCreateList}
            >
                <Ionicons name="add" size={32} color={colors.accentText}/>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.fabButton, styles.fabSecondary]}
                onPress={handleJoinList}
            >
                <Ionicons name="enter-outline" size={24} color={colors.accent}/>
            </TouchableOpacity>
        </View>

        <Modal visible={isJoinModalVisible} transparent animationType="fade">
            <View style={styles.joinModalBackdrop}>
                <View style={styles.joinModalContent}>
                    <View style={styles.joinModalHeader}>
                        <Text style={styles.joinModalTitle}>{t('lists.joinTitle')}</Text>
                        <TouchableOpacity onPress={closeJoinModal}>
                            <Ionicons name="close" size={22} color={colors.text}/>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.joinModalDescription}>{t('lists.joinDescription')}</Text>
                    <Input
                        label={t('lists.joinPlaceholder')}
                        placeholder="ABC123"
                        autoCapitalize="characters"
                        value={inviteCode}
                        onChangeText={value => {
                            setInviteCode(value);
                            setJoinError(undefined);
                        }}
                        error={joinError}
                    />
                    <Text style={styles.joinHelper}>{t('lists.joinHelper')}</Text>
                    <View style={styles.joinButtons}>
                        <Button
                            title={t('lists.joinSubmit')}
                            onPress={handleConfirmJoin}
                            loading={joining}
                            disabled={joining}
                        />
                        <Button
                            title={t('common.cancel')}
                            onPress={closeJoinModal}
                            variant="secondary"
                            disabled={joining}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    </View>;
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        listContainer: {
            paddingVertical: 8,
            flexGrow: 1,
        },
        listItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        listInfo: {
            flex: 1,
        },
        listName: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        listDate: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        deleteButton: {
            padding: 8,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
        },
        emptyIcon: {
            fontSize: 64,
            marginBottom: 16,
        },
        emptyTitle: {
            fontSize: 24,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
            textAlign: 'center',
        },
        emptyText: {
            fontSize: 16,
            color: colors.secondaryText,
            textAlign: 'center',
            marginBottom: 24,
        },
        onboardingWrapper: {
            width: '100%',
            marginBottom: 24,
        },
        emptyButton: {
            minWidth: 200,
        },
        fab: {
            position: 'absolute',
            right: 16,
            bottom: 16,
            alignItems: 'flex-end',
        },
        fabButton: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: colors.shadow,
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
            marginTop: 12,
        },
        fabSecondary: {
            backgroundColor: colors.surface,
            width: 48,
            height: 48,
            borderRadius: 24,
        },
        joinModalBackdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'center',
            padding: 24,
        },
        joinModalContent: {
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 20,
            gap: 12,
        },
        joinModalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        joinModalTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
        },
        joinModalDescription: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        joinHelper: {
            fontSize: 12,
            color: colors.secondaryText,
            marginTop: -8,
        },
        joinButtons: {
            gap: 8,
        },
    });
