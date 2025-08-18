import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/supabase';
import { useAuth } from './useAuth';

interface DatabaseHealth {
  isLoading: boolean;
  missingTables: string[];
  hasHealthy: boolean;
  isHealthy: boolean;
  hasCriticalMissing: boolean;
  needsSetup: boolean;
  lastChecked: Date | null;
  error: string | null;
  needsAuth: boolean;
  silentMode: boolean;
}

interface DatabaseHealthCheckResult {
  tableName: string;
  exists: boolean;
  error?: string;
  needsAuth?: boolean;
}

const REQUIRED_TABLES = [
  'companies',
  'business_units', 
  'user_profiles',
  'cash_registers',
  'sales',
  'cashflows',
  'transfers',
  'renditions',
  'rendition_expenses',
  'goals',
  'alerts'
];

const CRITICAL_TABLES = [
  'companies',
  'user_profiles',
  'business_units'
];

// Tables that require setup but are not critical for basic operation
const SETUP_REQUIRED_TABLES = [
  'transfers',
  'renditions',
  'rendition_expenses'
];

// Tables that are optional and shouldn't cause warnings in graceful degradation
const OPTIONAL_TABLES = [
  'goals',
  'alerts',
  'cashflows',
  'cash_registers',
  'sales'
];

interface DatabaseHealthOptions {
  skipAuthCheck?: boolean;
  userAuthenticated?: boolean;
  silentMode?: boolean;
}

// Function to detect simulated/emergency users
function isSimulatedUser(user?: any): boolean {
  if (!user) return false;
  return user.id?.includes('admin-daniel-ramirez') || 
         user.id?.includes('emergency') ||
         user.email === 'd.ramirez.ponce@gmail.com';
}

export function useDatabaseHealth(options: DatabaseHealthOptions = {}) {
  const { skipAuthCheck = false, userAuthenticated = false, silentMode = false } = options;
  const { user } = useAuth();
  const hasCheckedRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const checkInProgressRef = useRef(false);
  
  const [health, setHealth] = useState<DatabaseHealth>({
    isLoading: false,
    missingTables: [],
    hasHealthy: false,
    isHealthy: false,
    hasCriticalMissing: false,
    needsSetup: false,
    lastChecked: null,
    error: null,
    needsAuth: false,
    silentMode
  });

  // If user is simulated, return healthy state immediately
  const isUserSimulated = isSimulatedUser(user);

  const checkTableExists = async (tableName: string, silent: boolean = false): Promise<DatabaseHealthCheckResult> => {
    try {
      // For simulated users, return all tables as existing
      if (isUserSimulated) {
        return { tableName, exists: true };
      }

      const exists = await api.checkTableExists(tableName);
      return { tableName, exists };
      
    } catch (error: any) {
      // Solo log warnings si no estamos en modo silencioso o si es una tabla crítica
      const isOptionalTable = OPTIONAL_TABLES.includes(tableName);
      const shouldLog = !silent && (!isOptionalTable || !silentMode);
      
      if (shouldLog && !isUserSimulated) {
        console.warn(`⚠️ Error verificando tabla ${tableName}:`, error.message);
      }
      
      // Si el error es 42P01 (tabla no existe), la tabla no existe
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { tableName, exists: false };
      }
      
      // Si el error es de autorización, marcar que necesita autenticación
      if (error.message?.includes('No autorizado') || 
          error.message?.includes('401') || 
          error.message?.includes('invalid claim') ||
          error.message?.includes('missing sub claim')) {
        return { tableName, exists: true, needsAuth: true };
      }
      
      // Si el error es "Endpoint not found", la tabla probablemente no existe
      if (error.message?.includes('Endpoint not found')) {
        return { tableName, exists: false };
      }
      
      // Para otros errores, asumir que existe pero hay otro problema
      return { tableName, exists: true, error: error.message };
    }
  };

  const checkDatabaseHealth = useCallback(async () => {
    // Skip checks for simulated users
    if (isUserSimulated) {
      setHealth(prev => ({
        ...prev,
        isLoading: false,
        missingTables: [],
        hasHealthy: true,
        isHealthy: true,
        hasCriticalMissing: false,
        needsSetup: false,
        lastChecked: new Date(),
        error: null,
        needsAuth: false,
        silentMode
      }));
      return;
    }

    // Evitar verificaciones múltiples simultáneas
    if (checkInProgressRef.current) {
      return;
    }

    // Evitar verificaciones muy frecuentes (máximo cada 30 segundos)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 30000 && hasCheckedRef.current) {
      return;
    }

    // Si no hay autenticación y no queremos saltarla, no hacer nada
    if (!skipAuthCheck && !userAuthenticated) {
      setHealth(prev => ({
        ...prev,
        isLoading: false,
        needsAuth: true,
        error: null,
        missingTables: [],
        hasHealthy: false,
        isHealthy: false,
        hasCriticalMissing: false,
        needsSetup: false,
        silentMode
      }));
      return;
    }

    try {
      checkInProgressRef.current = true;
      lastCheckTimeRef.current = now;
      
      setHealth(prev => ({ ...prev, isLoading: true, error: null, needsAuth: false, silentMode }));
      
      // Solo log si no estamos en modo silencioso
      if (!silentMode) {
        console.log('🔍 Verificando salud de la base de datos...');
      }
      
      // Verificar solo tablas críticas primero para mejor rendimiento
      const criticalChecks = await Promise.allSettled(
        CRITICAL_TABLES.map(table => checkTableExists(table, silentMode))
      );
      
      const criticalResults: DatabaseHealthCheckResult[] = criticalChecks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return { 
            tableName: CRITICAL_TABLES[index], 
            exists: false, 
            error: result.reason?.message || 'Error desconocido'
          };
        }
      });
      
      // Verificar si necesitamos autenticación para las tablas críticas
      const needsAuthResults = criticalResults.filter(result => result.needsAuth);
      if (needsAuthResults.length > 0) {
        if (!silentMode) {
          console.log('🔐 Verificaciones críticas requieren autenticación');
        }
        setHealth(prev => ({
          ...prev,
          isLoading: false,
          needsAuth: true,
          error: 'Se requiere autenticación para verificar tablas críticas',
          missingTables: [],
          hasHealthy: false,
          isHealthy: false,
          hasCriticalMissing: false,
          needsSetup: false,
          silentMode
        }));
        return;
      }
      
      const missingCritical = criticalResults
        .filter(result => !result.exists)
        .map(result => result.tableName);
      
      const hasCriticalMissing = missingCritical.length > 0;
      
      // Verificar tablas de setup (renditions, transfers, etc.) siempre
      const setupChecks = await Promise.allSettled(
        SETUP_REQUIRED_TABLES.map(table => checkTableExists(table, silentMode))
      );
      
      const setupResults: DatabaseHealthCheckResult[] = setupChecks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return { 
            tableName: SETUP_REQUIRED_TABLES[index], 
            exists: false, 
            error: result.reason?.message || 'Error desconocido'
          };
        }
      });
      
      const missingSetup = setupResults
        .filter(result => !result.exists)
        .map(result => result.tableName);
      
      // Solo verificar tablas opcionales si no hay problemas críticos
      let missingOptional: string[] = [];
      
      if (!hasCriticalMissing) {
        const optionalChecks = await Promise.allSettled(
          OPTIONAL_TABLES.map(table => checkTableExists(table, silentMode))
        );
        
        const optionalResults: DatabaseHealthCheckResult[] = optionalChecks.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return { 
              tableName: OPTIONAL_TABLES[index], 
              exists: false, 
              error: result.reason?.message || 'Error desconocido'
            };
          }
        });
        
        missingOptional = optionalResults
          .filter(result => !result.exists)
          .map(result => result.tableName);
      }
      
      const allMissingTables = [...missingCritical, ...missingSetup, ...missingOptional];
      const hasHealthy = allMissingTables.length === 0;
      const needsSetup = missingCritical.length > 0 || missingSetup.length > 0;
      
      setHealth({
        isLoading: false,
        missingTables: allMissingTables,
        hasHealthy,
        isHealthy: hasHealthy,
        hasCriticalMissing,
        needsSetup,
        lastChecked: new Date(),
        error: null,
        needsAuth: false,
        silentMode
      });
      
      hasCheckedRef.current = true;
      
      // Log diferenciado según el modo y tipo de tablas faltantes
      if (!silentMode) {
        if (hasCriticalMissing) {
          console.warn('⚠️ Verificación de base de datos - Tablas críticas faltantes:', missingCritical);
        } else if (missingSetup.length > 0) {
          console.warn('🔧 Verificación de base de datos - Tablas de sistema faltantes:', missingSetup);
        } else if (allMissingTables.length > 0) {
          console.log('ℹ️ Verificación de base de datos - Algunas funcionalidades limitadas');
        } else {
          console.log('✅ Verificación de base de datos completada - Todas las tablas disponibles');
        }
      }
      
    } catch (error: any) {
      if (!silentMode) {
        console.error('❌ Error verificando salud de base de datos:', error);
      }
      setHealth(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error verificando base de datos',
        needsAuth: error.message?.includes('autorizado') || error.message?.includes('401'),
        silentMode
      }));
    } finally {
      checkInProgressRef.current = false;
    }
  }, [skipAuthCheck, userAuthenticated, silentMode, isUserSimulated]);

  // Skip automatic health checks for simulated users
  useEffect(() => {
    if (isUserSimulated) {
      // Set healthy state immediately for simulated users
      setHealth(prev => ({
        ...prev,
        isLoading: false,
        missingTables: [],
        hasHealthy: true,
        isHealthy: true,
        hasCriticalMissing: false,
        needsSetup: false,
        lastChecked: new Date(),
        error: null,
        needsAuth: false,
        silentMode: true // Always silent for simulated users
      }));
      return;
    }

    // Only check for real users
    if ((userAuthenticated || skipAuthCheck) && !hasCheckedRef.current) {
      const timeoutId = setTimeout(() => {
        checkDatabaseHealth();
      }, 1000); // Pequeño delay para evitar verificaciones innecesarias

      return () => clearTimeout(timeoutId);
    }
  }, [checkDatabaseHealth, userAuthenticated, skipAuthCheck, isUserSimulated]);

  const recheckHealth = useCallback(() => {
    // Skip for simulated users
    if (isUserSimulated) {
      console.log('🎭 Usuario simulado - saltando verificación de salud');
      return;
    }

    hasCheckedRef.current = false;
    lastCheckTimeRef.current = 0;
    if (userAuthenticated || skipAuthCheck) {
      checkDatabaseHealth();
    } else if (!silentMode) {
      console.warn('⚠️ No se puede recargar salud de base de datos - usuario no autenticado');
    }
  }, [checkDatabaseHealth, userAuthenticated, skipAuthCheck, silentMode, isUserSimulated]);

  // Only show banner for critical missing tables or when not in silent mode
  const shouldShowBanner = health.hasCriticalMissing || 
    (!silentMode && health.missingTables.length > 0 && !health.isLoading && !health.needsAuth);

  return {
    ...health,
    recheckHealth,
    shouldShowBanner,
    criticalMissing: health.hasCriticalMissing,
    optionalMissing: health.missingTables.filter(table => OPTIONAL_TABLES.includes(table)).length
  };
}

// Hook simplificado para casos específicos que no requiere autenticación
export function useTableExistsPublic(tableName: string) {
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const checkTable = async () => {
      try {
        setLoading(true);
        setNeedsAuth(false);
        
        // Usar endpoint de health que no requiere autenticación
        const response = await fetch('/api/health');
        if (response.ok) {
          setExists(true);
        } else {
          setExists(false);
        }
      } catch (error: any) {
        // Silent check for public usage
        if (error.message?.includes('autorizado') || error.message?.includes('401')) {
          setNeedsAuth(true);
          setExists(null);
        } else if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setExists(false);
        } else {
          setExists(true); // Asumir que existe si hay otro tipo de error
        }
      } finally {
        setLoading(false);
      }
    };

    if (tableName) {
      checkTable();
    }
  }, [tableName]);

  return { exists, loading, needsAuth };
}