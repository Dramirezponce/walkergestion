-- WalkerGestion Database Schema
-- 💚⚪ Verde y Blanco - Santiago Wanderers
-- Migration: 001_initial_schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cashier');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'check');
CREATE TYPE transaction_type AS ENUM ('sale', 'expense', 'transfer');
CREATE TYPE alert_type AS ENUM ('low_stock', 'high_expense', 'missed_goal', 'system');
CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    tax_id VARCHAR(50) UNIQUE,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT companies_name_check CHECK (length(name) >= 2),
    CONSTRAINT companies_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- BUSINESS UNITS TABLE
-- ============================================================================
CREATE TABLE business_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(50),
    manager_name VARCHAR(255),
    opening_hours JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT business_units_name_check CHECK (length(name) >= 2),
    CONSTRAINT business_units_unique_name_per_company UNIQUE (company_id, name)
);

-- ============================================================================
-- USERS TABLE (Profiles)
-- ============================================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'cashier',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    business_unit_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT user_profiles_name_check CHECK (length(name) >= 2),
    CONSTRAINT user_profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    
    -- Business rules
    CONSTRAINT user_profiles_business_unit_company_check 
        CHECK (
            (business_unit_id IS NULL) OR 
            (company_id IS NOT NULL)
        )
);

-- ============================================================================
-- CASH REGISTERS TABLE
-- ============================================================================
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    initial_amount DECIMAL(12,2) DEFAULT 0.00,
    current_amount DECIMAL(12,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT cash_registers_name_check CHECK (length(name) >= 2),
    CONSTRAINT cash_registers_amounts_check CHECK (
        initial_amount >= 0 AND current_amount >= 0
    ),
    CONSTRAINT cash_registers_unique_name_per_unit UNIQUE (business_unit_id, name)
);

-- ============================================================================
-- CASHIER ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE cashier_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES user_profiles(id),
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT cashier_assignments_unique_active UNIQUE (user_id, cash_register_id, is_active) 
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT cashier_assignments_date_check CHECK (
        unassigned_at IS NULL OR unassigned_at >= assigned_at
    )
);

-- ============================================================================
-- SALES TABLE
-- ============================================================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id UUID NOT NULL REFERENCES user_profiles(id),
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    description TEXT,
    invoice_number VARCHAR(100),
    customer_info JSONB DEFAULT '{}',
    items JSONB DEFAULT '[]',
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount - discount_amount + tax_amount) STORED,
    notes TEXT,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT sales_amount_check CHECK (amount > 0),
    CONSTRAINT sales_discount_check CHECK (discount_amount >= 0 AND discount_amount <= amount),
    CONSTRAINT sales_tax_check CHECK (tax_amount >= 0),
    CONSTRAINT sales_date_check CHECK (sale_date <= CURRENT_DATE)
);

-- ============================================================================
-- CASHFLOWS TABLE (Expenses and Income)
-- ============================================================================
CREATE TABLE cashflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    type transaction_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method payment_method,
    description TEXT NOT NULL,
    receipt_url TEXT,
    supplier_info JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurring_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT cashflows_amount_check CHECK (amount != 0),
    CONSTRAINT cashflows_category_check CHECK (length(category) >= 2),
    CONSTRAINT cashflows_description_check CHECK (length(description) >= 3),
    CONSTRAINT cashflows_date_check CHECK (transaction_date <= CURRENT_DATE)
);

-- ============================================================================
-- GOALS TABLE
-- ============================================================================
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0.00,
    target_date DATE NOT NULL,
    category VARCHAR(100) DEFAULT 'sales',
    bonus_percentage DECIMAL(5,2) DEFAULT 0.00,
    bonus_fixed_amount DECIMAL(12,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    achieved_at TIMESTAMPTZ,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT goals_target_amount_check CHECK (target_amount > 0),
    CONSTRAINT goals_current_amount_check CHECK (current_amount >= 0),
    CONSTRAINT goals_name_check CHECK (length(name) >= 2),
    CONSTRAINT goals_bonus_percentage_check CHECK (bonus_percentage >= 0 AND bonus_percentage <= 100),
    CONSTRAINT goals_bonus_fixed_check CHECK (bonus_fixed_amount >= 0),
    CONSTRAINT goals_target_date_check CHECK (target_date >= CURRENT_DATE OR achieved_at IS NOT NULL)
);

