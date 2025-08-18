import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  LayoutDashboard, 
  Building2, 
  ShoppingCart, 
  ArrowRightLeft, 
  Target, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  Crown,
  Shield,
  FileText
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'cashier';
    company: string;
    businessUnit?: string;
  };
  onLogout: () => void;
}

export default function Layout({ children, currentPage, onNavigate, user, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'cashier':
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Encargado';
      case 'cashier':
        return 'Cajero';
      default:
        return role;
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
      { id: 'sales', label: 'Ventas', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    ];

    const restrictedItems = [
      { id: 'companies', label: 'Empresas', icon: Building2, roles: ['admin'] },
      { id: 'cashflows', label: 'Rendiciones', icon: ArrowRightLeft, roles: ['admin', 'manager'] },
      { id: 'reports', label: 'Informes PDF', icon: FileText, roles: ['admin'] },
      { id: 'bonuses', label: 'Bonos', icon: Target, roles: ['admin'] },
      { id: 'alerts', label: 'Alertas', icon: Bell, roles: ['admin', 'manager'] },
      { id: 'settings', label: 'Configuración', icon: Settings, roles: ['admin', 'manager', 'cashier'] },
    ];

    return [...baseItems, ...restrictedItems].filter(item => 
      item.roles.includes(user.role)
    );
  };

  const menuItems = getMenuItems();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100">
      {/* Header */}
      <header className="bg-white border-b border-green-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                  WalkerGestion
                </h1>
                <p className="text-xs text-green-600 hidden sm:block">Sistema Integral de Gestión</p>
              </div>
            </div>

            {/* Navegación Desktop */}
            <nav className="hidden lg:flex items-center space-x-1">
              {menuItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={`flex items-center space-x-2 ${
                      isActive 
                        ? "bg-green-600 text-white hover:bg-green-700" 
                        : "text-green-700 hover:bg-green-100"
                    }`}
                    onClick={() => onNavigate(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>

            {/* Info del usuario y botones */}
            <div className="flex items-center space-x-3">
              {/* Info del usuario */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-green-900">{user.name}</p>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <p className="text-xs text-green-600">{getRoleName(user.role)}</p>
                  </div>
                </div>
                {user.businessUnit && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    {user.businessUnit}
                  </Badge>
                )}
              </div>

              {/* Botón de logout */}
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Salir</span>
              </Button>

              {/* Botón menú móvil */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden text-green-700 border-green-300"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-green-200">
            <div className="px-4 py-3 space-y-2">
              {/* Info del usuario en móvil */}
              <div className="flex items-center space-x-3 pb-3 border-b border-green-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">{user.name}</p>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <p className="text-xs text-green-600">{getRoleName(user.role)}</p>
                  </div>
                  <p className="text-xs text-green-500">{user.company}</p>
                  {user.businessUnit && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 mt-1">
                      {user.businessUnit}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Navegación móvil */}
              {menuItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start space-x-2 ${
                      isActive 
                        ? "bg-green-600 text-white" 
                        : "text-green-700 hover:bg-green-100"
                    }`}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Contenido principal */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-green-200 mt-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-green-600 to-green-700 rounded flex items-center justify-center">
                <Building2 className="h-3 w-3 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">WalkerGestion</p>
                <p className="text-xs text-green-600">© 2024 Sistema Integral de Gestión</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-xs text-green-600">
                Versión 1.0 | Desarrollado para optimizar la gestión de locales comerciales
              </p>
              <p className="text-xs text-green-500">
                Santiago Wanderers • Verde y Blanco
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}