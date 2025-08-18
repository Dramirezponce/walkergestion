export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  company: string;
  businessUnit?: string;
}

export interface BonusesProps {
  user: UserData;
}

export interface BusinessUnit {
  id: string;
  name: string;
  company_id: string;
  is_active: boolean;
}

export interface Goal {
  id: string;
  business_unit_id: string;
  month_year: string;
  target_amount: number;
  actual_amount: number;
  bonus_percentage: number;
  created_at: string;
  updated_at: string;
  business_units?: { name: string; company_id: string };
}

export interface Sale {
  id: string;
  business_unit_id: string;
  amount: number;
  created_at: string;
}

export interface GoalProgress {
  actualAmount: number;
  progress: number;
  bonusCalculated: number;
  status: string;
}

export interface GoalFormData {
  business_unit_id: string;
  target_amount: string;
  bonus_percentage: string;
  month_year: string;
}

export const PROVIDER_TYPES = [
  'Servicios Básicos',
  'Productos', 
  'Servicios Profesionales',
  'Mantenimiento',
  'Marketing'
] as const;