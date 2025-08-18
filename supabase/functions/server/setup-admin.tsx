import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client with service role
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function setupAdminUser() {
  try {
    console.log('🔧 Iniciando configuración robusta de usuario administrador Daniel Ramírez...')

    const adminEmail = 'd.ramirez.ponce@gmail.com'
    const adminPassword = 'WalkerGestion2024!'
    const adminName = 'Daniel Ramírez'
    const companyId = '550e8400-e29b-41d4-a716-446655440000'
    const businessUnitId = '550e8400-e29b-41d4-a716-446655440001'

    // Paso 1: Verificar conectividad y tablas
    console.log('🔍 Verificando conectividad y estructura de base de datos...')
    try {
      const { data: healthCheck, error: healthError } = await supabase
        .from('companies')
        .select('count')
        .limit(1)

      if (healthError) {
        if (healthError.code === '42P01') {
          throw new Error('SETUP_REQUIRED: Las tablas de la base de datos no existen. Ejecutar CORRECTED_SUPABASE_SETUP.sql')
        } else if (healthError.code === 'PGRST301') {
          throw new Error('PERMISSION_ERROR: Error de permisos. Verificar Service Role Key')
        } else {
          throw new Error(`DATABASE_ERROR: ${healthError.message}`)
        }
      }
      
      console.log('✅ Base de datos accesible')
    } catch (connectErr: any) {
      console.error('❌ Error de conectividad:', connectErr.message)
      throw connectErr
    }

    // Paso 2: Verificar/crear empresa por defecto
    console.log('🏢 Verificando empresa Santiago Wanderers Retail...')
    try {
      const { data: existingCompany, error: companyCheckError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single()

      if (companyCheckError && companyCheckError.code === 'PGRST116') {
        console.log('📝 Creando empresa Santiago Wanderers Retail...')
        const { data: newCompany, error: companyCreateError } = await supabase
          .from('companies')
          .insert({
            id: companyId,
            name: 'Santiago Wanderers Retail',
            description: 'Empresa principal del grupo comercial Santiago Wanderers - 💚⚪ Verde y Blanco',
            is_active: true
          })
          .select()
          .single()

        if (companyCreateError) {
          throw new Error(`Error creando empresa: ${companyCreateError.message}`)
        }
        console.log('✅ Empresa creada exitosamente')
      } else if (companyCheckError) {
        throw new Error(`Error verificando empresa: ${companyCheckError.message}`)
      } else {
        console.log(`✅ Empresa ya existe: ${existingCompany.name}`)
      }
    } catch (companyErr: any) {
      console.error('❌ Error de empresa:', companyErr.message)
      throw new Error(`COMPANY_ERROR: ${companyErr.message}`)
    }

    // Paso 3: Verificar/crear unidad de negocio
    console.log('📍 Verificando unidad de negocio Oficina Central...')
    try {
      const { data: existingUnit, error: unitCheckError } = await supabase
        .from('business_units')
        .select('id, name')
        .eq('id', businessUnitId)
        .single()

      if (unitCheckError && unitCheckError.code === 'PGRST116') {
        console.log('📝 Creando Oficina Central...')
        const { data: newUnit, error: unitCreateError } = await supabase
          .from('business_units')
          .insert({
            id: businessUnitId,
            company_id: companyId,
            name: 'Oficina Central',
            address: 'Valparaíso, Chile',
            is_active: true
          })
          .select()
          .single()

        if (unitCreateError) {
          throw new Error(`Error creando unidad de negocio: ${unitCreateError.message}`)
        }
        console.log('✅ Unidad de negocio creada exitosamente')
      } else if (unitCheckError) {
        throw new Error(`Error verificando unidad de negocio: ${unitCheckError.message}`)
      } else {
        console.log(`✅ Unidad de negocio ya existe: ${existingUnit.name}`)
      }
    } catch (unitErr: any) {
      console.error('❌ Error de unidad de negocio:', unitErr.message)
      throw new Error(`BUSINESS_UNIT_ERROR: ${unitErr.message}`)
    }

    // Paso 4: Gestión robusta del usuario en Auth
    console.log('👤 Gestionando usuario en Supabase Auth...')
    let userId: string
    
    try {
      // Verificar si el usuario ya existe
      const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers()
      
      if (listUsersError) {
        throw new Error(`Error accediendo a Auth: ${listUsersError.message}`)
      }

      let existingUser = existingUsers?.users?.find(user => user.email === adminEmail)
      
      if (existingUser) {
        console.log(`✅ Usuario ya existe en Auth: ${adminEmail}`)
        userId = existingUser.id
        
        // Verificar si el usuario está confirmado
        if (!existingUser.email_confirmed_at) {
          console.log('🔄 Confirmando email del usuario existente...')
          try {
            await supabase.auth.admin.updateUserById(existingUser.id, {
              email_confirm: true
            })
            console.log('✅ Email confirmado')
          } catch (confirmErr: any) {
            console.warn('⚠️ No se pudo confirmar email automáticamente:', confirmErr.message)
          }
        }
      } else {
        // Crear usuario nuevo
        console.log('📝 Creando nuevo usuario en Supabase Auth...')
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true, // Auto-confirmar email
          user_metadata: { 
            name: adminName, 
            role: 'admin',
            created_by: 'walker_gestion_setup'
          }
        })

        if (authError) {
          // Manejar errores específicos de Auth
          if (authError.message.includes('User already registered')) {
            console.log('⚠️ Usuario ya registrado, obteniendo información...')
            const { data: retryUsers } = await supabase.auth.admin.listUsers()
            existingUser = retryUsers?.users?.find(user => user.email === adminEmail)
            if (existingUser) {
              userId = existingUser.id
            } else {
              throw new Error('Usuario reportado como existente pero no encontrado')
            }
          } else {
            throw new Error(`Error creando usuario en Auth: ${authError.message}`)
          }
        } else if (!authData.user) {
          throw new Error('No se recibió información del usuario creado')
        } else {
          userId = authData.user.id
          console.log('✅ Usuario creado exitosamente en Auth')
        }
      }
    } catch (authErr: any) {
      console.error('❌ Error de autenticación:', authErr.message)
      throw new Error(`AUTH_ERROR: ${authErr.message}`)
    }

    // Paso 5: Configurar perfil usando función SQL mejorada
    console.log('🎭 Configurando perfil de usuario...')
    try {
      const { data: profileResult, error: profileError } = await supabase
        .rpc('setup_daniel_ramirez_user', { user_auth_id: userId })

      if (profileError) {
        console.warn('⚠️ Error ejecutando función SQL, intentando configuración manual:', profileError.message)
        
        // Fallback: configuración manual del perfil
        console.log('🔄 Configuración manual del perfil...')
        const { data: manualProfile, error: manualError } = await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            email: adminEmail,
            name: adminName,
            role: 'admin',
            company_id: companyId,
            business_unit_id: businessUnitId,
            phone: '+56 9 0000 0000',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()
          .single()

        if (manualError) {
          throw new Error(`Error en configuración manual del perfil: ${manualError.message}`)
        }
        console.log('✅ Perfil configurado manualmente')
      } else {
        console.log('✅ Perfil configurado con función SQL')
        console.log('Resultado:', profileResult)
      }
    } catch (profileErr: any) {
      console.error('❌ Error configurando perfil:', profileErr.message)
      throw new Error(`PROFILE_ERROR: ${profileErr.message}`)
    }

    // Paso 6: Verificación final del usuario
    console.log('🔍 Verificación final del usuario configurado...')
    try {
      const { data: finalProfile, error: finalError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (finalError || !finalProfile) {
        throw new Error('Usuario no verificado después de la configuración')
      }

      // Actualizar manager en unidad de negocio
      await supabase
        .from('business_units')
        .update({ 
          manager_id: userId, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', businessUnitId)

      console.log('🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!')
      console.log('📧 Email:', adminEmail)
      console.log('🔑 Contraseña:', adminPassword)
      console.log('👤 Nombre:', finalProfile.name)
      console.log('🎭 Rol:', finalProfile.role)
      console.log('🏢 Empresa ID:', finalProfile.company_id)
      console.log('📍 Unidad de negocio ID:', finalProfile.business_unit_id)

      return {
        success: true,
        user: {
          id: userId,
          email: adminEmail,
          name: finalProfile.name,
          role: finalProfile.role,
          company_id: finalProfile.company_id,
          business_unit_id: finalProfile.business_unit_id,
          temporaryPassword: adminPassword,
          profileComplete: true,
          emailConfirmed: true
        },
        message: 'Usuario Daniel Ramírez configurado exitosamente',
        timestamp: new Date().toISOString(),
        instructions: [
          '✅ Usuario creado/verificado en Supabase Auth',
          '✅ Perfil configurado en user_profiles',
          '✅ Empresa y unidad de negocio verificadas',
          '✅ Manager asignado a unidad de negocio',
          '✅ Sistema listo para login'
        ]
      }

    } catch (finalErr: any) {
      throw new Error(`VERIFICATION_ERROR: ${finalErr.message}`)
    }

  } catch (error: any) {
    console.error('❌ ERROR CONFIGURANDO USUARIO ADMINISTRADOR:', error.message)
    console.error('Stack trace:', error.stack)
    
    // Categorizar el error para dar mejores sugerencias
    let errorCategory = 'UNKNOWN'
    let suggestions: string[] = []
    
    if (error.message.includes('SETUP_REQUIRED')) {
      errorCategory = 'DATABASE_SETUP'
      suggestions = [
        'Ejecutar el archivo CORRECTED_SUPABASE_SETUP.sql en el editor SQL de Supabase',
        'Verificar que todas las tablas se crearon correctamente',
        'Confirmar que las políticas RLS están habilitadas'
      ]
    } else if (error.message.includes('PERMISSION_ERROR')) {
      errorCategory = 'PERMISSIONS'
      suggestions = [
        'Verificar que SUPABASE_SERVICE_ROLE_KEY es correcta',
        'Confirmar permisos de Service Role en Supabase Dashboard',
        'Verificar que la clave no ha expirado'
      ]
    } else if (error.message.includes('AUTH_ERROR')) {
      errorCategory = 'AUTHENTICATION'
      suggestions = [
        'Verificar configuración de Auth en Supabase',
        'Confirmar que el email no está bloqueado',
        'Revisar logs de Auth en Supabase Dashboard'
      ]
    } else {
      suggestions = [
        'Verificar conectividad con Supabase',
        'Revisar logs del servidor en Supabase Functions',
        'Confirmar configuración de variables de entorno'
      ]
    }
    
    return {
      success: false,
      error: error.message,
      errorCategory,
      message: 'Error en configuración del usuario administrador',
      timestamp: new Date().toISOString(),
      suggestions,
      troubleshooting: {
        step1: 'Ejecutar CORRECTED_SUPABASE_SETUP.sql',
        step2: 'Verificar Service Role Key',
        step3: 'Revisar logs de Supabase Functions',
        step4: 'Contactar soporte si persiste el problema'
      }
    }
  }
}

// Función mejorada para verificar el estado del usuario
export async function checkAdminUserStatus() {
  try {
    const adminEmail = 'd.ramirez.ponce@gmail.com'
    
    console.log('🔍 Verificando estado completo del usuario administrador...')
    
    // Verificar conectividad de base de datos primero
    try {
      const { error: connectError } = await supabase
        .from('companies')
        .select('count')
        .limit(1)
        
      if (connectError) {
        if (connectError.code === '42P01') {
          return {
            exists: false,
            hasProfile: false,
            needsSetup: true,
            message: 'Base de datos no configurada',
            details: 'Las tablas del sistema no existen. Ejecutar CORRECTED_SUPABASE_SETUP.sql',
            error: 'DATABASE_NOT_SETUP',
            suggestions: ['Ejecutar script SQL de configuración']
          }
        }
        throw connectError
      }
    } catch (dbErr: any) {
      return {
        exists: false,
        hasProfile: false,
        needsSetup: true,
        message: 'Error de conectividad con base de datos',
        details: dbErr.message,
        error: 'DATABASE_CONNECTION_ERROR'
      }
    }
    
    // Verificar usuario en Auth
    console.log('👤 Verificando usuario en Supabase Auth...')
    try {
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        throw new Error(`Error accediendo a Auth: ${listError.message}`)
      }
      
      const existingUser = existingUsers?.users?.find(user => user.email === adminEmail)
      
      if (!existingUser) {
        return {
          exists: false,
          hasProfile: false,
          needsSetup: true,
          message: 'Usuario no existe en Supabase Auth',
          details: 'El usuario Daniel Ramírez debe ser creado en el sistema de autenticación',
          suggestions: ['Ejecutar configuración automática']
        }
      }
      
      console.log('✅ Usuario encontrado en Auth')
      
      // Verificar perfil en user_profiles
      console.log('🎭 Verificando perfil de usuario...')
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        return {
          exists: true,
          hasProfile: false,
          needsSetup: true,
          message: 'Usuario existe en Auth pero no tiene perfil',
          user: {
            id: existingUser.id,
            email: existingUser.email,
            emailConfirmed: !!existingUser.email_confirmed_at
          },
          details: 'Perfil debe ser creado en la tabla user_profiles',
          suggestions: ['Ejecutar configuración de perfil']
        }
      }
      
      if (profileError) {
        throw new Error(`Error verificando perfil: ${profileError.message}`)
      }
      
      // Todo está configurado correctamente
      console.log('✅ Usuario completamente configurado')
      return {
        exists: true,
        hasProfile: true,
        needsSetup: false,
        message: 'Usuario administrador configurado correctamente',
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          company_id: profile.company_id,
          business_unit_id: profile.business_unit_id,
          is_active: profile.is_active,
          emailConfirmed: !!existingUser.email_confirmed_at
        },
        details: 'Usuario listo para iniciar sesión',
        lastUpdated: profile.updated_at
      }
      
    } catch (authErr: any) {
      console.error('❌ Error verificando Auth:', authErr.message)
      return {
        exists: false,
        hasProfile: false,
        needsSetup: true,
        message: 'Error verificando usuario en Auth',
        error: authErr.message,
        details: 'No se pudo acceder al sistema de autenticación'
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error general verificando estado del usuario:', error.message)
    return {
      exists: false,
      hasProfile: false,
      needsSetup: true,
      message: 'Error general verificando usuario',
      error: error.message,
      details: 'Error inesperado al verificar el estado del usuario',
      timestamp: new Date().toISOString()
    }
  }
}

// Función para ejecutar directamente si se llama como script
if (import.meta.main) {
  try {
    console.log('🚀 Ejecutando script de configuración de usuario administrador...')
    const result = await setupAdminUser()
    
    if (result.success) {
      console.log('✅ ¡SCRIPT COMPLETADO EXITOSAMENTE!')
      console.log('Usuario configurado:', result.user)
      console.log('Instrucciones:', result.instructions)
    } else {
      console.error('❌ SCRIPT FALLÓ:', result.error)
      console.error('Categoría:', result.errorCategory)
      console.error('Sugerencias:', result.suggestions)
      Deno.exit(1)
    }
  } catch (error: any) {
    console.error('❌ ERROR EJECUTANDO SCRIPT:', error.message)
    Deno.exit(1)
  }
}