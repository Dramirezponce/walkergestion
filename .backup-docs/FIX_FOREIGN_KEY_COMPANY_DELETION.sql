-- Fix foreign key constraints to allow proper company deletion
-- This script fixes the foreign key constraint issues for company deletion

-- Drop existing foreign key constraints that are causing problems
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_company_id_fkey;
ALTER TABLE business_units DROP CONSTRAINT IF EXISTS business_units_company_id_fkey;

-- Recreate the constraints with proper CASCADE/SET NULL behavior
-- Users should have their company_id set to NULL when company is deleted (not cascaded)
-- This allows users to exist without a company assignment
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Business units should be deleted when the company is deleted
ALTER TABLE business_units 
ADD CONSTRAINT business_units_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Also ensure business_unit_id is set to NULL when business unit is deleted
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_business_unit_id_fkey;
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_business_unit_id_fkey 
FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL;

-- Fix other related foreign keys that might cause issues
ALTER TABLE cash_registers DROP CONSTRAINT IF EXISTS cash_registers_business_unit_id_fkey;
ALTER TABLE cash_registers 
ADD CONSTRAINT cash_registers_business_unit_id_fkey 
FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE;

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_business_unit_id_fkey;
ALTER TABLE sales 
ADD CONSTRAINT sales_business_unit_id_fkey 
FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL;

ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_to_business_unit_id_fkey;
ALTER TABLE transfers 
ADD CONSTRAINT transfers_to_business_unit_id_fkey 
FOREIGN KEY (to_business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE;

ALTER TABLE renditions DROP CONSTRAINT IF EXISTS renditions_business_unit_id_fkey;
ALTER TABLE renditions 
ADD CONSTRAINT renditions_business_unit_id_fkey 
FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE;

ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_business_unit_id_fkey;
ALTER TABLE goals 
ADD CONSTRAINT goals_business_unit_id_fkey 
FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE;

ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_business_unit_id_fkey;
ALTER TABLE alerts 
ADD CONSTRAINT alerts_business_unit_id_fkey 
FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE '✅ Foreign key constraints fixed successfully!';
    RAISE NOTICE '📋 Company deletion should now work properly';
    RAISE NOTICE '👥 User profiles will have company_id set to NULL when company is deleted';
    RAISE NOTICE '🏢 Business units and related data will be CASCADE deleted';
END $$;