import React, {useEffect, useState} from 'react';
import {Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Button, Card, Loading} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {useExpensesStore} from '@/store/expenses.store';
import {useAuthStore} from '@/store/auth.store';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Expense, ListMember} from '@/types';

export const ListDetailsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const {listId} = route.params;

    const {user} = useAuthStore();
    const {currentList, members, fetchListById, fetchMembers} = useListsStore();
    const {expenses, fetchListExpenses} = useExpensesStore();

    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'expenses' | 'members'>('expenses');

    useEffect(() => {
        loadData();
    }, [listId]);

    const loadData = async () => {
        await Promise.all([
            fetchListById(listId),
            fetchMembers(listId),
            fetchListExpenses(listId),
        ]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleAddExpense = () => {
        navigation.navigate('CreateExpense', {listId});
    };

    const handleAddMember = () => {
        navigation.navigate('AddMember', {listId});
    };

    const handleExpensePress = (expense: Expense) => {
        navigation.navigate('ExpenseDetails', {expenseId: expense.id});
    };

    const handleShareInvite = async () => {
        if (!currentList) return;

        const inviteCode = currentList.inviteCode;
        Alert.alert(
            'Invite Code',
            `Share this code with others to invite them:\n\n${inviteCode}`,
            [
                {
                    text: 'Copy', onPress: () => {
                        // In production, use Clipboard.setString(inviteCode)
                        Alert.alert('Copied', 'Invite code copied to clipboard');
                    }
                },
                {text: 'Close', style: 'cancel'},
            ]
        );
    };

    if (!currentList) {
        return <Loading/>;
    }

    const isAdmin = currentList.adminId === user?.id;

    const renderExpense = (expense: Expense) => (
        <Card key={expense.id} onPress={() => handleExpensePress(expense)}>
            <View style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseDate}>
                        {new Date(expense.expenseDate).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>
                        {expense.currency} {expense.amount.toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, styles[`status${expense.status}`]]}>
                        <Text style={styles.statusText}>{expense.status}</Text>
                    </View>
                </View>
            </View>
        </Card>
    );

    const renderMember = (member: ListMember) => (
        <Card key={member.id}>
            <View style={styles.memberItem}>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                    <View style={styles.memberBadges}>
                        <Text style={styles.memberSplit}>{member.splitPercentage}%</Text>
                        {member.isValidator && (
                            <View style={styles.validatorBadge}>
                                <Ionicons name="shield-checkmark" size={14} color="#34C759"/>
                                <Text style={styles.validatorText}>Validator</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View
                    style={[styles.statusDot, member.status === 'active' ? styles.activeStatus : styles.pendingStatus]}/>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                }
            >
                <View style={styles.header}>
                    <Text style={styles.listName}>{currentList.name}</Text>
                    {isAdmin && (
                        <TouchableOpacity onPress={handleShareInvite} style={styles.inviteButton}>
                            <Ionicons name="share-outline" size={24} color="#007AFF"/>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
                        onPress={() => setActiveTab('expenses')}
                    >
                        <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
                            Expenses ({expenses.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'members' && styles.activeTab]}
                        onPress={() => setActiveTab('members')}
                    >
                        <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
                            Members ({members.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {activeTab === 'expenses' ? (
                        <>
                            {expenses.length === 0 ? (
                                <View style={styles.empty}>
                                    <Text style={styles.emptyIcon}>💸</Text>
                                    <Text style={styles.emptyText}>No expenses yet</Text>
                                    <Button title="Add Expense" onPress={handleAddExpense}/>
                                </View>
                            ) : (
                                expenses.map(renderExpense)
                            )}
                        </>
                    ) : (
                        <>
                            {members.length === 0 ? (
                                <View style={styles.empty}>
                                    <Text style={styles.emptyIcon}>👥</Text>
                                    <Text style={styles.emptyText}>No members yet</Text>
                                    {isAdmin && <Button title="Add Member" onPress={handleAddMember}/>}
                                </View>
                            ) : (
                                members.map(renderMember)
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            {activeTab === 'expenses' && (
                <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
                    <Ionicons name="add" size={32} color="#FFFFFF"/>
                </TouchableOpacity>
            )}

            {activeTab === 'members' && isAdmin && (
                <TouchableOpacity style={styles.fab} onPress={handleAddMember}>
                    <Ionicons name="person-add" size={24} color="#FFFFFF"/>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    listName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
    },
    inviteButton: {
        padding: 8,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 16,
        color: '#8E8E93',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    content: {
        padding: 8,
    },
    expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    expenseInfo: {
        flex: 1,
    },
    expenseTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    expenseDate: {
        fontSize: 14,
        color: '#8E8E93',
    },
    expenseRight: {
        alignItems: 'flex-end',
    },
    expenseAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusdraft: {
        backgroundColor: '#F2F2F7',
    },
    statussubmitted: {
        backgroundColor: '#FFD60A',
    },
    statusvalidated: {
        backgroundColor: '#34C759',
    },
    statusrejected: {
        backgroundColor: '#FF3B30',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberInfo: {
        flex: 1,
    },
    memberEmail: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    memberBadges: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberSplit: {
        fontSize: 14,
        color: '#8E8E93',
        marginRight: 8,
    },
    validatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    validatorText: {
        fontSize: 12,
        color: '#34C759',
        marginLeft: 2,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    activeStatus: {
        backgroundColor: '#34C759',
    },
    pendingStatus: {
        backgroundColor: '#FFD60A',
    },
    empty: {
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 24,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
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
    },
});
