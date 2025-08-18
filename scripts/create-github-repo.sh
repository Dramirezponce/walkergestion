#!/bin/bash

# WalkerGestion - Crear Repositorio GitHub (Automático)
# 💚⚪ Verde y Blanco - Santiago Wanderers

echo "🚀 WalkerGestion - Crear Repositorio GitHub"
echo "💚⚪ Verde y Blanco - Santiago Wanderers"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_step() {
    echo -e "\n${PURPLE}==== PASO $1: $2 ====${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar prerrequisitos
print_step "1" "VERIFICACIÓN DE PRERREQUISITOS"

if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. ¿Estás en el directorio correcto?"
    exit 1
fi

if ! command -v git &> /dev/null; then
    print_error "Git no está instalado"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

print_success "Prerrequisitos verificados"

# Obtener información del usuario
print_step "2" "CONFIGURACIÓN"

echo -e "${YELLOW}Por favor, proporciona la siguiente información:${NC}"
read -p "🧑‍💻 Tu usuario de GitHub: " GITHUB_USER
read -p "📧 Tu email de GitHub: " GITHUB_EMAIL  
read -p "📝 Nombre del repositorio [walkergestion]: " REPO_NAME

REPO_NAME=${REPO_NAME:-walkergestion}

print_success "Configuración guardada"

# Configurar Git
print_step "3" "CONFIGURACIÓN DE GIT"

git config --global user.name "$GITHUB_USER" 2>/dev/null || true
git config --global user.email "$GITHUB_EMAIL" 2>/dev/null || true

print_success "Git configurado"

# Limpiar proyecto
print_step "4" "LIMPIEZA DEL PROYECTO"

print_status "Ejecutando limpieza automática..."

# Crear backup de archivos importantes
mkdir -p .backup-temp 2>/dev/null

# Lista de archivos a mantener (esenciales)
keep_files=(
    "package.json"
    "App.tsx"
    "main.tsx" 
    "index.html"
    "vite.config.ts"
    "vercel.json"
    "README.md"
    "GITHUB_VERCEL_DEPLOYMENT.md"
    ".gitignore"
    ".env.example"
)

# Lista de directorios a mantener
keep_dirs=(
    "components"
    "hooks"
    "lib"
    "types"
    "styles"
    "utils"
    "scripts"
    "supabase"
    "src"
)

# Mover archivos innecesarios a backup
find . -maxdepth 1 -name "*.sql" -not -path "./supabase/*" -exec mv {} .backup-temp/ \; 2>/dev/null
find . -maxdepth 1 -name "*_*.md" -not -name "README.md" -not -name "GITHUB_VERCEL_DEPLOYMENT.md" -exec mv {} .backup-temp/ \; 2>/dev/null
find . -maxdepth 1 -name "*.ts" -not -name "vite.config.ts" -not -name "main.tsx" -exec mv {} .backup-temp/ \; 2>/dev/null

# Mover directorios legacy
[ -d "app" ] && mv app .backup-temp/ 2>/dev/null
[ -d "resources" ] && mv resources .backup-temp/ 2>/dev/null
[ -d "routes" ] && mv routes .backup-temp/ 2>/dev/null
[ -d "config" ] && mv config .backup-temp/ 2>/dev/null

# Mover archivos PHP
[ -f "composer.json" ] && mv composer.json .backup-temp/ 2>/dev/null
[ -f "deploy.sh" ] && mv deploy.sh .backup-temp/ 2>/dev/null

print_success "Limpieza completada"

# Verificar sistema
print_step "5" "VERIFICACIÓN DEL SISTEMA"

print_status "Instalando dependencias..."
if npm install; then
    print_success "Dependencias instaladas"
else
    print_error "Error instalando dependencias"
    exit 1
fi

print_status "Verificando build..."
if npm run build; then
    print_success "Build exitoso"
else
    print_error "Error en build"
    exit 1
fi

# Inicializar Git
print_step "6" "INICIALIZACIÓN DE GIT"

if [ ! -d ".git" ]; then
    git init
    print_success "Git inicializado"
else
    print_status "Git ya está inicializado"
fi

# Agregar archivos
print_status "Agregando archivos..."
git add .

# Crear commit
print_status "Creando commit inicial..."
git commit -m "🎉 Initial commit - WalkerGestion 💚⚪

Sistema de Gestión Comercial Santiago Wanderers - Verde y Blanco

🚀 Features:
- ✅ React 18 + TypeScript + Vite
- ✅ Supabase Backend + Auth + RLS
- ✅ Tailwind CSS + Shadcn/ui
- ✅ PWA Ready (installable)
- ✅ Vercel Deployment Ready
- ✅ Multi-tenant Architecture
- ✅ Role-based Access Control
- 💚⚪ Verde y Blanco Theme

📊 Modules:
- 🏢 Company & Business Unit Management
- 👥 User Management (Admin/Manager/Cashier)
- 💰 Sales Registration & Tracking
- 📈 Daily Cash Renditions
- 🎯 Goals & Bonus System
- 📊 Reports & Analytics
- 🔔 Alerts & Notifications

🔧 Tech Stack:
- Frontend: React, TypeScript, Vite, Tailwind
- Backend: Supabase (PostgreSQL + Edge Functions)
- Deployment: Vercel + GitHub Actions
- PWA: Service Worker + Manifest

💚⚪ Hecho con ❤️ para Santiago Wanderers de Valparaíso"

print_success "Commit inicial creado"

# Configurar rama main
git branch -M main

# Mostrar estadísticas
print_step "7" "ESTADÍSTICAS DEL PROYECTO"

echo -e "📊 ${BLUE}Estadísticas finales:${NC}"
echo -e "  📁 Directorios: $(find . -type d -not -path './node_modules/*' -not -path './.git/*' -not -path './.backup-temp/*' | wc -l)"
echo -e "  📄 Archivos: $(find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './.backup-temp/*' | wc -l)"
echo -e "  📦 Tamaño: $(du -sh . 2>/dev/null | cut -f1 || echo "N/A")"

# Verificar archivos esenciales
echo -e "\n📋 ${BLUE}Archivos esenciales verificados:${NC}"
for file in "${keep_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ❌ $file"
    fi
done

echo -e "\n📂 ${BLUE}Directorios verificados:${NC}"
for dir in "${keep_dirs[@]}"; do
    if [ -d "$dir" ]; then
        count=$(find "$dir" -type f | wc -l)
        echo -e "  ✅ $dir/ ($count archivos)"
    else
        echo -e "  ❌ $dir/"
    fi
done

# Instrucciones finales
print_step "8" "INSTRUCCIONES FINALES"

echo -e "\n${GREEN}🎉 ¡Proyecto listo para GitHub!${NC}\n"

echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo -e "\n${BLUE}1. Crear repositorio en GitHub:${NC}"
echo -e "   🌐 Ve a: ${PURPLE}https://github.com/new${NC}"
echo -e "   📝 Nombre: ${YELLOW}$REPO_NAME${NC}"
echo -e "   📄 Descripción: ${YELLOW}Sistema de Gestión Comercial Santiago Wanderers - 💚⚪ Verde y Blanco${NC}"
echo -e "   🔓 Visibilidad: ${YELLOW}Public${NC} (recomendado para Vercel gratuito)"
echo -e "   ❌ NO marcar 'Initialize with README'"

echo -e "\n${BLUE}2. Conectar y subir código:${NC}"
echo -e "   ${YELLOW}git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git${NC}"
echo -e "   ${YELLOW}git push -u origin main${NC}"

echo -e "\n${BLUE}3. Deployment en Vercel:${NC}"
echo -e "   🌐 Ve a: ${PURPLE}https://vercel.com/new${NC}"
echo -e "   🔗 Conecta tu repositorio $REPO_NAME"
echo -e "   ⚙️  Configurar variables de entorno:"
echo -e "      ${YELLOW}VITE_SUPABASE_URL${NC}=https://boyhheuwgtyeevijxhzb.supabase.co"
echo -e "      ${YELLOW}VITE_SUPABASE_ANON_KEY${NC}=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

echo -e "\n${BLUE}4. Verificación final:${NC}"
echo -e "   🔍 ${YELLOW}npm run check:system${NC}"
echo -e "   🚀 ${YELLOW}npm run dev${NC} (probar localmente)"

echo -e "\n${GREEN}📂 URLs importantes:${NC}"
echo -e "  🐙 GitHub: ${BLUE}https://github.com/$GITHUB_USER/$REPO_NAME${NC}"
echo -e "  🌐 Vercel: ${BLUE}https://vercel.com/dashboard${NC}"
echo -e "  📖 Guía completa: ${BLUE}GITHUB_VERCEL_DEPLOYMENT.md${NC}"

if [ -d ".backup-temp" ]; then
    echo -e "\n${YELLOW}📁 Nota: Archivos de respaldo están en .backup-temp/${NC}"
fi

print_success "💚⚪ ¡Verde y Blanco hacia el éxito digital!"