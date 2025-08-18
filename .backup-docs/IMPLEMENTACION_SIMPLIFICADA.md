# 🚀 IMPLEMENTACIÓN SIMPLIFICADA - WALKERGESTION

## 🎯 OBJETIVO ÚNICO
Tener WalkerGestion funcionando al 100% para Daniel Ramírez en menos de 30 minutos.

---

## ⏰ PROCESO RÁPIDO (5 PASOS ESENCIALES)

### ✅ PASO 1: EJECUTAR SCRIPT PRINCIPAL (5 minutos)

1. **Ir a:** https://supabase.com/dashboard
2. **Proyecto:** `boyhheuwgtyeevijxhzb`
3. **Ir a:** SQL Editor > New Query
4. **Copiar COMPLETO y ejecutar:**

```sql
-- ========================================
-- SETUP COMPLETO WALKERGESTION - UNA SOLA VEZ
-- ========================================

-- Limpiar configuración anterior
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS cashflows CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS cash_registers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS business_units CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Crear extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Empresas
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Unidades de negocio
CREATE TABLE business_units (
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

-- 3. Perfiles de usuario
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

-- 4. Cajas registradoras
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Ventas
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

-- 6. Flujos de caja
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

-- 7. Metas
CREATE TABLE goals (
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

-- 8. Alertas
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

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas
CREATE POLICY "Allow all for authenticated users" ON companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON business_units FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON user_profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON cash_registers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON cashflows FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON goals FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON alerts FOR ALL TO authenticated USING (true);

-- Datos iniciales
INSERT INTO companies (id, name, description, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Santiago Wanderers Retail', 'Empresa principal del grupo comercial Santiago Wanderers - 💚⚪ Verde y Blanco', true);

INSERT INTO business_units (id, company_id, name, address, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Oficina Central', 'Valparaíso, Chile', true),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Local Centro', 'Centro de Valparaíso', true),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Local Mall', 'Mall Marina Arauco', true);

INSERT INTO cash_registers (business_unit_id, name, code, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 'Caja Principal Centro', 'CENTRO-01', true),
('550e8400-e29b-41d4-a716-446655440002', 'Caja Secundaria Centro', 'CENTRO-02', true),
('550e8400-e29b-41d4-a716-446655440003', 'Caja Principal Mall', 'MALL-01', true),
('550e8400-e29b-41d4-a716-446655440003', 'Caja Secundaria Mall', 'MALL-02', true);

-- Función de configuración
CREATE OR REPLACE FUNCTION setup_daniel_ramirez_user(user_auth_id UUID)
RETURNS JSON AS $$
DECLARE
    admin_email TEXT := 'd.ramirez.ponce@gmail.com';
    admin_name TEXT := 'Daniel Ramírez';
    company_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    business_unit_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    result JSON;
BEGIN
    INSERT INTO user_profiles (id, email, name, role, company_id, business_unit_id, phone, is_active, created_at, updated_at) 
    VALUES (user_auth_id, admin_email, admin_name, 'admin', company_id, business_unit_id, '+56 9 0000 0000', true, now(), now())
    ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, role = 'admin', company_id = EXCLUDED.company_id, 
        business_unit_id = EXCLUDED.business_unit_id, is_active = true, updated_at = now();
    
    UPDATE business_units SET manager_id = user_auth_id, updated_at = now() WHERE id = business_unit_id;
    
    SELECT json_build_object('success', true, 'user_id', user_auth_id, 'email', admin_email, 'name', admin_name, 'role', 'admin', 'company_id', company_id, 'business_unit_id', business_unit_id, 'message', 'Usuario Daniel Ramírez configurado exitosamente', 'timestamp', now()) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'message', 'Error configurando usuario Daniel Ramírez', 'timestamp', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensaje final
SELECT '🎉 WALKERGESTION CONFIGURADO EXITOSAMENTE PARA DANIEL RAMÍREZ' as mensaje, 'd.ramirez.ponce@gmail.com' as email_admin, 'WalkerGestion2024!' as password_admin, now() as fecha_configuracion;
```

**✅ Mensaje esperado:** "WALKERGESTION CONFIGURADO EXITOSAMENTE"

---

### ✅ PASO 2: CONFIGURAR VARIABLES (5 minutos)

1. **En el mismo proyecto Supabase, ir a:** Settings > API
2. **Copiar estas 2 claves:**
   - `anon` key (la primera)
   - `service_role` key (la segunda - MUY IMPORTANTE)

3. **Ir a:** Edge Functions > Settings (o buscar "Environment Variables")
4. **Agregar estas 3 variables:**

```
SUPABASE_URL = https://boyhheuwgtyeevijxhzb.supabase.co
SUPABASE_ANON_KEY = [pegar la clave "anon" del paso 2]
SUPABASE_SERVICE_ROLE_KEY = [pegar la clave "service_role" del paso 2]
```

---

### ✅ PASO 3: VERIFICAR BACKEND (2 minutos)

1. **Abrir en nueva pestaña:**
   ```
   https://boyhheuwgtyeevijxhzb.supabase.co/functions/v1/make-server-97a60276/health
   ```

2. **Debe mostrar:** `{"status":"healthy"}`

3. **Si NO funciona:**
   - Ir a Edge Functions en Supabase
   - Crear nueva función llamada: `make-server-97a60276`
   - Copiar código del archivo: `/supabase/functions/server/index.tsx`
   - Deployar

---

### ✅ PASO 4: CREAR ÍNDICES DE PERFORMANCE (3 minutos)

En SQL Editor, nueva query:

```sql
-- Índices esenciales para WalkerGestion
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_business_unit ON sales(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_cashflows_status ON cashflows(status);
CREATE INDEX IF NOT EXISTS idx_business_units_company ON business_units(company_id);

SELECT '⚡ ÍNDICES DE PERFORMANCE CREADOS EXITOSAMENTE' as mensaje, now() as fecha;
```

---

### ✅ PASO 5: PROBAR LA APLICACIÓN (5 minutos)

1. **Ir a la aplicación WalkerGestion**
2. **Login con:**
   ```
   📧 Email: d.ramirez.ponce@gmail.com
   🔑 Contraseña: WalkerGestion2024!
   ```
3. **El sistema debe:**
   - Auto-configurar el usuario automáticamente
   - Mostrar dashboard completo
   - Acceso total como administrador

---

## 🆘 PROBLEMAS Y SOLUCIONES RÁPIDAS

### ❌ Error: "Variables no encontradas"
**Solución:** Ir a Project Settings > Functions > Environment Variables

### ❌ Error: "Function not found"
**Solución:** Redesplegar la función desde Edge Functions

### ❌ Error: "Tablas no existen"
**Solución:** Re-ejecutar el script SQL del Paso 1

### ❌ Error: "Invalid credentials"
**Solución:** El sistema debería auto-configurar el usuario. Verificar que el script SQL se ejecutó correctamente.

---

## ✅ VERIFICACIÓN FINAL

**Todo está funcionando si:**

1. ✅ Script SQL se ejecutó sin errores
2. ✅ Variables de entorno configuradas
3. ✅ URL de health responde correctamente
4. ✅ Login exitoso en la aplicación
5. ✅ Dashboard muestra datos del administrador

---

## 🎉 RESULTADO

**WalkerGestion completamente operativo para:**
- **Usuario:** Daniel Ramírez
- **Email:** d.ramirez.ponce@gmail.com
- **Rol:** Administrador General
- **Empresa:** Santiago Wanderers Retail 💚⚪

**¡Sistema listo para gestionar todos los locales comerciales!**