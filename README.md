# 🏢 WalkerGestion

## Sistema de Gestión Comercial Santiago Wanderers
### 💚⚪ Verde y Blanco

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fusername%2Fwalkergestion)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ecf8e.svg)](https://supabase.com/)

---

## 📋 Descripción

**WalkerGestion** es un sistema integral de gestión comercial diseñado específicamente para empresas con múltiples locales. Inspirado en los colores Verde y Blanco del Santiago Wanderers de Valparaíso.

### ✨ Características Principales

- 🏢 **Gestión Multi-Local**: Administra múltiples unidades de negocio desde una sola plataforma
- 👥 **Roles de Usuario**: Sistema completo con Admin, Manager y Cajero
- 💰 **Control de Ventas**: Registro y seguimiento detallado de ventas diarias
- 📊 **Rendiciones**: Sistema automatizado de rendición de cajas
- 🎯 **Metas y Bonos**: Configuración de objetivos con sistema de bonificaciones
- 📈 **Reportes**: Generación automática de informes y análisis
- 🔒 **Seguridad**: Autenticación robusta y políticas de acceso granulares
- 📱 **PWA**: Aplicación web progresiva, installable en móviles

---

## 🚀 Tech Stack

### Frontend
- **React 18** - Librería de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **Shadcn/ui** - Componentes de UI
- **Lucide React** - Iconografía
- **React Router** - Navegación
- **React Hook Form** - Manejo de formularios

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos
- **Row Level Security** - Seguridad a nivel de filas
- **Edge Functions** - Funciones serverless
- **Real-time subscriptions** - Actualizaciones en tiempo real

### Deployment
- **Vercel** - Hosting y deployment
- **GitHub** - Control de versiones
- **PWA** - Progressive Web App

---

## 🔧 Instalación y Configuración

### Pre-requisitos
- Node.js 18+
- npm o yarn
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/username/walkergestion.git
cd walkergestion
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Configurar en `.env.local`:
```env
VITE_SUPABASE_URL=https://boyhheuwgtyeevijxhzb.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=WalkerGestion
VITE_APP_VERSION=3.0.0
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Build para producción
```bash
npm run build
npm run preview
```

---

## 🗄️ Base de Datos

### Configuración de Supabase

El sistema incluye migraciones completas para configurar la base de datos:

```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: supabase/migrations/001_initial_schema.sql
-- Archivo: supabase/migrations/002_rls_policies.sql
```

### Tablas Principales
- `companies` - Empresas
- `business_units` - Unidades de negocio
- `user_profiles` - Perfiles de usuario
- `sales` - Ventas
- `cashflows` - Flujos de caja
- `renditions` - Rendiciones
- `goals` - Metas
- `bonuses` - Bonificaciones

---

## 👥 Roles de Usuario

### 🔐 Administrador
- Gestión completa de empresas
- Creación de unidades de negocio
- Gestión de usuarios
- Acceso a todos los reportes
- Configuración del sistema

### 👨‍💼 Manager (Encargado)
- Gestión de su unidad de negocio
- Supervisión de cajeros
- Procesamiento de rendiciones
- Reportes de su unidad
- Configuración de metas

### 💰 Cajero
- Registro de ventas
- Creación de rendiciones
- Ver sus bonificaciones
- Acceso a su perfil

---

## 📱 Progressive Web App (PWA)

La aplicación es installable como PWA:

### Características PWA
- ✅ Installable en móviles y desktop
- ✅ Funciona offline (básico)
- ✅ Notificaciones push (ready)
- ✅ Icono y splash screen
- ✅ Actualizaciones automáticas

### Instalación
En dispositivos móviles:
1. Abrir en el navegador
2. Tap en "Agregar a pantalla principal"
3. Confirmar instalación

---

## 🌐 Deployment

### Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fusername%2Fwalkergestion)

#### Configuración manual:
1. Fork este repositorio
2. Conectar a Vercel
3. Configurar variables de entorno
4. Deploy automático

#### Variables de entorno en Vercel:
```
VITE_SUPABASE_URL=https://boyhheuwgtyeevijxhzb.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=WalkerGestion
VITE_APP_VERSION=3.0.0
VITE_APP_ENVIRONMENT=production
```

### Otros proveedores
- **Netlify**: Compatible
- **Cloudflare Pages**: Compatible
- **GitHub Pages**: Compatible (con configuración)

---

## 📊 Características del Sistema

### Dashboard Intuitivo
- Resumen de ventas del día
- Indicadores clave de rendimiento
- Alertas y notificaciones
- Acceso rápido a funciones principales

### Gestión de Ventas
- Registro rápido de ventas
- Múltiples métodos de pago
- Categorización automática
- Histórico completo

### Sistema de Rendiciones
- Validación automática de montos
- Detección de discrepancias
- Aprobación por niveles
- Trazabilidad completa

### Reportes Avanzados
- Ventas por período
- Análisis de rendimiento
- Comparativas entre locales
- Exportación a CSV/PDF

---

## 🔒 Seguridad

### Autenticación
- Supabase Auth
- JWT tokens
- Sesiones seguras
- Logout automático

### Autorización
- Row Level Security (RLS)
- Políticas granulares por rol
- Acceso basado en contexto
- Auditoría de acciones

### Headers de Seguridad
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

---

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Tests con UI
npm run test:ui

# Coverage
npm run test:coverage
```

---

## 🤝 Contribuir

### Flujo de trabajo
1. Fork del repositorio
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de código
- TypeScript estricto
- ESLint + Prettier
- Conventional Commits
- Tests para nuevas funcionalidades

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Daniel Ramírez**
- Email: d.ramirez.ponce@gmail.com
- GitHub: [@username](https://github.com/username)

---

## 🎯 Roadmap

### Versión 3.1
- [ ] Notificaciones push
- [ ] Sincronización offline mejorada
- [ ] Módulo de inventario
- [ ] API REST pública

### Versión 3.2
- [ ] Dashboard analytics avanzado
- [ ] Integración con sistemas contables
- [ ] Módulo de facturación
- [ ] App móvil nativa

### Versión 4.0
- [ ] Multi-tenant SaaS
- [ ] Marketplace de plugins
- [ ] IA para predicciones
- [ ] Integración e-commerce

---

## 📚 Documentación

- [📖 Guía de Usuario](docs/USER_GUIDE.md)
- [🔧 Guía de Desarrollo](docs/DEVELOPMENT.md)
- [🌐 Guía de Deployment](GITHUB_VERCEL_DEPLOYMENT.md)
- [🗄️ Documentación de API](docs/API.md)

---

## 🆘 Soporte

### Issues y Bugs
Reportar en [GitHub Issues](https://github.com/username/walkergestion/issues)

### Preguntas Frecuentes
Ver [FAQ](docs/FAQ.md)

### Contacto
- 📧 Email: d.ramirez.ponce@gmail.com
- 💬 Discussions: [GitHub Discussions](https://github.com/username/walkergestion/discussions)

---

## ⭐ Agradecimientos

- Santiago Wanderers de Valparaíso por la inspiración 💚⚪
- Comunidad Open Source
- Supabase por la plataforma
- Vercel por el hosting
- Contributors y beta testers

---

<div align="center">

**💚⚪ Hecho con ❤️ para Santiago Wanderers**

**¡Verde y Blanco hacia el éxito digital!**

[⬆️ Volver arriba](#-walkergestion)

</div>