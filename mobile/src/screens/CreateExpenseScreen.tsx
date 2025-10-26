import React, {useState} from 'react';
import {
    Alert,
    KeyboardAvoidingView,
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

export const CreateExpenseScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const {listId} = route.params;

    const {createExpense, uploadReceipt, isLoading} = useExpensesStore();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [receiptUri, setReceiptUri] = useState<string | null>(null);
    const [errors, setErrors] = useState<any>({});

    const validate = () => {
        const newErrors: any = {};

        if (!title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!amount || parseFloat(amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePickImage = async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photos');
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
            Alert.alert('Permission Required', 'Please allow access to your camera');
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
            });

            if (receiptUri) {
                await uploadReceipt(expense.id, receiptUri);
            }

            Alert.alert('Success', 'Expense created successfully', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create expense');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>New Expense</Text>

                <Input
                    label="Title"
                    placeholder="e.g., Dinner, Gas, etc."
                    value={title}
                    onChangeText={(text) => {
                        setTitle(text);
                        setErrors({...errors, title: undefined});
                    }}
                    error={errors.title}
                    autoFocus
                />

                <Input
                    label="Amount"
                    placeholder="0.00"
                    value={amount}
                    onChangeText={(text) => {
                        setAmount(text);
                        setErrors({...errors, amount: undefined});
                    }}
                    error={errors.amount}
                    keyboardType="decimal-pad"
                />

                <Input
                    label="Notes (Optional)"
                    placeholder="Add any additional details..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                />

                <View style={styles.receiptSection}>
                    <Text style={styles.label}>Receipt Photo (Optional)</Text>

                    <View style={styles.receiptButtons}>
                        <TouchableOpacity style={styles.receiptButton} onPress={handleTakePhoto}>
                            <Ionicons name="camera-outline" size={24} color="#007AFF"/>
                            <Text style={styles.receiptButtonText}>Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.receiptButton} onPress={handlePickImage}>
                            <Ionicons name="images-outline" size={24} color="#007AFF"/>
                            <Text style={styles.receiptButtonText}>Choose Photo</Text>
                        </TouchableOpacity>
                    </View>

                    {receiptUri && (
                        <View style={styles.receiptPreview}>
                            <Ionicons name="checkmark-circle" size={24} color="#34C759"/>
                            <Text style={styles.receiptPreviewText}>Receipt added</Text>
                            <TouchableOpacity onPress={() => setReceiptUri(null)}>
                                <Ionicons name="close-circle" size={24} color="#FF3B30"/>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.buttons}>
                    <Button
                        title="Create Expense"
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
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    receiptSection: {
        marginVertical: 16,
    },
    receiptButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    receiptButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    receiptButtonText: {
        fontSize: 14,
        color: '#007AFF',
        marginLeft: 8,
    },
    receiptPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 12,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
    },
    receiptPreviewText: {
        flex: 1,
        fontSize: 14,
        color: '#34C759',
        marginLeft: 8,
    },
    buttons: {
        marginTop: 24,
    },
    button: {
        marginBottom: 12,
    },
});
