#!/bin/bash

# WalkerGestion - Cleanup Script for GitHub
# 💚⚪ Verde y Blanco - Santiago Wanderers

echo "🧹 WalkerGestion - Limpieza para GitHub"
echo "💚⚪ Verde y Blanco - Santiago Wanderers"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: No se encontró package.json${NC}"
    exit 1
fi

print_status "Iniciando limpieza de archivos para GitHub..."

# Crear directorio de backup para archivos que vamos a mover
mkdir -p .backup-docs 2>/dev/null

# Función para mover archivos a backup
move_to_backup() {
    if [ -f "$1" ]; then
        mv "$1" .backup-docs/
        print_warning "Movido a backup: $1"
    fi
}

# Limpiar archivos SQL duplicados/temporales
print_status "Limpiando archivos SQL duplicados..."
move_to_backup "CONFIGURACION_COMPLETA_SIN_DATOS.sql"
move_to_backup "CORRECTED_SUPABASE_SETUP.sql"
move_to_backup "DATABASE_RELATIONS_FIX.sql"
move_to_backup "FINAL_PRODUCTION_SUPABASE_SETUP.sql"
move_to_backup "FINAL_SUPABASE_SETUP.sql"
move_to_backup "FIX_FOREIGN_KEY_COMPANY_DELETION.sql"
move_to_backup "FIX_FOREIGN_KEY_CONSTRAINTS.sql"
move_to_backup "INDICES_PERFORMANCE_WALKERGESTION.sql"
move_to_backup "SETUP_ADMIN_DANIEL_RAMIREZ.sql"
move_to_backup "SOLUCION_RAPIDA_ADMIN.sql"
move_to_backup "SUPABASE_CHECK_STATUS.sql"
move_to_backup "SUPABASE_COMPLETE_SETUP.sql"
move_to_backup "SUPABASE_EMERGENCY_FIX.sql"
move_to_backup "SUPABASE_FIXED_SETUP.sql"
move_to_backup "SUPABASE_NUCLEAR_FIX.sql"
move_to_backup "SUPABASE_PRODUCTION_SETUP.sql"
move_to_backup "SUPABASE_SQL_SETUP.sql"
move_to_backup "setup-admin-user.sql"
move_to_backup "VERIFICACION_SISTEMA_CORREGIDA.sql"

# Limpiar documentación duplicada
print_status "Limpiando documentación duplicada..."
move_to_backup "GUIA_COMPLETA_PRODUCCION.md"
move_to_backup "GUIA_CONFIGURACION_SUPABASE_VISUAL.md"
move_to_backup "GUIA_IMPLEMENTACION_SUPABASE.md"
move_to_backup "IMPLEMENTACION_PRODUCCION_WALKERGESTION.md"
move_to_backup "IMPLEMENTACION_SIMPLIFICADA.md"
move_to_backup "INSTRUCCIONES_CONFIGURACION_FINAL.md"
move_to_backup "INSTRUCCIONES_DANIEL_RAMIREZ.md"
move_to_backup "METODO_ALTERNATIVO_SIMPLE.md"
move_to_backup "PASOS_SIMPLES_PARA_DANIEL.md"
move_to_backup "RESOLUCION_COMPLETA_ERRORES.md"
move_to_backup "SETUP_INSTRUCTIONS.md"
move_to_backup "SOLUCION_COMPLETA_DANIEL.md"
move_to_backup "SUPABASE_SETUP.md"
move_to_backup "VERIFICACION_RAPIDA_DANIEL.md"

# Limpiar archivos de configuración temporales
print_status "Limpiando archivos de configuración temporales..."
move_to_backup "complete-setup-walkergestion.ts"
move_to_backup "execute-setup.ts"
move_to_backup "setup-production.ts"
move_to_backup "setup-walker-gestion.ts"
move_to_backup "test-backend-relations.js"
move_to_backup "VERIFICACION_RAPIDA_SISTEMA_sql.tsx"

# Limpiar archivos PHP/Laravel legacy
print_status "Limpiando archivos PHP/Laravel legacy..."
if [ -d "app" ]; then
    mv app .backup-docs/ 2>/dev/null
    print_warning "Movido directorio PHP: app/"
fi

if [ -d "resources" ]; then
    mv resources .backup-docs/ 2>/dev/null
    print_warning "Movido directorio PHP: resources/"
fi

if [ -d "routes" ]; then
    mv routes .backup-docs/ 2>/dev/null
    print_warning "Movido directorio PHP: routes/"
fi

if [ -d "config" ]; then
    mv config .backup-docs/ 2>/dev/null
    print_warning "Movido directorio PHP: config/"
fi

move_to_backup "composer.json"
move_to_backup "deploy.sh"

# Verificar archivos esenciales
print_status "Verificando archivos esenciales..."

essential_files=(
    "package.json"
    "App.tsx"
    "main.tsx"
    "index.html"
    "vite.config.ts"
    "vercel.json"
    "README.md"
    "GITHUB_VERCEL_DEPLOYMENT.md"
    ".gitignore"
    "styles/globals.css"
)

missing_files=()
for file in "${essential_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    else
        print_success "✓ $file"
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    print_warning "Archivos esenciales faltantes:"
    for file in "${missing_files[@]}"; do
        echo -e "  ${RED}✗ $file${NC}"
    done
fi

# Verificar directorios esenciales
print_status "Verificando directorios esenciales..."

essential_dirs=(
    "components"
    "hooks"
    "lib"
    "types"
    "utils"
    "styles"
    "supabase"
    "scripts"
)

for dir in "${essential_dirs[@]}"; do
    if [ -d "$dir" ]; then
        file_count=$(find "$dir" -type f | wc -l)
        print_success "✓ $dir/ ($file_count archivos)"
    else
        echo -e "  ${RED}✗ $dir/${NC}"
    fi
done

# Mostrar estadísticas finales
print_status "Estadísticas del proyecto:"
echo -e "  📁 Directorios: $(find . -type d -not -path './node_modules/*' -not -path './.git/*' -not -path './.backup-docs/*' | wc -l)"
echo -e "  📄 Archivos: $(find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './.backup-docs/*' | wc -l)"
echo -e "  📦 Tamaño: $(du -sh . | cut -f1)"

if [ -d ".backup-docs" ]; then
    backup_count=$(find .backup-docs -type f | wc -l)
    echo -e "  🗂️  Archivos en backup: $backup_count"
fi

print_success "🎉 Limpieza completada!"
echo ""
print_status "Próximos pasos:"
echo -e "  1. ${YELLOW}Verificar que todo está bien${NC}: npm run check:system"
echo -e "  2. ${YELLOW}Inicializar Git${NC}: git init"
echo -e "  3. ${YELLOW}Agregar archivos${NC}: git add ."
echo -e "  4. ${YELLOW}Hacer commit${NC}: git commit -m 'Initial commit'"
echo ""
print_warning "Nota: Los archivos movidos están en .backup-docs/ por si los necesitas"