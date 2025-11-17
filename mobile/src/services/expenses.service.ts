import {Expense, ExpensePaymentMethod, ExpenseSplit, ExpenseValidation, ValidationStatus} from '@/types';
import apiService from './api.service';

export interface CreateExpenseData {
    listId: string;
    title: string;
    amount: number;
    currency?: string;
    expenseDate: string;
    notes?: string;
    receiptUrl?: string;
    paidByMemberId: string;
    paymentMethod: ExpensePaymentMethod;
    beneficiaryMemberIds: string[];
}

class ExpensesService {
    async getListExpenses(listId: string, fromDate?: string, toDate?: string): Promise<Expense[]> {
        const params: any = {};
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        return apiService.get<Expense[]>(`/expenses/list/${listId}`, params);
    }

    async getUserExpenses(fromDate?: string, toDate?: string): Promise<Expense[]> {
        const params: any = {};
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        return apiService.get<Expense[]>('/expenses/user', params);
    }

    async getExpenseById(id: string): Promise<Expense> {
        return apiService.get<Expense>(`/expenses/${id}`);
    }

    async createExpense(data: CreateExpenseData): Promise<Expense> {
        return apiService.post<Expense>('/expenses', data);
    }

    async updateExpense(id: string, data: Partial<CreateExpenseData>): Promise<Expense> {
        return apiService.put<Expense>(`/expenses/${id}`, data);
    }

    async deleteExpense(id: string): Promise<void> {
        return apiService.delete(`/expenses/${id}`);
    }

    async submitExpense(id: string): Promise<Expense> {
        return apiService.post<Expense>(`/expenses/${id}/submit`);
    }

    async validateExpense(id: string, status: ValidationStatus, notes?: string): Promise<ExpenseValidation> {
        return apiService.post<ExpenseValidation>(`/expenses/${id}/validate`, {
            status,
            notes,
        });
    }

    async getExpenseValidations(id: string): Promise<ExpenseValidation[]> {
        return apiService.get<ExpenseValidation[]>(`/expenses/${id}/validations`);
    }

    async getExpenseSplits(id: string): Promise<ExpenseSplit[]> {
        return apiService.get<ExpenseSplit[]>(`/expenses/${id}/splits`);
    }

    async uploadReceipt(expenseId: string, imageUri: string): Promise<string> {
        const formData = new FormData();

        const filename = imageUri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('receipt', {
            uri: imageUri,
            name: filename,
            type,
        } as any);

        const response = await apiService.upload<{ url: string }>(
            `/expenses/${expenseId}/receipt`,
            formData
        );

        return response.url;
    }
}

export default new ExpensesService();
