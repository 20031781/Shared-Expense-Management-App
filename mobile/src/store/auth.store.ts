import {create} from 'zustand';
import {User} from '@/types';
import authService from '@/services/auth.service';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        error: null
    }),

    login: async (email: string, password: string) => {
        try {
            set({isLoading: true, error: null});
            const response = await authService.loginWithEmail(email, password);
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.message || 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    signUp: async (email: string, password: string) => {
        try {
            set({isLoading: true, error: null});
            const response = await authService.registerWithEmail(email, password);
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.message || 'Sign up failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: async () => {
        try {
            set({isLoading: true});
            await authService.logout();
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        } catch (error: any) {
            set({
                error: error.message || 'Logout failed',
                isLoading: false
            });
        }
    },

    initialize: async () => {
        try {
            set({isLoading: true});
            const user = await authService.initialize();
            set({
                user,
                isAuthenticated: !!user,
                isLoading: false
            });
        } catch (error) {
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false
            });
        }
    },

    updateProfile: async (updates: Partial<User>) => {
        try {
            set({isLoading: true, error: null});
            set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null,
                isLoading: false
            }));
        } catch (error: any) {
            set({
                error: error.message || 'Update failed',
                isLoading: false
            });
            throw error;
        }
    },

    clearError: () => set({error: null}),
}));
