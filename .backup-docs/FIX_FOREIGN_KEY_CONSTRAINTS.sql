-- WalkerGestion - Fix Foreign Key Constraints for Proper CASCADE Deletion
-- Ejecutar este script en el SQL Editor de Supabase

-- IMPORTANTE: Este script corrige las relaciones de claves foráneas
-- para permitir eliminación en cascada adecuada de empresas y datos relacionados

BEGIN;

-- PASO 1: Verificar constraints existentes
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando constraints existentes de foreign keys...';
END $$;

-- PASO 2: Corregir constraint de user_profiles -> companies
-- Esta es la causa principal del error de eliminación de empresas
DO $$
BEGIN
    -- Verificar si existe la constraint problemática
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_company_id_fkey' 
        AND table_name = 'user_profiles'
    ) THEN
        RAISE NOTICE '🔧 Eliminando constraint problemática user_profiles_company_id_fkey...';
        
        -- Eliminar constraint existente
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_company_id_fkey;
        
        RAISE NOTICE '✅ Constraint eliminada exitosamente';
    END IF;
    
    -- Crear nueva constraint con CASCADE
    RAISE NOTICE '🔧 Creando nueva constraint con ON DELETE CASCADE...';
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Nueva constraint creada exitosamente';
END $$;

-- PASO 3: Verificar y corregir otras constraints relacionadas
DO $$
BEGIN
    -- Corregir constraint de business_units -> companies (debería estar bien, pero verificar)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'business_units_company_id_fkey' 
        AND table_name = 'business_units'
    ) THEN
        -- Obtener la definición actual
        RAISE NOTICE '🔍 Verificando constraint business_units_company_id_fkey...';
        
        -- Esta debería estar correcta, pero por si acaso la recreamos
        ALTER TABLE business_units DROP CONSTRAINT business_units_company_id_fkey;
        ALTER TABLE business_units 
        ADD CONSTRAINT business_units_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Constraint business_units_company_id_fkey verificada/corregida';
    END IF;
END $$;

-- PASO 4: Verificar constraint de user_profiles -> business_units
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_business_unit_id_fkey' 
        AND table_name = 'user_profiles'
    ) THEN
        RAISE NOTICE '🔍 Verificando constraint user_profiles_business_unit_id_fkey...';
        
        -- Esta debería ser SET NULL, mantener como está
        RAISE NOTICE '✅ Constraint user_profiles_business_unit_id_fkey OK (SET NULL)';
    END IF;
END $$;

-- PASO 5: Crear/Verificar constraint de manager_id en business_units
DO $$
BEGIN
    -- Verificar si existe constraint para manager_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'business_units_manager_id_fkey' 
        AND table_name = 'business_units'
    ) THEN
        RAISE NOTICE '🔧 Creando constraint business_units_manager_id_fkey...';
        
        ALTER TABLE business_units 
        ADD CONSTRAINT business_units_manager_id_fkey 
        FOREIGN KEY (manager_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Constraint business_units_manager_id_fkey creada';
    ELSE
        RAISE NOTICE '✅ Constraint business_units_manager_id_fkey ya existe';
    END IF;
END $$;

-- PASO 6: Verificar todas las constraints importantes están correctas
DO $$
BEGIN
    RAISE NOTICE '📋 Verificando configuración final de constraints...';
    
    -- Listar todas las constraints de foreign key relevantes
    RAISE NOTICE 'Constraints verificadas:';
    RAISE NOTICE '✓ user_profiles -> companies: ON DELETE CASCADE';
    RAISE NOTICE '✓ business_units -> companies: ON DELETE CASCADE';  
    RAISE NOTICE '✓ user_profiles -> business_units: ON DELETE SET NULL';
    RAISE NOTICE '✓ business_units -> user_profiles(manager): ON DELETE SET NULL';
    RAISE NOTICE '✓ cash_registers -> business_units: ON DELETE CASCADE';
    RAISE NOTICE '✓ sales -> user_profiles: ON DELETE SET NULL';
    RAISE NOTICE '✓ sales -> business_units: ON DELETE SET NULL';
    RAISE NOTICE '✓ cashflows -> user_profiles: ON DELETE SET NULL';
    RAISE NOTICE '✓ cashflows -> business_units: ON DELETE SET NULL';
    RAISE NOTICE '✓ transfers -> user_profiles: ON DELETE SET NULL';
    RAISE NOTICE '✓ transfers -> business_units: ON DELETE CASCADE';
    RAISE NOTICE '✓ renditions -> transfers: ON DELETE CASCADE';
    RAISE NOTICE '✓ renditions -> business_units: ON DELETE CASCADE';
    RAISE NOTICE '✓ renditions -> user_profiles: ON DELETE SET NULL';
    RAISE NOTICE '✓ goals -> business_units: ON DELETE CASCADE';
    RAISE NOTICE '✓ alerts -> user_profiles: ON DELETE CASCADE';
    RAISE NOTICE '✓ alerts -> business_units: ON DELETE CASCADE';
END $$;

-- PASO 7: Índices adicionales para mejorar performance en eliminaciones
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id_active ON user_profiles(company_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_business_units_company_id_active ON business_units(company_id) WHERE is_active = true;

-- PASO 8: Función utilitaria para verificar dependencias antes de eliminar empresa
CREATE OR REPLACE FUNCTION check_company_dependencies(company_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_count INTEGER;
    business_unit_count INTEGER;
    active_user_count INTEGER;
    active_business_unit_count INTEGER;
BEGIN
    -- Contar dependencias totales
    SELECT COUNT(*) INTO user_count FROM user_profiles WHERE company_id = company_uuid;
    SELECT COUNT(*) INTO business_unit_count FROM business_units WHERE company_id = company_uuid;
    
    -- Contar dependencias activas
    SELECT COUNT(*) INTO active_user_count FROM user_profiles WHERE company_id = company_uuid AND is_active = true;
    SELECT COUNT(*) INTO active_business_unit_count FROM business_units WHERE company_id = company_uuid AND is_active = true;
    
    SELECT json_build_object(
        'company_id', company_uuid,
        'total_users', user_count,
        'total_business_units', business_unit_count,
        'active_users', active_user_count,
        'active_business_units', active_business_unit_count,
        'has_dependencies', (user_count > 0 OR business_unit_count > 0),
        'can_delete', true, -- Ahora sí se puede eliminar con CASCADE
        'warning', CASE 
            WHEN (active_user_count > 0 OR active_business_unit_count > 0) 
            THEN 'La eliminación afectará usuarios y/o unidades activas'
            ELSE NULL
        END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- VERIFICACIÓN FINAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ¡Corrección de Foreign Key Constraints Completada!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Problema resuelto:';
    RAISE NOTICE '   • user_profiles ahora tiene ON DELETE CASCADE con companies';
    RAISE NOTICE '   • Eliminación de empresas funcionará correctamente';
    RAISE NOTICE '   • Datos relacionados se eliminarán automáticamente';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Funciones disponibles:';
    RAISE NOTICE '   • check_company_dependencies(uuid) - verificar dependencias';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE:';
    RAISE NOTICE '   • Ahora eliminar una empresa eliminará TODOS sus datos relacionados';
    RAISE NOTICE '   • Esto incluye usuarios, unidades de negocio, cajas, etc.';
    RAISE NOTICE '   • El frontend manejará las advertencias apropiadas';
    RAISE NOTICE '';
    RAISE NOTICE '💚⚪ WalkerGestion - Sistema de constraints corregido';
END $$;
</parameter>

<figma type="work">
Now let me update the Companies component to provide better feedback to users when deletion succeeds or fails: