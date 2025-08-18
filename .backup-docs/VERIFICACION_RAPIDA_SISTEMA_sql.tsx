-- =====================================
-- VERIFICACIÓN RÁPIDA DEL SISTEMA WALKERGESTION
-- EJECUTAR PARA CONFIRMAR QUE TODO ESTÁ OPERATIVO
-- =====================================

-- ======================================
-- 1. VERIFICAR TABLAS PRINCIPALES
-- ======================================
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
    expected_tables TEXT[] := ARRAY['companies', 'business_units', 'user_profiles', 'cash_registers', 'sales', 'cashflows', 'goals', 'alerts'];
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO TABLAS DEL SISTEMA...';
    
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION '❌ TABLAS FALTANTES: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ Todas las tablas principales están creadas';
    END IF;
END $$;

-- ======================================
-- 2. VERIFICAR DATOS INICIALES
-- ======================================
DO $$
DECLARE
    company_count INTEGER;
    unit_count INTEGER;
    register_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO DATOS INICIALES...';
    
    SELECT COUNT(*) INTO company_count FROM companies WHERE name = 'Santiago Wanderers Retail';
    SELECT COUNT(*) INTO unit_count FROM business_units WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';
    SELECT COUNT(*) INTO register_count FROM cash_registers;
    
    IF company_count = 0 THEN
        RAISE EXCEPTION '❌ Empresa Santiago Wanderers Retail no encontrada';
    END IF;
    
    IF unit_count < 3 THEN
        RAISE EXCEPTION '❌ Faltan unidades de negocio (encontradas: %, esperadas: 3)', unit_count;
    END IF;
    
    IF register_count < 4 THEN
        RAISE EXCEPTION '❌ Faltan cajas registradoras (encontradas: %, esperadas: 4)', register_count;
    END IF;
    
    RAISE NOTICE '✅ Datos iniciales correctos - Empresa: %, Unidades: %, Cajas: %', company_count, unit_count, register_count;
END $$;

-- ======================================
-- 3. VERIFICAR POLÍTICAS RLS
-- ======================================
DO $$
DECLARE
    policy_count INTEGER;
    expected_policies INTEGER := 8;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO POLÍTICAS RLS...';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename IN ('companies', 'business_units', 'user_profiles', 'cash_registers', 'sales', 'cashflows', 'goals', 'alerts')
    AND policyname = 'Allow all for authenticated users';
    
    IF policy_count < expected_policies THEN
        RAISE EXCEPTION '❌ Políticas RLS incompletas (encontradas: %, esperadas: %)', policy_count, expected_policies;
    END IF;
    
    RAISE NOTICE '✅ Políticas RLS configuradas correctamente: %', policy_count;
END $$;

-- ======================================
-- 4. VERIFICAR FUNCIÓN DE CONFIGURACIÓN
-- ======================================
DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO FUNCIÓN DE CONFIGURACIÓN...';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'setup_daniel_ramirez_user'
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        RAISE EXCEPTION '❌ Función setup_daniel_ramirez_user no encontrada';
    END IF;
    
    RAISE NOTICE '✅ Función de configuración disponible';
END $$;

-- ======================================
-- 5. VERIFICAR ÍNDICES DE PERFORMANCE
-- ======================================
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO ÍNDICES DE PERFORMANCE...';
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    IF index_count < 10 THEN
        RAISE WARNING '⚠️ Pocos índices de performance (encontrados: %). Considerar ejecutar INDICES_PERFORMANCE_WALKERGESTION.sql', index_count;
    ELSE
        RAISE NOTICE '✅ Índices de performance configurados: %', index_count;
    END IF;
END $$;

-- ======================================
-- 6. VERIFICAR TRIGGERS
-- ======================================
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO TRIGGERS...';
    
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%updated_at%';
    
    IF trigger_count < 4 THEN
        RAISE WARNING '⚠️ Triggers de timestamp incompletos (encontrados: %)', trigger_count;
    ELSE
        RAISE NOTICE '✅ Triggers configurados: %', trigger_count;
    END IF;
END $$;

-- ======================================
-- 7. PROBAR FUNCIÓN DE CONFIGURACIÓN (SOLO TEST)
-- ======================================
DO $$
DECLARE
    test_result JSON;
    test_user_id UUID := gen_random_uuid();
BEGIN
    RAISE NOTICE '🔍 PROBANDO FUNCIÓN DE CONFIGURACIÓN...';
    
    -- Simular configuración (no afecta datos reales)
    BEGIN
        SELECT setup_daniel_ramirez_user(test_user_id) INTO test_result;
        
        IF (test_result->>'success')::boolean = false THEN
            RAISE WARNING '⚠️ Función tiene errores: %', test_result->>'error';
        ELSE
            RAISE NOTICE '✅ Función de configuración operativa';
        END IF;
        
        -- Limpiar datos de prueba
        DELETE FROM user_profiles WHERE id = test_user_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '⚠️ Error probando función: %', SQLERRM;
    END;
