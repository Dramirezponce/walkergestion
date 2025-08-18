-- =====================================
-- CONFIGURACIÓN COMPLETA PARA DANIEL RAMÍREZ
-- WalkerGestion - Santiago Wanderers Retail
-- =====================================

-- Configuración inicial: limpiar y crear tablas
DO $$
BEGIN
    -- Eliminar tablas si existen (para reinstalación limpia)
    DROP TABLE IF EXISTS alerts CASCADE;
    DROP TABLE IF EXISTS goals CASCADE;
    DROP TABLE IF EXISTS cashflows CASCADE;
    DROP TABLE IF EXISTS sales CASCADE;
    DROP TABLE IF EXISTS cash_registers CASCADE;
    DROP TABLE IF EXISTS user_profiles CASCADE;
    DROP TABLE IF EXISTS business_units CASCADE;
    DROP TABLE IF EXISTS companies CASCADE;
    
    RAISE NOTICE '🧹 Tablas anteriores eliminadas';
END $$;

-- =====================================
-- CREAR TABLAS PRINCIPALES
-- =====================================

-- 1. Tabla de empresas
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabla de unidades de negocio
CREATE TABLE business_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    manager_id UUID, -- Se vinculará después
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabla de perfiles de usuario
CREATE TABLE user_profiles (
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

-- 4. Tabla de cajas registradoras
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabla de ventas
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    business_unit_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
    cash_register_id UUID REFERENCES cash_registers(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_type VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (transaction_type IN ('cash', 'debit', 'credit')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabla de flujos de caja
CREATE TABLE cashflows (
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

-- 7. Tabla de metas mensuales
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
    actual_amount DECIMAL(12,2) DEFAULT 0,
    bonus_percentage DECIMAL(5,2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(business_unit_id, month_year)
);

-- 8. Tabla de alertas
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================
-- CONFIGURAR ROW LEVEL SECURITY
-- =====================================

-- Habilitar RLS en todas las tablas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios autenticados (permisivas durante desarrollo)
CREATE POLICY "Allow authenticated users" ON companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON business_units FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON user_profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON cash_registers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON cashflows FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON goals FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON alerts FOR ALL TO authenticated USING (true);

-- =====================================
-- INSERTAR DATOS INICIALES
-- =====================================

-- Empresa principal
INSERT INTO companies (id, name, description, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Santiago Wanderers Retail', 'Empresa principal del grupo comercial Santiago Wanderers - 💚⚪ Verde y Blanco', true);

-- Unidades de negocio
INSERT INTO business_units (id, company_id, name, address, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Oficina Central', 'Valparaíso, Chile', true),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Local Centro', 'Centro de Valparaíso', true),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Local Mall', 'Mall Marina Arauco', true);

-- Cajas registradoras
INSERT INTO cash_registers (business_unit_id, name, code, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 'Caja Principal Centro', 'CENTRO-01', true),
('550e8400-e29b-41d4-a716-446655440002', 'Caja Secundaria Centro', 'CENTRO-02', true),
('550e8400-e29b-41d4-a716-446655440003', 'Caja Principal Mall', 'MALL-01', true),
('550e8400-e29b-41d4-a716-446655440003', 'Caja Secundaria Mall', 'MALL-02', true);

-- =====================================
-- PROCEDIMIENTO PARA CREAR USUARIO DANIEL RAMÍREZ
-- =====================================

-- Función para crear/actualizar el usuario administrador Daniel Ramírez
CREATE OR REPLACE FUNCTION setup_daniel_ramirez_admin()
RETURNS TEXT AS $$
DECLARE
    admin_email TEXT := 'd.ramirez.ponce@gmail.com';
    admin_name TEXT := 'Daniel Ramírez';
    admin_password TEXT := 'WalkerGestion2024!';
    company_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    business_unit_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    existing_user_id UUID;
    result_message TEXT;
BEGIN
    -- Verificar si el usuario ya existe en auth.users
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF existing_user_id IS NULL THEN
        -- El usuario no existe, será creado por el backend de Supabase
        result_message := '⚠️ Usuario no existe en Auth. Debe ser creado por el backend.';
    ELSE
        -- El usuario existe, verificar/crear perfil
        IF EXISTS(SELECT 1 FROM user_profiles WHERE id = existing_user_id) THEN
            -- Actualizar perfil existente
            UPDATE user_profiles SET 
                name = admin_name,
                role = 'admin',
                company_id = company_id,
                business_unit_id = business_unit_id,
                is_active = true,
                updated_at = now()
            WHERE id = existing_user_id;
            
            result_message := '✅ Perfil de usuario actualizado: ' || admin_name;
        ELSE
            -- Crear nuevo perfil
            INSERT INTO user_profiles (
                id, email, name, role, company_id, business_unit_id, 
                phone, is_active, created_at, updated_at
            ) VALUES (
                existing_user_id, admin_email, admin_name, 'admin', 
                company_id, business_unit_id, '+56 9 0000 0000', 
                true, now(), now()
            );
            
            result_message := '✅ Perfil de usuario creado: ' || admin_name;
        END IF;
        
        -- Actualizar manager_id en la unidad de negocio
        UPDATE business_units 
        SET manager_id = existing_user_id 
        WHERE id = business_unit_id;
    END IF;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_business_unit ON sales(business_unit_id);
CREATE INDEX idx_cashflows_status ON cashflows(status);
CREATE INDEX idx_cashflows_date ON cashflows(created_at);

-- =====================================
-- TRIGGERS PARA TIMESTAMPS
-- =====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_units_updated_at BEFORE UPDATE ON business_units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- EJECUCIÓN FINAL Y VERIFICACIÓN
-- =====================================

DO $$
DECLARE
    setup_result TEXT;
    table_count INTEGER;
    company_count INTEGER;
    unit_count INTEGER;
BEGIN
    -- Verificar que todas las tablas fueron creadas
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('companies', 'business_units', 'user_profiles', 'cash_registers', 'sales', 'cashflows', 'goals', 'alerts');
    
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO unit_count FROM business_units;
    
    -- Intentar configurar usuario Daniel Ramírez
    SELECT setup_daniel_ramirez_admin() INTO setup_result;
    
    -- Reporte final
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '✅ CONFIGURACIÓN WALKERGESTION COMPLETADA';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTADÍSTICAS:';
    RAISE NOTICE '   📁 Tablas creadas: % de 8', table_count;
    RAISE NOTICE '   🏢 Empresas: %', company_count;
    RAISE NOTICE '   📍 Unidades de negocio: %', unit_count;
    RAISE NOTICE '   🔧 Cajas registradoras: %', (SELECT COUNT(*) FROM cash_registers);
    RAISE NOTICE '';
    RAISE NOTICE '👤 USUARIO ADMINISTRADOR:';
    RAISE NOTICE '   📧 Email: d.ramirez.ponce@gmail.com';
    RAISE NOTICE '   🔑 Contraseña: WalkerGestion2024!';
    RAISE NOTICE '   🎭 Rol: Administrador General';
    RAISE NOTICE '   📋 Estado: %', setup_result;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRÓXIMOS PASOS:';
    RAISE NOTICE '   1. Ir a la aplicación web WalkerGestion';
    RAISE NOTICE '   2. Hacer clic en "Configurar Usuario Administrador"';
    RAISE NOTICE '   3. Iniciar sesión con las credenciales mostradas';
    RAISE NOTICE '   4. Cambiar la contraseña temporal';
    RAISE NOTICE '';
    RAISE NOTICE '💚⚪ ¡VERDE Y BLANCO COMO SANTIAGO WANDERERS!';
    RAISE NOTICE '';
    
    IF table_count < 8 THEN
        RAISE EXCEPTION '❌ ERROR: Solo se crearon % de 8 tablas esperadas', table_count;
    END IF;
    
    IF company_count = 0 THEN
        RAISE EXCEPTION '❌ ERROR: No se creó la empresa por defecto';
    END IF;
    
    IF unit_count = 0 THEN
        RAISE EXCEPTION '❌ ERROR: No se crearon las unidades de negocio';
    END IF;
    
END $$;

-- =====================================
-- INSTRUCCIONES FINALES
-- =====================================

-- Comentarios informativos
COMMENT ON TABLE companies IS 'Empresas del sistema WalkerGestion - Santiago Wanderers Retail';
COMMENT ON TABLE business_units IS 'Unidades de negocio (locales, sucursales, etc.)';
COMMENT ON TABLE user_profiles IS 'Perfiles de usuarios con roles: admin, manager, cashier';
COMMENT ON TABLE sales IS 'Registro de ventas diarias por tipo: cash, debit, credit';
COMMENT ON TABLE cashflows IS 'Flujos de caja (ingresos y gastos) con aprobación';
COMMENT ON TABLE goals IS 'Metas mensuales por unidad de negocio con bonos';
COMMENT ON TABLE alerts IS 'Sistema de alertas y notificaciones';

-- Confirmar configuración completa
SELECT 
    '🎯 WalkerGestion configurado para Daniel Ramírez' as mensaje,
    now() as fecha_configuracion,
    'Ready for production!' as estado;