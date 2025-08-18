#!/usr/bin/env node

/**
 * Script de inicialización para Supabase - WalkerGestion
 * Automatiza el deploy de Edge Functions y configuración inicial
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando configuración de Supabase para WalkerGestion...\n');

// Colores para logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, errorMessage) {
  try {
    log(`Ejecutando: ${command}`, colors.blue);
    const result = execSync(command, { stdio: 'inherit', encoding: 'utf8' });
    return true;
  } catch (error) {
    log(`❌ ${errorMessage}`, colors.red);
    console.error(error.message);
    return false;
  }
}

// Verificar que Supabase CLI está instalado
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    log('✅ Supabase CLI encontrado', colors.green);
    return true;
  } catch (error) {
    log('❌ Supabase CLI no está instalado', colors.red);
    log('Instalar con: npm install -g supabase', colors.yellow);
    return false;
  }
}

// Verificar archivo .env
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    log('✅ Archivo .env encontrado', colors.green);
    return true;
  } else {
    log('⚠️ Archivo .env no encontrado', colors.yellow);
    log('Copia .env.example a .env y configura las variables', colors.yellow);
    return false;
  }
}

// Deploy de Edge Functions
function deployEdgeFunctions() {
  log('\n📦 Desplegando Edge Functions...', colors.bright);
  
  const functions = [
    'setup-database',
    'make-server-97a60276'
  ];
  
  let success = true;
  
  for (const func of functions) {
    const funcPath = path.join('supabase', 'functions', func);
    if (fs.existsSync(funcPath)) {
      if (!execCommand(
        `supabase functions deploy ${func}`,
        `Error desplegando función ${func}`
      )) {
        success = false;
      }
    } else {
      log(`⚠️ Función ${func} no encontrada en ${funcPath}`, colors.yellow);
    }
  }
  
  return success;
}

// Ejecutar setup de base de datos
function runDatabaseSetup() {
  log('\n🗄️ Configurando base de datos...', colors.bright);
  
  // Leer variables de entorno
  require('dotenv').config();
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    log('❌ Variables de entorno no configuradas', colors.red);
    return false;
  }
  
  const setupUrl = `${supabaseUrl}/functions/v1/setup-database`;
  
  try {
    const curl = `curl -X POST "${setupUrl}" \\
      -H "Authorization: Bearer ${anonKey}" \\
      -H "Content-Type: application/json" \\
      --data '{}'`;
    
    return execCommand(curl, 'Error ejecutando setup de base de datos');
  } catch (error) {
    log('❌ Error en setup de base de datos', colors.red);
    return false;
  }
}

// Verificar estado del sistema
function verifySystemHealth() {
  log('\n🩺 Verificando estado del sistema...', colors.bright);
  
  require('dotenv').config();
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    log('❌ Variables de entorno no configuradas', colors.red);
    return false;
  }
  
  const healthUrl = `${supabaseUrl}/functions/v1/make-server-97a60276/health`;
  
  try {
    const curl = `curl -X GET "${healthUrl}" \\
      -H "Authorization: Bearer ${anonKey}" \\
      -H "Content-Type: application/json"`;
    
    return execCommand(curl, 'Error verificando salud del sistema');
  } catch (error) {
    log('❌ Error verificando sistema', colors.red);
    return false;
  }
}

// Función principal
async function main() {
  let allSuccess = true;
  
  // Verificaciones previas
  if (!checkSupabaseCLI()) {
    allSuccess = false;
  }
  
  if (!checkEnvFile()) {
    allSuccess = false;
  }
  
  if (!allSuccess) {
    log('\n❌ Verificaciones previas fallaron. Corrige los errores antes de continuar.', colors.red);
    process.exit(1);
  }
  
  // Deploy de funciones
  if (!deployEdgeFunctions()) {
    log('\n⚠️ Algunas Edge Functions no se desplegaron correctamente', colors.yellow);
  }
  
  // Setup de base de datos
  log('\n⏳ Esperando 5 segundos para que las funciones estén disponibles...', colors.blue);
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  if (!runDatabaseSetup()) {
    log('\n⚠️ Setup de base de datos tuvo problemas', colors.yellow);
  }
  
  // Verificación final
  log('\n⏳ Esperando 3 segundos antes de verificar...', colors.blue);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  if (!verifySystemHealth()) {
    log('\n⚠️ Verificación de salud del sistema tuvo problemas', colors.yellow);
  }
  
  // Resumen final
  log('\n🎉 Proceso de inicialización completado!', colors.green);
  log('\n📋 Próximos pasos:', colors.bright);
  log('1. Verificar que todas las Edge Functions están desplegadas', colors.yellow);
  log('2. Crear usuario administrador Daniel Ramírez en Authentication > Users', colors.yellow);
  log('3. Probar login en la aplicación', colors.yellow);
  log('\n💚⚪ ¡Verde y Blanco como Santiago Wanderers!', colors.green);
}

// Ejecutar script
main().catch(error => {
  log(`❌ Error crítico: ${error.message}`, colors.red);
  process.exit(1);
});