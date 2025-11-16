import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,} from 'react-native';
import {Button, Input, Loading} from '@/components';
import {useAuthStore} from '@/store/auth.store';

export const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const {login, signUp, isLoading} = useAuthStore();

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        try {
            if (isSignUp) {
                await signUp(email, password);
                Alert.alert('Success', 'Account created successfully!');
            } else {
                await login(email, password);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Authentication failed');
        }
    };

    if (isLoading) {
        return <Loading/>;
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>💰</Text>
                        <Text style={styles.title}>Split Expenses</Text>
                        <Text style={styles.subtitle}>
                            Share expenses with friends and family
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Input
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Input
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <Button
                            title={isSignUp ? 'Sign Up' : 'Sign In'}
                            onPress={handleSubmit}
                            disabled={isLoading}
                            loading={isLoading}
                            style={styles.submitButton}
                        />

                        <Button
                            title={isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                            onPress={() => setIsSignUp(!isSignUp)}
                            variant="outline"
                            style={styles.switchButton}
                        />
                    </View>

                    <Text style={styles.terms}>
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </Text>
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
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    logo: {
        fontSize: 80,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
    },
    formContainer: {
        gap: 16,
    },
    submitButton: {
        marginTop: 8,
    },
    switchButton: {
        marginTop: 8,
    },
    terms: {
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 24,
        paddingHorizontal: 20,
    },
});
