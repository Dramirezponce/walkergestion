// Tipos e interfaces para el sistema de datos mock
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'store_manager' | 'cashier';
  company: string;
  businessUnit?: string;
  company_id: string;
  business_unit_id?: string;
  avatar?: string;
}

export interface MockSale {
  id: string;
  date: string;
  amount: number;
  business_unit_id: string;
  business_unit_name: string;
  created_by: string;
  created_by_name: string;
  notes?: string;
  payment_methods: {
    cash: number;
    card: number;
    transfer: number;
  };
}

export interface MockRendition {
  id: string;
  date: string;
  business_unit_id: string;
  business_unit_name: string;
  total_sales: number;
  total_expenses: number;
  final_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created_by_name: string;
  expenses: MockExpense[];
  notes?: string;
}

export interface MockExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  receipt_url?: string;
  created_at: string;
}

export interface MockCompany {
  id: string;
  name: string;
  rut: string;
  address: string;
  phone: string;
  email: string;
  business_units: MockBusinessUnit[];
}

export interface MockBusinessUnit {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager_id?: string;
  company_id: string;
  monthly_goal: number;
  active: boolean;
}

export interface MockAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  business_unit_id?: string;
  created_at: string;
  read: boolean;
}

export interface MockBonus {
  id: string;
  user_id: string;
  user_name: string;
  business_unit_id: string;
  business_unit_name: string;
  month: string;
  amount: number;
  percentage_achieved: number;
  goal_amount: number;
  actual_amount: number;
  status: 'pending' | 'approved' | 'paid';
}

export interface DashboardStats {
  todaySales: number;
  todayAmount: number;
  monthSales: number;
  monthAmount: number;
  pendingRenditions: number;
  unreadAlerts: number;
  activeUnits: number;
}