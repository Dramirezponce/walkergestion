#!/bin/bash

echo "🚀 WalkerGestion Deployment Script"
echo "💚⚪ Verde y Blanco - Santiago Wanderers"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Checking Node.js version..."
node_version=$(node --version)
print_success "Node.js version: $node_version"

# Install dependencies
print_status "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Check if environment variables exist
if [ ! -f ".env" ] && [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
    print_warning "No environment file found. Creating .env.example..."
    cat > .env.example << EOL
# Supabase Configuration
VITE_SUPABASE_URL=https://boyhheuwgtyeevijxhzb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWhoZXV3Z3R5ZWV2aWp4aHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTAyNTYsImV4cCI6MjA2OTU4NjI1Nn0.GJRf8cWJmFCZi_m0n7ubLUfwm0g6smuiyz_RMtmXcbY

# App Configuration  
VITE_APP_NAME=WalkerGestion
VITE_APP_VERSION=3.0.0
EOL
    print_warning "Please copy .env.example to .env and configure your environment variables"
fi

# Build the application
print_status "Building application for production..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Build completed successfully"

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
    
    # Create .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << EOL
# Dependencies
node_modules/
.npm
.yarn

# Production
dist/
build/

# Environment variables
.env
.env.local
.env.production
.env.staging

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Temporary folders
tmp/
temp/
EOL
    fi
    
    git add .
    git commit -m "Initial commit - WalkerGestion Sistema de Gestión Comercial Santiago Wanderers"
    print_success "Git repository initialized"
fi

# Test the build locally
print_status "Testing build locally..."
if command -v python3 &> /dev/null; then
    print_status "Starting local server on http://localhost:8000"
    print_status "Press Ctrl+C to stop the server"
    cd dist && python3 -m http.server 8000
elif command -v python &> /dev/null; then
    print_status "Starting local server on http://localhost:8000"  
    print_status "Press Ctrl+C to stop the server"
    cd dist && python -m SimpleHTTPServer 8000
else
    print_warning "Python not found. Cannot start local server."
    print_status "You can use 'npm run preview' instead"
fi

print_success "🎉 WalkerGestion build completed!"
echo ""
echo "Next steps:"
echo "1. 🌐 Deploy to Vercel: https://vercel.com"
echo "2. 📁 Upload 'dist' folder to your hosting provider"
echo "3. 🗄️ Configure Supabase database using FINAL_PRODUCTION_SUPABASE_SETUP.sql"
echo "4. 🔐 Test login with d.ramirez.ponce@gmail.com"
echo ""
echo "💚⚪ ¡Verde y Blanco como Santiago Wanderers!"