#!/bin/bash

# WalkerGestion - GitHub Setup Script
# 💚⚪ Verde y Blanco - Santiago Wanderers

echo "🚀 WalkerGestion - GitHub Setup"
echo "💚⚪ Verde y Blanco - Santiago Wanderers"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${PURPLE}=== $1 ===${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. ¿Estás en el directorio correcto?"
    exit 1
fi

if [ ! -f "App.tsx" ]; then
    print_error "No se encontró App.tsx. ¿Estás en el directorio de WalkerGestion?"
    exit 1
fi

print_status "Directorio verificado ✅"

# Obtener información del usuario
print_header "CONFIGURACIÓN INICIAL"

read -p "🧑‍💻 Tu usuario de GitHub: " GITHUB_USERNAME
if [ -z "$GITHUB_USERNAME" ]; then
    print_error "Usuario de GitHub es requerido"
    exit 1
fi

read -p "📧 Tu email de GitHub: " GITHUB_EMAIL
if [ -z "$GITHUB_EMAIL" ]; then
    print_error "Email de GitHub es requerido" 
    exit 1
fi

read -p "📝 Nombre del repositorio [walkergestion]: " REPO_NAME
REPO_NAME=${REPO_NAME:-walkergestion}

print_success "Configuración guardada"
print_status "Usuario: $GITHUB_USERNAME"
print_status "Email: $GITHUB_EMAIL"
print_status "Repositorio: $REPO_NAME"

# Verificar dependencias
print_header "VERIFICANDO DEPENDENCIAS"

if ! command -v git &> /dev/null; then
    print_error "Git no está instalado. Instala Git primero."
    exit 1
fi
print_success "Git encontrado"

if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Instala Node.js 18+ primero."
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js encontrado: $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado."
    exit 1
fi
NPM_VERSION=$(npm --version)
print_success "npm encontrado: $NPM_VERSION"

# Configurar Git
print_header "CONFIGURANDO GIT"

git config --global user.name "$GITHUB_USERNAME" 2>/dev/null || true
git config --global user.email "$GITHUB_EMAIL" 2>/dev/null || true

print_success "Configuración de Git actualizada"

# Instalar dependencias
print_header "INSTALANDO DEPENDENCIAS"

print_status "Ejecutando npm install..."
if npm install; then
    print_success "Dependencias instaladas correctamente"
else
    print_error "Error instalando dependencias"
    exit 1
fi

# Verificar build
print_header "VERIFICANDO BUILD"

print_status "Ejecutando npm run build..."
if npm run build; then
    print_success "Build completado exitosamente"
else
    print_error "Error en el build. Corrige los errores antes de continuar."
    exit 1
fi

# Inicializar repositorio Git
print_header "CONFIGURANDO REPOSITORIO GIT"

if [ ! -d ".git" ]; then
    print_status "Inicializando repositorio Git..."
    git init
    print_success "Repositorio Git inicializado"
else
    print_status "Repositorio Git ya existe"
fi

# Crear .gitignore si no existe
if [ ! -f ".gitignore" ]; then
    print_warning ".gitignore no encontrado, creando uno básico..."
    cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
.env.production
*.log
.DS_Store
.vercel/
EOF
    print_success ".gitignore creado"
fi

# Agregar remote origin
print_status "Configurando remote origin..."
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

if git remote get-url origin &> /dev/null; then
    print_warning "Remote origin ya existe, actualizando..."
    git remote set-url origin "$REPO_URL"
else
    git remote add origin "$REPO_URL"
fi

print_success "Remote origin configurado: $REPO_URL"

# Agregar archivos
print_status "Agregando archivos al repositorio..."
git add .

# Hacer commit inicial
print_status "Creando commit inicial..."
git commit -m "🎉 Initial commit - WalkerGestion 💚⚪ Verde y Blanco

Sistema de Gestión Comercial Santiago Wanderers

Features:
- ✅ React + TypeScript + Vite
- ✅ Supabase Backend + Auth
- ✅ Tailwind CSS + Shadcn/ui
- ✅ PWA Ready
- ✅ Vercel Deployment Ready
- 💚⚪ Verde y Blanco Theme
"

# Configurar rama main
print_status "Configurando rama main..."
git branch -M main

print_success "Repositorio Git configurado correctamente"

# Mostrar instrucciones finales
print_header "¡CONFIGURACIÓN COMPLETA!"

echo -e "\n${GREEN}🎉 ¡WalkerGestion está listo para GitHub + Vercel!${NC}\n"

print_status "Próximos pasos:"
echo -e "  ${CYAN}1.${NC} Crear repositorio '$REPO_NAME' en GitHub:"
echo -e "     ${BLUE}https://github.com/new${NC}"
echo ""
echo -e "  ${CYAN}2.${NC} Pushear el código:"
echo -e "     ${YELLOW}git push -u origin main${NC}"
echo ""
echo -e "  ${CYAN}3.${NC} Conectar a Vercel:"
echo -e "     ${BLUE}https://vercel.com/new${NC}"
echo ""
echo -e "  ${CYAN}4.${NC} Configurar variables de entorno en Vercel:"
echo -e "     ${YELLOW}VITE_SUPABASE_URL${NC}=https://boyhheuwgtyeevijxhzb.supabase.co"
echo -e "     ${YELLOW}VITE_SUPABASE_ANON_KEY${NC}=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""

print_header "INFORMACIÓN DEL PROYECTO"
echo -e "  📦 Nombre: ${YELLOW}$REPO_NAME${NC}"
echo -e "  🌐 URL: ${BLUE}$REPO_URL${NC}"
echo -e "  👤 Usuario: ${YELLOW}$GITHUB_USERNAME${NC}"
echo -e "  📧 Email: ${YELLOW}$GITHUB_EMAIL${NC}"
echo -e "  🏗️  Build: ${GREEN}Exitoso${NC}"
echo -e "  📁 Archivos: $(git ls-files | wc -l) archivos listos"

print_header "COMANDOS ÚTILES"
echo -e "  ${YELLOW}git status${NC}           - Ver estado del repositorio"
echo -e "  ${YELLOW}git log --oneline${NC}    - Ver historial de commits"
echo -e "  ${YELLOW}npm run dev${NC}          - Ejecutar en modo desarrollo"
echo -e "  ${YELLOW}npm run build${NC}        - Crear build de producción"
echo -e "  ${YELLOW}npm run check:system${NC} - Verificar sistema"

echo ""
print_success "💚⚪ ¡Verde y Blanco hacia el éxito digital!"
echo ""