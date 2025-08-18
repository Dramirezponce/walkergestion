export interface Sale {
  id: string;
  amount: number;
  transaction_type: 'cash' | 'debit' | 'credit';
  created_at: string;
  business_unit_id?: string;
}

export interface Goal {
  id: string;
  business_unit_id: string;
  month_year: string;
  target_amount: number;
  actual_amount: number;
  bonus_percentage: number;
}

export interface BusinessUnit {
  id: string;
  name: string;
  company_id: string;
}

export interface Rendition {
  id: string;
  transfer_amount: number;
  total_expenses: number;
  remaining_amount: number;
  status: string;
  created_at: string;
  business_unit_id: string;
}

export interface ReportData {
  salesSummary: {
    totalRevenue: number;
    totalTransactions: number;
    avgTransactionValue: number;
    growth: number;
  };
  salesByType: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  salesByUnit: Array<{
    name: string;
    sales: number;
    transactions: number;
    growth: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    transactions: number;
  }>;
  goalsProgress: Array<{
    unit: string;
    target: number;
    actual: number;
    percentage: number;
    bonus: number;
  }>;
  renditionsSummary: {
    totalTransfers: number;
    totalExpenses: number;
    avgEfficiency: number;
    pendingApprovals: number;
  };
}

export interface ReportsProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'cashier';
    company_id?: string;
    business_unit_id?: string;
  };
}

export interface DateRange {
  from: string;
  to: string;
}