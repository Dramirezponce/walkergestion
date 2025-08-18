import { Sale, Goal, Rendition, BusinessUnit, ReportData, DateRange } from './types';
import { TRANSACTION_LABELS } from './constants';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(amount || 0);
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

export const formatFullDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

export const getBusinessUnitName = (id: string, units: BusinessUnit[]): string => {
  const unit = units.find(u => u.id === id);
  return unit ? unit.name : `Unidad ${id}`;
};

export const filterDataByDateAndUnit = <T extends { created_at: string; business_unit_id?: string }>(
  data: T[],
  dateRange: DateRange,
  selectedUnit: string
): T[] => {
  return data.filter(item => {
    const itemDate = new Date(item.created_at);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    
    const inDateRange = itemDate >= fromDate && itemDate <= toDate;
    const inUnit = selectedUnit === 'all' || item.business_unit_id === selectedUnit;
    
    return inDateRange && inUnit;
  });
};

export const generateReportData = (
  sales: Sale[],
  goals: Goal[],
  renditions: Rendition[],
  businessUnits: BusinessUnit[],
  dateRange: DateRange,
  selectedUnit: string
): ReportData => {
  // Filter data
  const filteredSales = filterDataByDateAndUnit(sales, dateRange, selectedUnit);
  const filteredGoals = goals.filter(goal => 
    selectedUnit === 'all' || goal.business_unit_id === selectedUnit
  );
  const filteredRenditions = filterDataByDateAndUnit(renditions, dateRange, selectedUnit);

  // Sales Summary
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
  const totalTransactions = filteredSales.length;
  const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const growth = Math.random() * 20 - 10; // Mock growth calculation

  // Sales by Type
  const salesByTypeMap = filteredSales.reduce((acc, sale) => {
    const type = sale.transaction_type || 'cash';
    acc[type] = (acc[type] || 0) + sale.amount;
    return acc;
  }, {} as Record<string, number>);

  const salesByType = Object.entries(salesByTypeMap).map(([type, value]) => ({
    name: TRANSACTION_LABELS[type as keyof typeof TRANSACTION_LABELS] || type,
    value,
    percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0
  }));

  // Sales by Unit
  const salesByUnitMap = filteredSales.reduce((acc, sale) => {
    const unitId = sale.business_unit_id || 'unknown';
    if (!acc[unitId]) {
      acc[unitId] = { sales: 0, transactions: 0 };
    }
    acc[unitId].sales += sale.amount;
    acc[unitId].transactions += 1;
    return acc;
  }, {} as Record<string, { sales: number; transactions: number }>);

  const salesByUnit = Object.entries(salesByUnitMap).map(([unitId, data]) => ({
    name: getBusinessUnitName(unitId, businessUnits),
    sales: data.sales,
    transactions: data.transactions,
    growth: Math.random() * 20 - 10 // Mock growth
  }));

  // Daily Sales
  const dailySalesMap = filteredSales.reduce((acc, sale) => {
    const date = sale.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = { sales: 0, transactions: 0 };
    }
    acc[date].sales += sale.amount;
    acc[date].transactions += 1;
    return acc;
  }, {} as Record<string, { sales: number; transactions: number }>);

  const dailySales = Object.entries(dailySalesMap)
    .map(([date, data]) => ({
      date: formatDate(date),
      sales: data.sales,
      transactions: data.transactions
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Last 30 days

  // Goals Progress
  const goalsProgress = filteredGoals.map(goal => {
    const percentage = goal.target_amount > 0 ? ((goal.actual_amount || 0) / goal.target_amount) * 100 : 0;
    const bonus = percentage >= 100 ? (goal.target_amount * goal.bonus_percentage) / 100 : 0;
    
    return {
      unit: getBusinessUnitName(goal.business_unit_id, businessUnits),
      target: goal.target_amount,
      actual: goal.actual_amount || 0,
      percentage,
      bonus
    };
  });

  // Renditions Summary
  const totalTransfers = filteredRenditions.reduce((sum, r) => sum + r.transfer_amount, 0);
  const totalExpenses = filteredRenditions.reduce((sum, r) => sum + r.total_expenses, 0);
  const avgEfficiency = totalTransfers > 0 ? ((totalTransfers - totalExpenses) / totalTransfers) * 100 : 0;
  const pendingApprovals = filteredRenditions.filter(r => r.status === 'submitted').length;

  return {
    salesSummary: {
      totalRevenue,
      totalTransactions,
      avgTransactionValue,
      growth
    },
    salesByType,
    salesByUnit,
    dailySales,
    goalsProgress,
    renditionsSummary: {
      totalTransfers,
      totalExpenses,
      avgEfficiency,
      pendingApprovals
    }
  };
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (!data.length) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getGrowthIcon = (growth: number) => {
  return growth >= 0 ? '📈' : '📉';
};

export const getGrowthColor = (growth: number): string => {
  if (growth > 5) return 'text-green-600';
  if (growth < -5) return 'text-red-600';
  return 'text-yellow-600';
};