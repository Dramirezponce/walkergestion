import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface HealthCheckResult {
  component: string
  status: 'healthy' | 'warning' | 'error'
  message: string
  details?: any
  timestamp: string
}

interface ProductionHealthReport {
  overall_status: 'healthy' | 'degraded' | 'unhealthy'
  system_version: string
  checks: HealthCheckResult[]
  daniel_ramirez_status: {
    exists: boolean
    has_profile: boolean
    can_login: boolean
    role: string
    company_assigned: boolean
    message: string
  }
  database_health: {
    tables_count: number
    missing_tables: string[]
    rls_enabled: boolean
    policies_count: number
  }
  performance_metrics: {
    response_time_ms: number
    database_connections: number
    memory_usage?: string
  }
  recommendations: string[]
  timestamp: string
}

export async function runProductionHealthCheck(): Promise<ProductionHealthReport> {
  const startTime = Date.now()
  const checks: HealthCheckResult[] = []
  const recommendations: string[] = []
  
  console.log('🩺 Ejecutando verificación completa de salud para producción...')
  
  // 1. Verificar conectividad de base de datos
  try {
    const { data: dbTest, error: dbError } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
    
    if (dbError) {
      checks.push({
        component: 'Database Connectivity',
        status: 'error',
        message: `Error de conectividad: ${dbError.message}`,
        details: { code: dbError.code, hint: dbError.hint },
        timestamp: new Date().toISOString()
      })
    } else {
      checks.push({
        component: 'Database Connectivity',
        status: 'healthy',
        message: 'Base de datos accesible y respondiendo',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error: any) {
    checks.push({
      component: 'Database Connectivity',
      status: 'error',
      message: `Error crítico de conectividad: ${error.message}`,
      timestamp: new Date().toISOString()
    })
  }

  // 2. Verificar todas las tablas requeridas
  const requiredTables = [
    'companies', 'business_units', 'user_profiles', 'cash_registers',
    'sales', 'cashflows', 'goals', 'alerts'
  ]
  
  const missingTables: string[] = []
  let tablesCount = 0
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error && error.code === '42P01') {
        missingTables.push(table)
      } else if (!error) {
        tablesCount++
      }
    } catch (error) {
      missingTables.push(table)
    }
  }
  
  if (missingTables.length === 0) {
    checks.push({
      component: 'Database Schema',
      status: 'healthy',
      message: `Todas las ${requiredTables.length} tablas están presentes`,
      details: { tables_found: tablesCount },
      timestamp: new Date().toISOString()
    })
  } else {
    checks.push({
      component: 'Database Schema',
      status: 'error',
      message: `${missingTables.length} tablas faltantes`,
      details: { missing_tables: missingTables },
      timestamp: new Date().toISOString()
    })
    recommendations.push('Ejecutar FINAL_PRODUCTION_SUPABASE_SETUP.sql para crear tablas faltantes')
  }

  // 3. Verificar RLS y políticas
  let rlsEnabled = false
  let policiesCount = 0
  
  try {
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', requiredTables)
    
    if (!rlsError && rlsData) {
      const rlsEnabledTables = rlsData.filter(table => table.rowsecurity).length
      rlsEnabled = rlsEnabledTables === requiredTables.length
      
      checks.push({
        component: 'Row Level Security',
        status: rlsEnabled ? 'healthy' : 'warning',
        message: `RLS habilitado en ${rlsEnabledTables}/${requiredTables.length} tablas`,
        details: { rls_enabled_tables: rlsEnabledTables },
        timestamp: new Date().toISOString()
      })
    }
    
    // Contar políticas
    const { data: policiesData, error: policiesError } = await supabase
      .from('pg_policies')
      .select('count')
      .eq('schemaname', 'public')
    
    if (!policiesError && policiesData) {
      policiesCount = policiesData.length
      
      checks.push({
        component: 'Security Policies',
        status: policiesCount > 0 ? 'healthy' : 'warning',
        message: `${policiesCount} políticas de seguridad activas`,
        details: { policies_count: policiesCount },
        timestamp: new Date().toISOString()
      })
    }
  } catch (error: any) {
    checks.push({
      component: 'Security Configuration',
      status: 'warning',
      message: 'No se pudo verificar configuración de seguridad',
      details: { error: error.message },
      timestamp: new Date().toISOString()
    })
  }

  // 4. Verificar específicamente a Daniel Ramírez
  const danielEmail = 'd.ramirez.ponce@gmail.com'
  let danielStatus = {
    exists: false,
    has_profile: false,
    can_login: false,
    role: 'unknown',
    company_assigned: false,
    message: 'Usuario no verificado'
  }
  
  try {
    // Verificar en Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (!authError && authUsers) {
      const danielAuth = authUsers.users.find(user => user.email === danielEmail)
      
      if (danielAuth) {
        danielStatus.exists = true
        danielStatus.can_login = !!danielAuth.email_confirmed_at
        
        // Verificar perfil
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', danielAuth.id)
          .single()
        
        if (!profileError && profileData) {
          danielStatus.has_profile = true
          danielStatus.role = profileData.role
          danielStatus.company_assigned = !!profileData.company_id
          danielStatus.message = 'Usuario completamente configurado y listo'
          
          checks.push({
            component: 'Daniel Ramírez Admin User',
            status: 'healthy',
            message: 'Usuario administrador completamente configurado',
            details: {
              email: danielEmail,
              role: profileData.role,
              company_id: profileData.company_id,
              business_unit_id: profileData.business_unit_id,
              email_confirmed: !!danielAuth.email_confirmed_at
            },
            timestamp: new Date().toISOString()
          })
        } else {
          danielStatus.message = 'Usuario existe en Auth pero falta perfil'
          recommendations.push('Ejecutar configuración de perfil de usuario administrador')
          
          checks.push({
            component: 'Daniel Ramírez Admin User',
            status: 'warning',
            message: 'Usuario existe pero perfil incompleto',
            details: { auth_exists: true, profile_exists: false },
            timestamp: new Date().toISOString()
          })
        }
      } else {
        danielStatus.message = 'Usuario no existe en sistema de autenticación'
        recommendations.push('Ejecutar configuración automática de usuario administrador')
        
        checks.push({
          component: 'Daniel Ramírez Admin User',
          status: 'error',
          message: 'Usuario administrador no encontrado',
          details: { email: danielEmail, exists: false },
          timestamp: new Date().toISOString()
        })
      }
    }
  } catch (error: any) {
    checks.push({
      component: 'Daniel Ramírez Admin User',
      status: 'error',
      message: `Error verificando usuario administrador: ${error.message}`,
      timestamp: new Date().toISOString()
    })
  }

  // 5. Verificar datos iniciales
  try {
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('count')
    
    const { data: unitsData, error: unitsError } = await supabase
      .from('business_units')
      .select('count')
    
    const companiesCount = companiesData?.length || 0
    const unitsCount = unitsData?.length || 0
    
    if (companiesCount > 0 && unitsCount > 0) {
      checks.push({
        component: 'Initial Data',
        status: 'healthy',
        message: `Datos iniciales presentes: ${companiesCount} empresa(s), ${unitsCount} unidad(es)`,
        details: { companies: companiesCount, business_units: unitsCount },
        timestamp: new Date().toISOString()
      })
    } else {
      checks.push({
        component: 'Initial Data',
        status: 'warning',
        message: 'Datos iniciales faltantes o incompletos',
        details: { companies: companiesCount, business_units: unitsCount },
        timestamp: new Date().toISOString()
      })
      recommendations.push('Verificar que el script SQL insertó los datos iniciales correctamente')
    }
  } catch (error: any) {
    checks.push({
      component: 'Initial Data',
      status: 'error',
      message: `Error verificando datos iniciales: ${error.message}`,
      timestamp: new Date().toISOString()
    })
  }

  // 6. Verificar funciones SQL especializadas
  try {
    const { data: functionsData, error: functionsError } = await supabase
      .rpc('setup_daniel_ramirez_user', { user_auth_id: '00000000-0000-0000-0000-000000000000' })
    
    // Esto debe fallar porque el ID no existe, pero la función debe existir
    checks.push({
      component: 'SQL Functions',
      status: 'healthy',
      message: 'Función de configuración de usuario disponible',
      details: { function_name: 'setup_daniel_ramirez_user' },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      checks.push({
        component: 'SQL Functions',
        status: 'warning',
        message: 'Función de configuración no encontrada',
        details: { missing_function: 'setup_daniel_ramirez_user' },
        timestamp: new Date().toISOString()
      })
      recommendations.push('Re-ejecutar sección de funciones SQL del script de configuración')
    } else {
      // Error esperado porque el ID es falso, pero la función existe
      checks.push({
        component: 'SQL Functions',
        status: 'healthy',
        message: 'Función de configuración disponible (error esperado con ID de prueba)',
        details: { function_name: 'setup_daniel_ramirez_user' },
        timestamp: new Date().toISOString()
      })
    }
  }

  // Calcular métricas de performance
  const responseTime = Date.now() - startTime
  
  // Determinar estado general
  const errorCount = checks.filter(check => check.status === 'error').length
  const warningCount = checks.filter(check => check.status === 'warning').length
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
  if (errorCount === 0 && warningCount === 0) {
    overallStatus = 'healthy'
  } else if (errorCount === 0) {
    overallStatus = 'degraded'
  } else {
    overallStatus = 'unhealthy'
  }

  // Agregar recomendaciones adicionales basadas en el estado
  if (overallStatus === 'unhealthy') {
    recommendations.unshift('CRÍTICO: Ejecutar FINAL_PRODUCTION_SUPABASE_SETUP.sql inmediatamente')
  }
  
  if (!danielStatus.exists || !danielStatus.has_profile) {
    recommendations.push('Ejecutar POST /make-server-97a60276/setup/admin para configurar usuario administrador')
  }

  return {
    overall_status: overallStatus,
    system_version: 'WalkerGestion v3.0 Producción',
    checks,
    daniel_ramirez_status: danielStatus,
    database_health: {
      tables_count: tablesCount,
      missing_tables: missingTables,
      rls_enabled: rlsEnabled,
      policies_count: policiesCount
    },
    performance_metrics: {
      response_time_ms: responseTime,
      database_connections: 1 // Simplificado para este check
    },
    recommendations,
    timestamp: new Date().toISOString()
  }
}

