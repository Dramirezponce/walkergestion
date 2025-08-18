import { useState, useCallback } from 'react';
import { api, UserProfile } from '../lib/supabase';

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  phone?: string;
}

interface UpdateUserData {
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  phone?: string;
  is_active: boolean;
}

export function useUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar lista de usuarios
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getUsers();
      setUsers(response.users || []);
      
      return { success: true, users: response.users };
    } catch (err: any) {
      const errorMessage = err.message || 'Error cargando usuarios';
      setError(errorMessage);
      console.error('Error loading users:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nuevo usuario
  const createUser = useCallback(async (userData: CreateUserData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el endpoint de signup del backend
      const response = await api.signUp(userData);
      
      if (response.success) {
        // Recargar la lista de usuarios para obtener el nuevo usuario
        await loadUsers();
        return { success: true, data: response.user };
      } else {
        const errorMessage = response.error || 'Error creando usuario';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error creando usuario';
      setError(errorMessage);
      console.error('Error creating user:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  // Actualizar usuario existente
  const updateUser = useCallback(async (userId: string, userData: UpdateUserData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular actualización usando Supabase directamente
      // En un entorno de producción, esto debería ir a través del backend
      const { supabase } = await import('../lib/supabase');
      
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          name: userData.name,
          role: userData.role,
          phone: userData.phone || null,
          is_active: userData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        const errorMessage = updateError.message || 'Error actualizando usuario';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Actualizar lista local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, ...data } : user
        )
      );

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Error actualizando usuario';
      setError(errorMessage);
      console.error('Error updating user:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Desactivar usuario
  const deactivateUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { supabase } = await import('../lib/supabase');
      
      const { data, error: deactivateError } = await supabase
        .from('user_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (deactivateError) {
        const errorMessage = deactivateError.message || 'Error desactivando usuario';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Actualizar lista local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_active: false } : user
        )
      );

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Error desactivando usuario';
      setError(errorMessage);
      console.error('Error deactivating user:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reactivar usuario
  const reactivateUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { supabase } = await import('../lib/supabase');
      
      const { data, error: reactivateError } = await supabase
        .from('user_profiles')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (reactivateError) {
        const errorMessage = reactivateError.message || 'Error reactivando usuario';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Actualizar lista local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_active: true } : user
        )
      );

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Error reactivando usuario';
      setError(errorMessage);
      console.error('Error reactivating user:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Resetear contraseña de usuario
  const resetUserPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { supabase } = await import('../lib/supabase');
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

      if (resetError) {
        const errorMessage = resetError.message || 'Error enviando reset de contraseña';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Error enviando reset de contraseña';
      setError(errorMessage);
      console.error('Error resetting password:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    clearError,
    loadUsers,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    resetUserPassword
  };
}