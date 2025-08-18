import type { Goal, Sale, GoalProgress, BusinessUnit } from './types';

export const calculateGoalProgress = (goal: Goal, sales: Sale[]): GoalProgress => {
  const currentMonth = goal.month_year;
  
  // Filtrar ventas del mes actual para la unidad de negocio
  const monthSales = sales.filter(sale => 
    sale.business_unit_id === goal.business_unit_id &&
    sale.created_at.startsWith(currentMonth)
  );
  
  const actualAmount = monthSales.reduce((sum, sale) => sum + sale.amount, 0);
  const progress = (actualAmount / goal.target_amount) * 100;
  const bonusCalculated = progress >= 100 ? (actualAmount * goal.bonus_percentage) / 100 : 0;
  
  return {
    actualAmount,
    progress: Math.min(progress, 100),
    bonusCalculated,
    status: progress >= 100 ? 'Meta alcanzada' : 'En progreso'
  };
};

export const getCurrentMonthGoals = (goals: Goal[]): Goal[] => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return goals.filter(goal => goal.month_year === currentMonth);
};

export const getHistoricalGoals = (goals: Goal[]): Goal[] => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return goals.filter(goal => goal.month_year < currentMonth);
};

export const getProgressColor = (progress: number): string => {
  if (progress >= 100) return 'bg-green-500';
  if (progress >= 80) return 'bg-yellow-500';
  return 'bg-blue-500';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Meta alcanzada': return 'bg-green-100 text-green-800';
    case 'En progreso': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getBusinessUnitName = (businessUnits: BusinessUnit[], businessUnitId: string): string => {
  const unit = businessUnits.find(bu => bu.id === businessUnitId);
  return unit?.name || 'Unidad desconocida';
};

export const formatMonthYear = (monthYear: string): string => {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

export const calculateStatistics = (goals: Goal[], sales: Sale[]) => {
  const currentMonthGoals = getCurrentMonthGoals(goals);
  
  const metasAlcanzadas = currentMonthGoals.filter(goal => {
    const progress = calculateGoalProgress(goal, sales);
    return progress.progress >= 100;
  }).length;

  const totalBonosEntregados = getHistoricalGoals(goals).reduce((sum, goal) => {
    const progress = calculateGoalProgress(goal, sales);
    return sum + progress.bonusCalculated;
  }, 0);

  const bonosPendientes = currentMonthGoals.filter(goal => {
    const progress = calculateGoalProgress(goal, sales);
    return progress.progress >= 100 && progress.bonusCalculated > 0;
  }).length;

  return {
    metasAlcanzadas,
    totalBonosEntregados,
    bonosPendientes,
    currentMonthGoals
  };
};