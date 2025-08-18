import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../utils/supabase/info'

// Configuración de Supabase Real
const supabaseUrl = `https://${projectId}.supabase.co`
const supabaseAnonKey = publicAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Tipos de datos
export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'cashier'
  company_id: string | null
  business_unit_id?: string | null
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  description?: string
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BusinessUnit {
  id: string
  company_id: string
  name: string
  address?: string
  phone?: string
  manager_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CashRegister {
  id: string
  business_unit_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  user_id: string
  business_unit_id: string
  cash_register_id?: string
  amount: number
  description?: string
  transaction_type: 'cash' | 'debit' | 'credit'
  created_at: string
}

export interface Cashflow {
  id: string
  user_id: string
  business_unit_id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  created_at: string
}

export interface Transfer {
  id: string
  from_user_id: string
  to_business_unit_id: string
  amount: number
  week_identifier: string
  status: 'pending' | 'received' | 'rendition_pending' | 'completed'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Rendition {
  id: string
  transfer_id: string
  business_unit_id: string
  user_id: string
  week_identifier: string
  transfer_amount: number
  total_expenses: number
  remaining_amount: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  notes?: string
  created_at: string
  updated_at: string
}

export interface RenditionExpense {
  id: string
  rendition_id: string
  description: string
  amount: number
  provider: string
  provider_type: string
  payment_method: string
  document_type: 'boleta' | 'factura'
  document_number?: string
  is_paid: boolean
  expense_date: string
  created_at: string
}

export interface Goal {
  id: string
  business_unit_id: string
  month_year: string
  target_amount: number
  actual_amount: number
  bonus_percentage: number
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  user_id?: string
  business_unit_id?: string
  is_read: boolean
  created_at: string
}

// Clase de error customizada para tablas faltantes
export class TableNotExistsError extends Error {
  public needsSetup: boolean;
  public tableName: string;

  constructor(message: string, tableName: string) {
    super(message);
    this.name = 'TableNotExistsError';
    this.needsSetup = true;
    this.tableName = tableName;
  }
}

// Función para verificar la conexión con Supabase
export const checkSupabaseConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  try {
    // Verificar configuración básica
    if (!supabaseUrl || !supabaseAnonKey) {
      return { connected: false, error: 'Configuración de Supabase incompleta' };
    }

    // Test de conectividad básica
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
      console.error('❌ Error de conectividad:', error.message);
      return { connected: false, error: error.message };
    }
    
    return { connected: true };
    
  } catch (error: any) {
    console.error('❌ Error verificando conexión:', error.message);
    return { connected: false, error: error.message };
  }
};

// Función para verificar el backend
export const checkBackendHealth = async (): Promise<{ healthy: boolean; error?: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos

    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-97a60276/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { healthy: false, error: `Backend respondió con status ${response.status}` };
    }

    const data = await response.json();
    return { healthy: true };

  } catch (error: any) {
    return { healthy: false, error: `Backend no disponible: ${error.message}` };
  }
};

// Función para verificar la salud completa del sistema
export const verifySystemHealth = async (): Promise<{ 
  ready: boolean; 
  connectivity: boolean;
  database: boolean; 
  backend: boolean; 
  errors: string[] 
}> => {
  const errors: string[] = [];
  
  // Verificar conectividad a Supabase
  let hasConnectivity = false;
  let dbConnected = false;
  let backendHealthy = false;

  try {
    const { connected, error: dbError } = await checkSupabaseConnection();
    dbConnected = connected;
    hasConnectivity = connected;
    
    if (dbError) {
      errors.push(`Database: ${dbError}`);
    }
  } catch (error: any) {
    errors.push(`Connectivity: ${error.message}`);
  }

  // Verificar backend (opcional)
  try {
    const { healthy, error: backendError } = await checkBackendHealth();
    backendHealthy = healthy;
    
    if (backendError) {
      errors.push(`Backend: ${backendError}`);
    }
  } catch (error: any) {
    errors.push(`Backend: ${error.message}`);
  }

  // Sistema listo solo si hay conectividad básica
  const ready = hasConnectivity && dbConnected;
  
  return {
    ready,
    connectivity: hasConnectivity,
    database: dbConnected,
    backend: backendHealthy,
    errors
  };
};

