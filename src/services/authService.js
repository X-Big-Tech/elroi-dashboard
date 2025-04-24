import { supabase } from '../lib/supabaseClient';

// This is a simple auth service stub that simulates authentication
// In a real app, you would use Supabase authentication properly

const authService = {
  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { user: data?.user, error };
  },
  
  // Sign up with email and password
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    return { user: data?.user, error };
  },
  
  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
  
  // Get the current user
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return data?.user;
  },
  
  // Get current session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return data?.session;
  },
  
  // Reset password
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },
  
  // Update password
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { user: data?.user, error };
  },
  
  // OAuth sign in with a specific provider
  signInWithProvider: async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        scopes: getProviderScopes(provider),
      }
    });
    return { data, error };
  },
  
  // Get connected accounts for a user
  getConnectedAccounts: async (userId) => {
    const { data, error } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching connected accounts:', error);
      return [];
    }
    return data || [];
  },
  
  // Connect new OAuth provider for existing user
  connectProvider: async (provider) => {
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard?tab=connections`,
        scopes: getProviderScopes(provider),
      }
    });
    return { data, error };
  },
  
  // Disconnect a provider
  disconnectProvider: async (userId, providerId) => {
    const { error } = await supabase
      .from('oauth_connections')
      .delete()
      .match({ user_id: userId, provider: providerId });
    
    return { error };
  }
};

// Helper function to get appropriate scopes for each provider
function getProviderScopes(provider) {
  switch(provider) {
    case 'google':
      return 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/youtube.readonly';
    case 'twitch':
      return 'user:read:email analytics:read:games';
    case 'discord':
      return 'identify email connections';
    case 'spotify':
      return 'user-read-email user-read-private user-library-read';
    case 'playstation':
      return 'psn:s2s';
    default:
      return '';
  }
}

export default authService; 