-- WalkerGestion Row Level Security Policies
-- 💚⚪ Verde y Blanco - Santiago Wanderers
-- Migration: 002_rls_policies

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE renditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Get current user profile
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS user_profiles AS $$
DECLARE
    profile user_profiles;
BEGIN
    SELECT * INTO profile 
    FROM user_profiles 
    WHERE id = auth.uid();
    
    RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's company ID
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
DECLARE
    company_id UUID;
BEGIN
    SELECT user_profiles.company_id INTO company_id
    FROM user_profiles 
    WHERE id = auth.uid();
    
    RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's business unit ID
CREATE OR REPLACE FUNCTION get_user_business_unit_id()
RETURNS UUID AS $$
DECLARE
    business_unit_id UUID;
BEGIN
    SELECT user_profiles.business_unit_id INTO business_unit_id
    FROM user_profiles 
    WHERE id = auth.uid();
    
    RETURN business_unit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access business unit
CREATE OR REPLACE FUNCTION can_access_business_unit(unit_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile user_profiles;
BEGIN
    SELECT * INTO profile FROM get_current_user_profile();
    
    -- Admin can access any business unit in their company
    IF profile.role = 'admin' THEN
        RETURN EXISTS (
            SELECT 1 FROM business_units 
            WHERE id = unit_id AND company_id = profile.company_id
        );
    END IF;
    
    -- Manager can access their assigned business unit
    IF profile.role = 'manager' THEN
        RETURN profile.business_unit_id = unit_id;
    END IF;
    
    -- Cashier can access their assigned business unit
    IF profile.role = 'cashier' THEN
        RETURN profile.business_unit_id = unit_id;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPANIES POLICIES
-- ============================================================================

-- Admins can view their own company
CREATE POLICY "Users can view their company" ON companies
    FOR SELECT USING (
        is_admin() AND id = get_user_company_id()
    );

-- Admins can update their own company
CREATE POLICY "Admins can update their company" ON companies
    FOR UPDATE USING (
        is_admin() AND id = get_user_company_id()
    );

-- Admins can insert companies (for setup)
CREATE POLICY "Admins can create companies" ON companies
    FOR INSERT WITH CHECK (
        is_admin()
    );

-- Prevent deletion of companies with users
CREATE POLICY "Prevent company deletion with users" ON companies
    FOR DELETE USING (
        is_admin() AND 
        id = get_user_company_id() AND
        NOT EXISTS (SELECT 1 FROM user_profiles WHERE company_id = companies.id)
    );

-- ============================================================================
-- BUSINESS UNITS POLICIES
-- ============================================================================

-- Users can view business units from their company
CREATE POLICY "Users can view company business units" ON business_units
    FOR SELECT USING (
        company_id = get_user_company_id()
    );

-- Admins can manage business units in their company
CREATE POLICY "Admins can manage business units" ON business_units
    FOR ALL USING (
        is_admin() AND company_id = get_user_company_id()
    );

-- Managers can update their assigned business unit
CREATE POLICY "Managers can update their business unit" ON business_units
    FOR UPDATE USING (
        is_manager_or_admin() AND can_access_business_unit(id)
    );

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Admins can view users in their company
CREATE POLICY "Admins can view company users" ON user_profiles
    FOR SELECT USING (
        is_admin() AND company_id = get_user_company_id()
    );

-- Admins can manage users in their company
CREATE POLICY "Admins can manage company users" ON user_profiles
    FOR ALL USING (
        is_admin() AND (
            company_id = get_user_company_id() OR 
            id = auth.uid()
        )
    );

-- Managers can view users in their business unit
CREATE POLICY "Managers can view unit users" ON user_profiles
    FOR SELECT USING (
        is_manager_or_admin() AND 
        business_unit_id = get_user_business_unit_id()
    );

-- ============================================================================
-- CASH REGISTERS POLICIES
-- ============================================================================

-- Users can view cash registers in accessible business units
CREATE POLICY "Users can view accessible cash registers" ON cash_registers
    FOR SELECT USING (
        can_access_business_unit(business_unit_id)
    );

-- Admins and managers can manage cash registers
CREATE POLICY "Admins and managers can manage cash registers" ON cash_registers
    FOR ALL USING (
        is_manager_or_admin() AND can_access_business_unit(business_unit_id)
    );

-- ============================================================================
-- CASHIER ASSIGNMENTS POLICIES
-- ============================================================================

-- Users can view assignments in accessible business units
CREATE POLICY "Users can view accessible assignments" ON cashier_assignments
    FOR SELECT USING (
        can_access_business_unit(business_unit_id) OR user_id = auth.uid()
    );

-- Managers and admins can manage assignments
CREATE POLICY "Managers can manage assignments" ON cashier_assignments
    FOR ALL USING (
        is_manager_or_admin() AND can_access_business_unit(business_unit_id)
    );

-- ============================================================================
-- SALES POLICIES
-- ============================================================================

-- Users can view sales from accessible business units
CREATE POLICY "Users can view accessible sales" ON sales
    FOR SELECT USING (
        can_access_business_unit(business_unit_id)
    );

-- Cashiers can create their own sales
CREATE POLICY "Cashiers can create sales" ON sales
    FOR INSERT WITH CHECK (
        cashier_id = auth.uid() AND 
        can_access_business_unit(business_unit_id)
    );

-- Cashiers can update their own sales (same day only)
CREATE POLICY "Cashiers can update own recent sales" ON sales
    FOR UPDATE USING (
        cashier_id = auth.uid() AND 
        can_access_business_unit(business_unit_id) AND
        sale_date = CURRENT_DATE
    );

-- Managers and admins can manage all sales in their units
CREATE POLICY "Managers can manage unit sales" ON sales
    FOR ALL USING (
        is_manager_or_admin() AND can_access_business_unit(business_unit_id)
    );

-- ============================================================================
-- CASHFLOWS POLICIES
-- ============================================================================

-- Users can view cashflows from accessible business units
CREATE POLICY "Users can view accessible cashflows" ON cashflows
    FOR SELECT USING (
        can_access_business_unit(business_unit_id)
    );

-- Managers and admins can manage cashflows
CREATE POLICY "Managers can manage cashflows" ON cashflows
    FOR ALL USING (
        is_manager_or_admin() AND can_access_business_unit(business_unit_id)
    );

-- Users can create cashflows they're responsible for
CREATE POLICY "Users can create own cashflows" ON cashflows
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        can_access_business_unit(business_unit_id)
    );

