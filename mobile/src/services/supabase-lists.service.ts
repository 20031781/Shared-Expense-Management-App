import {supabase} from '@/lib/supabase';
import {List, ListMember} from '@/types';

class SupabaseListsService {
    async getUserLists(): Promise<List[]> {
        const {data, error} = await supabase
            .from('lists')
            .select('*')
            .order('created_at', {ascending: false});

        if (error) throw new Error(error.message);
        return data || [];
    }

    async getListById(id: string): Promise<List> {
        const {data, error} = await supabase
            .from('lists')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async createList(name: string): Promise<List> {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const {data, error} = await supabase
            .from('lists')
            .insert({
                name,
                admin_id: user.id,
                invite_code: inviteCode,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateList(id: string, name: string): Promise<List> {
        const {data, error} = await supabase
            .from('lists')
            .update({name})
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async deleteList(id: string): Promise<void> {
        const {error} = await supabase
            .from('lists')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }

    async getListMembers(listId: string): Promise<ListMember[]> {
        const {data, error} = await supabase
            .from('list_members')
            .select('*, users(*)')
            .eq('list_id', listId);

        if (error) throw new Error(error.message);
        return data || [];
    }

    async addMember(
        listId: string,
        email: string,
        splitPercentage: number,
        isValidator: boolean
    ): Promise<ListMember> {
        const {data: user, error: userError} = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (userError) throw new Error('User not found');

        const {data, error} = await supabase
            .from('list_members')
            .insert({
                list_id: listId,
                user_id: user.id,
                split_percentage: splitPercentage,
                is_validator: isValidator,
                status: 'active',
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async joinListByCode(inviteCode: string): Promise<List> {
        const {data: list, error: listError} = await supabase
            .from('lists')
            .select('*')
            .eq('invite_code', inviteCode)
            .single();

        if (listError) throw new Error('Invalid invite code');

        const {data: {user}} = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const {error: memberError} = await supabase
            .from('list_members')
            .insert({
                list_id: list.id,
                user_id: user.id,
                split_percentage: 0,
                is_validator: false,
                status: 'active',
            });

        if (memberError) throw new Error(memberError.message);

        return list;
    }
}

export default new SupabaseListsService();
