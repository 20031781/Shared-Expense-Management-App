import {List, ListMember, UpdateMemberPayload} from '@/types';
import apiService from './api.service';

class ListsService {
    async getUserLists(): Promise<List[]> {
        return apiService.get<List[]>('/lists');
    }

    async getListById(id: string): Promise<List> {
        return apiService.get<List>(`/lists/${id}`);
    }

    async createList(name: string): Promise<List> {
        return apiService.post<List>('/lists', {name, members: []});
    }

    async updateList(id: string, name: string): Promise<List> {
        return apiService.put<List>(`/lists/${id}`, {name});
    }

    async deleteList(id: string): Promise<void> {
        return apiService.delete(`/lists/${id}`);
    }

    async getListMembers(listId: string): Promise<ListMember[]> {
        return apiService.get<ListMember[]>(`/lists/${listId}/members`);
    }

    async addMember(listId: string, email: string, isValidator: boolean, displayName?: string): Promise<ListMember> {
        return apiService.post<ListMember>(`/lists/${listId}/members`, {
            email,
            isValidator,
            displayName,
        });
    }

    async updateMember(listId: string, memberId: string, updates: UpdateMemberPayload): Promise<ListMember> {
        return apiService.put<ListMember>(`/lists/${listId}/members/${memberId}`, updates);
    }

    async removeMember(listId: string, memberId: string): Promise<void> {
        return apiService.delete(`/lists/${listId}/members/${memberId}`);
    }

    async joinListByCode(inviteCode: string, displayName?: string): Promise<List> {
        return apiService.post<List>('/lists/join', {inviteCode, displayName});
    }

    async acceptInvite(listId: string): Promise<ListMember> {
        return apiService.post<ListMember>(`/lists/${listId}/accept-invite`);
    }

    async getListByInviteCode(inviteCode: string): Promise<List> {
        return apiService.get<List>(`/lists/invite/${inviteCode}`);
    }

    async generateInviteLink(listId: string): Promise<string> {
        const list = await this.getListById(listId);
        return `splitexpenses://accept/${list.inviteCode}`;
    }

    async generateWhatsAppInvite(listId: string, listName: string): Promise<string> {
        const list = await this.getListById(listId);
        const universalLink = `https://splitexpenses.app/accept/${list.inviteCode}`;
        const deepLink = `splitexpenses://accept/${list.inviteCode}`;
        const message = encodeURIComponent(
            `Ciao! Ti invito ad unirti alla lista "${listName}" su Split Expenses.\n\n` +
            `Codice invito: ${list.inviteCode}\n` +
            `Apri direttamente il link: ${universalLink}\n\n` +
            `Se hai già l'app installata puoi usare anche questo collegamento diretto: ${deepLink}`
        );
        return `whatsapp://send?text=${message}`;
    }
}

export default new ListsService();
