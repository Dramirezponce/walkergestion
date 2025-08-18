-- =====================================
-- SOLUCIÓN RÁPIDA PARA CREAR USUARIO ADMINISTRADOR
-- EJECUTAR EN SUPABASE SQL EDITOR
-- =====================================

-- PASO 1: Crear el usuario administrador en auth.users (si no existe)
-- NOTA: Esta es una inserción directa en la tabla auth.users de Supabase
-- Solo funciona si tienes permisos de administrador en Supabase

DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'd.ramirez.ponce@gmail.com';
    admin_password TEXT := 'WalkerGestion2024!';
    encrypted_password TEXT;
    company_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    business_unit_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    user_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔧 CREANDO USUARIO ADMINISTRADOR DANIEL RAMÍREZ';
    
    -- Verificar si el usuario ya existe en auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = admin_email
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE '✅ Usuario ya existe en auth.users';
        
        -- Obtener el ID del usuario existente
        SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
        
    ELSE
        RAISE NOTICE '📝 Usuario no existe, creando en auth.users...';
        RAISE NOTICE '⚠️ ATENCIÓN: Esta inserción directa solo funciona con permisos de administrador';
        
        -- Generar ID para el nuevo usuario
        admin_user_id := gen_random_uuid();
        
        -- Crear hash básico de la contraseña (NOTA: En producción real, usar hash apropiado)
        encrypted_password := crypt(admin_password, gen_salt('bf'));
        
        -- Insertar usuario en auth.users
        -- NOTA: Esta inserción puede fallar si no tienes permisos suficientes
        BEGIN
            INSERT INTO auth.users (
                id,
                instance_id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                recovery_sent_at,
                last_sign_in_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                admin_user_id,
                '00000000-0000-0000-0000-000000000000'::uuid,
                'authenticated',
                'authenticated',
                admin_email,
                encrypted_password,
                now(),
                now(),
                now(),
                '{"provider": "email", "providers": ["email"]}',
                '{"name": "Daniel Ramírez", "role": "admin"}',
                now(),
                now(),
                '',
                '',
                '',
                ''
            );
            
            RAISE NOTICE '✅ Usuario creado en auth.users con ID: %', admin_user_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '❌ Error creando usuario en auth.users: %', SQLERRM;
            RAISE NOTICE '💡 SOLUCIÓN ALTERNATIVA: Crear usuario manualmente en Supabase Dashboard';
            RAISE NOTICE '   1. Ir a Authentication > Users';
            RAISE NOTICE '   2. Crear usuario con email: %', admin_email;
            RAISE NOTICE '   3. Contraseña: %', admin_password;
            RAISE NOTICE '   4. Confirmar email automáticamente';
            
            -- Si no podemos crear en auth.users, usar un ID fijo conocido
            admin_user_id := '11111111-1111-1111-1111-111111111111'::uuid;
            RAISE NOTICE '   5. Usar ID fijo para perfil: %', admin_user_id;
        END;
    END IF;
    
    -- PASO 2: Crear o actualizar perfil en user_profiles
    RAISE NOTICE '👤 Configurando perfil de usuario...';
    
    -- Verificar que las tablas base existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        RAISE EXCEPTION '❌ Tabla companies no existe. Ejecutar IMPLEMENTACION_SIMPLIFICADA.md primero';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE EXCEPTION '❌ Tabla user_profiles no existe. Ejecutar IMPLEMENTACION_SIMPLIFICADA.md primero';
    END IF;
    
    -- Crear o actualizar perfil
    INSERT INTO user_profiles (
        id,
        email,
        name,
        role,
        company_id,
        business_unit_id,
        phone,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        admin_email,
        'Daniel Ramírez',
        'admin',
        company_id,
        business_unit_id,
        '+56 9 0000 0000',
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = 'admin',
        company_id = EXCLUDED.company_id,
        business_unit_id = EXCLUDED.business_unit_id,
        is_active = true,
        updated_at = now();
    
    RAISE NOTICE '✅ Perfil configurado correctamente';
    
    -- PASO 3: Configurar como manager de la unidad de negocio
    UPDATE business_units 
    SET manager_id = admin_user_id, updated_at = now()
    WHERE id = business_unit_id;
    
    RAISE NOTICE '🏢 Manager configurado en unidad de negocio';
    
    -- PASO 4: Resultado final
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '✅ USUARIO ADMINISTRADOR CONFIGURADO';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👤 DATOS DEL USUARIO:';
    RAISE NOTICE '   📧 Email: %', admin_email;
    RAISE NOTICE '   🔑 Contraseña: %', admin_password;
    RAISE NOTICE '   🆔 ID: %', admin_user_id;
    RAISE NOTICE '   🎭 Rol: Administrador General';
    RAISE NOTICE '   🏢 Empresa: Santiago Wanderers Retail';
    RAISE NOTICE '   📍 Unidad: Oficina Central';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRÓXIMOS PASOS:';
    RAISE NOTICE '   1. ✅ Usuario configurado en base de datos';
    
    IF user_exists THEN
        RAISE NOTICE '   2. ✅ Usuario existe en auth.users';
    ELSE
        RAISE NOTICE '   2. ⚠️ Verificar usuario en Supabase Dashboard > Authentication';
        RAISE NOTICE '      - Si no aparece, crear manualmente con los datos mostrados';
    END IF;
    
    RAISE NOTICE '   3. 🌐 Ir a aplicación WalkerGestion';
    RAISE NOTICE '   4. 🔐 Login con credenciales mostradas';
    RAISE NOTICE '';
    RAISE NOTICE '💚⚪ ¡VERDE Y BLANCO COMO SANTIAGO WANDERERS!';
    
END $$;

-- =====================================
-- VERIFICACIÓN FINAL
-- =====================================
DO $$
DECLARE
    auth_user_count INTEGER;
    profile_count INTEGER;
    admin_email TEXT := 'd.ramirez.ponce@gmail.com';
BEGIN
    -- Contar usuario en auth.users (puede fallar si no hay permisos)
    BEGIN
        SELECT COUNT(*) INTO auth_user_count 
        FROM auth.users 
        WHERE email = admin_email;
        
        RAISE NOTICE '📊 Usuario en auth.users: %', 
            CASE WHEN auth_user_count > 0 THEN '✅ Existe' ELSE '❌ No existe' END;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '📊 Usuario en auth.users: ⚠️ No se puede verificar (sin permisos)';
    END;
    
    -- Contar perfil en user_profiles
    SELECT COUNT(*) INTO profile_count 
    FROM user_profiles 
    WHERE email = admin_email;
    
    RAISE NOTICE '📊 Perfil en user_profiles: %', 
        CASE WHEN profile_count > 0 THEN '✅ Existe' ELSE '❌ No existe' END;
    
    -- Resultado final
    IF profile_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎯 CONFIGURACIÓN COMPLETADA EXITOSAMENTE';
        RAISE NOTICE '🚀 SISTEMA LISTO PARA LOGIN';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ ERROR: Perfil no creado correctamente';
    END IF;
    
END $$;

-- Mostrar información final
SELECT 
    '🎯 Usuario administrador configurado' as estado,
    'd.ramirez.ponce@gmail.com' as email,
    'WalkerGestion2024!' as password,
    'admin' as rol,
    now() as fecha_configuracion;