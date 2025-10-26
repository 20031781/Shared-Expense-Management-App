import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,} from 'react-native';
import {Button, Input} from '@/components';
import {useListsStore} from '@/store/lists.store';
import {useNavigation} from '@react-navigation/native';

export const CreateListScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const {createList, isLoading} = useListsStore();
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('List name is required');
            return;
        }

        try {
            const list = await createList(name.trim());
            Alert.alert('Success', 'List created successfully', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('ListDetails', {listId: list.id}),
                },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create list');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Create New List</Text>
                <Text style={styles.subtitle}>
                    Give your expense list a name to get started
                </Text>

                <Input
                    label="List Name"
                    placeholder="e.g., Weekend Trip, Apartment, etc."
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        setError('');
                    }}
                    error={error}
                    autoFocus
                />

                <View style={styles.buttons}>
                    <Button
                        title="Create List"
                        onPress={handleCreate}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.button}
                    />
                    <Button
                        title="Cancel"
                        onPress={() => navigation.goBack()}
                        variant="secondary"
                        disabled={isLoading}
                        style={styles.button}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 32,
    },
    buttons: {
        marginTop: 24,
    },
    button: {
        marginBottom: 12,
    },
});
