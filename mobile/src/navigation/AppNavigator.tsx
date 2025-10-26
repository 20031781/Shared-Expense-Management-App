import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';

import {LoginScreen} from '@/screens/LoginScreen';
import {ListsScreen} from '@/screens/ListsScreen';
import {CreateListScreen} from '@/screens/CreateListScreen';
import {ListDetailsScreen} from '@/screens/ListDetailsScreen';
import {CreateExpenseScreen} from '@/screens/CreateExpenseScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const ListsStack = () => (
    <Stack.Navigator>
        <Stack.Screen
            name="Lists"
            component={ListsScreen}
            options={{title: 'My Lists'}}
        />
        <Stack.Screen
            name="CreateList"
            component={CreateListScreen}
            options={{title: 'Create List', presentation: 'modal'}}
        />
        <Stack.Screen
            name="ListDetails"
            component={ListDetailsScreen}
            options={{title: 'List Details'}}
        />
        <Stack.Screen
            name="CreateExpense"
            component={CreateExpenseScreen}
            options={{title: 'New Expense', presentation: 'modal'}}
        />
    </Stack.Navigator>
);

export const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen}/>
    </Stack.Navigator>
);

export const MainNavigator = () => (
    <Tab.Navigator
        screenOptions={({route}) => ({
            tabBarIcon: ({focused, color, size}) => {
                let iconName: any;

                if (route.name === 'ListsTab') {
                    iconName = focused ? 'list' : 'list-outline';
                } else if (route.name === 'Profile') {
                    iconName = focused ? 'person' : 'person-outline';
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
            options={{title: 'Lists'}}
        />
    </Tab.Navigator>
);
