export interface Transfer {
  id: string;
  from_user_id: string;
  to_business_unit_id: string;
  amount: number;
  week_identifier: string;
  status: 'pending' | 'received' | 'rendition_pending' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Rendition {
  id: string;
  transfer_id: string;
  business_unit_id: string;
  user_id: string;
  week_identifier: string;
  transfer_amount: number;
  total_expenses: number;
  remaining_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  expenses?: RenditionExpense[];
}

export interface RenditionExpense {
  id: string;
  rendition_id: string;
  description: string;
  amount: number;
  provider: string;
  provider_type: string;
  payment_method: string;
  document_type: 'boleta' | 'factura';
  document_number?: string;
  is_paid: boolean;
  expense_date: string;
  created_at: string;
}

export interface BusinessUnit {
  id: string;
  name: string;
  company_id: string;
  address?: string;
}

export interface RenditionsProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'cashier';
    company_id?: string;
    business_unit_id?: string;
  };
}

export interface TransferFormData {
  to_business_unit_id: string;
  amount: string;
  week_identifier: string;
  notes: string;
}

export interface RenditionFormData {
  transfer_id: string;
  business_unit_id: string;
  week_identifier: string;
  transfer_amount: string;
  notes: string;
}

export interface ExpenseFormData {
  description: string;
  amount: string;
  provider: string;
  provider_type: string;
  payment_method: string;
  document_type: 'boleta' | 'factura';
  document_number: string;
  is_paid: boolean;
  expense_date: string;
}