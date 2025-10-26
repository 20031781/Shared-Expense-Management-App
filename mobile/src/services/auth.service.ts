import * as WebBrowser from 'expo-web-browser';
import {LoginResponse, User} from '@/types';
import apiService from './api.service';
import storageService from './storage.service';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '';
const GOOGLE_CLIENT_ID_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || '';
const GOOGLE_CLIENT_ID_WEB = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '';

class AuthService {
    private currentUser: User | null = null;

    async initialize(): Promise<User | null> {
        const user = await storageService.getUser();
        const tokens = await storageService.getTokens();

        if (user && tokens) {
            const now = new Date();
            const expiresAt = new Date(tokens.expiresAt);

            if (expiresAt > now) {
                this.currentUser = user;
                return user;
            }
        }

        return null;
    }

    async registerWithEmail(email: string, password: string): Promise<LoginResponse> {
        try {
            const response = await apiService.post<LoginResponse>('/auth/register', {
                email,
                password,
            });

            await storageService.saveTokens(response.tokens);
            await storageService.saveUser(response.user);
            this.currentUser = response.user;

            return response;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    async loginWithEmail(email: string, password: string): Promise<LoginResponse> {
        try {
            const response = await apiService.post<LoginResponse>('/auth/login', {
                email,
                password,
            });

            await storageService.saveTokens(response.tokens);
            await storageService.saveUser(response.user);
            this.currentUser = response.user;

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async loginWithGoogle(idToken: string): Promise<LoginResponse> {
        try {
            const response = await apiService.post<LoginResponse>('/auth/google', {
                googleIdToken: idToken,
            });

            await storageService.saveTokens(response.tokens);
            await storageService.saveUser(response.user);
            this.currentUser = response.user;

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            const tokens = await storageService.getTokens();
            if (tokens) {
                await apiService.post('/auth/logout');
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            await storageService.clearAll();
            this.currentUser = null;
        }
    }

    async updateProfile(updates: Partial<User>): Promise<User> {
        try {
            const user = await apiService.put<User>('/auth/profile', updates);
            await storageService.saveUser(user);
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    async isAuthenticated(): Promise<boolean> {
        const tokens = await storageService.getTokens();
        if (!tokens) return false;

        const now = new Date();
        const expiresAt = new Date(tokens.expiresAt);
        return expiresAt > now;
    }

    getGoogleConfig() {
        return {
            iosClientId: GOOGLE_CLIENT_ID_IOS,
            androidClientId: GOOGLE_CLIENT_ID_ANDROID,
            webClientId: GOOGLE_CLIENT_ID_WEB,
        };
    }
}

export default new AuthService();
