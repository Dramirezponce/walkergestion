import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  company_id?: string;
  business_unit_id?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Refs para evitar memory leaks y race conditions
  const mountedRef = useRef(true);
  const profileLoadingRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Safe state setters que verifican si el componente está montado
  const safeSetUser = useCallback((user: User | null) => {
    if (mountedRef.current) {
      setUser(user);
    }
  }, []);

  const safeSetProfile = useCallback((profile: UserProfile | null) => {
    if (mountedRef.current) {
      setProfile(profile);
    }
  }, []);

  const safeSetLoading = useCallback((loading: boolean) => {
    if (mountedRef.current) {
      setLoading(loading);
    }
  }, []);

  const safeSetInitialized = useCallback((initialized: boolean) => {
    if (mountedRef.current) {
      setInitialized(initialized);
    }
  }, []);

  // Función optimizada para cargar perfil de usuario
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!mountedRef.current || profileLoadingRef.current) {
      return null;
    }

    profileLoadingRef.current = true;

    try {
      console.log('👤 Cargando perfil para userId:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error cargando perfil desde DB:', error.message);
        
        // Si la tabla no existe, no es un error crítico
        if (error.code === '42P01') {
          console.warn('⚠️ Tabla user_profiles no existe - modo graceful degradation');
          return null;
        }
        
        return null;
      }

      if (data && mountedRef.current) {
        console.log('✅ Perfil cargado desde DB:', data.email, '- Rol:', data.role);
        safeSetProfile(data);
        return data;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error crítico cargando perfil:', error.message);
      return null;
    } finally {
      profileLoadingRef.current = false;
    }
  }, [safeSetProfile]);

  // Efecto principal para manejar autenticación
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      try {
        console.log('🔍 === INICIALIZANDO AUTENTICACIÓN ===');
        
        // Verificar sesión existente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error obteniendo sesión inicial:', error.message);
          
          // Solo errores críticos deberían impedir la inicialización
          if (!error.message.includes('Invalid Refresh Token') && 
              !error.message.includes('Refresh Token Not Found')) {
            console.error('💥 Error crítico en sesión inicial');
          }
        }

        if (session?.user && mountedRef.current) {
          console.log('✅ Sesión existente encontrada para:', session.user.email);
          safeSetUser(session.user);
          
          // Cargar perfil de forma asíncrona
          loadUserProfile(session.user.id);
        } else {
          console.log('ℹ️ No hay sesión activa');
          safeSetUser(null);
          safeSetProfile(null);
        }

        // Configurar listener de cambios de autenticación - FIXED VERSION
        console.log('🔧 Configurando listener de auth state changes...');
        
        const authListener = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            if (!mountedRef.current) return;

            console.log('🔄 Auth state cambió:', event, session ? `(${session.user.email})` : '(sin sesión)');
            
            switch (event) {
              case 'SIGNED_IN':
                if (session?.user) {
                  console.log('✅ Usuario autenticado:', session.user.email);
                  safeSetUser(session.user);
                  loadUserProfile(session.user.id);
                }
                break;
                
              case 'SIGNED_OUT':
                console.log('👋 Usuario desconectado');
                safeSetUser(null);
                safeSetProfile(null);
                break;
                
              case 'TOKEN_REFRESHED':
                if (session?.user) {
                  console.log('🔄 Token renovado para:', session.user.email);
                  safeSetUser(session.user);
                  
                  // Solo recargar perfil si es necesario
                  if (!profile || profile.id !== session.user.id) {
                    loadUserProfile(session.user.id);
                  }
                }
                break;
                
              case 'USER_UPDATED':
                if (session?.user) {
                  console.log('👤 Usuario actualizado:', session.user.email);
                  safeSetUser(session.user);
                  loadUserProfile(session.user.id);
                }
                break;
                
              default:
                console.log('ℹ️ Evento de auth no manejado:', event);
            }
          }
        );

        // FIXED: Guardar la referencia correcta de la suscripción
        subscriptionRef.current = authListener.data.subscription;
        console.log('✅ Auth listener configurado correctamente');

        // Finalizar inicialización después de un breve delay para permitir que todo se asiente
        timeoutId = setTimeout(() => {
          if (mountedRef.current) {
            safeSetLoading(false);
            safeSetInitialized(true);
            console.log('✅ === AUTENTICACIÓN INICIALIZADA ===');
          }
        }, 100);

      } catch (error: any) {
        console.error('💥 Error crítico inicializando auth:', error.message);
        
        if (mountedRef.current) {
          safeSetUser(null);
          safeSetProfile(null);
          safeSetLoading(false);
          safeSetInitialized(true);
        }
      }
    };

    initializeAuth();

    // Cleanup - FIXED: usar la referencia correcta
    return () => {
      console.log('🧹 Limpieza de useAuth');
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // FIXED: Verificar y cancelar suscripción correctamente
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
          console.log('✅ Auth subscription cancelada correctamente');
        } catch (error: any) {
          console.warn('⚠️ Error cancelando auth subscription:', error.message);
        } finally {
          subscriptionRef.current = null;
        }
      }
    };
  }, []); // Dependencias vacías para ejecutar solo una vez

  // Función de sign in optimizada
  const signIn = useCallback(async (email: string, password: string) => {
    if (!mountedRef.current) return null;

    try {
      safeSetLoading(true);
      console.log('🔐 === INICIO PROCESO DE LOGIN ===');
      console.log('📧 Email:', email);

      // Verificar si es el usuario administrador especial Daniel
      const isDanielAdmin = email.trim().toLowerCase() === 'd.ramirez.ponce@gmail.com';
      const isValidAdminPassword = password === 'admin123' || password === 'WalkerGestion2024!';
      
      console.log('👤 Es Daniel (admin):', isDanielAdmin);
      console.log('🔑 Contraseña válida para admin:', isValidAdminPassword);

      // Manejar login simulado para el administrador Daniel
      if (isDanielAdmin && isValidAdminPassword) {
        console.log('🎭 === ACTIVANDO LOGIN SIMULADO PARA DANIEL ===');
        
        // Crear un perfil simulado completo
        const simulatedProfile: UserProfile = {
          id: `admin-daniel-ramirez-${Date.now()}`,
          email: 'd.ramirez.ponce@gmail.com',
          name: 'Daniel Ramírez',
          role: 'admin',
          company_id: `walkergestion-company-${Date.now()}`,
          business_unit_id: `walkergestion-business-unit-${Date.now()}`,
          phone: '+56912345678',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Crear usuario simulado con datos completos
        const simulatedUser = {
          id: simulatedProfile.id,
          email: 'd.ramirez.ponce@gmail.com',
          phone: '+56912345678',
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          app_metadata: {
            provider: 'simulation',
            providers: ['simulation']
          },
          user_metadata: {
            name: 'Daniel Ramírez',
            role: 'admin',
            full_name: 'Daniel Ramírez',
          },
          aud: 'authenticated',
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated'
        } as User;

        console.log('👤 Usuario simulado creado:', simulatedUser.email);
        console.log('📋 Perfil simulado creado:', simulatedProfile.name, '-', simulatedProfile.role);

        // Establecer el estado de forma segura
        if (mountedRef.current) {
          safeSetUser(simulatedUser);
          safeSetProfile(simulatedProfile);
          
          console.log('✅ Estado de autenticación simulado establecido');
          console.log('🏢 Company ID:', simulatedProfile.company_id);
          console.log('🏪 Business Unit ID:', simulatedProfile.business_unit_id);
          console.log('🎉 === LOGIN SIMULADO COMPLETADO ===');
          
          return {
            user: simulatedUser,
            session: {
              access_token: `simulated_token_daniel_${Date.now()}`,
              refresh_token: `simulated_refresh_daniel_${Date.now()}`,
              expires_in: 86400, // 24 horas
              token_type: 'bearer',
              user: simulatedUser
            }
          };
        }
      }

      // Para otros usuarios, intentar login normal con Supabase
      console.log('🔄 Intentando autenticación con Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        console.error('❌ Error en autenticación Supabase:', error.message);
        
        // Mensajes de error específicos para Daniel
        if (isDanielAdmin) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Contraseña incorrecta para el administrador. Intenta con: admin123');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Tu cuenta de administrador necesita verificación de email');
          }
        }
        
        // Mapear errores comunes a mensajes más amigables
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email o contraseña incorrectos');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Demasiados intentos. Espera un momento antes de intentar de nuevo');
        } else if (error.message.includes('signup disabled')) {
          throw new Error('El registro está deshabilitado. Contacta al administrador');
        }
        
        throw new Error(error.message);
      }

      if (data.user && mountedRef.current) {
        console.log('✅ Login Supabase exitoso para:', data.user.email);
        // El auth state change handler se encargará de cargar el perfil
        return data;
      }

      throw new Error('No se pudo completar el login');
    } catch (error: any) {
      console.error('❌ === ERROR EN LOGIN ===');
      console.error('Error:', error.message);
      throw error;
    } finally {
      if (mountedRef.current) {
        safeSetLoading(false);
      }
      console.log('🏁 === PROCESO DE LOGIN FINALIZADO ===');
    }
  }, [safeSetLoading, safeSetUser, safeSetProfile]);

  // Función de sign out optimizada
  const signOut = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      safeSetLoading(true);
      console.log('👋 === INICIO LOGOUT ===');

      // Si es un usuario simulado, limpiar estado directamente
      if (user?.id.includes('admin-daniel-ramirez')) {
        console.log('🎭 Cerrando sesión simulada para Daniel');
        safeSetUser(null);
        safeSetProfile(null);
        console.log('✅ Sesión simulada cerrada');
        return;
      }

      // Para usuarios de Supabase, usar el método oficial
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Error cerrando sesión:', error.message);
        throw new Error(error.message);
      }

      console.log('✅ Sesión cerrada exitosamente');
      // El auth state change handler se encargará de limpiar el estado
    } catch (error: any) {
      console.error('❌ Error crítico cerrando sesión:', error.message);
      throw error;
    } finally {
      if (mountedRef.current) {
        safeSetLoading(false);
      }
      console.log('🏁 === LOGOUT FINALIZADO ===');
    }
  }, [user?.id, safeSetLoading, safeSetUser, safeSetProfile]);

  // Función para refrescar perfil
  const refreshProfile = useCallback(async () => {
    if (!user?.id || !mountedRef.current) return;

    console.log('🔄 Refrescando perfil para:', user.email);
    
    // Si es usuario simulado, no intentar recargar desde DB
    if (user.id.includes('admin-daniel-ramirez')) {
      console.log('🎭 Usuario simulado - no necesita refresh desde DB');
      return;
    }

    await loadUserProfile(user.id);
  }, [user?.id, user?.email, loadUserProfile]);

  // Debug info optimizado - solo en desarrollo
  useEffect(() => {
    if (initialized && process.env.NODE_ENV === 'development') {
      console.log('📊 === ESTADO AUTH ===');
      console.log('User:', user ? `${user.email} (${user.id?.substring(0, 8)}...)` : 'null');
      console.log('Profile:', profile ? `${profile.name} - ${profile.role}` : 'null');
      console.log('Loading:', loading);
      console.log('Initialized:', initialized);
      console.log('===================');
    }
  }, [user, profile, loading, initialized]);

  return {
    user,
    profile,
    loading,
    initialized,
    signIn,
    signOut,
    refreshProfile
  };
}