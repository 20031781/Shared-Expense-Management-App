import {create} from 'zustand';
import {Expense, ValidationStatus} from '@/types';
import expensesService, {CreateExpenseData} from '@/services/expenses.service';

interface ExpensesState {
    expenses: Expense[];
    userExpenses: Expense[];
    currentExpense: Expense | null;
    isLoading: boolean;
    userExpensesLoading: boolean;
    error: string | null;

    fetchListExpenses: (listId: string, fromDate?: string, toDate?: string) => Promise<void>;
    fetchUserExpenses: (fromDate?: string, toDate?: string) => Promise<void>;
    fetchExpenseById: (id: string) => Promise<void>;
    createExpense: (data: CreateExpenseData) => Promise<Expense>;
    updateExpense: (id: string, data: Partial<CreateExpenseData>) => Promise<Expense>;
    deleteExpense: (id: string) => Promise<void>;
    submitExpense: (id: string) => Promise<void>;
    validateExpense: (id: string, status: ValidationStatus, notes?: string) => Promise<void>;
    uploadReceipt: (expenseId: string, imageUri: string) => Promise<string>;
    setCurrentExpense: (expense: Expense | null) => void;
    clearError: () => void;
}

export const useExpensesStore = create<ExpensesState>((set) => ({
    expenses: [],
    userExpenses: [],
    currentExpense: null,
    isLoading: false,
    userExpensesLoading: false,
    error: null,

    fetchListExpenses: async (listId: string, fromDate?: string, toDate?: string) => {
        try {
            set({isLoading: true, error: null});
            const expenses = await expensesService.getListExpenses(listId, fromDate, toDate);
            set({expenses, isLoading: false});
        } catch (error: any) {
            set({error: error.message, isLoading: false});
        }
    },

    fetchUserExpenses: async (fromDate?: string, toDate?: string) => {
        try {
            set({userExpensesLoading: true, error: null});
            const expenses = await expensesService.getUserExpenses(fromDate, toDate);
            set({userExpenses: expenses, userExpensesLoading: false});
        } catch (error: any) {
            set({error: error.message, userExpensesLoading: false});
        }
    },

    fetchExpenseById: async (id: string) => {
        try {
            set({isLoading: true, error: null});
            const expense = await expensesService.getExpenseById(id);
            set({currentExpense: expense, isLoading: false});
        } catch (error: any) {
            set({error: error.message, isLoading: false});
        }
    },

    createExpense: async (data: CreateExpenseData) => {
        try {
            set({isLoading: true, error: null});
            const expense = await expensesService.createExpense(data);
            set(state => ({
                expenses: [expense, ...state.expenses],
                isLoading: false
            }));
            return expense;
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    updateExpense: async (id: string, data: Partial<CreateExpenseData>) => {
        try {
            set({isLoading: true, error: null});
            const updatedExpense = await expensesService.updateExpense(id, data);
            set(state => ({
                expenses: state.expenses.map(e => e.id === id ? updatedExpense : e),
                currentExpense: state.currentExpense?.id === id ? updatedExpense : state.currentExpense,
                isLoading: false
            }));
            return updatedExpense;
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    deleteExpense: async (id: string) => {
        try {
            set({isLoading: true, error: null});
            await expensesService.deleteExpense(id);
            set(state => ({
                expenses: state.expenses.filter(e => e.id !== id),
                currentExpense: state.currentExpense?.id === id ? null : state.currentExpense,
                isLoading: false
            }));
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    submitExpense: async (id: string) => {
        try {
            set({isLoading: true, error: null});
            const expense = await expensesService.submitExpense(id);
            set(state => ({
                expenses: state.expenses.map(e => e.id === id ? expense : e),
                currentExpense: state.currentExpense?.id === id ? expense : state.currentExpense,
                isLoading: false
            }));
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    validateExpense: async (id: string, status: ValidationStatus, notes?: string) => {
        try {
            set({isLoading: true, error: null});
            await expensesService.validateExpense(id, status, notes);
            const expense = await expensesService.getExpenseById(id);
            set(state => ({
                expenses: state.expenses.map(e => e.id === id ? expense : e),
                currentExpense: state.currentExpense?.id === id ? expense : state.currentExpense,
                isLoading: false
            }));
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    uploadReceipt: async (expenseId: string, imageUri: string) => {
        try {
            set({isLoading: true, error: null});
            const url = await expensesService.uploadReceipt(expenseId, imageUri);
            set({isLoading: false});
            return url;
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    setCurrentExpense: (expense: Expense | null) => set({currentExpense: expense}),

    clearError: () => set({error: null}),
}));
