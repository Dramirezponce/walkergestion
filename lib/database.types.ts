export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_units: {
        Row: {
          id: string
          company_id: string
          name: string
          address: string | null
          phone: string | null
          manager_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          address?: string | null
          phone?: string | null
          manager_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          address?: string | null
          phone?: string | null
          manager_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_units_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_units_manager_id_fkey"
            columns: ["manager_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'cashier'
          company_id: string | null
          business_unit_id: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'cashier'
          company_id?: string | null
          business_unit_id?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'manager' | 'cashier'
          company_id?: string | null
          business_unit_id?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_business_unit_id_fkey"
            columns: ["business_unit_id"]
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          }
        ]
      }
      cash_registers: {
        Row: {
          id: string
          business_unit_id: string
          name: string
          code: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_unit_id: string
          name: string
          code: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_unit_id?: string
          name?: string
          code?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_business_unit_id_fkey"
            columns: ["business_unit_id"]
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          }
        ]
      }
      sales: {
        Row: {
          id: string
          user_id: string | null
          business_unit_id: string | null
          cash_register_id: string | null
          amount: number
          description: string | null
          transaction_type: 'cash' | 'debit' | 'credit'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          business_unit_id?: string | null
          cash_register_id?: string | null
          amount: number
          description?: string | null
          transaction_type?: 'cash' | 'debit' | 'credit'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          business_unit_id?: string | null
          cash_register_id?: string | null
          amount?: number
          description?: string | null
          transaction_type?: 'cash' | 'debit' | 'credit'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_business_unit_id_fkey"
            columns: ["business_unit_id"]
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cash_register_id_fkey"
            columns: ["cash_register_id"]
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          }
        ]
      }
      cashflows: {
        Row: {
          id: string
          user_id: string | null
          business_unit_id: string | null
          type: 'income' | 'expense'
          category: string
          amount: number
          description: string | null
          status: 'pending' | 'approved' | 'rejected'
          approved_by: string | null
          approved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          business_unit_id?: string | null
          type: 'income' | 'expense'
          category: string
          amount: number
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          business_unit_id?: string | null
          type?: 'income' | 'expense'
          category?: string
          amount?: number
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflows_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflows_business_unit_id_fkey"
            columns: ["business_unit_id"]
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflows_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      goals: {
        Row: {
          id: string
          business_unit_id: string
          month_year: string
          target_amount: number
          actual_amount: number
          bonus_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_unit_id: string
          month_year: string
          target_amount: number
          actual_amount?: number
          bonus_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_unit_id?: string
          month_year?: string
          target_amount?: number
          actual_amount?: number
          bonus_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_business_unit_id_fkey"
            columns: ["business_unit_id"]
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          }
        ]
      }
      alerts: {
        Row: {
          id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'error' | 'success'
          user_id: string | null
          business_unit_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          message: string
          type?: 'info' | 'warning' | 'error' | 'success'
          user_id?: string | null
          business_unit_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string
          type?: 'info' | 'warning' | 'error' | 'success'
          user_id?: string | null
          business_unit_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_business_unit_id_fkey"
            columns: ["business_unit_id"]
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      setup_daniel_ramirez_user: {
        Args: {
          user_auth_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'cashier'
      transaction_type: 'cash' | 'debit' | 'credit'
      cashflow_type: 'income' | 'expense'
      cashflow_status: 'pending' | 'approved' | 'rejected'
      alert_type: 'info' | 'warning' | 'error' | 'success'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}