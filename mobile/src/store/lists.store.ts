import {create} from 'zustand';
import {List, ListMember, UpdateMemberPayload} from '@/types';
import listsService from '@/services/lists.service';

interface ListsState {
    lists: List[];
    currentList: List | null;
    members: ListMember[];
    isLoading: boolean;
    error: string | null;

    fetchLists: () => Promise<void>;
    fetchListById: (id: string) => Promise<void>;
    fetchMembers: (listId: string) => Promise<void>;
    createList: (name: string) => Promise<List>;
    updateList: (id: string, name: string) => Promise<void>;
    deleteList: (id: string) => Promise<void>;
    addMember: (listId: string, email: string, displayName: string | undefined, isValidator: boolean) => Promise<void>;
    updateMember: (listId: string, memberId: string, updates: UpdateMemberPayload) => Promise<void>;
    removeMember: (listId: string, memberId: string) => Promise<void>;
    joinList: (inviteCode: string, displayName?: string) => Promise<void>;
    acceptInviteByCode: (inviteCode: string) => Promise<void>;
    setCurrentList: (list: List | null) => void;
    clearError: () => void;
}

export const useListsStore = create<ListsState>((set, get) => ({
    lists: [],
    currentList: null,
    members: [],
    isLoading: false,
    error: null,

    fetchLists: async () => {
        try {
            set({isLoading: true, error: null});
            const lists = await listsService.getUserLists();
            set({lists, isLoading: false});
        } catch (error: any) {
            set({error: error.message, isLoading: false});
        }
    },

    fetchListById: async (id: string) => {
        try {
            set({isLoading: true, error: null});
            const list = await listsService.getListById(id);
            set({currentList: list, isLoading: false});
        } catch (error: any) {
            set({error: error.message, isLoading: false});
        }
    },

    fetchMembers: async (listId: string) => {
        try {
            set({isLoading: true, error: null});
            const members = await listsService.getListMembers(listId);
            set({members, isLoading: false});
        } catch (error: any) {
            set({error: error.message, isLoading: false});
        }
    },

    createList: async (name: string) => {
        try {
            set({isLoading: true, error: null});
            const list = await listsService.createList(name);
            set(state => ({
                lists: [...state.lists, list],
                isLoading: false
            }));
            return list;
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    updateList: async (id: string, name: string) => {
        try {
            set({isLoading: true, error: null});
            const updatedList = await listsService.updateList(id, name);
            set(state => ({
                lists: state.lists.map(l => l.id === id ? updatedList : l),
                currentList: state.currentList?.id === id ? updatedList : state.currentList,
                isLoading: false
            }));
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    deleteList: async (id: string) => {
        try {
            set({isLoading: true, error: null});
            await listsService.deleteList(id);
            set(state => ({
                lists: state.lists.filter(l => l.id !== id),
                currentList: state.currentList?.id === id ? null : state.currentList,
                isLoading: false
            }));
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    addMember: async (listId: string, email: string, displayName: string | undefined, isValidator: boolean) => {
        try {
            set({isLoading: true, error: null});
            const member = await listsService.addMember(listId, email, isValidator, displayName);
            set(state => ({
                members: [...state.members, member],
                isLoading: false
            }));
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    updateMember: async (listId: string, memberId: string, updates: UpdateMemberPayload) => {
        try {
            set({isLoading: true, error: null});
            const updatedMember = await listsService.updateMember(listId, memberId, updates);
            set(state => ({
                members: state.members.map(m => m.id === memberId ? updatedMember : m),
                isLoading: false
            }));
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    removeMember: async (listId: string, memberId: string) => {
        try {
            set({isLoading: true, error: null});
            await listsService.removeMember(listId, memberId);
            set(state => ({
                members: state.members.filter(m => m.id !== memberId),
                isLoading: false
            }));
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    joinList: async (inviteCode: string, displayName?: string) => {
        try {
            set({isLoading: true, error: null});
            const normalizedCode = inviteCode.trim().toUpperCase();
            const list = await listsService.joinListByCode(normalizedCode, displayName);
            set(state => {
                const exists = state.lists.some(l => l.id === list.id);
                return {
                    lists: exists ? state.lists : [...state.lists, list],
                    isLoading: false
                };
            });
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    acceptInviteByCode: async (inviteCode: string) => {
        try {
            set({isLoading: true, error: null});
            const normalizedCode = inviteCode.trim().toUpperCase();
            const list = await listsService.getListByInviteCode(normalizedCode);
            await listsService.acceptInvite(list.id);
            set(state => {
                const exists = state.lists.some(l => l.id === list.id);
                return {
                    lists: exists ? state.lists : [...state.lists, list],
                    isLoading: false
                };
            });
        } catch (error: any) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    setCurrentList: (list: List | null) => set({currentList: list}),

    clearError: () => set({error: null}),
}));