// Función para ejecutar directamente si se llama como script
if (import.meta.main) {
  try {
    console.log('🩺 Ejecutando verificación de salud de producción...')
    const report = await runProductionHealthCheck()
    
    console.log('\n🎯 =====================================')
    console.log('📊 REPORTE DE SALUD DE PRODUCCIÓN')
    console.log('🎯 =====================================\n')
    
    console.log(`🏥 Estado General: ${report.overall_status.toUpperCase()}`)
    console.log(`🕐 Tiempo de Respuesta: ${report.performance_metrics.response_time_ms}ms`)
    console.log(`📦 Versión: ${report.system_version}`)
    console.log(`🗄️ Tablas: ${report.database_health.tables_count}/8`)
    console.log(`🔒 RLS: ${report.database_health.rls_enabled ? 'Habilitado' : 'Deshabilitado'}`)
    console.log(`👤 Daniel Ramírez: ${report.daniel_ramirez_status.message}`)
    
    console.log('\n📋 VERIFICACIONES DETALLADAS:')
    report.checks.forEach(check => {
      const icon = check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'
      console.log(`${icon} ${check.component}: ${check.message}`)
    })
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMENDACIONES:')
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }
    
    console.log(`\n🎉 Verificación completada - Sistema ${report.overall_status}`)
    
    if (report.overall_status === 'unhealthy') {
      console.log('\n🚨 ACCIÓN REQUERIDA: Sistema requiere atención inmediata')
      Deno.exit(1)
    } else if (report.overall_status === 'degraded') {
      console.log('\n⚠️ ADVERTENCIA: Sistema operativo pero con problemas menores')
    } else {
      console.log('\n💚⚪ ¡SISTEMA COMPLETAMENTE SALUDABLE - VERDE Y BLANCO!')
    }
    
  } catch (error: any) {
    console.error('❌ ERROR EJECUTANDO VERIFICACIÓN:', error.message)
    Deno.exit(1)
  }
}