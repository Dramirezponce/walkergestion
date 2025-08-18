import { MockSale, MockRendition, MockAlert, MockBonus } from './types';

// Utilidades para exportación de datos en diferentes formatos

// Convertir datos a CSV
export const convertToCSV = (data: any[], headers: string[]): string => {
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar valores que contengan comas o comillas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
};

// Exportar ventas a CSV
export const exportSalesToCSV = (sales: MockSale[]): string => {
  const headers = [
    'Fecha',
    'Unidad de Negocio',
    'Monto Total',
    'Efectivo',
    'Tarjeta',
    'Transferencia',
    'Vendedor',
    'Notas'
  ];
  
  const data = sales.map(sale => ({
    'Fecha': sale.date,
    'Unidad de Negocio': sale.business_unit_name,
    'Monto Total': sale.amount,
    'Efectivo': sale.payment_methods.cash,
    'Tarjeta': sale.payment_methods.card,
    'Transferencia': sale.payment_methods.transfer,
    'Vendedor': sale.created_by_name,
    'Notas': sale.notes || ''
  }));
  
  return convertToCSV(data, headers);
};

// Exportar rendiciones a CSV
export const exportRenditionsToCSV = (renditions: MockRendition[]): string => {
  const headers = [
    'Fecha',
    'Unidad de Negocio',
    'Total Ventas',
    'Total Gastos',
    'Monto Final',
    'Estado',
    'Creado por',
    'Notas'
  ];
  
  const data = renditions.map(rendition => ({
    'Fecha': rendition.date,
    'Unidad de Negocio': rendition.business_unit_name,
    'Total Ventas': rendition.total_sales,
    'Total Gastos': rendition.total_expenses,
    'Monto Final': rendition.final_amount,
    'Estado': rendition.status === 'approved' ? 'Aprobada' :
             rendition.status === 'pending' ? 'Pendiente' : 'Rechazada',
    'Creado por': rendition.created_by_name,
    'Notas': rendition.notes || ''
  }));
  
  return convertToCSV(data, headers);
};

// Exportar alertas a CSV
export const exportAlertsToCSV = (alerts: MockAlert[]): string => {
  const headers = [
    'Fecha',
    'Hora',
    'Título',
    'Mensaje',
    'Tipo',
    'Unidad de Negocio',
    'Estado'
  ];
  
  const data = alerts.map(alert => ({
    'Fecha': new Date(alert.created_at).toLocaleDateString(),
    'Hora': new Date(alert.created_at).toLocaleTimeString(),
    'Título': alert.title,
    'Mensaje': alert.message,
    'Tipo': alert.type === 'info' ? 'Información' :
            alert.type === 'warning' ? 'Advertencia' :
            alert.type === 'error' ? 'Error' : 'Éxito',
    'Unidad de Negocio': alert.business_unit_id || 'General',
    'Estado': alert.read ? 'Leída' : 'No leída'
  }));
  
  return convertToCSV(data, headers);
};

// Exportar bonos a CSV
export const exportBonusesToCSV = (bonuses: MockBonus[]): string => {
  const headers = [
    'Mes',
    'Unidad de Negocio',
    'Equipo',
    'Meta',
    'Ventas Reales',
    'Porcentaje Logrado',
    'Monto Bono',
    'Estado'
  ];
  
  const data = bonuses.map(bonus => ({
    'Mes': bonus.month,
    'Unidad de Negocio': bonus.business_unit_name,
    'Equipo': bonus.user_name,
    'Meta': bonus.goal_amount,
    'Ventas Reales': bonus.actual_amount,
    'Porcentaje Logrado': bonus.percentage_achieved,
    'Monto Bono': bonus.amount,
    'Estado': bonus.status === 'pending' ? 'Pendiente' :
             bonus.status === 'approved' ? 'Aprobado' : 'Pagado'
  }));
  
  return convertToCSV(data, headers);
};

// Descargar archivo CSV
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Generar reporte completo en formato JSON
export const generateFullReport = (
  sales: MockSale[],
  renditions: MockRendition[],
  alerts: MockAlert[],
  bonuses: MockBonus[]
) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = now.toISOString().split('T')[0];
  
  // Estadísticas del mes actual
  const monthSales = sales.filter(s => s.date >= monthStart && s.date <= monthEnd);
  const monthRenditions = renditions.filter(r => r.date >= monthStart && r.date <= monthEnd);
  const monthAlerts = alerts.filter(a => a.created_at >= monthStart);
  
  const totalSales = monthSales.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = monthRenditions.reduce((sum, r) => sum + r.total_expenses, 0);
  const unreadAlerts = alerts.filter(a => !a.read).length;
  const pendingBonuses = bonuses.filter(b => b.status === 'pending').length;
  
  return {
    reportDate: now.toISOString(),
    period: `${monthStart} to ${monthEnd}`,
    summary: {
      totalSales,
      totalExpenses,
      netIncome: totalSales - totalExpenses,
      salesCount: monthSales.length,
      renditionsCount: monthRenditions.length,
      unreadAlerts,
      pendingBonuses
    },
    data: {
      sales: monthSales,
      renditions: monthRenditions,
      alerts: monthAlerts,
      bonuses: bonuses.filter(b => b.month.startsWith(now.toISOString().slice(0, 7)))
    }
  };
};

// Generar estadísticas por unidad de negocio
export const generateUnitStats = (
  sales: MockSale[],
  renditions: MockRendition[],
  unitId: string
) => {
  const unitSales = sales.filter(s => s.business_unit_id === unitId);
  const unitRenditions = renditions.filter(r => r.business_unit_id === unitId);
  
  const totalSales = unitSales.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = unitRenditions.reduce((sum, r) => sum + r.total_expenses, 0);
  
  // Agrupación por método de pago
  const paymentMethods = unitSales.reduce((acc, sale) => {
    acc.cash += sale.payment_methods.cash;
    acc.card += sale.payment_methods.card;
    acc.transfer += sale.payment_methods.transfer;
    return acc;
  }, { cash: 0, card: 0, transfer: 0 });
  
  // Ventas por día de la semana
  const salesByDay = unitSales.reduce((acc, sale) => {
    const dayOfWeek = new Date(sale.date).getDay();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[dayOfWeek];
    
    if (!acc[dayName]) acc[dayName] = { count: 0, amount: 0 };
    acc[dayName].count++;
    acc[dayName].amount += sale.amount;
    
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);
  
  return {
    unitId,
    totalSales,
    totalExpenses,
    netIncome: totalSales - totalExpenses,
    salesCount: unitSales.length,
    renditionsCount: unitRenditions.length,
    avgSaleAmount: unitSales.length > 0 ? totalSales / unitSales.length : 0,
    paymentMethods,
    salesByDay
  };
};