-- ============================================================================
-- BONUSES TABLE
-- ============================================================================
CREATE TABLE bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    amount DECIMAL(12,2) NOT NULL,
    bonus_type VARCHAR(50) NOT NULL DEFAULT 'achievement',
    description TEXT,
    calculation_details JSONB DEFAULT '{}',
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    paid_by UUID REFERENCES user_profiles(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT bonuses_amount_check CHECK (amount > 0),
    CONSTRAINT bonuses_payment_date_check CHECK (
        (is_paid = false AND paid_at IS NULL) OR 
        (is_paid = true AND paid_at IS NOT NULL)
    )
);

-- ============================================================================
-- RENDITIONS TABLE
-- ============================================================================
CREATE TABLE renditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES user_profiles(id),
    expected_amount DECIMAL(12,2) NOT NULL,
    actual_amount DECIMAL(12,2) NOT NULL,
    difference_amount DECIMAL(12,2) GENERATED ALWAYS AS (actual_amount - expected_amount) STORED,
    sales_count INTEGER DEFAULT 0,
    total_sales_amount DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    breakdown JSONB DEFAULT '{}',
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMPTZ,
    rendition_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT renditions_amounts_check CHECK (
        expected_amount >= 0 AND actual_amount >= 0
    ),
    CONSTRAINT renditions_sales_count_check CHECK (sales_count >= 0),
    CONSTRAINT renditions_sales_amount_check CHECK (total_sales_amount >= 0),
    CONSTRAINT renditions_approval_check CHECK (
        (is_approved = false AND approved_at IS NULL AND approved_by IS NULL) OR
        (is_approved = true AND approved_at IS NOT NULL AND approved_by IS NOT NULL)
    ),
    CONSTRAINT renditions_date_check CHECK (rendition_date <= CURRENT_DATE)
);

-- ============================================================================
-- TRANSFERS TABLE
-- ============================================================================
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_business_unit_id UUID REFERENCES business_units(id),
    to_business_unit_id UUID REFERENCES business_units(id),
    from_cash_register_id UUID REFERENCES cash_registers(id),
    to_cash_register_id UUID REFERENCES cash_registers(id),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    transfer_type VARCHAR(50) DEFAULT 'cash',
    reference_number VARCHAR(100),
    initiated_by UUID NOT NULL REFERENCES user_profiles(id),
    approved_by UUID REFERENCES user_profiles(id),
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMPTZ,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT transfers_amount_check CHECK (amount > 0),
    CONSTRAINT transfers_description_check CHECK (length(description) >= 3),
    CONSTRAINT transfers_different_units_check CHECK (
        from_business_unit_id != to_business_unit_id OR
        from_cash_register_id != to_cash_register_id
    ),
    CONSTRAINT transfers_approval_check CHECK (
        (is_approved = false AND approved_at IS NULL) OR
        (is_approved = true AND approved_at IS NOT NULL AND approved_by IS NOT NULL)
    ),
    CONSTRAINT transfers_date_check CHECK (transfer_date <= CURRENT_DATE)
);

-- ============================================================================
-- ALERTS TABLE
-- ============================================================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    alert_type alert_type NOT NULL DEFAULT 'system',
    priority alert_priority NOT NULL DEFAULT 'medium',
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    read_by UUID REFERENCES user_profiles(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT alerts_title_check CHECK (length(title) >= 2),
    CONSTRAINT alerts_message_check CHECK (length(message) >= 3),
    CONSTRAINT alerts_read_check CHECK (
        (is_read = false AND read_at IS NULL AND read_by IS NULL) OR
        (is_read = true AND read_at IS NOT NULL)
    ),
    CONSTRAINT alerts_expiry_check CHECK (
        expires_at IS NULL OR expires_at > created_at
    )
);

-- ============================================================================
-- INDICES FOR PERFORMANCE
-- ============================================================================

-- Companies
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_tax_id ON companies(tax_id);

