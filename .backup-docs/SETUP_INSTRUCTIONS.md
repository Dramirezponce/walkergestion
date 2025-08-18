# 🟢⚪ WalkerGestion - Instrucciones de Configuración

**Santiago Wanderers Edition - Verde y Blanco**

## 🔧 Configuración Manual de Base de Datos

Si el configurador automático indica que se requiere configuración manual, sigue estos pasos:

### 📋 Pasos de Configuración

#### 1. Acceder a Supabase Dashboard
- Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
- Ve a la sección **SQL Editor**

#### 2. Ejecutar Script Principal
- Copia el contenido del archivo `SUPABASE_COMPLETE_SETUP.sql`
- Pégalo en el SQL Editor y ejecuta
- Este script creará todas las tablas, índices, funciones y datos iniciales

#### 3. Verificar Creación de Tablas
Deberías ver estas tablas creadas:
- ✅ `companies` - Gestión de empresas
- ✅ `business_units` - Sucursales
- ✅ `user_profiles` - Perfiles de usuario
- ✅ `sales` - Ventas
- ✅ `cashflows` - Flujos de caja
- ✅ `alerts` - Alertas
- ✅ `goals` - Metas y bonos
- ✅ `transfers` - Transferencias
- ✅ `custom_reports` - Reportes personalizados
- ✅ `system_settings` - Configuraciones

#### 4. Crear Usuario Administrador

**Opción A: Desde Authentication UI**
1. Ve a **Authentication** → **Users**
2. Clic en **Add user**
3. Email: `d.ramirez.ponce@gmail.com`
4. Password: `Daniel139103#`
5. Metadata: `{"name": "Daniel Ramirez Ponce", "role": "admin"}`

**Opción B: Desde SQL Editor**
- Ejecuta el script `setup-admin-user.sql`

#### 5. Verificar Configuración
Ejecuta esta consulta para verificar:
```sql
SELECT 
    up.name,
    up.email,
    up.role,
    c.name as company,
    bu.name as business_unit
FROM user_profiles up
LEFT JOIN companies c ON up.company_id = c.id
LEFT JOIN business_units bu ON up.business_unit_id = bu.id
WHERE up.role = 'admin';
```

### 🔐 Configuración de RLS (Row Level Security)

Si las políticas RLS no se crearon automáticamente:

#### 1. Habilitar RLS en Tablas
```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
```

#### 2. Políticas Básicas (Mínimo Requerido)
```sql
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles 
    FOR SELECT USING (auth.uid() = id);

-- Administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON user_profiles 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Usuarios autenticados pueden ver empresas y sucursales
CREATE POLICY "Users can view companies" ON companies 
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view business units" ON business_units 
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Usuarios pueden insertar sus propias ventas
CREATE POLICY "Users can insert own sales" ON sales 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ver ventas según rol
CREATE POLICY "Users can view sales based on role" ON sales 
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );
```

### 🎯 Datos de Usuario Administrador

Una vez configurado, el usuario administrador tendrá:

- **Nombre**: Daniel Ramirez Ponce
- **Email**: d.ramirez.ponce@gmail.com
- **Contraseña**: Daniel139103#
- **Rol**: Administrador General
- **Empresa**: Santiago Wanderers Retail
- **Unidad**: Administración Central

### 🏢 Estructura Empresarial

La configuración incluye:

#### Santiago Wanderers Retail
- **Administración Central** (Valparaíso)
- **Sucursal Centro** (Santiago Centro)
- **Sucursal Las Condes** (Las Condes)
- **Sucursal Providencia** (Providencia)

### 🚀 Verificación Final

1. **Inicia sesión** con las credenciales del administrador
2. **Verifica acceso** a todas las funcionalidades
3. **Comprueba el dashboard** muestre datos correctamente
4. **Prueba crear ventas** y flujos de caja

### ❌ Solución de Problemas

#### Error: "relation does not exist"
- Ejecuta nuevamente el script `SUPABASE_COMPLETE_SETUP.sql`
- Verifica que todas las tablas se crearon correctamente

#### Error: "insufficient_privilege" 
- Asegúrate de usar el SQL Editor con permisos de administrador
- Verifica que RLS esté configurado correctamente

#### Error de autenticación
- Confirma que el usuario existe en Authentication
- Verifica que el perfil esté en `user_profiles`
- Ejecuta `setup-admin-user.sql` si es necesario

#### Error: "Could not find the function public.exec"
- Normal - las políticas RLS deben crearse manualmente
- Usa las políticas básicas del paso 2 arriba

### 📞 Soporte

Si tienes problemas:
1. Verifica que el proyecto Supabase esté activo
2. Confirma que tienes permisos de administrador
3. Revisa los logs en Supabase Dashboard
4. Ejecuta los scripts paso a paso

### 💚⚪ ¡Vamos Wanderers!

Una vez completada la configuración, WalkerGestion estará completamente operativo con todas las funcionalidades de gestión comercial inspiradas en Santiago Wanderers de Valparaíso.

---

**WalkerGestion v2.0 - Santiago Wanderers Edition**  
*Verde y Blanco como el alma porteña* 🟢⚪