import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Database {
  public: {
    Tables: {
      [key: string]: any
    }
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando setup de base de datos WalkerGestion...')

    const setupResults = {
      tablesCreated: 0,
      policiesCreated: 0,
      initialDataInserted: false,
      errors: [] as string[]
    }

    // 1. Crear tablas principales
    const tables = [
      {
        name: 'companies',
        sql: `
          CREATE TABLE IF NOT EXISTS companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            logo_url TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      },
      {
        name: 'business_units',
        sql: `
          CREATE TABLE IF NOT EXISTS business_units (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            phone VARCHAR(50),
            manager_id UUID,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      },
      {
        name: 'user_profiles',
        sql: `
          CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
            company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
            business_unit_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
            phone VARCHAR(50),
            avatar_url TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      },
      {
        name: 'cash_registers',
        sql: `
          CREATE TABLE IF NOT EXISTS cash_registers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(50) NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      },
      {
        name: 'sales',
        sql: `
          CREATE TABLE IF NOT EXISTS sales (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
            business_unit_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
            cash_register_id UUID REFERENCES cash_registers(id) ON DELETE SET NULL,
            amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
            description TEXT,
            transaction_type VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (transaction_type IN ('cash', 'debit', 'credit')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      },
      {
        name: 'cashflows',
        sql: `
          CREATE TABLE IF NOT EXISTS cashflows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
            business_unit_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
            category VARCHAR(100) NOT NULL,
            amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
            description TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
            approved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      },
      {
        name: 'goals',
        sql: `
          CREATE TABLE IF NOT EXISTS goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
            month_year VARCHAR(7) NOT NULL,
            target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
            actual_amount DECIMAL(12,2) DEFAULT 0,
            bonus_percentage DECIMAL(5,2) DEFAULT 5.0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(business_unit_id, month_year)
          );
        `
      },
      {
        name: 'alerts',
        sql: `
          CREATE TABLE IF NOT EXISTS alerts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
            user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
            business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      }
    ]

    // Crear cada tabla
    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: table.sql })
        if (error) {
          setupResults.errors.push(`Error creando tabla ${table.name}: ${error.message}`)
        } else {
          setupResults.tablesCreated++
          console.log(`✅ Tabla ${table.name} creada/verificada`)
        }
      } catch (err) {
        setupResults.errors.push(`Error creando tabla ${table.name}: ${err.message}`)
      }
    }

    // 2. Configurar RLS y políticas
    const rlsConfigs = [
      'ALTER TABLE companies ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE sales ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE cashflows ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE goals ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;'
    ]

    const policies = [
      'CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON companies FOR ALL TO authenticated USING (true);',
      'CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON business_units FOR ALL TO authenticated USING (true);',
      'CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON user_profiles FOR ALL TO authenticated USING (true);',
      'CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON cash_registers FOR ALL TO authenticated USING (true);',
      'CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON sales FOR ALL TO authenticated USING (true);',
      'CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON cashflows FOR ALL TO authenticated USING (true);',
      'CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON goals FOR ALL TO authenticated USING (true);',
      'CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON alerts FOR ALL TO authenticated USING (true);'
    ]

    // Aplicar RLS
    for (const rlsConfig of rlsConfigs) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: rlsConfig })
        if (error) {
          setupResults.errors.push(`Error configurando RLS: ${error.message}`)
        }
      } catch (err) {
        setupResults.errors.push(`Error configurando RLS: ${err.message}`)
      }
    }

    // Aplicar políticas
    for (const policy of policies) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy })
        if (error) {
          setupResults.errors.push(`Error creando política: ${error.message}`)
        } else {
          setupResults.policiesCreated++
        }
      } catch (err) {
        setupResults.errors.push(`Error creando política: ${err.message}`)
      }
    }

    // 3. Insertar datos iniciales
    try {
      // Insertar empresa principal
      const { error: companyError } = await supabaseAdmin
        .from('companies')
        .upsert({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Santiago Wanderers Retail',
          description: 'Empresa principal del grupo comercial Santiago Wanderers - 💚⚪ Verde y Blanco',
          is_active: true
        })

      if (companyError) {
        setupResults.errors.push(`Error insertando empresa: ${companyError.message}`)
      }

      // Insertar unidades de negocio
      const { error: unitsError } = await supabaseAdmin
        .from('business_units')
        .upsert([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            company_id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Oficina Central',
            address: 'Valparaíso, Chile'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            company_id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Local Centro',
            address: 'Centro de Valparaíso'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            company_id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Local Mall',
            address: 'Mall Marina Arauco'
          }
        ])

      if (unitsError) {
        setupResults.errors.push(`Error insertando unidades: ${unitsError.message}`)
      }

      // Insertar cajas registradoras
      const { error: registersError } = await supabaseAdmin
        .from('cash_registers')
        .upsert([
          {
            business_unit_id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Caja Principal Centro',
            code: 'CENTRO-01'
          },
          {
            business_unit_id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Caja Secundaria Centro',
            code: 'CENTRO-02'
          },
          {
            business_unit_id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'Caja Principal Mall',
            code: 'MALL-01'
          },
          {
            business_unit_id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'Caja Secundaria Mall',
            code: 'MALL-02'
          }
        ])

      if (registersError) {
        setupResults.errors.push(`Error insertando cajas: ${registersError.message}`)
      }

      if (!companyError && !unitsError && !registersError) {
        setupResults.initialDataInserted = true
        console.log('✅ Datos iniciales insertados correctamente')
      }

    } catch (err) {
      setupResults.errors.push(`Error insertando datos iniciales: ${err.message}`)
    }

    // 4. Crear función para setup de Daniel Ramírez
    const setupFunction = `
      CREATE OR REPLACE FUNCTION setup_daniel_ramirez_user(user_auth_id UUID)
      RETURNS JSON AS $$
      DECLARE
          admin_email TEXT := 'd.ramirez.ponce@gmail.com';
          admin_name TEXT := 'Daniel Ramírez';
          company_id UUID := '550e8400-e29b-41d4-a716-446655440000';
          business_unit_id UUID := '550e8400-e29b-41d4-a716-446655440001';
          result JSON;
      BEGIN
          INSERT INTO user_profiles (
              id, email, name, role, company_id, business_unit_id, phone, is_active, created_at, updated_at
          ) VALUES (
              user_auth_id, admin_email, admin_name, 'admin', company_id, business_unit_id, '+56 9 0000 0000', true, now(), now()
          )
          ON CONFLICT (id) DO UPDATE SET 
              name = EXCLUDED.name,
              role = 'admin',
              company_id = EXCLUDED.company_id,
              business_unit_id = EXCLUDED.business_unit_id,
              is_active = true,
              updated_at = now();
          
          UPDATE business_units SET manager_id = user_auth_id, updated_at = now() WHERE id = business_unit_id;
          
          SELECT json_build_object(
              'success', true,
              'user_id', user_auth_id,
              'email', admin_email,
              'name', admin_name,
              'role', 'admin',
              'company_id', company_id,
              'business_unit_id', business_unit_id,
              'message', 'Usuario Daniel Ramírez configurado exitosamente',
              'timestamp', now()
          ) INTO result;
          
          RETURN result;
      EXCEPTION
          WHEN OTHERS THEN
              RETURN json_build_object(
                  'success', false,
                  'error', SQLERRM,
                  'message', 'Error configurando usuario Daniel Ramírez',
                  'timestamp', now()
              );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    try {
      const { error: functionError } = await supabaseAdmin.rpc('exec_sql', { sql: setupFunction })
      if (functionError) {
        setupResults.errors.push(`Error creando función: ${functionError.message}`)
      } else {
        console.log('✅ Función setup_daniel_ramirez_user creada')
      }
    } catch (err) {
      setupResults.errors.push(`Error creando función: ${err.message}`)
    }

    const success = setupResults.errors.length === 0
    const response = {
      success,
      message: success ? 
        '🎉 Setup de base de datos completado exitosamente' : 
        '⚠️ Setup completado con algunos errores',
      results: setupResults,
      timestamp: new Date().toISOString()
    }

    console.log('📊 Resultado del setup:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: success ? 200 : 207 // 207 Multi-Status para éxito parcial
    })

  } catch (error) {
    console.error('❌ Error en setup de base de datos:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Error crítico en setup de base de datos',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})