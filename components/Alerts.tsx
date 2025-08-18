import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { UserData } from '../types/app';
import { toast } from 'sonner@2.0.3';
import { 
  Plus, 
  Bell, 
  BellRing,
  Filter,
  Search,
  Eye,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Settings,
  Download,
  Archive,
  Trash2,
  Clock,
  Target,
  TrendingUp,
  DollarSign,
  Building2
} from 'lucide-react';

interface AlertsProps {
  userData: UserData;
}

interface AlertFormData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  business_unit_id: string;
}

interface AlertSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  salesThreshold: string;
  expenseThreshold: string;
  renditionDelay: string;
  autoMarkRead: boolean;
}

const initialFormData: AlertFormData = {
  title: '',
  message: '',
  type: 'info',
  business_unit_id: 'general' // Cambiado de '' a 'general'
};

const initialSettings: AlertSettings = {
  emailNotifications: true,
  pushNotifications: true,
  salesThreshold: '50000',
  expenseThreshold: '10000',
  renditionDelay: '48',
  autoMarkRead: false
};

// Datos de fallback para cuando el sistema demo no esté disponible
const FALLBACK_BUSINESS_UNITS = [
  { id: 'demo-1', name: 'Sucursal Plaza Victoria' },
  { id: 'demo-2', name: 'Sucursal Puerto' },
  { id: 'demo-3', name: 'Sucursal Cerros' }
];

