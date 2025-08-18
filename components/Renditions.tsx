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
import { UserData } from '../types/app';
import { demoData, simulateNetworkDelay, MockRendition, MockExpense, DEMO_COMPANIES } from '../lib/demo-data';
import { toast } from 'sonner@2.0.3';
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  Receipt,
  Building2,
  Filter,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Trash2,
  Edit
} from 'lucide-react';

interface RenditionsProps {
  userData: UserData;
}

interface RenditionFormData {
  business_unit_id: string;
  date: string;
  total_sales: string;
  expenses: ExpenseFormData[];
  notes: string;
}

interface ExpenseFormData {
  description: string;
  amount: string;
  category: string;
}

const initialFormData: RenditionFormData = {
  business_unit_id: '',
  date: new Date().toISOString().split('T')[0],
  total_sales: '',
  expenses: [{ description: '', amount: '', category: 'other' }],
  notes: ''
};

const expenseCategories = [
  { value: 'maintenance', label: 'Mantención' },
  { value: 'supplies', label: 'Insumos' },
  { value: 'services', label: 'Servicios' },
  { value: 'transport', label: 'Transporte' },
  { value: 'food', label: 'Alimentación' },
  { value: 'other', label: 'Otros' }
];

export default function Renditions({ userData }: RenditionsProps) {
  const [renditions, setRenditions] = useState<MockRendition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedRendition, setSelectedRendition] = useState<MockRendition | null>(null);
  const [formData, setFormData] = useState<RenditionFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [dateFilter, setDateFilter] = useState('month');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessUnitFilter, setBusinessUnitFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar rendiciones
  useEffect(() => {
    const loadRenditions = async () => {
      try {
        setLoading(true);
        await simulateNetworkDelay(600);
        
        const allRenditions = demoData.getRenditions();
        setRenditions(allRenditions);
      } catch (error) {
        console.error('Error cargando rendiciones:', error);
        toast.error('Error al cargar rendiciones');
      } finally {
        setLoading(false);
      }
    };

    loadRenditions();
  }, []);

  // Obtener unidades de negocio
  const businessUnits = DEMO_COMPANIES[0]?.business_units || [];

  // Filtrar rendiciones
  const filteredRenditions = renditions.filter(rendition => {
    // Filtro por fecha
    const renditionDate = new Date(rendition.date);
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    let dateMatch = true;
    switch (dateFilter) {
      case 'week':
        dateMatch = renditionDate >= weekAgo;
        break;
      case 'month':
        dateMatch = renditionDate >= monthAgo;
        break;
      case 'quarter':
        dateMatch = renditionDate >= threeMonthsAgo;
        break;
    }

    // Filtro por estado
    const statusMatch = statusFilter === 'all' || rendition.status === statusFilter;

    // Filtro por unidad de negocio
    const unitMatch = businessUnitFilter === 'all' || rendition.business_unit_id === businessUnitFilter;

    // Filtro por búsqueda
    const searchMatch = searchTerm === '' || 
      rendition.business_unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rendition.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rendition.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    return dateMatch && statusMatch && unitMatch && searchMatch;
  });

  // Calcular estadísticas
  const stats = {
    total: filteredRenditions.length,
    approved: filteredRenditions.filter(r => r.status === 'approved').length,
    pending: filteredRenditions.filter(r => r.status === 'pending').length,
    rejected: filteredRenditions.filter(r => r.status === 'rejected').length,
    totalAmount: filteredRenditions.reduce((sum, r) => sum + r.final_amount, 0),
    totalSales: filteredRenditions.reduce((sum, r) => sum + r.total_sales, 0),
    totalExpenses: filteredRenditions.reduce((sum, r) => sum + r.total_expenses, 0)
  };

  // Manejar cambio en formulario
  const handleFormChange = (field: keyof RenditionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manejar cambio en gastos
  const handleExpenseChange = (index: number, field: keyof ExpenseFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.map((expense, i) => 
        i === index ? { ...expense, [field]: value } : expense
      )
    }));
  };

  // Agregar nuevo gasto
  const addExpense = () => {
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, { description: '', amount: '', category: 'other' }]
    }));
  };

  // Remover gasto
  const removeExpense = (index: number) => {
    if (formData.expenses.length > 1) {
      setFormData(prev => ({
        ...prev,
        expenses: prev.expenses.filter((_, i) => i !== index)
      }));
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    if (!formData.business_unit_id) {
      toast.error('Selecciona una unidad de negocio');
      return false;
    }

    if (!formData.date) {
      toast.error('Selecciona una fecha');
      return false;
    }

    const totalSales = parseFloat(formData.total_sales) || 0;
    if (totalSales <= 0) {
      toast.error('El total de ventas debe ser mayor a 0');
      return false;
    }

    const hasValidExpenses = formData.expenses.some(expense => 
      expense.description.trim() && parseFloat(expense.amount) > 0
    );

    if (!hasValidExpenses) {
      toast.error('Agrega al menos un gasto válido');
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
      await simulateNetworkDelay(1000);
      
      const businessUnit = businessUnits.find(unit => unit.id === formData.business_unit_id);
      
      // Filtrar gastos válidos
      const validExpenses = formData.expenses
        .filter(expense => expense.description.trim() && parseFloat(expense.amount) > 0)
        .map(expense => ({
          id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: expense.description.trim(),
          amount: parseFloat(expense.amount),
          category: expense.category,
          created_at: formData.date
        }));

      const totalExpenses = validExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalSales = parseFloat(formData.total_sales);
      
      const newRendition = demoData.addRendition({
        date: formData.date,
        business_unit_id: formData.business_unit_id,
        business_unit_name: businessUnit?.name || 'Unidad desconocida',
        total_sales: totalSales,
        total_expenses: totalExpenses,
        final_amount: totalSales - totalExpenses,
        status: 'pending',
        created_by: userData.id,
        created_by_name: userData.name,
        expenses: validExpenses,
        notes: formData.notes || undefined
      });
      
      setRenditions(prev => [newRendition, ...prev]);
      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      
      toast.success('Rendición registrada exitosamente', {
        description: `${businessUnit?.name} - $${newRendition.final_amount.toLocaleString()}`
      });
      
    } catch (error) {
      console.error('Error registrando rendición:', error);
      toast.error('Error al registrar la rendición');
    } finally {
      setSubmitting(false);
    }
  };

  // Ver detalle de rendición
  const handleViewDetail = (rendition: MockRendition) => {
    setSelectedRendition(rendition);
    setIsDetailDialogOpen(true);
  };

  // Actualizar estado de rendición
  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await simulateNetworkDelay(500);
      
      const updatedRendition = demoData.updateRendition(id, { status: newStatus });
      
      if (updatedRendition) {
        setRenditions(prev => prev.map(r => r.id === id ? updatedRendition : r));
        
        toast.success(`Rendición ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}`, {
          description: `${updatedRendition.business_unit_name} - $${updatedRendition.final_amount.toLocaleString()}`
        });
        
        // Agregar alerta al sistema
        demoData.addAlert({
          title: `🏪 Rendición ${newStatus === 'approved' ? 'Aprobada' : 'Rechazada'}`,
          message: `La rendición de ${updatedRendition.business_unit_name} del ${updatedRendition.date} ha sido ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}.`,
          type: newStatus === 'approved' ? 'success' : 'warning',
          business_unit_id: updatedRendition.business_unit_id,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  // Exportar datos
  const handleExport = () => {
    try {
      const exportData = filteredRenditions.map(rendition => ({
        Fecha: rendition.date,
        'Unidad de Negocio': rendition.business_unit_name,
        'Total Ventas': rendition.total_sales,
        'Total Gastos': rendition.total_expenses,
        'Monto Final': rendition.final_amount,
        Estado: rendition.status === 'approved' ? 'Aprobada' : 
               rendition.status === 'pending' ? 'Pendiente' : 'Rechazada',
        'Creado por': rendition.created_by_name,
        Notas: rendition.notes || ''
      }));

      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rendiciones_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Datos exportados', {
        description: 'El archivo CSV se ha descargado correctamente'
      });
    } catch (error) {
      console.error('Error exportando datos:', error);
      toast.error('Error al exportar los datos');
    }
  };

  // Obtener icono de estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Obtener badge de estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprobada</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold">Control de Rendiciones</h1>
          <p className="text-muted-foreground">
            Gestiona las rendiciones y gastos operacionales
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Rendición
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Rendición</DialogTitle>
                <DialogDescription>
                  Ingresa los detalles de ventas y gastos para la rendición
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
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
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="total_sales">Total de Ventas</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="total_sales"
                      type="number"
                      placeholder="0"
                      value={formData.total_sales}
                      onChange={(e) => handleFormChange('total_sales', e.target.value)}
                      className="pl-10"
                      min="1"
                      step="1"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Gastos Operacionales</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addExpense}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Gasto
                    </Button>
                  </div>
                  
                  {formData.expenses.map((expense, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5 space-y-2">
                        <Label className="text-sm">Descripción</Label>
                        <Input
                          placeholder="Descripción del gasto"
                          value={expense.description}
                          onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                        />
                      </div>
                      
                      <div className="col-span-3 space-y-2">
                        <Label className="text-sm">Categoría</Label>
                        <Select 
                          value={expense.category}
                          onValueChange={(value) => handleExpenseChange(index, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-3 space-y-2">
                        <Label className="text-sm">Monto</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-3 h-3 w-3 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0"
                            value={expense.amount}
                            onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                            className="pl-8"
                            min="0"
                            step="1"
                          />
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        {formData.expenses.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeExpense(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Resumen:</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Ventas:</span>
                        <div>${(parseFloat(formData.total_sales) || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="font-medium">Total Gastos:</span>
                        <div>${formData.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="font-medium">Monto Final:</span>
                        <div className="font-bold">
                          ${((parseFloat(formData.total_sales) || 0) - 
                             formData.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observaciones adicionales sobre la rendición"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={3}
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
                    {submitting ? 'Registrando...' : 'Registrar Rendición'}
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
            <CardTitle className="text-sm font-medium">Total Rendiciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSales > 0 ? Math.round((stats.totalExpenses / stats.totalSales) * 100) : 0}% de ventas
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
              <Label>Período</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
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
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobadas</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
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
                  placeholder="Buscar rendiciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de rendiciones */}
      <Card>
        <CardHeader>
          <CardTitle>Rendiciones Registradas</CardTitle>
          <CardDescription>
            {filteredRenditions.length} rendiciones encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRenditions.map((rendition) => (
              <div 
                key={rendition.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rendition.business_unit_name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {rendition.date}
                    </Badge>
                    {getStatusBadge(rendition.status)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Por {rendition.created_by_name} • {rendition.expenses.length} gastos
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Ventas:</span>
                      <div className="font-medium">${rendition.total_sales.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gastos:</span>
                      <div className="font-medium text-red-600">-${rendition.total_expenses.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Final:</span>
                      <div className={`font-bold ${rendition.final_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${rendition.final_amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {rendition.status === 'pending' && userData.role === 'admin' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusUpdate(rendition.id, 'approved')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusUpdate(rendition.id, 'rejected')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetail(rendition)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredRenditions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No hay rendiciones registradas</h3>
                <p className="text-sm">
                  {renditions.length === 0 
                    ? 'Comienza registrando tu primera rendición'
                    : 'Prueba ajustando los filtros de búsqueda'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalle de rendición */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Rendición</DialogTitle>
            <DialogDescription>
              Información completa de la rendición seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedRendition && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">ID:</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {selectedRendition.id.slice(-8)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Fecha:</span>
                    <span className="text-sm">{selectedRendition.date}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Unidad:</span>
                    <span className="text-sm">{selectedRendition.business_unit_name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Creado por:</span>
                    <span className="text-sm">{selectedRendition.created_by_name}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedRendition.status)}
                      {getStatusBadge(selectedRendition.status)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Ventas:</span>
                    <span className="text-sm font-bold text-green-600">
                      ${selectedRendition.total_sales.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Gastos:</span>
                    <span className="text-sm font-bold text-red-600">
                      -${selectedRendition.total_expenses.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Monto Final:</span>
                    <span className={`text-sm font-bold ${selectedRendition.final_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${selectedRendition.final_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Detalle de Gastos</h4>
                
                <div className="space-y-3">
                  {selectedRendition.expenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{expense.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {expenseCategories.find(cat => cat.value === expense.category)?.label || expense.category}
                        </div>
                      </div>
                      <div className="font-bold text-red-600">
                        -${expense.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedRendition.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Notas</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                      {selectedRendition.notes}
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex gap-3 pt-4">
                {selectedRendition.status === 'pending' && userData.role === 'admin' && (
                  <>
                    <Button 
                      onClick={() => {
                        handleStatusUpdate(selectedRendition.id, 'approved');
                        setIsDetailDialogOpen(false);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Aprobar
                    </Button>
                    <Button 
                      onClick={() => {
                        handleStatusUpdate(selectedRendition.id, 'rejected');
                        setIsDetailDialogOpen(false);
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  </>
                )}
                
                <Button 
                  onClick={() => setIsDetailDialogOpen(false)}
                  variant="outline"
                  className={selectedRendition.status === 'pending' && userData.role === 'admin' ? '' : 'flex-1'}
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