// API helper functions para interactuar con el backend
const API_BASE = `${supabaseUrl}/functions/v1/make-server-97a60276`;

// Global flag for graceful degradation mode
let GRACEFUL_DEGRADATION_MODE = true;

// Function to detect simulated/emergency users
function isSimulatedUser(token?: string): boolean {
  if (!token) return false;
  return token.includes('simulated_token') || token.includes('emergency');
}

// Mock data for simulated users
const getMockData = (endpoint: string) => {
  const endpointMocks: Record<string, any> = {
    '/companies': { companies: [] },
    '/business-units': [
      { 
        id: 'mock-business-unit-1', 
        name: 'Local Principal', 
        location: 'Centro' 
      }
    ],
    '/users': { users: [] },
    '/cash-registers': [],
    '/sales': { sales: [] },
    '/cashflows': { cashflows: [] },
    '/transfers': { transfers: [] },
    '/renditions': { renditions: [] },
    '/goals': { goals: [] },
    '/alerts': { alerts: [] }
  };

  return endpointMocks[endpoint] || { mockData: true, message: 'Datos de demostración' };
};

export const api = {
  // Method to control warning verbosity
  setGracefulDegradationMode(enabled: boolean) {
    GRACEFUL_DEGRADATION_MODE = enabled;
    if (!enabled) {
      console.log(`🔧 Graceful degradation mode disabled - full error reporting enabled`);
    }
  },
  
  // Helper para hacer requests autenticados optimizado
  async request(endpoint: string, options: RequestInit = {}) {
    try {
      // Obtener sesión actual una sola vez
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || supabaseAnonKey;
      
      // Detectar usuarios simulados y retornar datos mock
      if (isSimulatedUser(token)) {
        console.log('🎭 Usuario simulado detectado - retornando datos mock para:', endpoint);
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
        
        // Retornar datos mock apropiados
        return getMockData(endpoint);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 segundos

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        let errorData: any = {};
        
        try {
          errorData = await response.json();
          
          // Build detailed error message
          if (errorData.error) {
            errorMessage = errorData.error;
            
            // Add specific details for better user understanding
            if (errorData.code === 'HAS_DEPENDENCIES' && errorData.dependencies) {
              const deps = errorData.dependencies;
              errorMessage += `. Tiene ${deps.totalUsers} usuario(s) y ${deps.totalBusinessUnits} unidad(es) asociadas.`;
              if (deps.users.length > 0) {
                errorMessage += ` Usuarios: ${deps.users.slice(0, 3).join(', ')}${deps.users.length > 3 ? '...' : ''}`;
              }
            } else if (errorData.code === 'FOREIGN_KEY_CONSTRAINT') {
              errorMessage += '. Elimina primero todos los datos relacionados.';
            } else if (errorData.code === 'TABLE_NOT_EXISTS' || errorData.code === '42P01') {
              errorMessage += '. La base de datos necesita configuración inicial.';
            } else if (errorData.details) {
              errorMessage += ` (${errorData.details})`;
            }
            
            if (errorData.suggestion) {
              errorMessage += ` Sugerencia: ${errorData.suggestion}`;
            }
          }
        } catch (parseError) {
          // Silent error parsing in production
        }
        
        const error = new Error(errorMessage);
        (error as any).code = errorData.code;
        (error as any).details = errorData.details;
        (error as any).dependencies = errorData.dependencies;
        (error as any).needsSetup = errorData.needsSetup;
        throw error;
      }

      const responseData = await response.json();
      
      // Si hay warnings sobre tabla faltante, loggear solo en modo debug
      if (responseData.warning && !GRACEFUL_DEGRADATION_MODE) {
        console.warn('⚠️ API Warning:', responseData.warning);
      }
      
      return responseData;
    } catch (error: any) {
      if (!GRACEFUL_DEGRADATION_MODE) {
        console.error(`❌ API Request Failed [${endpoint}]:`, error.message);
      }
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout en la solicitud - el servidor no respondió a tiempo');
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Error de conexión - verifica tu internet y que el backend esté funcionando');
      }
      
      // Si es un error de tabla faltante, lanzar error específico
      if (error.code === '42P01' || error.needsSetup) {
        const tableName = extractTableNameFromEndpoint(endpoint);
        throw new TableNotExistsError(
          `La tabla ${tableName} no existe. Configure la base de datos desde Configuración.`,
          tableName
        );
      }
      
      throw new Error(error.message || 'Error de conexión desconocido');
    }
  },

  // Setup database endpoint
  async setupDatabase() {
    try {
      console.log('🗄️ Iniciando configuración de base de datos...');
      const response = await this.request('/setup/database', {
        method: 'POST'
      });
      return response;
    } catch (error: any) {
      console.error('❌ Error configurando base de datos:', error.message);
      throw error;
    }
  },

  // Check if a specific table exists - with simulated user support
  async checkTableExists(tableName: string) {
    try {
      // Check for simulated users first
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || supabaseAnonKey;
      
      if (isSimulatedUser(token)) {
        console.log('🎭 Usuario simulado - todas las tablas "existen" para propósitos de demo');
        return true; // For simulated users, all tables "exist"
      }
      
      const response = await this.request(`/health/table/${tableName}`, {
        method: 'GET'
      });
      return response.exists || false;
    } catch (error: any) {
      // If we get a table not exists error, that's what we're checking for
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return false;
      }
      // For other errors (like auth), assume table exists for safety in simulated mode
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || supabaseAnonKey;
      if (isSimulatedUser(token)) {
        return true;
      }
      throw error;
    }
  },

  // Companies - with mock support
  async getCompanies() {
    try {
      const response = await this.request('/companies');
      return response.companies || [];
    } catch (error: any) {
      if (error instanceof TableNotExistsError || 
          error.code === '42P01' || 
          error.message?.includes('does not exist')) {
        return [];
      }
      
      if (!GRACEFUL_DEGRADATION_MODE) {
        console.warn('⚠️ Error cargando empresas:', error.message);
      }
      return [];
    }
  },

  async createCompany(company: { name: string; description?: string }) {
    const response = await this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
    return response.company;
  },

  async deleteCompany(companyId: string) {
    try {
      return await this.request(`/companies/${companyId}`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      throw new Error(`Error eliminando empresa: ${error.message}`);
    }
  },

  // Business Units - with mock support
  async getBusinessUnits(filters?: { company_id?: string }) {
    try {
      const params = new URLSearchParams();
      if (filters?.company_id) params.append('company_id', filters.company_id);
      
      const queryString = params.toString();
      const response = await this.request(`/business-units${queryString ? `?${queryString}` : ''}`);
      return response || [];
    } catch (error: any) {
      // Si es un error de tabla faltante, propagarlo para que el componente pueda manejarlo
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('🚨 Tabla de business_units no existe - propagando error para configuración');
        throw error; // Propagar el error para que el componente lo maneje
      }
      
      if (error instanceof TableNotExistsError) {
        throw error; // También propagar TableNotExistsError
      }
      
      if (!GRACEFUL_DEGRADATION_MODE) {
        console.warn('⚠️ Error cargando unidades de negocio:', error.message);
      }
      return [];
    }
  },

  async getBusinessUnit(businessUnitId: string) {
    const response = await this.request(`/business-units/${businessUnitId}`);
    return response;
  },

  async createBusinessUnit(unit: { company_id: string; name: string; address?: string; phone?: string }) {
    const response = await this.request('/business-units', {
      method: 'POST',
      body: JSON.stringify(unit),
    });
    return response.businessUnit;
  },

  async deleteBusinessUnit(businessUnitId: string) {
    return this.request(`/business-units/${businessUnitId}`, {
      method: 'DELETE'
    });
  },

  // Cash Registers - with mock support
  async getCashRegisters(filters?: { company_id?: string; business_unit_id?: string }) {
    try {
      const params = new URLSearchParams();
      if (filters?.company_id) params.append('company_id', filters.company_id);
      if (filters?.business_unit_id) params.append('business_unit_id', filters.business_unit_id);
      
      const queryString = params.toString();
      const response = await this.request(`/cash-registers${queryString ? `?${queryString}` : ''}`);
      return response || [];
    } catch (error: any) {
      if (error instanceof TableNotExistsError) {
        return [];
      }
      throw error;
    }
  },

  async createCashRegister(cashRegister: { 
    business_unit_id: string; 
    name: string; 
    code: string; 
  }) {
    const response = await this.request('/cash-registers', {
      method: 'POST',
      body: JSON.stringify(cashRegister),
    });
    return response.cashRegister;
  },

  async deleteCashRegister(cashRegisterId: string) {
    return this.request(`/cash-registers/${cashRegisterId}`, {
      method: 'DELETE'
    });
  },

  // Sales - with mock support
  async getSales(filters?: { 
    dateFilter?: string; 
    typeFilter?: string; 
    business_unit_id?: string; 
    cash_register_id?: string; 
    company_id?: string; 
  }) {
    try {
      const params = new URLSearchParams();
      if (filters?.dateFilter) params.append('dateFilter', filters.dateFilter);
      if (filters?.typeFilter) params.append('typeFilter', filters.typeFilter);
      if (filters?.business_unit_id) params.append('business_unit_id', filters.business_unit_id);
      if (filters?.cash_register_id) params.append('cash_register_id', filters.cash_register_id);
      if (filters?.company_id) params.append('company_id', filters.company_id);
      
      const queryString = params.toString();
      const response = await this.request(`/sales${queryString ? `?${queryString}` : ''}`);
      return response.sales || [];
    } catch (error: any) {
      if (error instanceof TableNotExistsError) {
        return [];
      }
      throw error;
    }
  },

  async createSale(sale: { 
    amount: number; 
    description?: string; 
    transaction_type: 'cash' | 'debit' | 'credit';
    business_unit_id?: string;
    cash_register_id?: string;
  }) {
    const response = await this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
    return response.sale;
  },

  // Cashflows - with mock support
  async getCashflows() {
    try {
      const response = await this.request('/cashflows');
      return response.cashflows || [];
    } catch (error: any) {
      if (error instanceof TableNotExistsError || 
          error.code === '42P01' || 
          error.message?.includes('does not exist')) {
        return [];
      }
      return [];
    }
  },

  async createCashflow(cashflow: { type: string; category: string; amount: number; description?: string }) {
    const response = await this.request('/cashflows', {
      method: 'POST',
      body: JSON.stringify(cashflow),
    });
    return response.cashflow;
  },

  async updateCashflowStatus(id: string, status: 'approved' | 'rejected') {
    return this.request(`/cashflows/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Transfers - with mock support
  async getTransfers() {
    try {
      const response = await this.request('/transfers');
      return response.transfers || [];
    } catch (error: any) {
      // Si es un error de tabla faltante, propagarlo para que el componente pueda manejarlo
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('🚨 Tabla de transfers no existe - propagando error para configuración');
        throw error; // Propagar el error para que el componente lo maneje
      }
      
      if (error instanceof TableNotExistsError) {
        throw error; // También propagar TableNotExistsError
      }
      
      return [];
    }
  },

  async createTransfer(transfer: {
    to_business_unit_id: string;
    amount: number;
    week_identifier: string;
    notes?: string;
  }) {
    const response = await this.request('/transfers', {
      method: 'POST',
      body: JSON.stringify(transfer),
    });
    return response.transfer;
  },

  async updateTransferStatus(transferId: string, status: string) {
    const response = await this.request(`/transfers/${transferId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.transfer;
  },

  // Renditions - with mock support
  async getRenditions() {
    try {
      const response = await this.request('/renditions');
      return response.renditions || [];
    } catch (error: any) {
      // Si es un error de tabla faltante, propagarlo para que el componente pueda manejarlo
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('🚨 Tabla de renditions no existe - propagando error para configuración');
        // Create a more specific error for missing table
        const tableError = new Error(`Tabla 'renditions' no existe en la base de datos`);
        (tableError as any).code = '42P01';
        (tableError as any).needsSetup = true;
        throw tableError;
      }
      
      // Solo log si no es error de tabla faltante
      if (!GRACEFUL_DEGRADATION_MODE && 
          !error.message?.includes('tabla') &&
          !error.message?.includes('relationship')) {
        console.error('❌ Error fetching renditions (non-table):', error.message);
      }
      
      if (error instanceof TableNotExistsError) {
        throw error; // También propagar TableNotExistsError
      }
      
      throw error; // Propagar otros errores también
    }
  },

  async createRendition(rendition: {
    transfer_id: string;
    business_unit_id: string;
    week_identifier: string;
    transfer_amount: number;
    expenses?: any[];
    notes?: string;
  }) {
    const response = await this.request('/renditions', {
      method: 'POST',
      body: JSON.stringify(rendition),
    });
    return response.rendition;
  },

  async deleteRendition(renditionId: string) {
    try {
      return await this.request(`/renditions/${renditionId}`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      throw new Error(`Error eliminando rendición: ${error.message}`);
    }
  },

  // Users - with mock support
  async getUsers() {
    try {
      const response = await this.request('/users');
      return response.users || [];
    } catch (error: any) {
      if (error instanceof TableNotExistsError) {
        return [];
      }
      throw error;
    }
  },

  async createUser(userData: { 
    name: string; 
    email: string; 
    password: string; 
    role: string; 
    company_id?: string; 
    business_unit_id?: string;
    cash_register_id?: string;
    phone?: string;
  }) {
    const response = await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.user;
  },

  async updateUserStatus(userId: string, isActive: boolean) {
    const response = await this.request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
    return response.user;
  },

  // Goals - with mock support
  async getGoals() {
    try {
      const response = await this.request('/goals');
      return response.goals || [];
    } catch (error: any) {
      if (error instanceof TableNotExistsError || 
          error.code === '42P01' || 
          error.message?.includes('does not exist')) {
        return [];
      }
      return [];
    }
  },

  async createGoal(goal: { 
    business_unit_id: string; 
    month_year: string; 
    target_amount: number; 
    bonus_percentage?: number 
  }) {
    const response = await this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    return response.goal;
  },

  async deleteGoal(goalId: string) {
    return this.request(`/goals/${goalId}`, {
      method: 'DELETE'
    });
  },

  // Dashboard Stats - with mock support
  async getDashboardStats() {
    try {
      const response = await this.request('/dashboard/stats');
      return response.stats || {};
    } catch (error: any) {
      if (error instanceof TableNotExistsError) {
        return {
          totalSales: 0,
          totalRevenue: 0,
          pendingCashflows: 0,
          activeGoals: 0,
          recentSales: [],
          monthlyGrowth: 0
        };
      }
      throw error;
    }
  },

  // Auth
  async signUp(userData: { email: string; password: string; name: string; role?: string }) {
    const response = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  }
};

// Helper function para extraer nombre de tabla del endpoint
function extractTableNameFromEndpoint(endpoint: string): string {
  const parts = endpoint.split('/').filter(Boolean);
  const tablePart = parts[0];
  
  const tableMap: { [key: string]: string } = {
    'renditions': 'renditions',
    'transfers': 'transfers',
    'sales': 'sales',
    'companies': 'companies',
    'business-units': 'business_units',
    'cash-registers': 'cash_registers',
    'cashflows': 'cashflows',
    'goals': 'goals',
    'alerts': 'alerts',
    'users': 'user_profiles'
  };
  
  return tableMap[tablePart] || tablePart;
}

// Información de configuración
export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  projectId,
  hasValidConfig: !!(supabaseUrl && supabaseAnonKey && projectId)
};

// Configuración en modo silencioso por defecto
api.setGracefulDegradationMode(true);