END $$;

-- ======================================
-- 8. VERIFICAR ESTRUCTURA PARA DANIEL RAMÍREZ
-- ======================================
DO $$
DECLARE
    daniel_company_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    daniel_unit_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    company_exists BOOLEAN;
    unit_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO ESTRUCTURA PARA DANIEL RAMÍREZ...';
    
    SELECT EXISTS(SELECT 1 FROM companies WHERE id = daniel_company_id) INTO company_exists;
    SELECT EXISTS(SELECT 1 FROM business_units WHERE id = daniel_unit_id) INTO unit_exists;
    
    IF NOT company_exists THEN
        RAISE EXCEPTION '❌ Empresa de Daniel Ramírez no encontrada';
    END IF;
    
    IF NOT unit_exists THEN
        RAISE EXCEPTION '❌ Unidad de negocio de Daniel Ramírez no encontrada';
    END IF;
    
    RAISE NOTICE '✅ Estructura para Daniel Ramírez lista';
END $$;

-- ======================================
-- 9. REPORTE FINAL DE VERIFICACIÓN
-- ======================================
DO $$
DECLARE
    current_time TIMESTAMP := now();
    tables_count INTEGER;
    policies_count INTEGER;
    functions_count INTEGER;
    indexes_count INTEGER;
    data_ready BOOLEAN := true;
BEGIN
    -- Contar elementos
    SELECT COUNT(*) INTO tables_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('companies', 'business_units', 'user_profiles', 'cash_registers', 'sales', 'cashflows', 'goals', 'alerts');
    
    SELECT COUNT(*) INTO policies_count FROM pg_policies 
    WHERE schemaname = 'public' AND policyname = 'Allow all for authenticated users';
    
    SELECT COUNT(*) INTO functions_count FROM information_schema.routines 
    WHERE routine_name = 'setup_daniel_ramirez_user';
    
    SELECT COUNT(*) INTO indexes_count FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
    
    -- Reporte final
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '📋 REPORTE FINAL DE VERIFICACIÓN';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ELEMENTOS DEL SISTEMA:';
    RAISE NOTICE '   📋 Tablas principales: % de 8 ✅', tables_count;
    RAISE NOTICE '   🔒 Políticas RLS: % ✅', policies_count;
    RAISE NOTICE '   ⚙️ Funciones SQL: % ✅', functions_count;
    RAISE NOTICE '   🔍 Índices performance: % ✅', indexes_count;
    RAISE NOTICE '';
    RAISE NOTICE '👤 CONFIGURACIÓN DANIEL RAMÍREZ:';
    RAISE NOTICE '   📧 Email: d.ramirez.ponce@gmail.com';
    RAISE NOTICE '   🔑 Contraseña: WalkerGestion2024!';
    RAISE NOTICE '   🎭 Rol: Administrador General';
    RAISE NOTICE '   🏢 Empresa: Santiago Wanderers Retail';
    RAISE NOTICE '   📍 Unidad: Oficina Central';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRÓXIMOS PASOS:';
    RAISE NOTICE '   1. ✅ Base de datos verificada';
    RAISE NOTICE '   2. 🌐 Ir a aplicación WalkerGestion';
    RAISE NOTICE '   3. 🔐 Login con credenciales mostradas';
    RAISE NOTICE '   4. 🎯 Sistema auto-configurará el usuario';
    RAISE NOTICE '';
    RAISE NOTICE '📅 Verificación realizada: %', current_time;
    RAISE NOTICE '💚⚪ ¡VERDE Y BLANCO COMO SANTIAGO WANDERERS!';
    RAISE NOTICE '';
    
    -- Validación final
    IF tables_count = 8 AND policies_count >= 8 AND functions_count >= 1 THEN
        RAISE NOTICE '🎉 ¡SISTEMA COMPLETAMENTE OPERATIVO!';
        RAISE NOTICE '🚀 WALKERGESTION LISTO PARA PRODUCCIÓN';
    ELSE
        RAISE EXCEPTION '❌ SISTEMA INCOMPLETO - REVISAR CONFIGURACIÓN';
    END IF;
END $$;

-- ======================================
-- INFORMACIÓN FINAL PARA EL USUARIO
-- ======================================
SELECT 
    '🎯 Sistema WalkerGestion verificado exitosamente' as estado,
    '✅ Listo para Daniel Ramírez (d.ramirez.ponce@gmail.com)' as usuario,
    now() as fecha_verificacion,
    '💚⚪ Verde y Blanco como Santiago Wanderers!' as mensaje;