export default function Alerts({ userData }: AlertsProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [formData, setFormData] = useState<AlertFormData>(initialFormData);
  const [settings, setSettings] = useState<AlertSettings>(initialSettings);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessUnitFilter, setBusinessUnitFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [demoSystem, setDemoSystem] = useState<any>(null);

  // Cargar sistema demo de forma asíncrona
  useEffect(() => {
    const loadDemoSystem = async () => {
      try {
        const demoModule = await import('../lib/demo-data');
        setDemoSystem(demoModule);
        console.log('✅ Sistema demo cargado correctamente');
      } catch (error) {
        console.warn('⚠️ No se pudo cargar el sistema demo, usando fallback:', error);
        // Crear sistema mock básico
        setDemoSystem({
          demoData: {
            getAlerts: () => [],
            addAlert: (alert: any) => ({ ...alert, id: Date.now().toString() }),
            markAlertAsRead: () => {}
          },
          DEMO_COMPANIES: [{ business_units: FALLBACK_BUSINESS_UNITS }],
          simulateNetworkDelay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        });
      }
    };

    loadDemoSystem();
  }, []);

  // Cargar alertas cuando el sistema demo esté listo
  useEffect(() => {
    if (!demoSystem) return;

    const loadAlerts = async () => {
      try {
        setLoading(true);
        await demoSystem.simulateNetworkDelay(400);
        
        const allAlerts = demoSystem.demoData?.getAlerts() || [];
        setAlerts(allAlerts);

        // Cargar configuraciones desde localStorage
        try {
          const savedSettings = localStorage.getItem('walkergestion_alert_settings');
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          }
        } catch {
          // Usar configuraciones por defecto
        }

        console.log(`🔔 Cargadas ${allAlerts.length} alertas`);
      } catch (error) {
        console.error('Error cargando alertas:', error);
        toast.error('Error al cargar alertas', {
          description: 'Usando datos de demostración'
        });
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [demoSystem]);

  // Obtener unidades de negocio
  const businessUnits = demoSystem?.DEMO_COMPANIES?.[0]?.business_units || FALLBACK_BUSINESS_UNITS;

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    // Filtro por tipo
    const typeMatch = typeFilter === 'all' || alert.type === typeFilter;

    // Filtro por estado
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'read' && alert.read) ||
      (statusFilter === 'unread' && !alert.read);

    // Filtro por unidad de negocio - actualizado para manejar 'general'
    const unitMatch = businessUnitFilter === 'all' || 
      (businessUnitFilter === 'general' && !alert.business_unit_id) ||
      alert.business_unit_id === businessUnitFilter;

    // Filtro por búsqueda
    const searchMatch = searchTerm === '' || 
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message?.toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && statusMatch && unitMatch && searchMatch;
  });

  // Calcular estadísticas
  const stats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.read).length,
    today: alerts.filter(a => a.created_at?.startsWith(new Date().toISOString().split('T')[0])).length,
    byType: {
      info: alerts.filter(a => a.type === 'info').length,
      warning: alerts.filter(a => a.type === 'warning').length,
      error: alerts.filter(a => a.type === 'error').length,
      success: alerts.filter(a => a.type === 'success').length
    }
  };

  // Manejar cambio en formulario
  const handleFormChange = (field: keyof AlertFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manejar cambio en configuraciones
  const handleSettingsChange = (field: keyof AlertSettings, value: string | boolean) => {
    setSettings(prev => {
      const updated = { ...prev, [field]: value };
      
      // Guardar en localStorage
      try {
        localStorage.setItem('walkergestion_alert_settings', JSON.stringify(updated));
      } catch (error) {
        console.error('Error guardando configuraciones:', error);
      }
      
      return updated;
    });
  };

  // Validar formulario
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return false;
    }

    if (!formData.message.trim()) {
      toast.error('El mensaje es requerido');
      return false;
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      await demoSystem?.simulateNetworkDelay(500);
      
      const businessUnit = businessUnits.find(unit => unit.id === formData.business_unit_id);
      
      const alertData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        business_unit_id: formData.business_unit_id === 'general' ? undefined : formData.business_unit_id,
        created_at: new Date().toISOString(),
        read: false
      };

      const newAlert = demoSystem?.demoData?.addAlert(alertData) || {
        ...alertData,
        id: Date.now().toString()
      };
      
      setAlerts(prev => [newAlert, ...prev]);
      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      
      toast.success('Alerta creada exitosamente', {
        description: businessUnit ? `Para ${businessUnit.name}` : 'Alerta general del sistema'
      });
      
    } catch (error) {
      console.error('Error creando alerta:', error);
      toast.error('Error al crear la alerta');
    } finally {
      setSubmitting(false);
    }
  };

  // Marcar alerta como leída
  const handleMarkAsRead = async (id: string) => {
    try {
      await demoSystem?.simulateNetworkDelay(200);
      
      demoSystem?.demoData?.markAlertAsRead(id);
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, read: true } : alert
      ));
      
      toast.success('Alerta marcada como leída');
    } catch (error) {
      console.error('Error marcando alerta:', error);
      toast.error('Error al marcar como leída');
    }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      await demoSystem?.simulateNetworkDelay(500);
      
      const unreadAlerts = alerts.filter(a => !a.read);
      unreadAlerts.forEach(alert => demoSystem?.demoData?.markAlertAsRead(alert.id));
      
      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
      
      toast.success(`${unreadAlerts.length} alertas marcadas como leídas`);
    } catch (error) {
      console.error('Error marcando alertas:', error);
      toast.error('Error al marcar todas como leídas');
    }
  };

  // Ver detalle de alerta
  const handleViewDetail = (alert: any) => {
    setSelectedAlert(alert);
    setIsDetailDialogOpen(true);
    
    // Marcar como leída automáticamente si está configurado
    if (settings.autoMarkRead && !alert.read) {
      handleMarkAsRead(alert.id);
    }
  };

  // Exportar alertas
  const handleExport = () => {
    try {
      const exportData = filteredAlerts.map(alert => ({
        Fecha: new Date(alert.created_at).toLocaleDateString(),
        Hora: new Date(alert.created_at).toLocaleTimeString(),
        Título: alert.title,
        Mensaje: alert.message,
        Tipo: alert.type === 'info' ? 'Información' :
              alert.type === 'warning' ? 'Advertencia' :
              alert.type === 'error' ? 'Error' : 'Éxito',
        'Unidad de Negocio': alert.business_unit_id ? 
          businessUnits.find(u => u.id === alert.business_unit_id)?.name || 'Desconocida' : 
          'General',
        Estado: alert.read ? 'Leída' : 'No leída'
      }));

      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `alertas_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Alertas exportadas', {
        description: 'El archivo CSV se ha descargado correctamente'
      });
    } catch (error) {
      console.error('Error exportando alertas:', error);
      toast.error('Error al exportar las alertas');
    }
  };

  // Obtener icono según tipo de alerta
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Obtener badge según tipo
  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Información</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Advertencia</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Éxito</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  // Formatear tiempo relativo
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays === 0) {
      if (diffHours === 0) return 'Hace poco';
      return `Hace ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading || !demoSystem) {
    return (
      <div className="space-y-6 p-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centro de Alertas</h1>
          <p className="text-muted-foreground">
            Gestiona notificaciones y alertas del sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          {stats.unread > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Marcar todas como leídas
            </Button>
          )}
          
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby="alert-settings-dialog-description">
              <DialogHeader>
                <DialogTitle>Configuración de Alertas</DialogTitle>
                <DialogDescription id="alert-settings-dialog-description">
                  Personaliza cómo y cuándo recibir alertas
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notificaciones</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Notificaciones por email</Label>
                    <Switch
                      id="email-notifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingsChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Notificaciones push</Label>
                    <Switch
                      id="push-notifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingsChange('pushNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-read">Marcar como leída al ver</Label>
                    <Switch
                      id="auto-read"
                      checked={settings.autoMarkRead}
                      onCheckedChange={(checked) => handleSettingsChange('autoMarkRead', checked)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Umbrales de Alerta</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sales-threshold">Umbral de ventas diarias</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="sales-threshold"
                        type="number"
                        value={settings.salesThreshold}
                        onChange={(e) => handleSettingsChange('salesThreshold', e.target.value)}
                        className="pl-10"
                        placeholder="50000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expense-threshold">Umbral de gastos por rendición</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="expense-threshold"
                        type="number"
                        value={settings.expenseThreshold}
                        onChange={(e) => handleSettingsChange('expenseThreshold', e.target.value)}
                        className="pl-10"
                        placeholder="10000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rendition-delay">Retraso máximo en rendiciones (horas)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rendition-delay"
                        type="number"
                        value={settings.renditionDelay}
                        onChange={(e) => handleSettingsChange('renditionDelay', e.target.value)}
                        className="pl-10"
                        placeholder="48"
                      />
                    </div>
                  </div>
                </div>
                
                <Button onClick={() => setIsSettingsDialogOpen(false)} className="w-full">
                  Guardar Configuración
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby="new-alert-dialog-description">
              <DialogHeader>
                <DialogTitle>Crear Nueva Alerta</DialogTitle>
                <DialogDescription id="new-alert-dialog-description">
                  Envía una notificación personalizada al sistema
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Título de la alerta"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    maxLength={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe el contenido de la alerta"
                    value={formData.message}
                    onChange={(e) => handleFormChange('message', e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Alerta</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleFormChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">ℹ️ Información</SelectItem>
                      <SelectItem value="warning">⚠️ Advertencia</SelectItem>
                      <SelectItem value="error">❌ Error</SelectItem>
                      <SelectItem value="success">✅ Éxito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_unit">Unidad de Negocio (opcional)</Label>
                  <Select 
                    value={formData.business_unit_id} 
                    onValueChange={(value) => handleFormChange('business_unit_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alerta general del sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Alerta general del sistema</SelectItem>
                      {businessUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Creando...' : 'Crear Alerta'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.today} nuevas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Leer</CardTitle>
            <BellRing className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.unread / stats.total) * 100) : 0}% pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.byType.warning}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.byType.error}</div>
            <p className="text-xs text-muted-foreground">
              Críticos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="info">Información</SelectItem>
                  <SelectItem value="warning">Advertencias</SelectItem>
                  <SelectItem value="error">Errores</SelectItem>
                  <SelectItem value="success">Éxito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="unread">Sin leer</SelectItem>
                  <SelectItem value="read">Leídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Unidad de Negocio</Label>
              <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las unidades</SelectItem>
                  <SelectItem value="general">Alertas generales</SelectItem>
                  {businessUnits.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alertas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas del Sistema</CardTitle>
          <CardDescription>
            {filteredAlerts.length} alertas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                  !alert.read ? 'bg-muted/20 border-primary/20' : ''
                }`}
                onClick={() => handleViewDetail(alert)}
              >
                <div className="mt-1">
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h4 className="font-medium leading-tight">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getAlertBadge(alert.type)}
                      {!alert.read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{formatTimeAgo(alert.created_at)}</span>
                      {alert.business_unit_id && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {businessUnits.find(u => u.id === alert.business_unit_id)?.name || 'Unidad desconocida'}
                        </span>
                      )}
                    </div>
                    
                    {!alert.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(alert.id);
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar leída
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredAlerts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No hay alertas</h3>
                <p className="text-sm">
                  {alerts.length === 0 
                    ? 'No se han generado alertas aún'
                    : 'Prueba ajustando los filtros de búsqueda'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalle de alerta */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby="alert-detail-dialog-description">
          <DialogHeader>
            <DialogTitle>Detalle de Alerta</DialogTitle>
            <DialogDescription id="alert-detail-dialog-description">
              Información completa de la alerta seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getAlertIcon(selectedAlert.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-medium">{selectedAlert.title}</h3>
                  {getAlertBadge(selectedAlert.type)}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Mensaje</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    {selectedAlert.message}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Fecha:</span>
                    <div className="text-muted-foreground">
                      {new Date(selectedAlert.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Hora:</span>
                    <div className="text-muted-foreground">
                      {new Date(selectedAlert.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Estado:</span>
                    <div className="text-muted-foreground">
                      {selectedAlert.read ? 'Leída' : 'Sin leer'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Unidad:</span>
                    <div className="text-muted-foreground">
                      {selectedAlert.business_unit_id 
                        ? businessUnits.find(u => u.id === selectedAlert.business_unit_id)?.name || 'Desconocida'
                        : 'General'
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                {!selectedAlert.read && (
                  <Button 
                    onClick={() => {
                      handleMarkAsRead(selectedAlert.id);
                      setIsDetailDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Marcar como Leída
                  </Button>
                )}
                
                <Button 
                  onClick={() => setIsDetailDialogOpen(false)}
                  variant="outline"
                  className={selectedAlert.read ? 'flex-1' : ''}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}