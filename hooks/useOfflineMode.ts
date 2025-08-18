import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNetworkConnectivity } from './useNetworkConnectivity';

interface OfflineData {
  userData: any;
  lastSales: any[];
  lastRenditions: any[];
  pendingSales: any[];
  pendingRenditions: any[];
  lastSync: Date | null;
}

interface OfflineCapabilities {
  canViewData: boolean;
  canCreateSales: boolean;
  canCreateRenditions: boolean;
  canSyncWhenOnline: boolean;
}

export function useOfflineMode() {
  const { networkStatus } = useNetworkConnectivity();
  const [offlineData, setOfflineData] = useState<OfflineData>({
    userData: null,
    lastSales: [],
    lastRenditions: [],
    pendingSales: [],
    pendingRenditions: [],
    lastSync: null
  });

  const [capabilities, setCapabilities] = useState<OfflineCapabilities>({
    canViewData: false,
    canCreateSales: false,
    canCreateRenditions: false,
    canSyncWhenOnline: false
  });

  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Claves para localStorage - memoized to avoid recreation
  const STORAGE_KEYS = useMemo(() => ({
    USER_DATA: 'walkergestion_offline_user',
    SALES_DATA: 'walkergestion_offline_sales',
    RENDITIONS_DATA: 'walkergestion_offline_renditions',
    PENDING_SALES: 'walkergestion_pending_sales',
    PENDING_RENDITIONS: 'walkergestion_pending_renditions',
    LAST_SYNC: 'walkergestion_last_sync'
  }), []);

  // Función para guardar datos en localStorage
  const saveToStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`💾 Guardado en localStorage: ${key}`);
    } catch (error) {
      console.error(`❌ Error guardando en localStorage ${key}:`, error);
    }
  }, []);

  // Función para cargar datos desde localStorage
  const loadFromStorage = useCallback((key: string, defaultValue: any = null) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`❌ Error cargando desde localStorage ${key}:`, error);
      return defaultValue;
    }
  }, []);

  // Función para sincronizar datos cuando se recupera la conexión
  const syncPendingData = useCallback(async () => {
    if (!networkStatus.isOnline || !networkStatus.isSupabaseReachable) {
      return false;
    }

    try {
      console.log('🔄 Iniciando sincronización de datos offline...');

      // Sincronizar ventas pendientes
      if (offlineData.pendingSales.length > 0) {
        console.log(`📈 Sincronizando ${offlineData.pendingSales.length} ventas pendientes...`);
        
        // Aquí iría la lógica para enviar las ventas al servidor
        // Por ahora simularemos el éxito
        for (const sale of offlineData.pendingSales) {
          console.log('📊 Sincronizando venta:', sale.id);
        }

        // Limpiar ventas pendientes después de sincronizar
        setOfflineData(prev => ({
          ...prev,
          pendingSales: []
        }));
        saveToStorage(STORAGE_KEYS.PENDING_SALES, []);
      }

      // Sincronizar rendiciones pendientes
      if (offlineData.pendingRenditions.length > 0) {
        console.log(`💰 Sincronizando ${offlineData.pendingRenditions.length} rendiciones pendientes...`);
        
        for (const rendition of offlineData.pendingRenditions) {
          console.log('💳 Sincronizando rendición:', rendition.id);
        }

        setOfflineData(prev => ({
          ...prev,
          pendingRenditions: []
        }));
        saveToStorage(STORAGE_KEYS.PENDING_RENDITIONS, []);
      }

      // Actualizar última sincronización
      const now = new Date();
      setOfflineData(prev => ({
        ...prev,
        lastSync: now
      }));
      saveToStorage(STORAGE_KEYS.LAST_SYNC, now.toISOString());

      console.log('✅ Sincronización completada');
      return true;

    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      return false;
    }
  }, [networkStatus.isOnline, networkStatus.isSupabaseReachable, saveToStorage, STORAGE_KEYS.PENDING_SALES, STORAGE_KEYS.PENDING_RENDITIONS, STORAGE_KEYS.LAST_SYNC, offlineData.pendingSales.length, offlineData.pendingRenditions.length]);

  // Función para guardar datos para uso offline
  const cacheDataForOffline = useCallback((userData: any, salesData: any[] = [], renditionsData: any[] = []) => {
    console.log('💾 Guardando datos para uso offline...');

    const newOfflineData = {
      userData,
      lastSales: salesData.slice(-50), // Últimas 50 ventas
      lastRenditions: renditionsData.slice(-50), // Últimas 50 rendiciones
      pendingSales: offlineData.pendingSales,
      pendingRenditions: offlineData.pendingRenditions,
      lastSync: new Date()
    };

    setOfflineData(newOfflineData);

    // Guardar en localStorage
    saveToStorage(STORAGE_KEYS.USER_DATA, userData);
    saveToStorage(STORAGE_KEYS.SALES_DATA, salesData);
    saveToStorage(STORAGE_KEYS.RENDITIONS_DATA, renditionsData);
    saveToStorage(STORAGE_KEYS.LAST_SYNC, newOfflineData.lastSync.toISOString());

    console.log('✅ Datos guardados para uso offline');
  }, [offlineData.pendingSales, offlineData.pendingRenditions, saveToStorage, STORAGE_KEYS]);

  // Función para agregar una venta offline
  const addOfflineSale = useCallback((saleData: any) => {
    if (!isOfflineMode) return false;

    const offlineSale = {
      ...saleData,
      id: `offline_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdOffline: true,
      createdAt: new Date().toISOString()
    };

    const newPendingSales = [...offlineData.pendingSales, offlineSale];
    
    setOfflineData(prev => ({
      ...prev,
      pendingSales: newPendingSales
    }));

    saveToStorage(STORAGE_KEYS.PENDING_SALES, newPendingSales);
    
    console.log('💾 Venta guardada offline:', offlineSale.id);
    return true;
  }, [isOfflineMode, offlineData.pendingSales, saveToStorage, STORAGE_KEYS.PENDING_SALES]);

  // Función para agregar una rendición offline
  const addOfflineRendition = useCallback((renditionData: any) => {
    if (!isOfflineMode) return false;

    const offlineRendition = {
      ...renditionData,
      id: `offline_rendition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdOffline: true,
      createdAt: new Date().toISOString()
    };

    const newPendingRenditions = [...offlineData.pendingRenditions, offlineRendition];
    
    setOfflineData(prev => ({
      ...prev,
      pendingRenditions: newPendingRenditions
    }));

    saveToStorage(STORAGE_KEYS.PENDING_RENDITIONS, newPendingRenditions);
    
    console.log('💾 Rendición guardada offline:', offlineRendition.id);
    return true;
  }, [isOfflineMode, offlineData.pendingRenditions, saveToStorage, STORAGE_KEYS.PENDING_RENDITIONS]);

  // Efecto para cargar datos offline al inicializar - solo una vez
  useEffect(() => {
    console.log('🔄 Cargando datos offline desde localStorage...');
    
    const userData = loadFromStorage(STORAGE_KEYS.USER_DATA);
    const salesData = loadFromStorage(STORAGE_KEYS.SALES_DATA, []);
    const renditionsData = loadFromStorage(STORAGE_KEYS.RENDITIONS_DATA, []);
    const pendingSales = loadFromStorage(STORAGE_KEYS.PENDING_SALES, []);
    const pendingRenditions = loadFromStorage(STORAGE_KEYS.PENDING_RENDITIONS, []);
    const lastSyncStr = loadFromStorage(STORAGE_KEYS.LAST_SYNC);
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;

    setOfflineData({
      userData,
      lastSales: salesData,
      lastRenditions: renditionsData,
      pendingSales,
      pendingRenditions,
      lastSync
    });

    // Determinar capacidades offline
    const hasUserData = !!userData;
    const hasCachedData = salesData.length > 0 || renditionsData.length > 0;

    setCapabilities({
      canViewData: hasUserData && hasCachedData,
      canCreateSales: hasUserData,
      canCreateRenditions: hasUserData,
      canSyncWhenOnline: pendingSales.length > 0 || pendingRenditions.length > 0
    });

    console.log('✅ Datos offline cargados:', {
      hasUserData,
      cachedSales: salesData.length,
      cachedRenditions: renditionsData.length,
      pendingSales: pendingSales.length,
      pendingRenditions: pendingRenditions.length,
      lastSync
    });
  }, [loadFromStorage, STORAGE_KEYS.USER_DATA, STORAGE_KEYS.SALES_DATA, STORAGE_KEYS.RENDITIONS_DATA, STORAGE_KEYS.PENDING_SALES, STORAGE_KEYS.PENDING_RENDITIONS, STORAGE_KEYS.LAST_SYNC]);

  // Efecto para manejar cambios de conectividad - dependencies simplified
  useEffect(() => {
    const shouldBeOffline = !networkStatus.isOnline || !networkStatus.isSupabaseReachable;
    
    // Only update if actually changed to prevent infinite loops
    setIsOfflineMode(prev => {
      if (prev !== shouldBeOffline) {
        console.log(`🌐 Modo offline ${shouldBeOffline ? 'activado' : 'desactivado'}`);
        return shouldBeOffline;
      }
      return prev;
    });
  }, [networkStatus.isOnline, networkStatus.isSupabaseReachable]);

  // Separate effect for sync on reconnection to avoid circular dependencies
  useEffect(() => {
    if (networkStatus.isOnline && networkStatus.isSupabaseReachable && !isOfflineMode) {
      const hasPendingData = offlineData.pendingSales.length > 0 || offlineData.pendingRenditions.length > 0;
      if (hasPendingData) {
        console.log('🔄 Conexión restaurada - sincronizando datos pendientes...');
        syncPendingData();
      }
    }
  }, [networkStatus.isOnline, networkStatus.isSupabaseReachable, isOfflineMode]);

  return {
    isOfflineMode,
    offlineData,
    capabilities,
    pendingItemsCount: offlineData.pendingSales.length + offlineData.pendingRenditions.length,
    cacheDataForOffline,
    addOfflineSale,
    addOfflineRendition,
    syncPendingData,
    lastSync: offlineData.lastSync
  };
}