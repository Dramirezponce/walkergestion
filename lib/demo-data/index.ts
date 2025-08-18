// Archivo principal del sistema de datos demo
// Mantiene la misma API que el archivo original

// Exportar tipos
export type {
  MockUser,
  MockSale,
  MockRendition,
  MockExpense,
  MockCompany,
  MockBusinessUnit,
  MockAlert,
  MockBonus,
  DashboardStats
} from './types';

// Exportar constantes
export {
  DEMO_USER,
  DEMO_COMPANIES,
  CASHIER_NAMES,
  EXPENSE_DESCRIPTIONS,
  SALE_NOTES,
  ALERT_TEMPLATES
} from './constants';

// Exportar generadores
export {
  generateDemoSales,
  generateDemoRenditions,
  generateDemoAlerts,
  generateDemoBonuses,
  simulateNetworkDelay,
  simulateNetworkError
} from './generators';

// Exportar y crear instancia del manager
export { DemoDataManager } from './manager';

// Crear instancia singleton con manejo de errores
let demoDataInstance: any = null;

try {
  // Importación síncrona
  const managerModule = require('./manager');
  demoDataInstance = managerModule.DemoDataManager.getInstance();
} catch (error) {
  console.warn('DemoDataManager initialization failed, using fallback:', error);
  
  // Crear un mock básico para evitar errores
  demoDataInstance = {
    getSales: () => [],
    getRenditions: () => [],
    getAlerts: () => [],
    getBonuses: () => [],
    getCompanies: () => [{
      id: 'demo-company',
      business_units: [
        { id: 'demo-unit-1', name: 'Sucursal Demo 1', active: true },
        { id: 'demo-unit-2', name: 'Sucursal Demo 2', active: true }
      ]
    }],
    addSale: (sale: any) => ({ ...sale, id: Date.now().toString() }),
    addRendition: (rendition: any) => ({ ...rendition, id: Date.now().toString() }),
    addAlert: (alert: any) => ({ ...alert, id: Date.now().toString() }),
    addBonus: (bonus: any) => ({ ...bonus, id: Date.now().toString() }),
    updateRendition: () => null,
    markAlertAsRead: () => {},
    getDashboardStats: () => ({
      todaySales: 0,
      todayAmount: 0,
      monthSales: 0,
      monthAmount: 0,
      pendingRenditions: 0,
      unreadAlerts: 0,
      activeUnits: 2
    })
  };
}

// Instancia singleton para mantener compatibilidad
export const demoData = demoDataInstance;

// Función para obtener datos con fallback seguro
export const getSafeData = () => {
  try {
    return {
      sales: demoData?.getSales() || [],
      renditions: demoData?.getRenditions() || [],
      alerts: demoData?.getAlerts() || [],
      bonuses: demoData?.getBonuses() || []
    };
  } catch (error) {
    console.warn('Error getting demo data:', error);
    return {
      sales: [],
      renditions: [],
      alerts: [],
      bonuses: []
    };
  }
};

// Datos generados para compatibilidad directa con fallback
export const DEMO_SALES = getSafeData().sales;
export const DEMO_RENDITIONS = getSafeData().renditions;
export const DEMO_ALERTS = getSafeData().alerts;
export const DEMO_BONUSES = getSafeData().bonuses;