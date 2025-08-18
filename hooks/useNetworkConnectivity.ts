import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner@2.0.3';

interface NetworkStatus {
  isOnline: boolean;
  isSupabaseReachable: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  lastConnected: Date | null;
  reconnectAttempts: number;
  isReconnecting: boolean;
}

interface ConnectivityTest {
  name: string;
  url: string;
  timeout: number;
  critical: boolean;
}

export function useNetworkConnectivity() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSupabaseReachable: false,
    connectionQuality: 'offline',
    lastConnected: null,
    reconnectAttempts: 0,
    isReconnecting: false
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const testIntervalRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // URLs de prueba para verificar conectividad - memoized to prevent recreation
  const connectivityTests: ConnectivityTest[] = useMemo(() => [
    {
      name: 'Supabase API',
      url: 'https://boyhheuwgtyeevijxhzb.supabase.co/rest/v1/',
      timeout: 5000,
      critical: true
    },
    {
      name: 'Internet básico',
      url: 'https://www.google.com/favicon.ico',
      timeout: 3000,
      critical: false
    },
    {
      name: 'DNS primario',
      url: 'https://cloudflare-dns.com',
      timeout: 3000,
      critical: false
    }
  ], []);

  // Función para testear la conexión a un endpoint específico
  const testEndpoint = useCallback(async (test: ConnectivityTest): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), test.timeout);

      const response = await fetch(test.url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: test.name.includes('Supabase') ? {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWhoZXV3Z3R5ZWV2aWp4aHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTAyNTYsImV4cCI6MjA2OTU4NjI1Nn0.GJRf8cWJmFCZi_m0n7ubLUfwm0g6smuiyz_RMtmXcbY'
        } : {}
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // Función para determinar la calidad de la conexión
  const determineConnectionQuality = useCallback((results: boolean[]): NetworkStatus['connectionQuality'] => {
    const passedTests = results.filter(Boolean).length;
    const totalTests = results.length;
    const percentage = (passedTests / totalTests) * 100;

    if (percentage === 0) return 'offline';
    if (percentage < 50) return 'poor';
    if (percentage < 80) return 'good';
    return 'excellent';
  }, []);

  // Función principal para testear conectividad
  const testConnectivity = useCallback(async (): Promise<NetworkStatus> => {
    console.log('🌐 Iniciando test de conectividad...');

    const startTime = Date.now();
    const testPromises = connectivityTests.map(test => testEndpoint(test));
    const results = await Promise.all(testPromises);
    
    const supabaseReachable = results[0]; // Primer test es siempre Supabase
    const browserOnline = navigator.onLine;
    const quality = determineConnectionQuality(results);
    
    const newStatus: NetworkStatus = {
      isOnline: browserOnline && results.some(Boolean),
      isSupabaseReachable: supabaseReachable,
      connectionQuality: quality,
      lastConnected: results.some(Boolean) ? new Date() : null,
      reconnectAttempts: 0, // Reset on successful test
      isReconnecting: false
    };

    console.log(`🌐 Test completado en ${Date.now() - startTime}ms:`, {
      browserOnline,
      supabaseReachable,
      quality,
      results: connectivityTests.map((test, i) => ({
        name: test.name,
        success: results[i]
      }))
    });

    return newStatus;
  }, [connectivityTests, testEndpoint, determineConnectionQuality]);

  // Función para manejar reconexión automática
  const startReconnection = useCallback(async (currentAttempts: number = 0) => {
    console.log(`🔄 Iniciando intento de reconexión #${currentAttempts + 1}...`);
    
    setNetworkStatus(prev => ({
      ...prev,
      isReconnecting: true,
      reconnectAttempts: currentAttempts + 1
    }));

    // Estrategia de backoff exponencial
    const delay = Math.min(1000 * Math.pow(2, currentAttempts), 30000);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        const newStatus = await testConnectivity();
        
        if (newStatus.isOnline && newStatus.isSupabaseReachable) {
          // Reconexión exitosa
          console.log('✅ Reconexión exitosa');
          
          if (isInitializedRef.current) { // Only show toast after initial load
            toast.success('Conexión restaurada', {
              description: 'WalkerGestión está nuevamente conectado',
              duration: 3000
            });
          }

          setNetworkStatus({
            ...newStatus,
            reconnectAttempts: 0,
            isReconnecting: false
          });
        } else {
          // Reconexión falló, intentar de nuevo
          setNetworkStatus(prev => ({
            ...prev,
            ...newStatus,
            isReconnecting: false
          }));
          
          if (currentAttempts < 10) {
            setTimeout(() => startReconnection(currentAttempts + 1), 2000);
          }
        }
      } catch (error) {
        console.error('❌ Error en reconexión:', error);
        setNetworkStatus(prev => ({
          ...prev,
          isReconnecting: false
        }));
      }
    }, delay);
  }, [testConnectivity]);

  // Función manual para forzar reconexión
  const forceReconnect = useCallback(async () => {
    console.log('🔄 Reconexión manual forzada');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setNetworkStatus(prev => ({
      ...prev,
      reconnectAttempts: 0
    }));

    const newStatus = await testConnectivity();
    setNetworkStatus(newStatus);

    if (!newStatus.isOnline || !newStatus.isSupabaseReachable) {
      startReconnection(0);
    }
  }, [testConnectivity, startReconnection]);

  // Efecto para manejar eventos de conectividad del navegador
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Navegador reporta: ONLINE');
      if (isInitializedRef.current) {
        forceReconnect();
      }
    };

    const handleOffline = () => {
      console.log('🌐 Navegador reporta: OFFLINE');
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        connectionQuality: 'offline'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forceReconnect]);

  // Efecto para test inicial - solo una vez
  useEffect(() => {
    let mounted = true;

    // Test inicial
    testConnectivity().then(initialStatus => {
      if (mounted) {
        setNetworkStatus(initialStatus);
        isInitializedRef.current = true;
      }
    });

    return () => {
      mounted = false;
    };
  }, [testConnectivity]);

  // Efecto separado para monitoreo periódico
  useEffect(() => {
    if (!isInitializedRef.current) return;

    // Test periódico cada 30 segundos
    testIntervalRef.current = setInterval(async () => {
      if (!networkStatus.isReconnecting) {
        const newStatus = await testConnectivity();
        
        setNetworkStatus(prev => {
          // Detectar cambio de estado offline -> online
          if (!prev.isOnline && newStatus.isOnline && isInitializedRef.current) {
            toast.success('Conexión restaurada', {
              description: 'WalkerGestión está de vuelta online'
            });
          }
          
          // Detectar cambio de estado online -> offline
          if (prev.isOnline && !newStatus.isOnline && isInitializedRef.current) {
            toast.error('Conexión perdida', {
              description: 'Intentando reconectar automáticamente...'
            });
            
            // Iniciar proceso de reconexión
            setTimeout(() => startReconnection(0), 1000);
          }

          return newStatus;
        });
      }
    }, 30000);

    return () => {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [testConnectivity, networkStatus.isReconnecting, startReconnection]);

  // Función para obtener diagnóstico detallado
  const getDetailedDiagnosis = useCallback(async () => {
    console.log('🔍 Iniciando diagnóstico detallado...');
    
    const diagnosis = {
      timestamp: new Date(),
      browser: {
        userAgent: navigator.userAgent,
        onLine: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language
      },
      network: {
        effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
        downlink: (navigator as any).connection?.downlink || 'unknown',
        rtt: (navigator as any).connection?.rtt || 'unknown'
      },
      tests: [] as Array<{
        name: string;
        url: string;
        success: boolean;
        error?: string;
        duration: number;
      }>
    };

    for (const test of connectivityTests) {
      const startTime = Date.now();
      try {
        const success = await testEndpoint(test);
        diagnosis.tests.push({
          name: test.name,
          url: test.url,
          success,
          duration: Date.now() - startTime
        });
      } catch (error) {
        diagnosis.tests.push({
          name: test.name,
          url: test.url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime
        });
      }
    }

    return diagnosis;
  }, [connectivityTests, testEndpoint]);

  return {
    networkStatus,
    forceReconnect,
    getDetailedDiagnosis,
    isHealthy: networkStatus.isOnline && networkStatus.isSupabaseReachable,
    connectionQuality: networkStatus.connectionQuality
  };
}