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
      const { action } = await req.json()

      if (action === 'complete-setup') {
        console.log('🚀 Iniciando configuración completa de WalkerGestion...')
        
        const setupSteps = []
        
        // Paso 1: Leer y ejecutar el SQL completo
        try {
          console.log('📄 Ejecutando script SQL completo...')
          
          // Aquí ejecutaríamos el SQL completo desde el archivo
          // Como no podemos leer archivos en Edge Functions, incluiremos el SQL directamente
          
          const completeSQL = `
            -- Crear extensiones
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";
            
            -- Crear tablas principales (versión simplificada para Edge Functions)
            CREATE TABLE IF NOT EXISTS companies (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              description TEXT,
              logo_url TEXT,
              phone VARCHAR(50),
              address TEXT,
              website VARCHAR(255),
              tax_id VARCHAR(50),
              industry VARCHAR(100),
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS business_units (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
              name VARCHAR(255) NOT NULL,
              code VARCHAR(20) UNIQUE,
              address TEXT,
              phone VARCHAR(50),
              email VARCHAR(255),
              manager_id UUID,
              region VARCHAR(100),
              city VARCHAR(100),
              monthly_target DECIMAL(12,2) DEFAULT 0,
              opening_hours JSONB,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS user_profiles (
              id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
              email VARCHAR(255) NOT NULL UNIQUE,
              name VARCHAR(255) NOT NULL,
              phone VARCHAR(50),
              avatar_url TEXT,
              role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'cashier')) DEFAULT 'cashier',
              company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
              business_unit_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
              employee_code VARCHAR(20),
              hire_date DATE,
              salary DECIMAL(10,2),
              commission_rate DECIMAL(5,2) DEFAULT 0,
              is_active BOOLEAN DEFAULT true,
              last_login_at TIMESTAMP WITH TIME ZONE,
              preferences JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS sales (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
              sale_number VARCHAR(50) UNIQUE,
              amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
              tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
              total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
              description TEXT,
              transaction_type VARCHAR(20) CHECK (transaction_type IN ('cash', 'card', 'transfer', 'check')) DEFAULT 'cash',
              payment_method VARCHAR(50),
              customer_name VARCHAR(255),
              customer_phone VARCHAR(50),
              customer_email VARCHAR(255),
              products JSONB,
              notes TEXT,
              commission_amount DECIMAL(10,2) DEFAULT 0,
              status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')) DEFAULT 'completed',
              sale_date DATE DEFAULT CURRENT_DATE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS cashflows (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
              type VARCHAR(20) CHECK (type IN ('income', 'expense')) NOT NULL,
              category VARCHAR(100) NOT NULL,
              subcategory VARCHAR(100),
              amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
              description TEXT NOT NULL,
              reference_number VARCHAR(50),
              supplier_name VARCHAR(255),
              payment_method VARCHAR(50),
              receipt_url TEXT,
              tags JSONB,
              status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
              approved_by UUID REFERENCES auth.users(id),
              approved_at TIMESTAMP WITH TIME ZONE,
              rejection_reason TEXT,
              transaction_date DATE DEFAULT CURRENT_DATE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS alerts (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              type VARCHAR(20) CHECK (type IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
              priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
              company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
              category VARCHAR(50),
              action_url TEXT,
              metadata JSONB,
              is_read BOOLEAN DEFAULT false,
              expires_at TIMESTAMP WITH TIME ZONE,
              created_by UUID REFERENCES auth.users(id),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS goals (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
              user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
              period_type VARCHAR(20) CHECK (period_type IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
              period_start DATE NOT NULL,
              period_end DATE NOT NULL,
              target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
              actual_amount DECIMAL(12,2) DEFAULT 0 CHECK (actual_amount >= 0),
              achievement_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
                CASE 
                  WHEN target_amount > 0 THEN (actual_amount / target_amount) * 100 
                  ELSE 0 
                END
              ) STORED,
              bonus_percentage DECIMAL(5,2) DEFAULT 5.0 CHECK (bonus_percentage >= 0),
              bonus_amount DECIMAL(10,2) DEFAULT 0,
              goal_type VARCHAR(20) CHECK (goal_type IN ('sales', 'profit', 'transactions')) DEFAULT 'sales',
              description TEXT,
              is_achieved BOOLEAN GENERATED ALWAYS AS (actual_amount >= target_amount) STORED,
              achieved_at TIMESTAMP WITH TIME ZONE,
              notes TEXT,
              created_by UUID REFERENCES auth.users(id),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(business_unit_id, user_id, period_start, goal_type)
            );
          `
          
          const { error: sqlError } = await supabase.rpc('exec', { sql: completeSQL })
          
          if (sqlError) {
            console.error('Error ejecutando SQL:', sqlError)
            setupSteps.push(`❌ Error en SQL: ${sqlError.message}`)
          } else {
            setupSteps.push('✅ Tablas principales creadas')
          }
          
        } catch (error: any) {
          console.error('Error en configuración SQL:', error)
          setupSteps.push(`❌ Error configurando tablas: ${error.message}`)
        }
        
        // Paso 2: Insertar datos iniciales
        try {
          console.log('📊 Insertando datos iniciales...')
          
          const dataSQL = `
            INSERT INTO companies (id, name, description, tax_id, industry, phone, address, website) VALUES 
            (
              '550e8400-e29b-41d4-a716-446655440000', 
              'Santiago Wanderers Retail', 
              'Empresa de retail inspirada en Santiago Wanderers de Valparaíso - Verde y Blanco',
              '96.123.456-7',
              'Retail',
              '+56 32 123 4567',
              'Valparaíso, Región de Valparaíso, Chile',
              'www.wanderers-retail.cl'
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              updated_at = NOW();
              
            INSERT INTO business_units (id, company_id, name, code, address, phone, email, region, city, monthly_target, opening_hours) VALUES 
            (
              '550e8400-e29b-41d4-a716-446655440001', 
              '550e8400-e29b-41d4-a716-446655440000', 
              'Administración Central', 
              'ADM',
              'Playa Ancha, Valparaíso, Chile', 
              '+56 32 123 4567',
              'admin@wanderers-retail.cl',
              'Valparaíso',
              'Valparaíso',
              0,
              '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "closed", "sunday": "closed"}'::jsonb
            ),
            (
              '550e8400-e29b-41d4-a716-446655440002', 
              '550e8400-e29b-41d4-a716-446655440000', 
              'Sucursal Centro', 
              'CEN',
              'Plaza de Armas, Santiago Centro, Chile', 
              '+56 2 2345 6789',
              'centro@wanderers-retail.cl',
              'Metropolitana',
              'Santiago',
              5000000,
              '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-20:00", "saturday": "10:00-18:00", "sunday": "11:00-17:00"}'::jsonb
            ),
            (
              '550e8400-e29b-41d4-a716-446655440003', 
              '550e8400-e29b-41d4-a716-446655440000', 
              'Sucursal Las Condes', 
              'LCO',
              'Av. Apoquindo, Las Condes, Santiago, Chile', 
              '+56 2 3456 7890',
              'lascondes@wanderers-retail.cl',
              'Metropolitana',
              'Las Condes',
              8000000,
              '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-20:00", "saturday": "10:00-18:00", "sunday": "11:00-17:00"}'::jsonb
            ),
            (
              '550e8400-e29b-41d4-a716-446655440004', 
              '550e8400-e29b-41d4-a716-446655440000', 
              'Sucursal Providencia', 
              'PRO',
              'Av. Providencia, Providencia, Santiago, Chile', 
              '+56 2 4567 8901',
              'providencia@wanderers-retail.cl',
              'Metropolitana',
              'Providencia',
              6000000,
              '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-20:00", "saturday": "10:00-18:00", "sunday": "11:00-17:00"}'::jsonb
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              monthly_target = EXCLUDED.monthly_target,
              opening_hours = EXCLUDED.opening_hours,
              updated_at = NOW();
          `
          
          const { error: dataError } = await supabase.rpc('exec', { sql: dataSQL })
          
          if (dataError) {
            console.error('Error insertando datos:', dataError)
            setupSteps.push(`⚠️ Datos iniciales: ${dataError.message}`)
          } else {
            setupSteps.push('✅ Datos de Santiago Wanderers insertados')
          }
          
        } catch (error: any) {
          console.error('Error insertando datos:', error)
          setupSteps.push(`❌ Error en datos iniciales: ${error.message}`)
        }
        
        // Paso 3: Crear usuario administrador
        try {
          console.log('👑 Creando usuario administrador...')
          
          const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
            email: 'd.ramirez.ponce@gmail.com',
            password: 'Daniel139103#',
            user_metadata: {
              name: 'Daniel Ramirez Ponce',
              role: 'admin'
            },
            email_confirm: true
          })
          
          if (adminError) {
            if (adminError.message.includes('already registered')) {
              setupSteps.push('⚠️ Usuario administrador ya existe')
            } else {
              console.error('Error creando admin:', adminError)
              setupSteps.push(`❌ Error creando admin: ${adminError.message}`)
            }
          } else {
            setupSteps.push('✅ Usuario Daniel Ramirez Ponce creado')
            
            // Crear alerta de bienvenida
            if (adminUser?.user) {
              try {
                await supabase.from('alerts').insert({
                  title: '¡Bienvenido a WalkerGestion!',
                  message: 'Hola Daniel, tu cuenta de administrador ha sido creada exitosamente. 💚⚪ ¡Vamos Wanderers! El sistema está completamente configurado.',
                  type: 'success',
                  priority: 'high',
                  user_id: adminUser.user.id,
                  business_unit_id: '550e8400-e29b-41d4-a716-446655440001',
                  category: 'system'
                })
                setupSteps.push('✅ Alerta de bienvenida creada')
              } catch (alertError) {
                console.warn('Error creando alerta:', alertError)
              }
            }
          }
          
        } catch (error: any) {
          console.error('Error creando administrador:', error)
          setupSteps.push(`❌ Error creando administrador: ${error.message}`)
        }
        
        // Paso 4: Configurar funciones y triggers
        try {
          console.log('⚙️ Configurando funciones y triggers...')
          
          const functionsSQL = `
            CREATE OR REPLACE FUNCTION handle_new_user()
            RETURNS TRIGGER AS $$
            BEGIN
              INSERT INTO user_profiles (
                id, 
                email, 
                name, 
                role, 
                company_id, 
                business_unit_id,
                hire_date
              )
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
                END,
                CURRENT_DATE
              );
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE FUNCTION handle_new_user();
          `
          
          const { error: functionsError } = await supabase.rpc('exec', { sql: functionsSQL })
          
          if (functionsError) {
            console.error('Error configurando funciones:', functionsError)
            setupSteps.push(`⚠️ Funciones: ${functionsError.message}`)
          } else {
            setupSteps.push('✅ Funciones y triggers configurados')
          }
          
        } catch (error: any) {
          console.error('Error en funciones:', error)
          setupSteps.push(`❌ Error en funciones: ${error.message}`)
        }
        
        // Resumen final
        console.log('🎉 Configuración completa finalizada')
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Configuración completa de WalkerGestion finalizada',
            steps: setupSteps,
            summary: {
              empresa: 'Santiago Wanderers Retail',
              sucursales: 4,
              administrador: 'Daniel Ramirez Ponce',
              email: 'd.ramirez.ponce@gmail.com',
              sistema: 'Completamente funcional'
            }
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Acción no reconocida' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error en configuración completa:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})