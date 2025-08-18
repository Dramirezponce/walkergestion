import { createClient } from '@supabase/supabase-js';

// =====================================
// CONFIGURACIÓN DEL CLIENTE SUPABASE
// =====================================

// Configuration with fallback values (using the known working values from .env.example)
const supabaseUrl = 'https://boyhheuwgtyeevijxhzb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWhoZXV3Z3R5ZWV2aWp4aHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTAyNTYsImV4cCI6MjA2OTU4NjI1Nn0.GJRf8cWJmFCZi_m0n7ubLUfwm0g6smuiyz_RMtmXcbY';

// Validación de configuración
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Configuración de Supabase incompleta');
}

// Log para debugging
console.log('🔍 WalkerGestion - Cliente Supabase configurado:', {
  url: supabaseUrl,
  projectId: 'boyhheuwgtyeevijxhzb',
  hasAuth: true,
  hasValidConfig: true
});

// Cliente principal de Supabase para frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'walkergestion@3.2'
    }
  }
});

console.log('✅ Cliente Supabase inicializado correctamente');

// =====================================
// FUNCIONES DE VERIFICACIÓN
// =====================================

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    console.log('🔍 Verificando conexión con Supabase...');
    
    // Test básico de conectividad
    const { data, error } = await supabase.auth.getSession();
    
    if (error && !error.message.includes('Invalid Refresh Token')) {
      console.error('❌ Error de conectividad:', error.message);
      return { connected: false, error: error.message };
    }
    
    console.log('✅ Conexión con Supabase establecida');
    return { connected: true };
    
  } catch (error: any) {
    console.error('❌ Error verificando conexión:', error.message);
    return { connected: false, error: error.message };
  }
}

export async function checkDatabaseSchema(): Promise<{
  valid: boolean;
  error?: string;
  tables?: string[];
}> {
  try {
    console.log('🔍 Verificando esquema de base de datos...');
    
    // Verificar tabla crítica: user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error verificando esquema:', error.message);
      return { valid: false, error: error.message };
    }
    
    console.log('✅ Esquema de base de datos válido');
    return { valid: true };
    
  } catch (error: any) {
    console.error('❌ Error verificando esquema:', error.message);
    return { valid: false, error: error.message };
  }
}

// =====================================
// CONFIGURACIÓN Y METADATOS
// =====================================

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  projectId: supabaseUrl?.match(/https:\/\/(.+)\.supabase\.co/)?.[1] || 'boyhheuwgtyeevijxhzb',
  hasValidConfig: !!(supabaseUrl && supabaseAnonKey),
  environment: 'production',
  debug: false
};

// Log de configuración (solo en desarrollo)
if (SUPABASE_CONFIG.debug) {
  console.log('🗄️ WalkerGestion - Supabase configurado:', {
    url: supabaseUrl,
    projectId: SUPABASE_CONFIG.projectId,
    environment: SUPABASE_CONFIG.environment,
    hasAuth: !!supabase.auth,
    hasValidConfig: SUPABASE_CONFIG.hasValidConfig
  });
}

// =====================================
// TIPOS DE DATOS PARA WALKERGESTION
// =====================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  company_id: string | null;
  business_unit_id?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessUnit {
  id: string;
  company_id: string;
  name: string;
  address?: string;
  phone?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  business_unit_id: string;
  cash_register_id?: string;
  amount: number;
  description?: string;
  transaction_type: 'cash' | 'debit' | 'credit';
  created_at: string;
}

export interface Cashflow {
  id: string;
  user_id: string;
  business_unit_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  business_unit_id: string;
  month_year: string;
  target_amount: number;
  actual_amount: number;
  bonus_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  user_id?: string;
  business_unit_id?: string;
  is_read: boolean;
  created_at: string;
}

// =====================================
// FUNCIONES HELPER PARA RLS
// =====================================

export async function withAuth<T>(
  operation: () => Promise<T>
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuario no autenticado');
  }
  
  return operation();
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error obteniendo perfil de usuario:', error);
      return null;
    }
    
    return profile;
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    return null;
  }
}

// =====================================
// EXPORTACIÓN POR DEFECTO
// =====================================

export default supabase;