import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { UserData } from './types/app';
import MobileLayout from './components/MobileLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { DEMO_USER } from './lib/demo-data';

// Páginas principales - con lazy loading para mejor performance
import { lazy } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Sales = lazy(() => import('./components/Sales'));
const Renditions = lazy(() => import('./components/Renditions'));
const Reports = lazy(() => import('./components/Reports'));
const Cashflows = lazy(() => import('./components/Cashflows'));
const Alerts = lazy(() => import('./components/Alerts'));
const Bonuses = lazy(() => import('./components/Bonuses'));
const Companies = lazy(() => import('./components/Companies'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const Settings = lazy(() => import('./components/Settings'));

interface AppProps {
  onNavigateToWebsite?: () => void;
}

type AppPage = 
  | 'dashboard' 
  | 'sales' 
  | 'renditions' 
  | 'reports' 
  | 'cashflows' 
  | 'alerts' 
  | 'bonuses' 
  | 'companies' 
  | 'users' 
  | 'settings';

interface AppState {
  currentPage: AppPage;
  isLoading: boolean;
  error: string | null;
  showWelcome: boolean;
}

// Welcome screen para modo demo
const DemoWelcomeScreen = ({ onContinue }: { onContinue: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-100 flex items-center justify-center p-4">
    <div className="max-w-md w-full">
      <div className="bg-card border border-green-200 rounded-xl p-8 shadow-lg">
        <div className="text-center space-y-6">
          {/* Logo/Icono */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <div className="text-3xl">🏪</div>
          </div>
          
          {/* Título */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-700">WalkerGestión</h1>
            <p className="text-lg text-green-600">Versión Demo</p>
          </div>
          
          {/* Descripción */}
          <div className="space-y-4 text-left">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✨ Funcionalidades incluidas:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Dashboard con métricas en tiempo real</li>
                <li>• Registro de ventas diarias</li>
                <li>• Control de rendiciones y gastos</li>
                <li>• Gestión de alertas y notificaciones</li>
                <li>• Sistema de bonos y metas</li>
                <li>• Generación de reportes</li>
                <li>• Gestión de empresas y usuarios</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📱 Modo Demo Offline:</h3>
              <p className="text-sm text-blue-700">
                Esta versión funciona completamente sin conexión a internet usando datos simulados. 
                Todas las funciones están disponibles para demostración.
              </p>
            </div>
          </div>
          
          {/* Usuario demo */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">👤 Usuario Demo:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Nombre:</strong> {DEMO_USER.name}</p>
              <p><strong>Email:</strong> {DEMO_USER.email}</p>
              <p><strong>Rol:</strong> Administrador General</p>
              <p><strong>Empresa:</strong> {DEMO_USER.company}</p>
            </div>
          </div>
          
          {/* Botón de continuar */}
          <button
            onClick={onContinue}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            Comenzar Demostración
          </button>
          
          {/* Nota */}
          <p className="text-xs text-muted-foreground">
            Los datos mostrados son simulados y se reinician al recargar la página
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Loading component optimizado para demo
const DemoLoading = ({ message = "Cargando WalkerGestión Demo..." }: { message?: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-100 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-green-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-green-700">WalkerGestión Demo</h2>
        <p className="text-green-600">{message}</p>
        <div className="flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Page loading component
const PageLoading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent mx-auto"></div>
      <p className="text-muted-foreground">Cargando página...</p>
    </div>
  </div>
);

export default function App({ onNavigateToWebsite }: AppProps) {
  // Estado optimizado de la aplicación
  const [appState, setAppState] = useState<AppState>({
    currentPage: 'dashboard',
    isLoading: true,
    error: null,
    showWelcome: true
  });

  // Datos del usuario para demo (siempre Daniel)
  const userData: UserData = useMemo(() => ({
    id: DEMO_USER.id,
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    role: DEMO_USER.role,
    company: DEMO_USER.company,
    businessUnit: DEMO_USER.businessUnit,
    company_id: DEMO_USER.company_id,
    business_unit_id: DEMO_USER.business_unit_id
  }), []);

  // Efecto de inicialización del demo
  useEffect(() => {
    // Simular carga inicial
    const initDemo = async () => {
      console.log('🎭 === INICIANDO WALKERGESTION DEMO ===');
      
      // Simular tiempo de carga
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Demo inicializado correctamente');
      console.log('👤 Usuario demo:', userData.name);
      
      setAppState(prev => ({ 
        ...prev, 
        isLoading: false 
      }));
    };

    initDemo();
  }, [userData.name]);

  // Manejar navegación entre páginas - memoizado
  const handleNavigate = useCallback((page: AppPage) => {
    console.log('🧭 Navegando a:', page);
    setAppState(prev => ({ ...prev, currentPage: page }));
  }, []);

  // Manejar cierre de la demo
  const handleLogout = useCallback(async () => {
    try {
      console.log('👋 Cerrando demo...');
      
      toast.success('Demo finalizada', {
        description: 'Gracias por probar WalkerGestión!',
        duration: 3000
      });
      
      // Reiniciar estado
      setAppState({
        currentPage: 'dashboard',
        isLoading: false,
        error: null,
        showWelcome: true
      });
      
      if (onNavigateToWebsite) {
        setTimeout(() => onNavigateToWebsite(), 2000);
      }
    } catch (error) {
      console.error('❌ Error al cerrar demo:', error);
      toast.error('Error al cerrar demo', {
        description: 'Recarga la página para reiniciar',
        duration: 3000
      });
    }
  }, [onNavigateToWebsite]);

  // Manejar errores globales optimizado
  const handleGlobalError = useCallback((error: Error) => {
    console.error('💥 Error en demo:', error);
    
    toast.error('Error en la demostración', {
      description: 'Esto es una simulación, el error no afecta el sistema real',
      duration: 5000
    });
    
    setAppState(prev => ({ 
      ...prev, 
      error: error.message 
    }));
  }, []);

  // Continuar desde pantalla de bienvenida
  const handleContinueDemo = useCallback(() => {
    console.log('🎬 Iniciando demostración interactiva');
    setAppState(prev => ({ 
      ...prev, 
      showWelcome: false 
    }));
    
    toast.success('¡Bienvenido a WalkerGestión!', {
      description: 'Explora todas las funcionalidades disponibles',
      duration: 4000
    });
  }, []);

  // Renderizar contenido de página con lazy loading
  const renderPageContent = useCallback(() => {
    switch (appState.currentPage) {
      case 'dashboard':
        return <Dashboard userData={userData} />;
      case 'sales':
        return <Sales userData={userData} />;
      case 'renditions':
        return <Renditions userData={userData} />;
      case 'reports':
        return <Reports userData={userData} />;
      case 'cashflows':
        return <Cashflows userData={userData} />;
      case 'alerts':
        return <Alerts userData={userData} />;
      case 'bonuses':
        return <Bonuses userData={userData} />;
      case 'companies':
        return <Companies userData={userData} />;
      case 'users':
        return <UserManagement userData={userData} />;
      case 'settings':
        return <Settings userData={userData} />;
      default:
        return <Dashboard userData={userData} />;
    }
  }, [userData, appState.currentPage]);

  // Funciones para manejo de errores
  const handleRetry = useCallback(() => {
    console.log('🔄 Reintentando en demo...');
    setAppState(prev => ({ ...prev, error: null }));
    
    toast.info('Demo reiniciada', {
      description: 'Continuando con la demostración',
      duration: 2000
    });
  }, []);

  // Pantalla de carga inicial
  if (appState.isLoading) {
    return <DemoLoading message="Preparando demostración..." />;
  }

  // Pantalla de bienvenida
  if (appState.showWelcome) {
    return (
      <ErrorBoundary onError={handleGlobalError}>
        <DemoWelcomeScreen onContinue={handleContinueDemo} />
        <Toaster />
      </ErrorBoundary>
    );
  }

  // Pantalla de error crítico
  if (appState.error) {
    return (
      <ErrorBoundary onError={handleGlobalError}>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-red-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8">
              <div className="text-destructive text-6xl mb-6">⚠️</div>
              <h2 className="text-2xl font-bold text-destructive mb-4">Error en Demo</h2>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                {appState.error}
              </p>
              <div className="space-y-3 text-sm text-muted-foreground mb-6">
                <p>🎭 Esto es una demostración offline</p>
                <p>💾 Los datos son simulados</p>
                <p>🔄 Puedes continuar usando la demo</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  🔄 Continuar Demo
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  👋 Salir de Demo
                </button>
              </div>
            </div>
          </div>
        </div>
        <Toaster />
      </ErrorBoundary>
    );
  }

  // Aplicación principal en modo demo
  return (
    <ErrorBoundary onError={handleGlobalError}>
      <div className="min-h-screen bg-background">
        {/* Banner de modo demo */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="animate-pulse">🎭</span>
            <span className="font-medium">MODO DEMOSTRACIÓN</span>
            <span className="text-blue-100">•</span>
            <span className="text-blue-100">Datos simulados</span>
            <span className="text-blue-100">•</span>
            <span className="text-blue-100">Sin conexión requerida</span>
          </div>
        </div>
        
        <MobileLayout 
          currentPage={appState.currentPage} 
          onNavigate={handleNavigate}
          user={userData}
          onLogout={handleLogout}
        >
          <div className="min-h-[calc(100vh-120px)]">
            <Suspense fallback={<PageLoading />}>
              {renderPageContent()}
            </Suspense>
          </div>
        </MobileLayout>
        
        <Toaster 
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
          duration={4000}
        />
      </div>
    </ErrorBoundary>
  );
}