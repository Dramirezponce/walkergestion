import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST') {
      const { action, userData } = await req.json()

      if (action === 'setup-database') {
        // Execute the complete database setup SQL
        const setupSQL = `
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Units table
CREATE TABLE IF NOT EXISTS business_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'cashier')) DEFAULT 'cashier',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  business_unit_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('cash', 'card', 'transfer')) DEFAULT 'cash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cashflows table
CREATE TABLE IF NOT EXISTS cashflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('income', 'expense')) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
  user_id UUID REFERENCES auth.users(id),
  business_unit_id UUID REFERENCES business_units(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table for bonus tracking
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  actual_amount DECIMAL(12,2) DEFAULT 0,
  bonus_percentage DECIMAL(5,2) DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_unit_id, month_year)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_unit ON user_profiles(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_unit ON sales(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_cashflows_user ON cashflows(user_id);
CREATE INDEX IF NOT EXISTS idx_cashflows_business_unit ON cashflows(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_cashflows_status ON cashflows(status);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_business_unit ON alerts(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_goals_business_unit ON goals(business_unit_id);

-- Insert demo data
INSERT INTO companies (id, name, description) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Santiago Wanderers Retail', 'Empresa de retail inspirada en Santiago Wanderers de Valparaíso')
ON CONFLICT (id) DO NOTHING;

INSERT INTO business_units (id, company_id, name, address) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Administración Central', 'Valparaíso, Chile'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Sucursal Centro', 'Santiago Centro'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Sucursal Las Condes', 'Las Condes, Santiago'),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Sucursal Providencia', 'Providencia, Santiago')
ON CONFLICT (id) DO NOTHING;

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, name, role, company_id, business_unit_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cashier'),
    '550e8400-e29b-41d4-a716-446655440000',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'cashier') = 'admin' 
      THEN '550e8400-e29b-41d4-a716-446655440001'
      ELSE '550e8400-e29b-41d4-a716-446655440002'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
        `

        // Execute SQL setup
        const { error: sqlError } = await supabase.rpc('exec', { sql: setupSQL })
        
        if (sqlError) {
          console.error('Database setup error:', sqlError)
          return new Response(
            JSON.stringify({ success: false, error: sqlError.message }), 
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Database configured successfully' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'create-admin') {
        // Create admin user with specific credentials
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          user_metadata: {
            name: userData.name,
            role: 'admin'
          },
          // Automatically confirm the user's email since an email server hasn't been configured.
          email_confirm: true
        })

        if (authError) {
          console.error('Error creating admin user:', authError)
          return new Response(
            JSON.stringify({ success: false, error: authError.message }), 
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create welcome alert for the new admin
        if (authData.user) {
          const { error: alertError } = await supabase
            .from('alerts')
            .insert({
              title: '¡Bienvenido a WalkerGestion!',
              message: \`Hola \${userData.name}, tu cuenta de administrador ha sido creada exitosamente. 💚⚪ ¡Vamos Wanderers!\`,
              type: 'success',
              user_id: authData.user.id,
              business_unit_id: '550e8400-e29b-41d4-a716-446655440001'
            })

          if (alertError) {
            console.warn('Could not create welcome alert:', alertError)
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Admin user created successfully',
            user: authData.user
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'check-connection') {
        // Simple connection test
        const { data, error } = await supabase
          .from('companies')
          .select('count')
          .limit(1)

        return new Response(
          JSON.stringify({ 
            success: !error, 
            connected: !error,
            error: error?.message 
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'setup-policies') {
        // Setup RLS policies
        const policiesSQL = \`
-- RLS Policies
-- User profiles: users can read their own profile and admins can read all
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles" ON user_profiles 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Sales: users can insert their own sales, view based on role
CREATE POLICY "Users can insert own sales" ON sales 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view sales based on role" ON sales 
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Cashflows: users can create, managers can approve
CREATE POLICY "Users can insert cashflows" ON cashflows 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view cashflows based on role" ON cashflows 
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update cashflows" ON cashflows 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Companies and business units: admins only
CREATE POLICY "Admins can manage companies" ON companies 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view companies" ON companies 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage business units" ON business_units 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view business units" ON business_units 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Goals: admins can manage, managers can view
CREATE POLICY "Admins can manage goals" ON goals 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers can view goals" ON goals 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Alerts: based on role and assignment
CREATE POLICY "Users can view assigned alerts" ON alerts 
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN business_units bu ON up.business_unit_id = bu.id
      WHERE up.id = auth.uid() 
      AND (bu.id = alerts.business_unit_id OR up.role IN ('admin', 'manager'))
    )
  );

CREATE POLICY "Managers can create alerts" ON alerts 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
        \`

        const { error: policiesError } = await supabase.rpc('exec', { sql: policiesSQL })
        
        return new Response(
          JSON.stringify({ 
            success: !policiesError, 
            error: policiesError?.message 
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})