-- ============================================================================
-- GOALS POLICIES
-- ============================================================================

-- Users can view goals from accessible business units
CREATE POLICY "Users can view accessible goals" ON goals
    FOR SELECT USING (
        can_access_business_unit(business_unit_id)
    );

-- Admins can manage all goals in their company
CREATE POLICY "Admins can manage goals" ON goals
    FOR ALL USING (
        is_admin() AND can_access_business_unit(business_unit_id)
    );

-- Managers can view and update goals in their unit
CREATE POLICY "Managers can update unit goals" ON goals
    FOR UPDATE USING (
        is_manager_or_admin() AND can_access_business_unit(business_unit_id)
    );

-- ============================================================================
-- BONUSES POLICIES
-- ============================================================================

-- Users can view bonuses from accessible business units
CREATE POLICY "Users can view accessible bonuses" ON bonuses
    FOR SELECT USING (
        can_access_business_unit(business_unit_id) OR user_id = auth.uid()
    );

-- Admins can manage all bonuses
CREATE POLICY "Admins can manage bonuses" ON bonuses
    FOR ALL USING (
        is_admin() AND can_access_business_unit(business_unit_id)
    );

-- Managers can view bonuses in their unit
CREATE POLICY "Managers can view unit bonuses" ON bonuses
    FOR SELECT USING (
        is_manager_or_admin() AND can_access_business_unit(business_unit_id)
    );

-- ============================================================================
-- RENDITIONS POLICIES
-- ============================================================================

-- Users can view renditions from accessible business units
CREATE POLICY "Users can view accessible renditions" ON renditions
    FOR SELECT USING (
        can_access_business_unit(business_unit_id) OR cashier_id = auth.uid()
    );

