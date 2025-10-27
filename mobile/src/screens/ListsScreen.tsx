import React, {useEffect, useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Button, Card, Loading} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {List} from '@/types';
import {useNavigation} from '@react-navigation/native';

export const ListsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const {lists, isLoading, fetchLists, deleteList} = useListsStore();
    const [refreshing, setRefreshing] = useState(false);

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
        Alert.alert(
            'Join List',
            'Enter the invite code to join an existing list',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Coming Soon',
                    onPress: () => {},
                },
            ]
        );
    };

    const handleDeleteList = (list: List) => {
        Alert.alert(
            'Delete List',
            `Are you sure you want to delete "${list.name}"?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteList(list.id);
                            Alert.alert('Success', 'List deleted successfully');
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
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
                        Created {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleDeleteList(item)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30"/>
                </TouchableOpacity>
            </View>
        </Card>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No lists yet</Text>
            <Text style={styles.emptyText}>
                Create your first list or join an existing one
            </Text>
            <Button
                title="Create List"
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
                    <Ionicons name="add" size={32} color="#FFFFFF"/>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.fabButton, styles.fabSecondary]}
                    onPress={handleJoinList}
                >
                    <Ionicons name="enter-outline" size={24} color="#007AFF"/>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
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
        color: '#000000',
        marginBottom: 4,
    },
    listDate: {
        fontSize: 14,
        color: '#8E8E93',
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
        color: '#000000',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
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
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
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
        backgroundColor: '#FFFFFF',
        width: 48,
        height: 48,
        borderRadius: 24,
    },
});
