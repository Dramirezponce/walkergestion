import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { UserData } from '../types/app';
import { toast } from 'sonner@2.0.3';
import { 
  Plus, 
  ShoppingCart, 
  Calendar, 
  DollarSign, 
  CreditCard,
  Banknote,
  Building2,
  Filter,
  Search,
  TrendingUp,
  Eye
} from 'lucide-react';

interface SalesProps {
  userData: UserData;
}

interface SaleFormData {
  business_unit_id: string;
  amount: string;
  payment_cash: string;
  payment_card: string;
  payment_transfer: string;
  notes: string;
}

const initialFormData: SaleFormData = {
  business_unit_id: '',
  amount: '',
  payment_cash: '',
  payment_card: '',
  payment_transfer: '',
  notes: ''
};

// Datos de fallback para cuando el sistema demo no esté disponible
const FALLBACK_BUSINESS_UNITS = [
  { id: 'demo-1', name: 'Sucursal Plaza Victoria' },
  { id: 'demo-2', name: 'Sucursal Puerto' },
  { id: 'demo-3', name: 'Sucursal Cerros' }
];

export default function Sales({ userData }: SalesProps) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [formData, setFormData] = useState<SaleFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
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
            getSales: () => [],
            addSale: (sale: any) => ({ ...sale, id: Date.now().toString() })
          },
          DEMO_COMPANIES: [{ business_units: FALLBACK_BUSINESS_UNITS }],
          simulateNetworkDelay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        });
      }
    };

    loadDemoSystem();
  }, []);

  // Cargar ventas cuando el sistema demo esté listo
  useEffect(() => {
    if (!demoSystem) return;

    const loadSales = async () => {
      try {
        setLoading(true);
        await demoSystem.simulateNetworkDelay(500);
        
        const allSales = demoSystem.demoData?.getSales() || [];
        setSales(allSales);
        console.log(`📊 Cargadas ${allSales.length} ventas`);
      } catch (error) {
        console.error('Error cargando ventas:', error);
        toast.error('Error al cargar ventas', {
          description: 'Usando datos de demostración'
        });
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, [demoSystem]);

  // Obtener unidades de negocio
  const businessUnits = demoSystem?.DEMO_COMPANIES?.[0]?.business_units || FALLBACK_BUSINESS_UNITS;

  // Filtrar ventas
  const filteredSales = sales.filter(sale => {
    // Filtro por fecha
    const saleDate = new Date(sale.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let dateMatch = true;
    switch (dateFilter) {
      case 'today':
        dateMatch = saleDate.toDateString() === today.toDateString();
        break;
      case 'yesterday':
        dateMatch = saleDate.toDateString() === yesterday.toDateString();
        break;
      case 'week':
        dateMatch = saleDate >= weekAgo;
        break;
      case 'month':
        dateMatch = saleDate >= monthAgo;
        break;
    }

    // Filtro por unidad de negocio
    const unitMatch = businessUnitFilter === 'all' || sale.business_unit_id === businessUnitFilter;

    // Filtro por búsqueda
    const searchMatch = searchTerm === '' || 
      sale.business_unit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    return dateMatch && unitMatch && searchMatch;
  });

  // Calcular estadísticas
  const stats = {
    total: filteredSales.length,
    amount: filteredSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
    cash: filteredSales.reduce((sum, sale) => sum + (sale.payment_methods?.cash || 0), 0),
    card: filteredSales.reduce((sum, sale) => sum + (sale.payment_methods?.card || 0), 0),
    transfer: filteredSales.reduce((sum, sale) => sum + (sale.payment_methods?.transfer || 0), 0)
  };

  // Manejar cambio en formulario
  const handleFormChange = (field: keyof SaleFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calcular distribución de pagos si se cambia el monto total
      if (field === 'amount') {
        const amount = parseFloat(value) || 0;
        const cash = Math.floor(amount * 0.4); // 40% efectivo por defecto
        const card = Math.floor(amount * 0.6); // 60% tarjeta por defecto
        const transfer = amount - cash - card; // Resto en transferencia
        
        updated.payment_cash = cash.toString();
        updated.payment_card = card.toString();
        updated.payment_transfer = Math.max(0, transfer).toString();
      }
      
      return updated;
    });
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const amount = parseFloat(formData.amount) || 0;
    const cash = parseFloat(formData.payment_cash) || 0;
    const card = parseFloat(formData.payment_card) || 0;
    const transfer = parseFloat(formData.payment_transfer) || 0;
    const total = cash + card + transfer;

    if (!formData.business_unit_id) {
      toast.error('Selecciona una unidad de negocio');
      return false;
    }

    if (amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return false;
    }

    if (Math.abs(total - amount) > 1) { // Permitir diferencia de $1 por redondeos
      toast.error('La suma de los métodos de pago debe igualar al monto total');
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
      await demoSystem?.simulateNetworkDelay(800);
      
      const businessUnit = businessUnits.find(unit => unit.id === formData.business_unit_id);
      
      const saleData = {
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(formData.amount),
        business_unit_id: formData.business_unit_id,
        business_unit_name: businessUnit?.name || 'Unidad desconocida',
        created_by: userData.id,
        created_by_name: userData.name,
        payment_methods: {
          cash: parseFloat(formData.payment_cash) || 0,
          card: parseFloat(formData.payment_card) || 0,
          transfer: parseFloat(formData.payment_transfer) || 0
        },
        notes: formData.notes || undefined
      };

      const newSale = demoSystem?.demoData?.addSale(saleData) || {
        ...saleData,
        id: Date.now().toString()
      };
      
      setSales(prev => [newSale, ...prev]);
      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      
      toast.success('Venta registrada exitosamente', {
        description: `$${newSale.amount.toLocaleString()} en ${businessUnit?.name}`
      });
      
    } catch (error) {
      console.error('Error registrando venta:', error);
      toast.error('Error al registrar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  // Ver detalle de venta
  const handleViewDetail = (sale: any) => {
    setSelectedSale(sale);
    setIsDetailDialogOpen(true);
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
          <h1 className="text-3xl font-bold">Registro de Ventas</h1>
          <p className="text-muted-foreground">
            Gestiona las ventas diarias de tus unidades de negocio
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Venta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" aria-describedby="new-sale-dialog-description">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Venta</DialogTitle>
              <DialogDescription id="new-sale-dialog-description">
                Ingresa los detalles de la venta realizada
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_unit">Unidad de Negocio</Label>
                <Select 
                  value={formData.business_unit_id} 
                  onValueChange={(value) => handleFormChange('business_unit_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Monto Total</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                    className="pl-10"
                    min="1"
                    step="1"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <Label>Distribución por Método de Pago</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="cash" className="text-sm">Efectivo</Label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cash"
                      type="number"
                      placeholder="0"
                      value={formData.payment_cash}
                      onChange={(e) => handleFormChange('payment_cash', e.target.value)}
                      className="pl-10"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="card" className="text-sm">Tarjeta</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="card"
                      type="number"
                      placeholder="0"
                      value={formData.payment_card}
                      onChange={(e) => handleFormChange('payment_card', e.target.value)}
                      className="pl-10"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transfer" className="text-sm">Transferencia</Label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="transfer"
                      type="number"
                      placeholder="0"
                      value={formData.payment_transfer}
                      onChange={(e) => handleFormChange('payment_transfer', e.target.value)}
                      className="pl-10"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Input
                  id="notes"
                  placeholder="Detalles adicionales de la venta"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
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
                  {submitting ? 'Registrando...' : 'Registrar Venta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.amount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.amount > 0 ? Math.round((stats.cash / stats.amount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats.cash.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarjeta</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.amount > 0 ? Math.round((stats.card / stats.amount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats.card.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.amount > 0 ? Math.round((stats.transfer / stats.amount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats.transfer.toLocaleString()}
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
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
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
                  placeholder="Buscar ventas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Registradas</CardTitle>
          <CardDescription>
            {filteredSales.length} ventas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredSales.map((sale) => (
              <div 
                key={sale.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 bg-primary/10 rounded-full">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sale.business_unit_name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {sale.date}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Por {sale.created_by_name}
                  </div>
                  
                  {sale.notes && (
                    <div className="text-xs text-muted-foreground italic">
                      {sale.notes}
                    </div>
                  )}
                </div>
                
                <div className="text-right space-y-1">
                  <div className="font-semibold">
                    ${sale.amount?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    💵 ${sale.payment_methods?.cash?.toLocaleString() || '0'} • 
                    💳 ${sale.payment_methods?.card?.toLocaleString() || '0'} • 
                    📱 ${sale.payment_methods?.transfer?.toLocaleString() || '0'}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetail(sale)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
              </div>
            ))}
            
            {filteredSales.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No hay ventas registradas</h3>
                <p className="text-sm">
                  {sales.length === 0 
                    ? 'Comienza registrando tu primera venta'
                    : 'Prueba ajustando los filtros de búsqueda'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalle de venta */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby="sale-detail-dialog-description">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
            <DialogDescription id="sale-detail-dialog-description">
              Información completa de la venta seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">ID:</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {selectedSale.id?.toString().slice(-8)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Fecha:</span>
                  <span className="text-sm">{selectedSale.date}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Unidad:</span>
                  <span className="text-sm">{selectedSale.business_unit_name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Vendedor:</span>
                  <span className="text-sm">{selectedSale.created_by_name}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Monto Total</h4>
                <div className="text-2xl font-bold text-center p-4 bg-primary/10 rounded-lg">
                  ${selectedSale.amount?.toLocaleString() || '0'}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Métodos de Pago</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Efectivo
                    </span>
                    <span className="font-medium">
                      ${selectedSale.payment_methods?.cash?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tarjeta
                    </span>
                    <span className="font-medium">
                      ${selectedSale.payment_methods?.card?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Transferencia
                    </span>
                    <span className="font-medium">
                      ${selectedSale.payment_methods?.transfer?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedSale.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Notas</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                      {selectedSale.notes}
                    </p>
                  </div>
                </>
              )}
              
              <Button 
                onClick={() => setIsDetailDialogOpen(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}