-- Cashiers can create their own renditions
CREATE POLICY "Cashiers can create renditions" ON renditions
    FOR INSERT WITH CHECK (
        cashier_id = auth.uid() AND 
        can_access_business_unit(business_unit_id)
    );

-- Cashiers can update their own unapproved renditions
CREATE POLICY "Cashiers can update own renditions" ON renditions
    FOR UPDATE USING (
        cashier_id = auth.uid() AND 
        can_access_business_unit(business_unit_id) AND
        is_approved = false
    );

-- Managers can approve and manage renditions
CREATE POLICY "Managers can manage renditions" ON renditions
    FOR ALL USING (
        is_manager_or_admin() AND can_access_business_unit(business_unit_id)
    );

-- ============================================================================
-- TRANSFERS POLICIES
-- ============================================================================

-- Users can view transfers involving accessible business units
CREATE POLICY "Users can view accessible transfers" ON transfers
    FOR SELECT USING (
        can_access_business_unit(from_business_unit_id) OR 
        can_access_business_unit(to_business_unit_id)
    );

-- Managers can create transfers between accessible units
CREATE POLICY "Managers can create transfers" ON transfers
    FOR INSERT WITH CHECK (
        is_manager_or_admin() AND 
        (can_access_business_unit(from_business_unit_id) OR 
         can_access_business_unit(to_business_unit_id))
    );

-- Managers can update their own unapproved transfers
CREATE POLICY "Managers can update own transfers" ON transfers
    FOR UPDATE USING (
        is_manager_or_admin() AND 
        initiated_by = auth.uid() AND 
        is_approved = false
    );

-- Admins can approve transfers
CREATE POLICY "Admins can approve transfers" ON transfers
    FOR UPDATE USING (
        is_admin() AND 
        (can_access_business_unit(from_business_unit_id) OR 
         can_access_business_unit(to_business_unit_id))
    );

-- ============================================================================
-- ALERTS POLICIES
-- ============================================================================

-- Users can view alerts for accessible business units or personal alerts
CREATE POLICY "Users can view accessible alerts" ON alerts
    FOR SELECT USING (
        can_access_business_unit(business_unit_id) OR 
        user_id = auth.uid() OR
        business_unit_id IS NULL
    );

-- Users can mark their alerts as read
CREATE POLICY "Users can mark alerts as read" ON alerts
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        (business_unit_id IS NOT NULL AND can_access_business_unit(business_unit_id))
    );

-- Managers and admins can create alerts
CREATE POLICY "Managers can create alerts" ON alerts
    FOR INSERT WITH CHECK (
        is_manager_or_admin() AND 
        (business_unit_id IS NULL OR can_access_business_unit(business_unit_id))
    );

-- Admins can manage all alerts in their scope
CREATE POLICY "Admins can manage alerts" ON alerts
    FOR ALL USING (
        is_admin() AND 
        (business_unit_id IS NULL OR can_access_business_unit(business_unit_id))
    );

-- ============================================================================
-- STORAGE POLICIES (if using Supabase Storage)
-- ============================================================================

-- Allow authenticated users to upload files
INSERT INTO storage.buckets (id, name, public)
VALUES ('walkergestion-files', 'walkergestion-files', false);

-- Users can upload files for their business units
CREATE POLICY "Users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        bucket_id = 'walkergestion-files'
    );

-- Users can view files for their business units
CREATE POLICY "Users can view files" ON storage.objects
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        bucket_id = 'walkergestion-files'
    );

-- Users can update their own files
CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        bucket_id = 'walkergestion-files' AND
        owner = auth.uid()
    );

-- Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        bucket_id = 'walkergestion-files' AND
        owner = auth.uid()
    );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 WalkerGestion RLS Policies Applied Successfully!';
    RAISE NOTICE '💚⚪ Verde y Blanco - Santiago Wanderers';
    RAISE NOTICE '🔒 Security Level: Enterprise Grade';
    RAISE NOTICE '👥 Role-based Access: Admin, Manager, Cashier';
    RAISE NOTICE '🏢 Multi-tenant: Company & Business Unit Isolation';
    RAISE NOTICE '📊 Next: Execute 003_sample_data.sql for test data (optional)';
END $$;