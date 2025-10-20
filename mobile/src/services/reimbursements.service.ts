import { Reimbursement } from '@/types';
import apiService from './api.service';

class ReimbursementsService {
  async getListReimbursements(listId: string): Promise<Reimbursement[]> {
    return apiService.get<Reimbursement[]>(`/reimbursements/list/${listId}`);
  }

  async getUserReimbursements(): Promise<Reimbursement[]> {
    return apiService.get<Reimbursement[]>('/reimbursements/user');
  }

  async generateReimbursements(listId: string): Promise<{ count: number }> {
    return apiService.post<{ count: number }>(`/reimbursements/generate/${listId}`);
  }

  async completeReimbursement(id: string): Promise<Reimbursement> {
    return apiService.put<Reimbursement>(`/reimbursements/${id}/complete`);
  }

  getReimbursementsToPayByUser(reimbursements: Reimbursement[], userId: string): Reimbursement[] {
    return reimbursements.filter(r => r.fromUserId === userId && r.status === 'pending');
  }

  getReimbursementsToReceiveByUser(reimbursements: Reimbursement[], userId: string): Reimbursement[] {
    return reimbursements.filter(r => r.toUserId === userId && r.status === 'pending');
  }

  calculateTotalToPay(reimbursements: Reimbursement[], userId: string): number {
    return this.getReimbursementsToPayByUser(reimbursements, userId)
      .reduce((sum, r) => sum + r.amount, 0);
  }

  calculateTotalToReceive(reimbursements: Reimbursement[], userId: string): number {
    return this.getReimbursementsToReceiveByUser(reimbursements, userId)
      .reduce((sum, r) => sum + r.amount, 0);
  }
}

export default new ReimbursementsService();
