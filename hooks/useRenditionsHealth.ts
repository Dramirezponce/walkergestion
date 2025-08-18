import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/supabase';

interface RenditionsHealthState {
  isHealthy: boolean;
  missingTables: string[];
  hasTablesError: boolean;
  hasPermissionError: boolean;
  lastCheck: Date | null;
  isChecking: boolean;
  needsSetup: boolean;
}

interface UseRenditionsHealthOptions {
  autoCheck?: boolean;
  checkInterval?: number;
  skipAuthCheck?: boolean;
  userAuthenticated?: boolean;
}

const REQUIRED_RENDITIONS_TABLES = [
  'business_units_97a60276',
  'transfers_97a60276',
  'renditions_97a60276',
  'rendition_expenses_97a60276'
];

export function useRenditionsHealth(options: UseRenditionsHealthOptions = {}) {
  const {
    autoCheck = true,
    checkInterval = 30000, // 30 segundos
    skipAuthCheck = false,
    userAuthenticated = false
  } = options;

  const [state, setState] = useState<RenditionsHealthState>({
    isHealthy: false,
    missingTables: [],
    hasTablesError: false,
    hasPermissionError: false,
    lastCheck: null,
    isChecking: false,
    needsSetup: false
  });

  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Check renditions system health
  const checkRenditionsHealth = useCallback(async (silent: boolean = false) => {
    // Skip check if user not authenticated and we require auth
    if (!skipAuthCheck && !userAuthenticated) {
      if (!silent) {
        console.log('🔍 Saltando verificación de rendiciones - usuario no autenticado');
      }
      setState(prev => ({
        ...prev,
        isHealthy: false,
        hasPermissionError: true,
        needsSetup: false,
        lastCheck: new Date(),
        isChecking: false
      }));
      return false;
    }

    setState(prev => ({ ...prev, isChecking: true }));

    try {
      if (!silent) {
        console.log('🔍 Verificando salud del sistema de rendiciones...');
      }

      const missingTables: string[] = [];
      let hasTablesError = false;
      let hasPermissionError = false;

      // Alternative approach: try direct API calls to detect missing tables
      const tablesToCheck = [
        { name: 'renditions', apiCall: () => api.getRenditions() },
        { name: 'transfers', apiCall: () => api.getTransfers() },
        { name: 'business_units', apiCall: () => api.getBusinessUnits() }
      ];

      for (const { name, apiCall } of tablesToCheck) {
        try {
          await apiCall();
          if (!silent) {
            console.log(`✅ Tabla ${name} existe y es accesible`);
          }
        } catch (error: any) {
          if (!silent) {
            console.warn(`❌ Problema con tabla ${name}:`, error.message);
          }

          // Check if it's a table existence error
          if (
            error.message?.includes('does not exist') ||
            error.message?.includes('relation') ||
            error.code === '42P01'
          ) {
            missingTables.push(name);
            hasTablesError = true;
          } else if (
            error.message?.includes('permission') ||
            error.message?.includes('access') ||
            error.code === '42501'
          ) {
            hasPermissionError = true;
          } else {
            // Other error - assume table missing for safety
            missingTables.push(name);
            hasTablesError = true;
          }
        }
      }

      const isHealthy = missingTables.length === 0 && !hasPermissionError;
      const needsSetup = missingTables.length > 0;

      setState(prev => ({
        ...prev,
        isHealthy,
        missingTables,
        hasTablesError,
        hasPermissionError,
        needsSetup,
        lastCheck: new Date(),
        isChecking: false
      }));

      // Only log critical issues
      if (!isHealthy && !silent && hasTablesError) {
        console.log('🚨 Sistema de rendiciones: tablas faltantes detectadas:', {
          missingTables,
          needsSetup: true
        });
      }

      if (!silent) {
        if (isHealthy) {
          console.log('✅ Sistema de rendiciones saludable');
        } else {
          console.log('⚠️ Sistema de rendiciones requiere atención:', {
            missingTables,
            hasTablesError,
            hasPermissionError,
            needsSetup
          });
        }
      }

      // Reset retry count on successful check
      setRetryCount(0);

      return isHealthy;

    } catch (error: any) {
      console.error('❌ Error verificando salud de rendiciones:', error);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);

      setState(prev => ({
        ...prev,
        isHealthy: false,
        hasTablesError: true,
        needsSetup: true,
        lastCheck: new Date(),
        isChecking: false
      }));

      return false;
    }
  }, [skipAuthCheck, userAuthenticated]);

  // Setup renditions database
  const setupRenditionsDatabase = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isChecking: true }));
      console.log('🔧 Configurando base de datos de rendiciones...');

      const response = await api.setupDatabase();
      console.log('✅ Configuración de rendiciones completada:', response);

      // Wait a moment and recheck
      setTimeout(() => {
        checkRenditionsHealth(false);
      }, 2000);

      return { success: true, message: 'Base de datos configurada exitosamente' };

    } catch (error: any) {
      console.error('❌ Error configurando base de datos de rendiciones:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      
      return { 
        success: false, 
        message: error.message || 'Error configurando base de datos'
      };
    }
  }, [checkRenditionsHealth]);

  // Force recheck
  const recheckHealth = useCallback(() => {
    console.log('🔄 Forzando verificación de salud de rendiciones...');
    setRetryCount(0);
    return checkRenditionsHealth(false);
  }, [checkRenditionsHealth]);

  // Initial check and interval setup
  useEffect(() => {
    if (!autoCheck) return;

    // Initial check with delay to allow component to mount
    const initialTimeout = setTimeout(() => {
      checkRenditionsHealth(false); // Don't be silent for initial check
    }, 100);

    // Set up interval for periodic checks
    const interval = setInterval(() => {
      // Only auto-check if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        checkRenditionsHealth(true);
      }
    }, checkInterval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [autoCheck, checkInterval, checkRenditionsHealth, retryCount, maxRetries]);

  // Check when user authentication status changes
  useEffect(() => {
    if (!skipAuthCheck) {
      checkRenditionsHealth(true);
    }
  }, [userAuthenticated, skipAuthCheck, checkRenditionsHealth]);

  return {
    // Health status
    isHealthy: state.isHealthy,
    isChecking: state.isChecking,
    lastCheck: state.lastCheck,
    
    // Error states
    missingTables: state.missingTables,
    hasTablesError: state.hasTablesError,
    hasPermissionError: state.hasPermissionError,
    needsSetup: state.needsSetup,
    
    // Computed states
    hasCriticalMissing: state.missingTables.length > 0,
    canRetry: retryCount < maxRetries,
    retryCount,
    
    // Actions
    checkHealth: () => checkRenditionsHealth(false),
    recheckHealth,
    setupDatabase: setupRenditionsDatabase,
    
    // Required tables info
    requiredTables: REQUIRED_RENDITIONS_TABLES,
    
    // Helper methods
    getHealthSummary: () => ({
      status: state.isHealthy ? 'healthy' : 'unhealthy',
      issues: [
        ...(state.missingTables.length > 0 ? [`Tablas faltantes: ${state.missingTables.join(', ')}`] : []),
        ...(state.hasPermissionError ? ['Errores de permisos'] : []),
        ...(state.hasTablesError ? ['Errores de estructura de base de datos'] : [])
      ],
      lastCheck: state.lastCheck,
      needsSetup: state.needsSetup
    })
  };
}