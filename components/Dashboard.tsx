import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  AlertTriangle,
  Users,
  Building,
  Calendar,
  ArrowRight,
  RefreshCw,
  Clock,
  Award,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { UserData } from '../types/app';
import { toast } from 'sonner@2.0.3';

interface DashboardProps {
  userData: UserData;
}

interface DashboardMetrics {
  todaySales: number;
  monthSales: number;
  pendingRenditions: number;
  monthGoal: number;
  goalProgress: number;
  alerts: number;
  dailyGrowth: number;
  monthlyGrowth: number;
  expenses: number;
  transfers: number;
  cashBalance: number;
  activeUsers: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'rendition' | 'expense' | 'transfer' | 'alert' | 'goal_achieved';
  description: string;
  amount?: number;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  priority?: 'low' | 'medium' | 'high';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  disabled?: boolean;
}

export default function Dashboard({ userData }: DashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todaySales: 0,
    monthSales: 0,
    pendingRenditions: 0,
    monthGoal: 0,
    goalProgress: 0,
    alerts: 0,
    dailyGrowth: 0,
    monthlyGrowth: 0,
    expenses: 0,
    transfers: 0,
    cashBalance: 0,
    activeUsers: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Defensive programming: Ensure userData exists and has required properties
  const safeUserData = {
    id: userData?.id || 'unknown',
    name: userData?.name || 'Usuario',
    email: userData?.email || '',
    role: userData?.role || 'cashier',
    company: userData?.company || 'Sin empresa',
    businessUnit: userData?.businessUnit,
    company_id: userData?.company_id,
    business_unit_id: userData?.business_unit_id
  };

  // Memoizar datos basados en el rol del usuario
  const rolePermissions = useMemo(() => {
    return {
      canViewAllMetrics: safeUserData.role === 'admin',
      canViewCompanyMetrics: safeUserData.role === 'admin' || safeUserData.role === 'manager',
      canManageUsers: safeUserData.role === 'admin',
      canViewFinancials: safeUserData.role === 'admin' || safeUserData.role === 'manager'
    };
  }, [safeUserData.role]);

  // Cargar datos del dashboard
  const loadDashboardData = useCallback(async () => {
    if (!userData) {
      console.warn('⚠️ No hay datos de usuario para cargar dashboard');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📊 Cargando datos del dashboard para:', safeUserData.name);
      
      // Simular carga de datos más realista
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generar datos dinámicos basados en el rol y fecha actual
      const now = new Date();
      const dayOfMonth = now.getDate();
      const monthProgress = (dayOfMonth / 30) * 100; // Progreso del mes
      
      // Datos base más realistas
      const baseMetrics: DashboardMetrics = {
        todaySales: 125000 + (dayOfMonth * 5000) + Math.floor(Math.random() * 50000),
        monthSales: 2850000 + (dayOfMonth * 95000),
        pendingRenditions: Math.floor(Math.random() * 5) + 1,
        monthGoal: 3500000,
        goalProgress: Math.min(95 + Math.floor(Math.random() * 10), 100),
        alerts: Math.floor(Math.random() * 3) + 1,
        dailyGrowth: 5.2 + (Math.random() * 10 - 5), // Entre 0.2% y 10.2%
        monthlyGrowth: 12.8 + (Math.random() * 8 - 4), // Entre 8.8% y 16.8%
        expenses: 145000 + Math.floor(Math.random() * 20000),
        transfers: Math.floor(Math.random() * 12) + 4,
        cashBalance: 450000 + Math.floor(Math.random() * 100000),
        activeUsers: safeUserData.role === 'admin' ? 15 + Math.floor(Math.random() * 10) : 3
      };

      // Ajustar métricas según el rol
      if (safeUserData.role === 'cashier') {
        baseMetrics.monthSales = baseMetrics.monthSales * 0.3; // Solo su unidad
        baseMetrics.todaySales = baseMetrics.todaySales * 0.3;
        baseMetrics.transfers = Math.floor(baseMetrics.transfers * 0.2);
      } else if (safeUserData.role === 'manager') {
        baseMetrics.monthSales = baseMetrics.monthSales * 0.6; // Sus unidades
        baseMetrics.todaySales = baseMetrics.todaySales * 0.6;
        baseMetrics.transfers = Math.floor(baseMetrics.transfers * 0.5);
      }

      setMetrics(baseMetrics);

      // Generar actividad reciente dinámica
      const activities: RecentActivity[] = [
        {
          id: `activity-${Date.now()}-1`,
          type: 'sale',
          description: 'Venta registrada - Terminal Principal',
          amount: 15000 + Math.floor(Math.random() * 25000),
          time: 'Hace 5 min',
          status: 'completed'
        },
        {
          id: `activity-${Date.now()}-2`,
          type: 'rendition',
          description: 'Rendición pendiente - Caja Principal',
          amount: 85000 + Math.floor(Math.random() * 50000),
          time: 'Hace 1 hora',
          status: 'pending',
          priority: 'medium'
        },
        {
          id: `activity-${Date.now()}-3`,
          type: baseMetrics.goalProgress >= 100 ? 'goal_achieved' : 'alert',
          description: baseMetrics.goalProgress >= 100 ? 
            '🎉 ¡Meta mensual alcanzada!' : 
            `Meta mensual al ${baseMetrics.goalProgress}%`,
          time: 'Hace 2 horas',
          status: 'completed',
          priority: baseMetrics.goalProgress >= 100 ? 'high' : 'low'
        },
        {
          id: `activity-${Date.now()}-4`,
          type: 'expense',
          description: 'Gasto registrado - Suministros',
          amount: 12000 + Math.floor(Math.random() * 8000),
          time: 'Hace 3 horas',
          status: 'completed'
        },
        {
          id: `activity-${Date.now()}-5`,
          type: 'transfer',
          description: 'Transferencia semanal procesada',
          amount: 450000 + Math.floor(Math.random() * 100000),
          time: 'Ayer',
          status: 'completed'
        }
      ];

      setRecentActivity(activities);
      setLastRefresh(new Date());

      console.log('✅ Datos del dashboard cargados exitosamente');
      
      // Toast de éxito personalizado según el rol
      const roleMessages = {
        admin: '📊 Dashboard de administrador actualizado',
        manager: '📈 Dashboard de encargado actualizado', 
        cashier: '💰 Dashboard de cajero actualizado'
      };
      
      toast.success(roleMessages[safeUserData.role], {
        description: `Última actualización: ${lastRefresh.toLocaleTimeString()}`,
        duration: 2000
      });

    } catch (error) {
      console.error('❌ Error cargando datos del dashboard:', error);
      toast.error('Error al cargar los datos del dashboard', {
        description: 'Mostrando datos de ejemplo',
        duration: 4000
      });
    } finally {
      setIsLoading(false);
    }
  }, [safeUserData.name, safeUserData.role, userData]);

  // Cargar datos al montar y cuando cambie el usuario
  useEffect(() => {
    if (userData) {
      loadDashboardData();
    }
  }, [loadDashboardData, userData]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && userData) {
        console.log('🔄 Auto-refresh del dashboard');
        loadDashboardData();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [isLoading, loadDashboardData, userData]);

  // Formateo de moneda
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // Acciones rápidas según el rol
  const quickActions = useMemo((): QuickAction[] => {
    const actions: QuickAction[] = [
      {
        id: 'new-sale',
        title: 'Nueva Venta',
        description: 'Registrar venta del día',
        icon: <ShoppingCart className="h-5 w-5" />,
        color: 'bg-green-500',
        action: () => {
          toast.info('Función Nueva Venta', {
            description: 'Navegar a registro de ventas',
            duration: 2000
          });
        }
      }
    ];

    if (rolePermissions.canViewFinancials) {
      actions.push({
        id: 'view-renditions',
        title: 'Rendiciones',
        description: 'Ver rendiciones pendientes',
        icon: <RefreshCw className="h-5 w-5" />,
        color: 'bg-blue-500',
        action: () => {
          toast.info('Función Rendiciones', {
            description: 'Navegar a rendiciones',
            duration: 2000
          });
        }
      });
    }

    if (safeUserData.role === 'admin') {
      actions.push(
        {
          id: 'manage-users',
          title: 'Usuarios',
          description: 'Gestionar usuarios del sistema',
          icon: <Users className="h-5 w-5" />,
          color: 'bg-purple-500',
          action: () => {
            toast.info('Función Usuarios', {
              description: 'Navegar a gestión de usuarios',
              duration: 2000
            });
          }
        },
        {
          id: 'system-settings',
          title: 'Configuración',
          description: 'Configuración del sistema',
          icon: <Building className="h-5 w-5" />,
          color: 'bg-orange-500',
          action: () => {
            toast.info('Función Configuración', {
              description: 'Navegar a configuración',
              duration: 2000
            });
          }
        }
      );
    }

    return actions;
  }, [safeUserData.role, rolePermissions]);

  // Obtener icono de actividad
  const getActivityIcon = useCallback((type: RecentActivity['type']) => {
    const iconMap = {
      sale: <DollarSign className="h-4 w-4 text-green-600" />,
      rendition: <RefreshCw className="h-4 w-4 text-blue-600" />,
      expense: <TrendingDown className="h-4 w-4 text-red-600" />,
      transfer: <ArrowRight className="h-4 w-4 text-purple-600" />,
      alert: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
      goal_achieved: <Award className="h-4 w-4 text-gold-600" />
    };
    return iconMap[type] || <Calendar className="h-4 w-4 text-gray-600" />;
  }, []);

  // Obtener badge de estado
  const getStatusBadge = useCallback((activity: RecentActivity) => {
    const { status, priority } = activity;
    
    if (status === 'completed') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>;
    }
    if (status === 'pending') {
      const priorityColors = {
        high: 'bg-red-100 text-red-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-blue-100 text-blue-800'
      };
      return (
        <Badge variant="secondary" className={priorityColors[priority || 'low']}>
          Pendiente
        </Badge>
      );
    }
    if (status === 'failed') {
      return <Badge variant="destructive">Fallido</Badge>;
    }
    return null;
  }, []);

  // Early return if userData is not available
  if (!userData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold">Datos de usuario no disponibles</h3>
            <p className="text-muted-foreground">No se pudieron cargar los datos del usuario</p>
          </div>
        </div>
      </div>
    );
  }

  // Componente de carga
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-96 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header mejorado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">
            ¡Hola, {safeUserData.name}! 👋
          </h1>
          <div className="flex items-center space-x-4">
            <p className="text-muted-foreground">
              {safeUserData.role === 'admin' ? '👑 Administrador General' : 
               safeUserData.role === 'manager' ? '👨‍💼 Encargado de Local' : '💰 Cajero'}
              {safeUserData.businessUnit && ` • ${safeUserData.businessUnit}`}
            </p>
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {lastRefresh.toLocaleTimeString()}
            </Badge>
          </div>
        </div>
        
        <Button
          onClick={loadDashboardData}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="hover:bg-green-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Alerta de meta alcanzada */}
      {metrics.goalProgress >= 100 && (
        <Alert className="border-green-300 bg-gradient-to-r from-green-50 to-green-100">
          <Award className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">🎉 ¡Felicitaciones! Meta mensual alcanzada</p>
                <p className="text-sm">Has superado el objetivo establecido para este mes</p>
              </div>
              <Badge className="bg-green-600">
                {metrics.goalProgress}%
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas principales mejoradas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(metrics.todaySales)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {metrics.dailyGrowth > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  +{metrics.dailyGrowth.toFixed(1)}% vs ayer
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  {metrics.dailyGrowth.toFixed(1)}% vs ayer
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(metrics.monthSales)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +{metrics.monthlyGrowth.toFixed(1)}% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Mensual</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {metrics.goalProgress}%
            </div>
            <Progress value={metrics.goalProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(Math.max(0, metrics.monthGoal - metrics.monthSales))} restante
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {rolePermissions.canViewAllMetrics ? 'Alertas' : 'Estado'}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics.alerts}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingRenditions} rendiciones pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card 
              key={action.id}
              className="cursor-pointer hover:shadow-md transition-all group"
              onClick={action.action}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contenido principal con tabs mejoradas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">📊 Resumen</TabsTrigger>
          <TabsTrigger value="activity">🔔 Actividad</TabsTrigger>
          <TabsTrigger value="goals">🎯 Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Rendiciones pendientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-primary" />
                  Rendiciones Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Caja Principal', status: 'pending' },
                    { name: 'Terminal 2', status: 'pending' },
                    { name: 'Caja Express', status: 'completed' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{item.name}</span>
                      <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                        {item.status === 'completed' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completada
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pendiente
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" size="sm" variant="outline">
                  Ver Todas las Rendiciones
                </Button>
              </CardContent>
            </Card>

            {/* Resumen financiero */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary" />
                  Resumen Financiero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ingresos del Mes</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(metrics.monthSales)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gastos del Mes</span>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(metrics.expenses)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Efectivo en Caja</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(metrics.cashBalance)}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Balance Neto</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(metrics.monthSales - metrics.expenses)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Actividad Reciente</span>
                <Badge variant="outline">{recentActivity.length} eventos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {activity.amount && (
                        <span className="text-sm font-semibold">
                          {formatCurrency(activity.amount)}
                        </span>
                      )}
                      {getStatusBadge(activity)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Meta Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {metrics.goalProgress}%
                    </div>
                    <Progress value={metrics.goalProgress} className="mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(metrics.monthSales)} de {formatCurrency(metrics.monthGoal)}
                    </p>
                  </div>
                  
                  {metrics.goalProgress >= 100 ? (
                    <div className="bg-green-100 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-green-800 font-bold mb-1">🎉 ¡Meta Alcanzada!</p>
                      <p className="text-green-600 text-sm">Excelente trabajo este mes</p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-blue-800 font-medium mb-1">¡Vas muy bien!</p>
                      <p className="text-blue-600 text-sm">
                        Faltan {formatCurrency(metrics.monthGoal - metrics.monthSales)} para la meta
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-600" />
                  Bonificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { 
                      name: 'Bonus Meta 100%', 
                      status: metrics.goalProgress >= 100 ? 'available' : 'locked',
                      description: 'Por superar la meta mensual'
                    },
                    { 
                      name: 'Bonus Trimestral', 
                      status: 'pending',
                      description: 'En evaluación para el trimestre'
                    },
                    { 
                      name: 'Bonus Equipo', 
                      status: 'locked',
                      description: 'Disponible con meta grupal'
                    }
                  ].map((bonus, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{bonus.name}</p>
                        <p className="text-xs text-muted-foreground">{bonus.description}</p>
                      </div>
                      <Badge 
                        variant={bonus.status === 'available' ? 'default' : 
                                bonus.status === 'pending' ? 'secondary' : 'outline'}
                        className={
                          bonus.status === 'available' ? 'bg-green-600' :
                          bonus.status === 'pending' ? 'bg-yellow-500' : ''
                        }
                      >
                        {bonus.status === 'available' ? '✅ Disponible' :
                         bonus.status === 'pending' ? '⏳ Pendiente' : '🔒 Bloqueado'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" size="sm" variant="outline">
                  Ver Detalles de Bonos
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}