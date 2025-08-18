import { ReactNode, useState, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import NetworkIndicator from './NetworkIndicator';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { 
  Menu,
  Home,
  ShoppingCart,
  RefreshCw,
  FileText,
  ArrowUpDown,
  Bell,
  Target,
  Building2,
  Users,
  Settings,
  LogOut,
  User,
  WifiOff,
  CloudOff
} from 'lucide-react';
import { UserData } from '../types/app';

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  user: UserData;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  roles: string[];
  badge?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="h-5 w-5" />,
    roles: ['admin', 'manager', 'cashier']
  },
  {
    id: 'sales',
    label: 'Ventas',
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ['admin', 'manager', 'cashier']
  },
  {
    id: 'renditions',
    label: 'Rendiciones',
    icon: <RefreshCw className="h-5 w-5" />,
    roles: ['admin', 'manager', 'cashier'],
    badge: '3'
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: <FileText className="h-5 w-5" />,
    roles: ['admin', 'manager']
  },
  {
    id: 'cashflows',
    label: 'Flujo de Caja',
    icon: <ArrowUpDown className="h-5 w-5" />,
    roles: ['admin', 'manager']
  },
  {
    id: 'alerts',
    label: 'Alertas',
    icon: <Bell className="h-5 w-5" />,
    roles: ['admin', 'manager'],
    badge: '2'
  },
  {
    id: 'bonuses',
    label: 'Bonos',
    icon: <Target className="h-5 w-5" />,
    roles: ['admin', 'manager', 'cashier']
  },
  {
    id: 'companies',
    label: 'Empresas',
    icon: <Building2 className="h-5 w-5" />,
    roles: ['admin']
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: <Users className="h-5 w-5" />,
    roles: ['admin', 'manager']
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin', 'manager', 'cashier']
  }
];

export default function MobileLayout({ 
  children, 
  currentPage, 
  onNavigate, 
  user, 
  onLogout 
}: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isOfflineMode, pendingItemsCount, capabilities } = useOfflineMode();

  // Filtrar elementos del menú según el rol del usuario - memoized
  const filteredMenuItems = useMemo(() => 
    menuItems.filter(item => item.roles.includes(user.role)), 
    [user.role]
  );

  const getCurrentPageTitle = useCallback(() => {
    const currentItem = menuItems.find(item => item.id === currentPage);
    return currentItem?.label || 'WalkerGestión';
  }, [currentPage]);

  const handleNavigate = useCallback((pageId: string) => {
    onNavigate(pageId);
    setIsMenuOpen(false);
  }, [onNavigate]);

  const handleLogout = useCallback(() => {
    setIsMenuOpen(false);
    onLogout();
  }, [onLogout]);

  const getUserInitials = useCallback((name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  }, []);

  const getRoleLabel = useCallback((role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Encargado';
      case 'cashier':
        return 'Cajero';
      default:
        return 'Usuario';
    }
  }, []);

  const getRoleColor = useCallback((role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'cashier':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-primary">WalkerGestión</SheetTitle>
                </SheetHeader>
                
                {/* Perfil del usuario */}
                <div className="py-6 border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=16a34a&color=ffffff`} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <Badge size="sm" className={`mt-1 ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                  </div>
                  {user.businessUnit && (
                    <div className="mt-3 p-2 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground">Unidad de Negocio</p>
                      <p className="text-sm font-medium">{user.businessUnit}</p>
                    </div>
                  )}
                </div>

                {/* Navegación */}
                <nav className="py-4 space-y-2">
                  {filteredMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
                        currentPage === item.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge size="sm" variant={currentPage === item.id ? "secondary" : "default"}>
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Footer del menú */}
                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                  {/* Estado de conexión en menú */}
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Estado de Conexión</span>
                      <NetworkIndicator compact={true} />
                    </div>
                    {isOfflineMode && capabilities.canViewData && (
                      <div className="text-xs text-muted-foreground">
                        <CloudOff className="h-3 w-3 inline mr-1" />
                        Modo offline • {pendingItemsCount} elementos pendientes
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate('settings')}
                    className="w-full justify-start"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-lg font-semibold text-primary">
                {getCurrentPageTitle()}
              </h1>
            </div>
          </div>

          {/* Indicadores y usuario */}
          <div className="flex items-center space-x-3">
            {/* Indicador de red */}
            <div className="hidden sm:block">
              <NetworkIndicator showDetails={true} />
            </div>
            <div className="block sm:hidden">
              <NetworkIndicator compact={true} />
            </div>
            
            {/* Modo offline */}
            {isOfflineMode && (
              <div className="flex items-center space-x-1">
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                  <WifiOff className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Modo Offline</span>
                  <span className="sm:hidden">Offline</span>
                </Badge>
                {pendingItemsCount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {pendingItemsCount}
                  </Badge>
                )}
              </div>
            )}

            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=16a34a&color=ffffff`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto">
        {children}
      </main>

      {/* Bottom Navigation - Solo en móviles */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="grid grid-cols-4 gap-1 p-2">
          {filteredMenuItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${
                currentPage === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <Badge 
                    size="sm" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Padding para el bottom navigation */}
      <div className="md:hidden h-20"></div>
    </div>
  );
}