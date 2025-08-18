import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  company_id: string | null;
  business_unit_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  settings: Record<string, any>;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  // State
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;

  // Methods
  signIn: (email: string, password: string) => Promise<{ user: User; profile: UserProfile }>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ user: User; profile: UserProfile }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;

  // Utilities
  hasRole: (role: 'admin' | 'manager' | 'cashier') => boolean;
  hasAnyRole: (roles: ('admin' | 'manager' | 'cashier')[]) => boolean;
  canAccessBusinessUnit: (businessUnitId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (initialSession?.user && mounted) {
          const userProfile = await fetchProfile(initialSession.user.id);
          
          if (mounted) {
            setSession(initialSession);
            setUser(initialSession.user);
            setProfile(userProfile);
          }
        }

        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);

        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          setSession(session);
          setUser(session.user);
          setProfile(userProfile);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    const userProfile = await fetchProfile(data.user.id);
    if (!userProfile) throw new Error('Profile not found');

    return { user: data.user, profile: userProfile };
  }, [fetchProfile]);

  // Sign up
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    userData: Partial<UserProfile>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email,
        ...userData
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return { user: data.user, profile };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    setProfile(data);
    return data;
  }, [user]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    const userProfile = await fetchProfile(user.id);
    setProfile(userProfile);
  }, [user, fetchProfile]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  // Utility functions
  const hasRole = useCallback((role: 'admin' | 'manager' | 'cashier') => {
    return profile?.role === role;
  }, [profile]);

  const hasAnyRole = useCallback((roles: ('admin' | 'manager' | 'cashier')[]) => {
    return profile ? roles.includes(profile.role) : false;
  }, [profile]);

  const canAccessBusinessUnit = useCallback((businessUnitId: string) => {
    if (!profile) return false;
    
    if (profile.role === 'admin') return true;
    return profile.business_unit_id === businessUnitId;
  }, [profile]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    resetPassword,
    updatePassword,
    hasRole,
    hasAnyRole,
    canAccessBusinessUnit,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}