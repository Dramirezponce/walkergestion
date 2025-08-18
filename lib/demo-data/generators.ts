import { MockSale, MockRendition, MockAlert, MockBonus, MockExpense } from './types';
import { DEMO_COMPANIES, CASHIER_NAMES, EXPENSE_DESCRIPTIONS, SALE_NOTES, ALERT_TEMPLATES } from './constants';

// Generar ventas demo más realistas con patrones
export const generateDemoSales = (): MockSale[] => {
  const sales: MockSale[] = [];
  const businessUnits = DEMO_COMPANIES[0].business_units.filter(u => u.active);
  
  for (let i = 0; i < 45; i++) { // 45 días de datos
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
    
    businessUnits.forEach(unit => {
      // Ajustar número de ventas según día de la semana
      let baseSales = 3;
      if (dayOfWeek === 0) baseSales = 1; // Domingo menos ventas
      else if (dayOfWeek === 6) baseSales = 5; // Sábado más ventas
      else if (dayOfWeek === 5) baseSales = 4; // Viernes más ventas
      
      const dailySales = Math.floor(Math.random() * 2) + baseSales;
      
      for (let j = 0; j < dailySales; j++) {
        // Montos más realistas según la unidad
        let baseAmount = 15000;
        if (unit.id === 'demo-store-1') baseAmount = 25000; // Sucursal más grande
        else if (unit.id === 'demo-store-2') baseAmount = 20000;
        else if (unit.id === 'demo-store-3') baseAmount = 12000; // Sucursal más pequeña
        
        const amount = Math.floor(Math.random() * baseAmount) + baseAmount * 0.5;
        
        // Distribución de pagos más realista
        const cashPercent = 0.2 + Math.random() * 0.3; // 20-50% efectivo
        const cardPercent = 0.3 + Math.random() * 0.4; // 30-70% tarjeta
        
        const cash = Math.floor(amount * cashPercent);
        const card = Math.floor(amount * cardPercent);
        const transfer = amount - cash - card;
        
        // Notas ocasionales
        let notes: string | undefined;
        if (Math.random() < 0.15) {
          notes = SALE_NOTES[Math.floor(Math.random() * SALE_NOTES.length)];
        }
        
        sales.push({
          id: `sale-${unit.id}-${dateStr}-${j}`,
          date: dateStr,
          amount,
          business_unit_id: unit.id,
          business_unit_name: unit.name,
          created_by: 'demo-cashier',
          created_by_name: CASHIER_NAMES[Math.floor(Math.random() * CASHIER_NAMES.length)],
          payment_methods: { cash, card, transfer },
          notes
        });
      }
    });
  }
  
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generar rendiciones demo con gastos detallados
export const generateDemoRenditions = (): MockRendition[] => {
  const renditions: MockRendition[] = [];
  const businessUnits = DEMO_COMPANIES[0].business_units.filter(u => u.active);
  
  for (let i = 0; i < 15; i++) { // 15 rendiciones de ejemplo
    const date = new Date();
    date.setDate(date.getDate() - i * 2); // Cada 2 días
    const dateStr = date.toISOString().split('T')[0];
    
    businessUnits.forEach(unit => {
      // Ventas base según la unidad
      let baseSales = 50000;
      if (unit.id === 'demo-store-1') baseSales = 80000;
      else if (unit.id === 'demo-store-2') baseSales = 65000;
      else if (unit.id === 'demo-store-3') baseSales = 40000;
      
      const totalSales = Math.floor(Math.random() * baseSales * 0.4) + baseSales;
      const expenseCount = Math.floor(Math.random() * 4) + 2; // 2-5 gastos
      const expenses: MockExpense[] = [];
      
      // Generar gastos realistas
      const categories = Object.keys(EXPENSE_DESCRIPTIONS);
      for (let j = 0; j < expenseCount; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)] as keyof typeof EXPENSE_DESCRIPTIONS;
        const descriptions = EXPENSE_DESCRIPTIONS[category];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        let expenseAmount = 1000;
        if (category === 'maintenance') expenseAmount = 15000;
        else if (category === 'services') expenseAmount = 8000;
        else if (category === 'supplies') expenseAmount = 5000;
        else if (category === 'transport') expenseAmount = 3000;
        else if (category === 'food') expenseAmount = 2000;
        
        expenses.push({
          id: `expense-${unit.id}-${dateStr}-${j}`,
          description,
          amount: Math.floor(Math.random() * expenseAmount) + expenseAmount * 0.3,
          category,
          created_at: dateStr
        });
      }
      
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      // Estados más realistas basados en la fecha
      let status: 'pending' | 'approved' | 'rejected' = 'approved';
      if (i < 3) status = 'pending'; // Los 3 más recientes pendientes
      else if (Math.random() < 0.1) status = 'rejected'; // 10% rechazadas
      
      renditions.push({
        id: `rendition-${unit.id}-${dateStr}`,
        date: dateStr,
        business_unit_id: unit.id,
        business_unit_name: unit.name,
        total_sales: totalSales,
        total_expenses: totalExpenses,
        final_amount: totalSales - totalExpenses,
        status,
        created_by: 'demo-manager',
        created_by_name: `Encargado ${unit.name}`,
        expenses,
        notes: Math.random() < 0.3 ? 'Rendición con observaciones especiales' : undefined
      });
    });
  }
  
  return renditions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generar alertas demo variadas
