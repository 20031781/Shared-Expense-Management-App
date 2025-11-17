import * as WebBrowser from 'expo-web-browser';
import {AuthResponse, LoginResponse, User} from '@/types';
import apiService from './api.service';
import storageService from './storage.service';
import {buildAuthTokens} from '@/lib/token-utils';

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
            const response = await apiService.post<AuthResponse>('/auth/register', {
                email,
                password,
            });

            return await this.persistAuthResponse(response);
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    async loginWithEmail(email: string, password: string): Promise<LoginResponse> {
        try {
            const response = await apiService.post<AuthResponse>('/auth/login', {
                email,
                password,
            });

            return await this.persistAuthResponse(response);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async loginWithGoogle(idToken: string): Promise<LoginResponse> {
        try {
            const response = await apiService.post<AuthResponse>('/auth/google', {
                googleIdToken: idToken,
            });

            return await this.persistAuthResponse(response);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            const tokens = await storageService.getTokens();
            if (tokens?.refreshToken) {
                await apiService.post('/auth/logout', {refreshToken: tokens.refreshToken});
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

    async registerDeviceToken(token: string, platform: 'ios' | 'android'): Promise<void> {
        try {
            await apiService.post('/auth/device-token', {token, platform});
        } catch (error) {
            console.error('Device token registration error:', error);
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

    private async persistAuthResponse(response: AuthResponse): Promise<LoginResponse> {
        const tokens = buildAuthTokens(response.accessToken, response.refreshToken);
        await storageService.saveTokens(tokens);
        await storageService.saveUser(response.user);
        this.currentUser = response.user;

        return {
            user: response.user,
            tokens,
        };
    }
}

export default new AuthService();
