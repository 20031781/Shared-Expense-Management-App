import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthTokens, User} from '@/types';

const TOKENS_KEY = 'auth_tokens';
const USER_KEY = 'current_user';

export class StorageService {
    async saveTokens(tokens: AuthTokens): Promise<void> {
        try {
            await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
        } catch (error) {
            console.error('Error saving tokens:', error);
            throw error;
        }
    }

    async getTokens(): Promise<AuthTokens | null> {
        try {
            const tokens = await SecureStore.getItemAsync(TOKENS_KEY);
            return tokens ? JSON.parse(tokens) : null;
        } catch (error) {
            console.error('Error getting tokens:', error);
            return null;
        }
    }

    async clearTokens(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(TOKENS_KEY);
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    }

    async saveUser(user: User): Promise<void> {
        try {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }

    async getUser(): Promise<User | null> {
        try {
            const user = await AsyncStorage.getItem(USER_KEY);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async clearUser(): Promise<void> {
        try {
            await AsyncStorage.removeItem(USER_KEY);
        } catch (error) {
            console.error('Error clearing user:', error);
        }
    }

    async clearAll(): Promise<void> {
        await this.clearTokens();
        await this.clearUser();
    }

    async setItem(key: string, value: string): Promise<void> {
        await AsyncStorage.setItem(key, value);
    }

    async getItem(key: string): Promise<string | null> {
        return await AsyncStorage.getItem(key);
    }

    async removeItem(key: string): Promise<void> {
        await AsyncStorage.removeItem(key);
    }
}

export default new StorageService();