-- Business Units
CREATE INDEX idx_business_units_company ON business_units(company_id);
CREATE INDEX idx_business_units_active ON business_units(is_active);

-- User Profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_business_unit ON user_profiles(business_unit_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

-- Cash Registers
CREATE INDEX idx_cash_registers_business_unit ON cash_registers(business_unit_id);
CREATE INDEX idx_cash_registers_active ON cash_registers(is_active);

-- Cashier Assignments
CREATE INDEX idx_cashier_assignments_user ON cashier_assignments(user_id);
CREATE INDEX idx_cashier_assignments_register ON cashier_assignments(cash_register_id);
CREATE INDEX idx_cashier_assignments_business_unit ON cashier_assignments(business_unit_id);
CREATE INDEX idx_cashier_assignments_active ON cashier_assignments(is_active);

-- Sales
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_register ON sales(cash_register_id);
CREATE INDEX idx_sales_business_unit ON sales(business_unit_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- Cashflows
CREATE INDEX idx_cashflows_business_unit ON cashflows(business_unit_id);
CREATE INDEX idx_cashflows_user ON cashflows(user_id);
CREATE INDEX idx_cashflows_type ON cashflows(type);
CREATE INDEX idx_cashflows_category ON cashflows(category);
CREATE INDEX idx_cashflows_date ON cashflows(transaction_date);
CREATE INDEX idx_cashflows_created_at ON cashflows(created_at);

-- Goals
CREATE INDEX idx_goals_business_unit ON goals(business_unit_id);
CREATE INDEX idx_goals_active ON goals(is_active);
CREATE INDEX idx_goals_target_date ON goals(target_date);
CREATE INDEX idx_goals_category ON goals(category);

-- Bonuses
CREATE INDEX idx_bonuses_goal ON bonuses(goal_id);
CREATE INDEX idx_bonuses_business_unit ON bonuses(business_unit_id);
CREATE INDEX idx_bonuses_user ON bonuses(user_id);
CREATE INDEX idx_bonuses_paid ON bonuses(is_paid);
CREATE INDEX idx_bonuses_earned_at ON bonuses(earned_at);

-- Renditions
CREATE INDEX idx_renditions_register ON renditions(cash_register_id);
CREATE INDEX idx_renditions_business_unit ON renditions(business_unit_id);
CREATE INDEX idx_renditions_cashier ON renditions(cashier_id);
CREATE INDEX idx_renditions_date ON renditions(rendition_date);
CREATE INDEX idx_renditions_approved ON renditions(is_approved);

-- Transfers
CREATE INDEX idx_transfers_from_business_unit ON transfers(from_business_unit_id);
CREATE INDEX idx_transfers_to_business_unit ON transfers(to_business_unit_id);
CREATE INDEX idx_transfers_from_register ON transfers(from_cash_register_id);
CREATE INDEX idx_transfers_to_register ON transfers(to_cash_register_id);
CREATE INDEX idx_transfers_initiated_by ON transfers(initiated_by);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);
CREATE INDEX idx_transfers_approved ON transfers(is_approved);

-- Alerts
CREATE INDEX idx_alerts_business_unit ON alerts(business_unit_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_expires_at ON alerts(expires_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_business_units_updated_at BEFORE UPDATE ON business_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_cash_registers_updated_at BEFORE UPDATE ON cash_registers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_cashier_assignments_updated_at BEFORE UPDATE ON cashier_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_cashflows_updated_at BEFORE UPDATE ON cashflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_bonuses_updated_at BEFORE UPDATE ON bonuses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_renditions_updated_at BEFORE UPDATE ON renditions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 WalkerGestion Database Schema Created Successfully!';
    RAISE NOTICE '💚⚪ Verde y Blanco - Santiago Wanderers';
    RAISE NOTICE '🗄️ Tables: %, %, %, %, %, %, %, %, %, %, %', 
        'companies', 'business_units', 'user_profiles', 'cash_registers', 
        'cashier_assignments', 'sales', 'cashflows', 'goals', 'bonuses', 
        'renditions', 'transfers', 'alerts';
    RAISE NOTICE '📊 Next: Execute 002_rls_policies.sql for Row Level Security';
END $$;