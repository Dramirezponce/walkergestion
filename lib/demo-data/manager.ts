import { MockSale, MockRendition, MockAlert, MockBonus, MockCompany, DashboardStats } from './types';
import { DEMO_COMPANIES } from './constants';
import { generateDemoSales, generateDemoRenditions, generateDemoAlerts, generateDemoBonuses } from './generators';

// Clase para manejar el almacenamiento local de datos demo
export class DemoDataManager {
  private static instance: DemoDataManager;
  
  static getInstance(): DemoDataManager {
    if (!DemoDataManager.instance) {
      DemoDataManager.instance = new DemoDataManager();
    }
    return DemoDataManager.instance;
  }
  
  private getStorageKey(type: string): string {
    return `walkergestion_demo_${type}`;
  }
  
  // Ventas
  getSales(): MockSale[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey('sales'));
      return stored ? JSON.parse(stored) : generateDemoSales();
    } catch {
      return generateDemoSales();
    }
  }
  
  addSale(sale: Omit<MockSale, 'id'>): MockSale {
    const newSale: MockSale = {
      ...sale,
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const sales = this.getSales();
    sales.unshift(newSale);
    localStorage.setItem(this.getStorageKey('sales'), JSON.stringify(sales));
    
    return newSale;
  }
  
  updateSale(id: string, updates: Partial<MockSale>): MockSale | null {
    const sales = this.getSales();
    const index = sales.findIndex(s => s.id === id);
    
    if (index === -1) return null;
    
    sales[index] = { ...sales[index], ...updates };
    localStorage.setItem(this.getStorageKey('sales'), JSON.stringify(sales));
    
    return sales[index];
  }
  
  deleteSale(id: string): boolean {
    const sales = this.getSales();
    const filteredSales = sales.filter(s => s.id !== id);
    
    if (filteredSales.length === sales.length) return false;
    
    localStorage.setItem(this.getStorageKey('sales'), JSON.stringify(filteredSales));
    return true;
  }
  
  // Rendiciones
  getRenditions(): MockRendition[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey('renditions'));
      return stored ? JSON.parse(stored) : generateDemoRenditions();
    } catch {
      return generateDemoRenditions();
    }
  }
  
  addRendition(rendition: Omit<MockRendition, 'id'>): MockRendition {
    const newRendition: MockRendition = {
      ...rendition,
      id: `rendition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const renditions = this.getRenditions();
    renditions.unshift(newRendition);
    localStorage.setItem(this.getStorageKey('renditions'), JSON.stringify(renditions));
    
    return newRendition;
  }
  
  updateRendition(id: string, updates: Partial<MockRendition>): MockRendition | null {
    const renditions = this.getRenditions();
    const index = renditions.findIndex(r => r.id === id);
    
    if (index === -1) return null;
    
    renditions[index] = { ...renditions[index], ...updates };
    localStorage.setItem(this.getStorageKey('renditions'), JSON.stringify(renditions));
    
    return renditions[index];
  }
  
  deleteRendition(id: string): boolean {
    const renditions = this.getRenditions();
    const filteredRenditions = renditions.filter(r => r.id !== id);
    
    if (filteredRenditions.length === renditions.length) return false;
    
    localStorage.setItem(this.getStorageKey('renditions'), JSON.stringify(filteredRenditions));
    return true;
  }
  
  // Alertas
  getAlerts(): MockAlert[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey('alerts'));
      return stored ? JSON.parse(stored) : generateDemoAlerts();
    } catch {
      return generateDemoAlerts();
    }
  }
  
  addAlert(alert: Omit<MockAlert, 'id'>): MockAlert {
    const newAlert: MockAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const alerts = this.getAlerts();
    alerts.unshift(newAlert);
    localStorage.setItem(this.getStorageKey('alerts'), JSON.stringify(alerts));
    
    return newAlert;
  }
  
  markAlertAsRead(id: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      alert.read = true;
      localStorage.setItem(this.getStorageKey('alerts'), JSON.stringify(alerts));
    }
  }
  
  markAllAlertsAsRead(): void {
    const alerts = this.getAlerts();
    alerts.forEach(alert => alert.read = true);
    localStorage.setItem(this.getStorageKey('alerts'), JSON.stringify(alerts));
  }
  
  deleteAlert(id: string): boolean {
    const alerts = this.getAlerts();
    const filteredAlerts = alerts.filter(a => a.id !== id);
    
    if (filteredAlerts.length === alerts.length) return false;
    
    localStorage.setItem(this.getStorageKey('alerts'), JSON.stringify(filteredAlerts));
    return true;
  }
  
  // Bonos
  getBonuses(): MockBonus[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey('bonuses'));
      return stored ? JSON.parse(stored) : generateDemoBonuses();
    } catch {
      return generateDemoBonuses();
    }
  }
  
  addBonus(bonus: Omit<MockBonus, 'id'>): MockBonus {
    const newBonus: MockBonus = {
      ...bonus,
      id: `bonus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const bonuses = this.getBonuses();
    bonuses.unshift(newBonus);
    localStorage.setItem(this.getStorageKey('bonuses'), JSON.stringify(bonuses));
    
    return newBonus;
  }
  
  updateBonus(id: string, updates: Partial<MockBonus>): MockBonus | null {
    const bonuses = this.getBonuses();
    const index = bonuses.findIndex(b => b.id === id);
    
    if (index === -1) return null;
    
    bonuses[index] = { ...bonuses[index], ...updates };
    localStorage.setItem(this.getStorageKey('bonuses'), JSON.stringify(bonuses));
    
    return bonuses[index];
  }
  
  deleteBonus(id: string): boolean {
    const bonuses = this.getBonuses();
    const filteredBonuses = bonuses.filter(b => b.id !== id);
    
    if (filteredBonuses.length === bonuses.length) return false;
    
    localStorage.setItem(this.getStorageKey('bonuses'), JSON.stringify(filteredBonuses));
    return true;
  }
  
  // Empresas
  getCompanies(): MockCompany[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey('companies'));
      return stored ? JSON.parse(stored) : DEMO_COMPANIES;
    } catch {
      return DEMO_COMPANIES;
    }
  }
  
  updateCompany(id: string, updates: Partial<MockCompany>): MockCompany | null {
    const companies = this.getCompanies();
    const index = companies.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    companies[index] = { ...companies[index], ...updates };
    localStorage.setItem(this.getStorageKey('companies'), JSON.stringify(companies));
    
    return companies[index];
  }
  
  // Estadísticas del dashboard
  getDashboardStats(): DashboardStats {
    const sales = this.getSales();
    const renditions = this.getRenditions();
    const alerts = this.getAlerts();
    
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const todaySales = sales.filter(s => s.date === today);
    const monthSales = sales.filter(s => s.date.startsWith(thisMonth));
    
    const todayTotal = todaySales.reduce((sum, s) => sum + s.amount, 0);
    const monthTotal = monthSales.reduce((sum, s) => sum + s.amount, 0);
    
    const pendingRenditions = renditions.filter(r => r.status === 'pending').length;
    const unreadAlerts = alerts.filter(a => !a.read).length;
    
    return {
      todaySales: todaySales.length,
      todayAmount: todayTotal,
      monthSales: monthSales.length,
      monthAmount: monthTotal,
      pendingRenditions,
      unreadAlerts,
      activeUnits: DEMO_COMPANIES[0].business_units.filter(u => u.active).length
    };
  }
  
  // Búsquedas y filtros avanzados
  searchSales(query: string): MockSale[] {
    const sales = this.getSales();
    const lowerQuery = query.toLowerCase();
    
    return sales.filter(sale =>
      sale.business_unit_name.toLowerCase().includes(lowerQuery) ||
      sale.created_by_name.toLowerCase().includes(lowerQuery) ||
      sale.notes?.toLowerCase().includes(lowerQuery) ||
      sale.amount.toString().includes(query)
    );
  }
  
  getSalesByDateRange(startDate: string, endDate: string): MockSale[] {
    const sales = this.getSales();
    return sales.filter(sale => sale.date >= startDate && sale.date <= endDate);
  }
  
  getSalesByUnit(businessUnitId: string): MockSale[] {
    const sales = this.getSales();
    return sales.filter(sale => sale.business_unit_id === businessUnitId);
  }
  
  getTopSellingUnits(limit: number = 5): Array<{unit: string, total: number}> {
    const sales = this.getSales();
    const unitTotals: Record<string, {name: string, total: number}> = {};
    
    sales.forEach(sale => {
      if (!unitTotals[sale.business_unit_id]) {
        unitTotals[sale.business_unit_id] = {
          name: sale.business_unit_name,
          total: 0
        };
      }
      unitTotals[sale.business_unit_id].total += sale.amount;
    });
    
    return Object.values(unitTotals)
      .map(unit => ({unit: unit.name, total: unit.total}))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }
  
  // Operaciones de mantenimiento
  clearAllData(): void {
    const keys = ['sales', 'renditions', 'alerts', 'bonuses', 'companies'];
    keys.forEach(key => {
      localStorage.removeItem(this.getStorageKey(key));
    });
  }
  
  resetToDefaults(): void {
    this.clearAllData();
    // Los getters automáticamente cargarán los datos por defecto
  }
  
  exportData(): string {
    const data = {
      sales: this.getSales(),
      renditions: this.getRenditions(),
      alerts: this.getAlerts(),
      bonuses: this.getBonuses(),
      companies: this.getCompanies(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.sales) localStorage.setItem(this.getStorageKey('sales'), JSON.stringify(data.sales));
      if (data.renditions) localStorage.setItem(this.getStorageKey('renditions'), JSON.stringify(data.renditions));
      if (data.alerts) localStorage.setItem(this.getStorageKey('alerts'), JSON.stringify(data.alerts));
      if (data.bonuses) localStorage.setItem(this.getStorageKey('bonuses'), JSON.stringify(data.bonuses));
      if (data.companies) localStorage.setItem(this.getStorageKey('companies'), JSON.stringify(data.companies));
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}