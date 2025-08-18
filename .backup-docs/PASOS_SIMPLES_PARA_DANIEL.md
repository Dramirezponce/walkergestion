# 🚀 PASOS SIMPLES PARA DANIEL RAMÍREZ

## ⚡ SOLUCIÓN RÁPIDA - 10 MINUTOS

### 🎯 OBJETIVO
Tener WalkerGestion funcionando completamente para que Daniel pueda hacer login.

---

## 📋 PASO 1: CONFIGURAR BASE DE DATOS (5 minutos)

1. **Ir a Supabase**
   ```
   🌐 https://supabase.com/dashboard
   ```

2. **Abrir proyecto: `boyhheuwgtyeevijxhzb`**

3. **Ir a SQL Editor > New Query**

4. **Copiar y pegar este código COMPLETO:**

```sql
-- CONFIGURACIÓN COMPLETA WALKERGESTION
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS cashflows CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS cash_registers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS business_units CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tablas principales
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE business_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
    company_id UUID REFERENCES companies(id),
    business_unit_id UUID REFERENCES business_units(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    business_unit_id UUID REFERENCES business_units(id),
    cash_register_id UUID REFERENCES cash_registers(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_type VARCHAR(20) NOT NULL DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE cashflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    business_unit_id UUID REFERENCES business_units(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
    actual_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info',
    user_id UUID REFERENCES user_profiles(id),
    business_unit_id UUID REFERENCES business_units(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

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
('550e8400-e29b-41d4-a716-446655440000', 'Santiago Wanderers Retail', 'Empresa principal - 💚⚪ Verde y Blanco', true);

INSERT INTO business_units (id, company_id, name, address, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Oficina Central', 'Valparaíso, Chile', true),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Local Centro', 'Centro de Valparaíso', true);

INSERT INTO cash_registers (business_unit_id, name, code, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 'Caja Principal Centro', 'CENTRO-01', true);

SELECT '🎉 BASE DE DATOS CONFIGURADA EXITOSAMENTE' as mensaje, now() as fecha;
```

5. **Hacer clic en "RUN" y verificar mensaje:** 
   `"BASE DE DATOS CONFIGURADA EXITOSAMENTE"`

---

## 👤 PASO 2: CREAR USUARIO ADMINISTRADOR (3 minutos)

1. **En el mismo Supabase, ir a:** Authentication > Users

2. **Hacer clic en "Add User"**

3. **Llenar datos EXACTOS:**
   ```
   📧 Email: d.ramirez.ponce@gmail.com
   🔑 Password: WalkerGestion2024!
   ✅ Email Confirm: SÍ (marcar casilla)
   ```

4. **Hacer clic en "Create User"**

5. **Copiar el USER ID que aparece** (algo como: `abc123...`)

---

## 🔗 PASO 3: CONECTAR USUARIO CON PERFIL (2 minutos)

1. **Volver a SQL Editor > New Query**

2. **Pegar este código y CAMBIAR el USER_ID:**

```sql
-- CONECTAR DANIEL RAMÍREZ
-- CAMBIAR 'abc123-...' por el USER ID real del paso anterior
INSERT INTO user_profiles (
    id,
    email,
    name,
    role,
    company_id,
    business_unit_id,
    is_active
) VALUES (
    'abc123-def4-5678-9012-345678901234',  -- ← CAMBIAR POR EL USER ID REAL
    'd.ramirez.ponce@gmail.com',
    'Daniel Ramírez',
    'admin',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    true
);

SELECT '✅ USUARIO DANIEL CONFIGURADO' as resultado, now() as fecha;
```

3. **Ejecutar y verificar mensaje:** `"USUARIO DANIEL CONFIGURADO"`

---

## 🚀 PASO 4: PROBAR LOGIN

1. **Ir a la aplicación WalkerGestion**

2. **Usar credenciales:**
   ```
   📧 Email: d.ramirez.ponce@gmail.com
   🔑 Contraseña: WalkerGestion2024!
   ```

3. **¡Debe funcionar el login!**

---

## 🆘 SI ALGO FALLA

### Error: "Invalid login credentials"
- Verificar que el usuario se creó en Authentication > Users
- Verificar que el email es exactamente: `d.ramirez.ponce@gmail.com`
- Verificar que se ejecutó el script de conexión con el USER ID correcto

### Error: "User profile not found"  
- Verificar que se ejecutó el PASO 3 correctamente
- Verificar que el USER ID es el correcto del usuario creado

### Error: "Function not found"
- Sistema funciona sin backend por ahora
- Solo necesita base de datos y usuario para login básico

---

## ✅ RESULTADO ESPERADO

Al completar estos pasos:

- ✅ Base de datos completamente configurada
- ✅ Usuario Daniel Ramírez creado en Supabase Auth  
- ✅ Perfil conectado correctamente
- ✅ Login funcional en WalkerGestion
- ✅ Acceso completo como administrador

## 💚⚪ ¡VERDE Y BLANCO COMO SANTIAGO WANDERERS!

**WalkerGestion listo para gestionar los locales comerciales con la pasión verdadera del hincha Wanderer.**

---

### 📞 SI NECESITAS AYUDA
Los pasos son súper simples, pero si algo no funciona:
1. Verificar que todos los scripts se ejecutaron sin errores
2. Verificar que el USER ID se copió correctamente
3. Verificar credenciales de login exactas