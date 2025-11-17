import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';

import {LoginScreen} from '@/screens/LoginScreen';
import {ListsScreen} from '@/screens/ListsScreen';
import {CreateListScreen} from '@/screens/CreateListScreen';
import {ListDetailsScreen} from '@/screens/ListDetailsScreen';
import {CreateExpenseScreen} from '@/screens/CreateExpenseScreen';
import {ExpenseDetailsScreen} from '@/screens/ExpenseDetailsScreen';
import {AddMemberScreen} from '@/screens/AddMemberScreen';
import {EditMemberScreen} from '@/screens/EditMemberScreen';
import {SettingsScreen} from '@/screens/SettingsScreen';
import {AnalyticsScreen} from '@/screens/AnalyticsScreen';
import {useTranslation} from '@i18n';
import {useAppTheme} from '@theme';

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
            <Stack.Screen
                name="EditMember"
                component={EditMemberScreen}
                options={{title: t('members.editTitle'), presentation: 'modal'}}
            />
            <Stack.Screen
                name="ExpenseDetails"
                component={ExpenseDetailsScreen}
                options={{title: t('expenses.detailsTitle')}}
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

const AnalyticsStack = () => {
    const {t} = useTranslation();
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="AnalyticsHome"
                component={AnalyticsScreen}
                options={{title: t('analytics.title')}}
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
    const {colors} = useAppTheme();
    return (
        <Tab.Navigator
            screenOptions={({route}) => ({
                tabBarIcon: ({focused, color, size}) => {
                    const iconMap: Record<string, {active: any; inactive: any}> = {
                        ListsTab: {active: 'list', inactive: 'list-outline'},
                        AnalyticsTab: {active: 'stats-chart', inactive: 'stats-chart-outline'},
                        SettingsTab: {active: 'settings', inactive: 'settings-outline'},
                    };
                    const selected = iconMap[route.name] ?? iconMap.ListsTab;
                    const iconName = focused ? selected.active : selected.inactive;
                    return <Ionicons name={iconName} size={size} color={color}/>;
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.secondaryText,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.surfaceSecondary,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="ListsTab"
                component={ListsStack}
                options={{title: t('navigation.lists')}}
            />
            <Tab.Screen
                name="AnalyticsTab"
                component={AnalyticsStack}
                options={{title: t('navigation.analytics')}}
            />
            <Tab.Screen
                name="SettingsTab"
                component={SettingsStack}
                options={{title: t('navigation.settings')}}
            />
        </Tab.Navigator>
    );
};
