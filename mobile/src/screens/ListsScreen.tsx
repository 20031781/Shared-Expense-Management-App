import React, {useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Button, Card, Loading} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {List} from '@/types';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

export const ListsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const {lists, isLoading, fetchLists, deleteList} = useListsStore();
    const [refreshing, setRefreshing] = useState(false);
    const {t} = useTranslation();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = async () => {
        await fetchLists();
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLists();
        setRefreshing(false);
    };

    const handleCreateList = () => {
        navigation.navigate('CreateList');
    };

    const handleListPress = (list: List) => {
        navigation.navigate('ListDetails', {listId: list.id});
    };

    const handleJoinList = () => {
        Alert.alert(t('lists.joinTitle'), t('lists.joinDescription'), [
            {text: t('lists.joinAction'), style: 'default'},
        ]);
    };

    const handleDeleteList = (list: List) => {
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
    };

    const renderList = ({item}: { item: List }) => (
        <Card onPress={() => handleListPress(item)}>
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
        </Card>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>{t('lists.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('lists.emptySubtitle')}</Text>
            <Button
                title={t('lists.createList')}
                onPress={handleCreateList}
                style={styles.emptyButton}
            />
        </View>
    );

    if (isLoading && lists.length === 0) {
        return <Loading/>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={lists}
                renderItem={renderList}
                keyExtractor={(item) => item.id}
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
        </View>
    );
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
    });
