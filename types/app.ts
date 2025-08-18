export type SystemState = 'checking' | 'ready' | 'needs-setup' | 'error';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  company: string;
  businessUnit?: string;
  company_id?: string;
  business_unit_id?: string;
}

export interface AppProps {
  onNavigateToWebsite?: () => void;
}