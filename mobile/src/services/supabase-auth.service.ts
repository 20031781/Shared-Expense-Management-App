import { supabase } from '@/lib/supabase';
import { AuthTokens } from '@/types';

class SupabaseAuthService {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    return data;
  }

  async signIn(email: string, password: string): Promise<AuthTokens> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('No session created');

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      user: {
        id: data.user.id,
        email: data.user.email!,
        fullName: data.user.user_metadata?.full_name || data.user.email!,
        googleId: null,
      },
    };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);

    if (!data.session) return null;

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      user: {
        id: data.session.user.id,
        email: data.session.user.email!,
        fullName: data.session.user.user_metadata?.full_name || data.session.user.email!,
        googleId: null,
      },
    };
  }

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw new Error(error.message);

    if (!data.session) return null;

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
    };
  }
}

export default new SupabaseAuthService();
