import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';

import {LoginScreen} from '@/screens/LoginScreen';
import {ListsScreen} from '@/screens/ListsScreen';
import {CreateListScreen} from '@/screens/CreateListScreen';
import {ListDetailsScreen} from '@/screens/ListDetailsScreen';
import {CreateExpenseScreen} from '@/screens/CreateExpenseScreen';
import {AddMemberScreen} from '@/screens/AddMemberScreen';
import {SettingsScreen} from '@/screens/SettingsScreen';
import {useTranslation} from '@i18n';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const ListsStack = () => {
    const {t} = useTranslation();
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Lists"
                component={ListsScreen}
                options={{title: t('lists.myLists')}}
            />
            <Stack.Screen
                name="CreateList"
                component={CreateListScreen}
                options={{title: t('lists.createList'), presentation: 'modal'}}
            />
            <Stack.Screen
                name="ListDetails"
                component={ListDetailsScreen}
                options={{title: t('lists.details')}}
            />
            <Stack.Screen
                name="CreateExpense"
                component={CreateExpenseScreen}
                options={{title: t('expenses.newExpense'), presentation: 'modal'}}
            />
            <Stack.Screen
                name="AddMember"
                component={AddMemberScreen}
                options={{title: t('members.title'), presentation: 'modal'}}
            />
        </Stack.Navigator>
    );
};

const SettingsStack = () => {
    const {t} = useTranslation();
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="SettingsHome"
                component={SettingsScreen}
                options={{title: t('settings.title')}}
            />
        </Stack.Navigator>
    );
};

export const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen}/>
    </Stack.Navigator>
);

export const MainNavigator = () => {
    const {t} = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={({route}) => ({
                tabBarIcon: ({focused, color, size}) => {
                    let iconName: any;

                    if (route.name === 'ListsTab') {
                        iconName = focused ? 'list' : 'list-outline';
                    } else {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color}/>;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="ListsTab"
                component={ListsStack}
                options={{title: t('navigation.lists')}}
            />
            <Tab.Screen
                name="SettingsTab"
                component={SettingsStack}
                options={{title: t('navigation.settings')}}
            />
        </Tab.Navigator>
    );
};