export const generateDemoAlerts = (): MockAlert[] => {
  const alerts: MockAlert[] = [];
  const businessUnits = DEMO_COMPANIES[0].business_units.filter(u => u.active);
  
  // Alertas específicas por unidad
  businessUnits.forEach((unit, index) => {
    const alertCount = Math.floor(Math.random() * 3) + 1; // 1-3 alertas por unidad
    
    for (let i = 0; i < alertCount; i++) {
      const categoryKeys = Object.keys(ALERT_TEMPLATES);
      const category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)] as keyof typeof ALERT_TEMPLATES;
      const templates = ALERT_TEMPLATES[category];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      const hoursAgo = Math.floor(Math.random() * 72) + 1; // 1-72 horas atrás
      const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
      
      alerts.push({
        id: `alert-${unit.id}-${category}-${i}`,
        title: template.title,
        message: `${unit.name}: ${template.message}`,
        type: template.type,
        business_unit_id: unit.id,
        created_at: createdAt,
        read: Math.random() < 0.6 // 60% leídas
      });
    }
  });
  
  // Alertas generales del sistema
  const systemAlerts = ALERT_TEMPLATES.system;
  systemAlerts.forEach((template, index) => {
    const hoursAgo = Math.floor(Math.random() * 48) + 1;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    
    alerts.push({
      id: `alert-system-${index}`,
      title: template.title,
      message: template.message,
      type: template.type,
      created_at: createdAt,
      read: Math.random() < 0.8 // 80% leídas
    });
  });
  
  return alerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

// Generar bonos demo basados en performance
export const generateDemoBonuses = (): MockBonus[] => {
  const bonuses: MockBonus[] = [];
  const businessUnits = DEMO_COMPANIES[0].business_units.filter(u => u.active);
  
  for (let i = 0; i < 6; i++) { // 6 meses de datos
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toISOString().slice(0, 7);
    
    businessUnits.forEach(unit => {
      const goalAmount = unit.monthly_goal;
      
      // Performance más realista (80% - 130% del goal)
      const performanceMultiplier = 0.8 + Math.random() * 0.5;
      const actualAmount = Math.floor(goalAmount * performanceMultiplier);
      const percentageAchieved = Math.floor((actualAmount / goalAmount) * 100);
      
      // Solo generar bono si supera el 100%
      if (actualAmount > goalAmount) {
        const bonusAmount = Math.floor((actualAmount - goalAmount) * 0.1); // 10% del exceso
        
        let status: 'pending' | 'approved' | 'paid' = 'paid';
        if (i === 0) status = 'pending'; // Mes actual pendiente
        else if (i === 1) status = 'approved'; // Mes anterior aprobado
        
        bonuses.push({
          id: `bonus-${unit.id}-${monthStr}`,
          user_id: 'demo-manager',
          user_name: `Equipo ${unit.name}`,
          business_unit_id: unit.id,
          business_unit_name: unit.name,
          month: monthStr,
          amount: bonusAmount,
          percentage_achieved: percentageAchieved,
          goal_amount: goalAmount,
          actual_amount: actualAmount,
          status
        });
      }
    });
  }
  
  return bonuses.sort((a, b) => b.month.localeCompare(a.month));
};

// Utilidades para simular comportamiento de red
export const simulateNetworkDelay = (ms: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const simulateNetworkError = (probability: number = 0.05): boolean => {
  return Math.random() < probability;
};