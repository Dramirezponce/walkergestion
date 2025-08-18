#!/usr/bin/env node

// WalkerGestion - System Check Script
// 💚⚪ Verde y Blanco - Santiago Wanderers

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🔍 ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function checkFile(filePath, description, required = true) {
  const fullPath = path.join(ROOT_DIR, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else if (required) {
    log(`❌ ${description} - REQUERIDO`, 'red');
    return false;
  } else {
    log(`⚠️  ${description} - OPCIONAL`, 'yellow');
    return true;
  }
}

function checkDirectory(dirPath, description) {
  const fullPath = path.join(ROOT_DIR, dirPath);
  const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  
  if (exists) {
    const files = fs.readdirSync(fullPath);
    log(`✅ ${description} (${files.length} archivos)`, 'green');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkPackageJson() {
  try {
    const packagePath = path.join(ROOT_DIR, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    log(`✅ package.json válido`, 'green');
    log(`   📦 Nombre: ${packageJson.name}`, 'blue');
    log(`   🏷️  Versión: ${packageJson.version}`, 'blue');
    
    // Check important scripts
    const requiredScripts = ['dev', 'build', 'preview'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length === 0) {
      log(`✅ Scripts requeridos presentes`, 'green');
    } else {
      log(`❌ Scripts faltantes: ${missingScripts.join(', ')}`, 'red');
      return false;
    }
    
    // Check important dependencies
    const requiredDeps = ['react', 'react-dom', '@supabase/supabase-js', 'lucide-react'];
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDeps.length === 0) {
      log(`✅ Dependencias críticas presentes`, 'green');
    } else {
      log(`❌ Dependencias faltantes: ${missingDeps.join(', ')}`, 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ Error leyendo package.json: ${error.message}`, 'red');
    return false;
  }
}

function checkEnvironmentSetup() {
  log(`ℹ️  Variables de entorno requeridas:`, 'blue');
  log(`   VITE_SUPABASE_URL=https://boyhheuwgtyeevijxhzb.supabase.co`, 'blue');
  log(`   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`, 'blue');
  
  const envExample = path.join(ROOT_DIR, '.env.example');
  if (fs.existsSync(envExample)) {
    log(`✅ .env.example encontrado`, 'green');
  } else {
    log(`⚠️  .env.example no encontrado`, 'yellow');
  }
  
  return true;
}

function checkBuildOutput() {
  const distPath = path.join(ROOT_DIR, 'dist');
  if (fs.existsSync(distPath)) {
    log(`✅ Directorio dist/ existe`, 'green');
    
    const indexHtml = path.join(distPath, 'index.html');
    if (fs.existsSync(indexHtml)) {
      log(`✅ index.html en dist/`, 'green');
    } else {
      log(`❌ index.html faltante en dist/`, 'red');
      return false;
    }
    
    const assetsDir = path.join(distPath, 'assets');
    if (fs.existsSync(assetsDir)) {
      const assets = fs.readdirSync(assetsDir);
      log(`✅ Assets generados (${assets.length} archivos)`, 'green');
    } else {
      log(`❌ Directorio assets/ faltante`, 'red');
      return false;
    }
    
    return true;
  } else {
    log(`⚠️  No hay build previo (ejecuta 'npm run build')`, 'yellow');
    return true; // No es crítico para deployment inicial
  }
}

async function main() {
  log('🚀 WalkerGestion - Verificación del Sistema', 'magenta');
  log('💚⚪ Verde y Blanco - Santiago Wanderers', 'green');
  console.log('');
  
  let allPassed = true;
  
  // 1. Archivos de configuración críticos
  logSection('Archivos de Configuración');
  allPassed &= checkFile('package.json', 'package.json');
  allPassed &= checkFile('vite.config.ts', 'Configuración de Vite');
  allPassed &= checkFile('vercel.json', 'Configuración de Vercel');
  allPassed &= checkFile('tsconfig.json', 'Configuración de TypeScript', false);
  allPassed &= checkFile('.gitignore', 'GitIgnore');
  allPassed &= checkFile('index.html', 'HTML principal');
  
  // 2. Archivos de aplicación
  logSection('Archivos de Aplicación');
  allPassed &= checkFile('App.tsx', 'Componente principal');
  allPassed &= checkFile('main.tsx', 'Entry point');
  allPassed &= checkFile('styles/globals.css', 'Estilos globales');
  
  // 3. Directorios importantes
  logSection('Estructura de Directorios');
  allPassed &= checkDirectory('components', 'Componentes React');
  allPassed &= checkDirectory('hooks', 'Hooks personalizados');
  allPassed &= checkDirectory('lib', 'Librerías y utilidades');
  allPassed &= checkDirectory('types', 'Definiciones de tipos');
  allPassed &= checkDirectory('components/ui', 'Componentes UI');
  
  // 4. Configuración específica
  logSection('Configuración del Proyecto');
  allPassed &= checkPackageJson();
  allPassed &= checkEnvironmentSetup();
  
  // 5. Supabase
  logSection('Configuración de Supabase');
  allPassed &= checkFile('utils/supabase/info.tsx', 'Información de Supabase');
  allPassed &= checkFile('lib/supabase.ts', 'Cliente de Supabase');
  allPassed &= checkDirectory('supabase/migrations', 'Migraciones de BD');
  allPassed &= checkDirectory('supabase/functions', 'Edge Functions');
  
  // 6. Build output (opcional)
  logSection('Build de Producción');
  checkBuildOutput();
  
  // 7. Resumen final
  logSection('Resumen');
  
  if (allPassed) {
    log('🎉 ¡Sistema listo para deployment!', 'green');
    console.log('');
    log('📋 Próximos pasos:', 'cyan');
    log('1. 📁 Crear repositorio en GitHub', 'blue');
    log('2. 🔄 Push del código: git add . && git commit -m "Initial commit" && git push', 'blue');
    log('3. 🌐 Conectar a Vercel: https://vercel.com/new', 'blue');
    log('4. ⚙️  Configurar variables de entorno en Vercel', 'blue');
    log('5. 🚀 Deploy automático', 'blue');
    console.log('');
    process.exit(0);
  } else {
    log('❌ Hay problemas que resolver antes del deployment', 'red');
    console.log('');
    log('🔧 Soluciones sugeridas:', 'yellow');
    log('1. Ejecutar: npm install', 'blue');
    log('2. Verificar archivos faltantes', 'blue');
    log('3. Ejecutar: npm run build (para verificar que compila)', 'blue');
    log('4. Corregir errores reportados arriba', 'blue');
    console.log('');
    process.exit(1);
  }
}

main().catch(error => {
  log(`💥 Error inesperado: ${error.message}`, 'red');
  process.exit(1);
});