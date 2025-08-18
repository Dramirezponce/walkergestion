export const CHART_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

export const REPORT_TYPES = {
  SUMMARY: 'summary',
  SALES: 'sales',
  GOALS: 'goals',
  RENDITIONS: 'renditions'
} as const;

export const TRANSACTION_TYPES = {
  CASH: 'cash',
  DEBIT: 'debit',
  CREDIT: 'credit'
} as const;

export const TRANSACTION_LABELS = {
  [TRANSACTION_TYPES.CASH]: 'Efectivo',
  [TRANSACTION_TYPES.DEBIT]: 'Débito',
  [TRANSACTION_TYPES.CREDIT]: 'Crédito'
} as const;

export const CHART_CONFIG = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  animationDuration: 750
} as const;

export const DEFAULT_DATE_RANGE = {
  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  to: new Date().toISOString().split('T')[0]
} as const;