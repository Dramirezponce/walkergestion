import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { UserData } from '../types/app';
import { demoData, simulateNetworkDelay, MockBonus, DEMO_COMPANIES } from '../lib/demo-data';
import { toast } from 'sonner@2.0.3';
import { 
  Plus, 
  Gift, 
  Target, 
  TrendingUp,
  Calendar, 
  DollarSign, 
  Users,
  Building2,
  Filter,
  Search,
  Eye,
  Download,
  Award,
  Star,
  Trophy,
  CheckCircle2,
  Clock,
  Settings
} from 'lucide-react';

interface BonusesProps {
  userData: UserData;
}

interface GoalFormData {
  business_unit_id: string;
  month: string;
  monthly_goal: string;
  bonus_percentage: string;
}

interface BonusCalculation {
  business_unit_id: string;
  business_unit_name: string;
  month: string;
  monthly_goal: number;
  actual_sales: number;
  percentage_achieved: number;
  bonus_amount: number;
  qualifies: boolean;
}

const initialGoalForm: GoalFormData = {
  business_unit_id: '',
  month: new Date().toISOString().slice(0, 7),
  monthly_goal: '',
  bonus_percentage: '10'
};

export default function Bonuses({ userData }: BonusesProps) {
  const [bonuses, setBonuses] = useState<MockBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<MockBonus | null>(null);
  const [goalFormData, setGoalFormData] = useState<GoalFormData>(initialGoalForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('current');
  const [businessUnitFilter, setBusinessUnitFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar bonos
  useEffect(() => {
    const loadBonuses = async () => {
      try {
        setLoading(true);
        await simulateNetworkDelay(500);
        
        const allBonuses = demoData.getBonuses();
        setBonuses(allBonuses);
      } catch (error) {
        console.error('Error cargando bonos:', error);
        toast.error('Error al cargar bonos');
      } finally {
        setLoading(false);
      }
    };

    loadBonuses();
  }, []);

  // Obtener unidades de negocio
  const businessUnits = DEMO_COMPANIES[0]?.business_units || [];

  // Calcular performance actual del mes
  const currentPerformance = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const sales = demoData.getSales();
    const monthSales = sales.filter(s => s.date.startsWith(currentMonth));
    
    return businessUnits.map(unit => {
      const unitSales = monthSales.filter(s => s.business_unit_id === unit.id);
      const totalSales = unitSales.reduce((sum, s) => sum + s.amount, 0);
      const percentage = unit.monthly_goal > 0 ? (totalSales / unit.monthly_goal) * 100 : 0;
      
      return {
        business_unit_id: unit.id,
        business_unit_name: unit.name,
        month: currentMonth,
        monthly_goal: unit.monthly_goal,
        actual_sales: totalSales,
        percentage_achieved: Math.round(percentage),
        bonus_amount: totalSales > unit.monthly_goal ? Math.round((totalSales - unit.monthly_goal) * 0.1) : 0,
        qualifies: totalSales >= unit.monthly_goal
      } as BonusCalculation;
    });
  }, [businessUnits]);

  // Filtrar bonos
  const filteredBonuses = bonuses.filter(bonus => {
    // Filtro por estado
    const statusMatch = statusFilter === 'all' || bonus.status === statusFilter;

    // Filtro por mes
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);
    
    let monthMatch = true;
    switch (monthFilter) {
      case 'current':
        monthMatch = bonus.month === currentMonth;
        break;
      case 'last':
        monthMatch = bonus.month === lastMonthStr;
        break;
      case 'quarter':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        monthMatch = bonus.month >= threeMonthsAgo.toISOString().slice(0, 7);
        break;
    }

    // Filtro por unidad de negocio
    const unitMatch = businessUnitFilter === 'all' || bonus.business_unit_id === businessUnitFilter;

    // Filtro por búsqueda
    const searchMatch = searchTerm === '' || 
      bonus.business_unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bonus.user_name.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && monthMatch && unitMatch && searchMatch;
  });

  // Calcular estadísticas
  const stats = {
    total: bonuses.length,
    pending: bonuses.filter(b => b.status === 'pending').length,
    approved: bonuses.filter(b => b.status === 'approved').length,
    paid: bonuses.filter(b => b.status === 'paid').length,
    totalAmount: bonuses.reduce((sum, b) => sum + b.amount, 0),
    currentMonthQualified: currentPerformance.filter(p => p.qualifies).length,
    currentMonthTotal: currentPerformance.reduce((sum, p) => sum + p.bonus_amount, 0)
  };

  // Manejar cambio en formulario de metas
  const handleGoalFormChange = (field: keyof GoalFormData, value: string) => {
    setGoalFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calcular bono estimado
  const calculateEstimatedBonus = () => {
    const goal = parseFloat(goalFormData.monthly_goal) || 0;
    const percentage = parseFloat(goalFormData.bonus_percentage) || 0;
    const unit = businessUnits.find(u => u.id === goalFormData.business_unit_id);
    
    if (!unit || goal <= 0) return 0;
    
    const sales = demoData.getSales();
    const monthSales = sales.filter(s => 
      s.business_unit_id === unit.id && 
      s.date.startsWith(goalFormData.month)
    );
    const actualSales = monthSales.reduce((sum, s) => sum + s.amount, 0);
    
    return actualSales > goal ? Math.round((actualSales - goal) * (percentage / 100)) : 0;
  };

  // Validar formulario de metas
  const validateGoalForm = (): boolean => {
    if (!goalFormData.business_unit_id) {
      toast.error('Selecciona una unidad de negocio');
      return false;
    }

    if (!goalFormData.month) {
      toast.error('Selecciona un mes');
      return false;
    }

    const goal = parseFloat(goalFormData.monthly_goal);
    if (goal <= 0) {
      toast.error('La meta mensual debe ser mayor a 0');
      return false;
    }

    const bonusPercentage = parseFloat(goalFormData.bonus_percentage);
    if (bonusPercentage <= 0 || bonusPercentage > 50) {
      toast.error('El porcentaje de bono debe estar entre 1% y 50%');
      return false;
    }

    return true;
  };

  // Manejar envío del formulario de metas
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateGoalForm()) return;
    
    try {
      setSubmitting(true);
      await simulateNetworkDelay(800);
      
      const unit = businessUnits.find(u => u.id === goalFormData.business_unit_id);
      const estimatedBonus = calculateEstimatedBonus();
      
      if (estimatedBonus > 0) {
        // Crear bono si se califica
        const sales = demoData.getSales();
        const monthSales = sales.filter(s => 
          s.business_unit_id === goalFormData.business_unit_id && 
          s.date.startsWith(goalFormData.month)
        );
        const actualSales = monthSales.reduce((sum, s) => sum + s.amount, 0);
        const goal = parseFloat(goalFormData.monthly_goal);
        
        const newBonus: MockBonus = {
          id: `bonus-${goalFormData.business_unit_id}-${goalFormData.month}-${Date.now()}`,
          user_id: userData.id,
          user_name: `Equipo ${unit?.name}`,
          business_unit_id: goalFormData.business_unit_id,
          business_unit_name: unit?.name || 'Unidad desconocida',
          month: goalFormData.month,
          amount: estimatedBonus,
          percentage_achieved: Math.round((actualSales / goal) * 100),
          goal_amount: goal,
          actual_amount: actualSales,
          status: 'pending'
        };
        
        setBonuses(prev => [newBonus, ...prev]);
        
        toast.success('Bono calculado y registrado', {
          description: `$${estimatedBonus.toLocaleString()} para ${unit?.name}`
        });

        // Agregar alerta de bono
        demoData.addAlert({
          title: '🎉 Nuevo Bono Calculado',
          message: `Se ha calculado un bono de $${estimatedBonus.toLocaleString()} para ${unit?.name} por superar la meta mensual.`,
          type: 'success',
          business_unit_id: goalFormData.business_unit_id,
          created_at: new Date().toISOString(),
          read: false
        });
      } else {
        toast.info('Meta no alcanzada', {
          description: `${unit?.name} no califica para bono este mes`
        });
      }
      
      setGoalFormData(initialGoalForm);
      setIsGoalDialogOpen(false);
      
    } catch (error) {
      console.error('Error calculando bono:', error);
      toast.error('Error al calcular el bono');
    } finally {
      setSubmitting(false);
    }
  };

  // Ver detalle de bono
  const handleViewDetail = (bonus: MockBonus) => {
    setSelectedBonus(bonus);
    setIsDetailDialogOpen(true);
  };

  // Aprobar bono
  const handleApproveBonus = async (id: string) => {
    try {
      await simulateNetworkDelay(400);
      
      setBonuses(prev => prev.map(bonus => 
        bonus.id === id ? { ...bonus, status: 'approved' } : bonus
      ));
      
      const bonus = bonuses.find(b => b.id === id);
      if (bonus) {
        toast.success('Bono aprobado', {
          description: `$${bonus.amount.toLocaleString()} para ${bonus.business_unit_name}`
        });

        // Agregar alerta
        demoData.addAlert({
          title: '✅ Bono Aprobado',
          message: `El bono de $${bonus.amount.toLocaleString()} para ${bonus.business_unit_name} ha sido aprobado.`,
          type: 'success',
          business_unit_id: bonus.business_unit_id,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error('Error aprobando bono:', error);
      toast.error('Error al aprobar el bono');
    }
  };

  // Marcar como pagado
  const handleMarkAsPaid = async (id: string) => {
    try {
      await simulateNetworkDelay(400);
      
      setBonuses(prev => prev.map(bonus => 
        bonus.id === id ? { ...bonus, status: 'paid' } : bonus
      ));
      
      const bonus = bonuses.find(b => b.id === id);
      if (bonus) {
        toast.success('Bono marcado como pagado', {
          description: `$${bonus.amount.toLocaleString()} para ${bonus.business_unit_name}`
        });
      }
    } catch (error) {
      console.error('Error marcando como pagado:', error);
      toast.error('Error al marcar como pagado');
    }
  };

  // Exportar datos
  const handleExport = () => {
    try {
      const exportData = filteredBonuses.map(bonus => ({
        Mes: bonus.month,
        'Unidad de Negocio': bonus.business_unit_name,
        Equipo: bonus.user_name,
        'Meta ($)': bonus.goal_amount,
        'Ventas Reales ($)': bonus.actual_amount,
        'Porcentaje Logrado (%)': bonus.percentage_achieved,
        'Monto Bono ($)': bonus.amount,
        Estado: bonus.status === 'pending' ? 'Pendiente' :
               bonus.status === 'approved' ? 'Aprobado' : 'Pagado'
      }));

      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `bonos_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Bonos exportados', {
        description: 'El archivo CSV se ha descargado correctamente'
      });
    } catch (error) {
      console.error('Error exportando bonos:', error);
      toast.error('Error al exportar los bonos');
    }
  };

  // Obtener badge de estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Aprobado</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pagado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  // Obtener icono de estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return <Gift className="h-4 w-4 text-gray-600" />;
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
          <h1 className="text-3xl font-bold">Sistema de Bonos</h1>
          <p className="text-muted-foreground">
            Gestiona bonos por cumplimiento de metas mensuales
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          
          <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Calcular Bono
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Calcular Bono por Meta</DialogTitle>
                <DialogDescription>
                  Calcula el bono basado en el cumplimiento de metas mensuales
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business_unit">Unidad de Negocio</Label>
                  <Select 
                    value={goalFormData.business_unit_id} 
                    onValueChange={(value) => handleGoalFormChange('business_unit_id', value)}
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
                  <Label htmlFor="month">Mes</Label>
                  <Input
                    id="month"
                    type="month"
                    value={goalFormData.month}
                    onChange={(e) => handleGoalFormChange('month', e.target.value)}
                    max={new Date().toISOString().slice(0, 7)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthly_goal">Meta Mensual</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="monthly_goal"
                      type="number"
                      placeholder="0"
                      value={goalFormData.monthly_goal}
                      onChange={(e) => handleGoalFormChange('monthly_goal', e.target.value)}
                      className="pl-10"
                      min="1"
                      step="1000"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bonus_percentage">Porcentaje de Bono (%)</Label>
                  <Input
                    id="bonus_percentage"
                    type="number"
                    placeholder="10"
                    value={goalFormData.bonus_percentage}
                    onChange={(e) => handleGoalFormChange('bonus_percentage', e.target.value)}
                    min="1"
                    max="50"
                    step="0.1"
                  />
                </div>
                
                {goalFormData.business_unit_id && goalFormData.monthly_goal && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">Estimación de Bono</h4>
                    <div className="text-2xl font-bold text-green-600">
                      ${calculateEstimatedBonus().toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Basado en ventas actuales del mes seleccionado
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsGoalDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Calculando...' : 'Calcular Bono'}
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
            <CardTitle className="text-sm font-medium">Total Bonos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Por aprobar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              Completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentMonthQualified}</div>
            <p className="text-xs text-muted-foreground">
              Unidades calificadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance actual del mes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance del Mes Actual
          </CardTitle>
          <CardDescription>
            Progreso hacia las metas mensuales de cada unidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentPerformance.map((performance) => (
              <div key={performance.business_unit_id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{performance.business_unit_name}</h4>
                    <div className="text-sm text-muted-foreground">
                      ${performance.actual_sales.toLocaleString()} / ${performance.monthly_goal.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={performance.qualifies ? "default" : "secondary"}>
                        {performance.percentage_achieved}%
                      </Badge>
                      {performance.qualifies && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Trophy className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            +${performance.bonus_amount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={Math.min(performance.percentage_achieved, 100)} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobados</SelectItem>
                  <SelectItem value="paid">Pagados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mes actual</SelectItem>
                  <SelectItem value="last">Mes pasado</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
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
                  placeholder="Buscar bonos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de bonos */}
      <Card>
        <CardHeader>
          <CardTitle>Bonos Registrados</CardTitle>
          <CardDescription>
            {filteredBonuses.length} bonos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredBonuses.map((bonus) => (
              <div 
                key={bonus.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 bg-primary/10 rounded-full">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{bonus.business_unit_name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {bonus.month}
                    </Badge>
                    {getStatusBadge(bonus.status)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {bonus.user_name} • {bonus.percentage_achieved}% de cumplimiento
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Meta:</span>
                      <div className="font-medium">${bonus.goal_amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ventas:</span>
                      <div className="font-medium text-green-600">${bonus.actual_amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bono:</span>
                      <div className="font-bold text-primary">${bonus.amount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {bonus.status === 'pending' && userData.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApproveBonus(bonus.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {bonus.status === 'approved' && userData.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsPaid(bonus.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetail(bonus)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredBonuses.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No hay bonos registrados</h3>
                <p className="text-sm">
                  {bonuses.length === 0 
                    ? 'Comienza calculando bonos por metas cumplidas'
                    : 'Prueba ajustando los filtros de búsqueda'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalle de bono */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Bono</DialogTitle>
            <DialogDescription>
              Información completa del bono seleccionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedBonus && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                
                <div>
                  <h3 className="font-bold text-2xl">${selectedBonus.amount.toLocaleString()}</h3>
                  <p className="text-muted-foreground">Bono por cumplimiento de meta</p>
                </div>
                
                {getStatusBadge(selectedBonus.status)}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Mes:</span>
                    <div className="text-muted-foreground">{selectedBonus.month}</div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Unidad:</span>
                    <div className="text-muted-foreground">{selectedBonus.business_unit_name}</div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Equipo:</span>
                    <div className="text-muted-foreground">{selectedBonus.user_name}</div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Cumplimiento:</span>
                    <div className="text-muted-foreground">{selectedBonus.percentage_achieved}%</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium">Detalle de Performance</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Meta Mensual:</span>
                      <span className="font-medium">${selectedBonus.goal_amount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Ventas Reales:</span>
                      <span className="font-medium text-green-600">${selectedBonus.actual_amount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Exceso sobre Meta:</span>
                      <span className="font-medium">${(selectedBonus.actual_amount - selectedBonus.goal_amount).toLocaleString()}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-primary font-bold">
                      <span>Bono Calculado:</span>
                      <span>${selectedBonus.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={Math.min(selectedBonus.percentage_achieved, 100)} 
                  className="h-3"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                {selectedBonus.status === 'pending' && userData.role === 'admin' && (
                  <Button 
                    onClick={() => {
                      handleApproveBonus(selectedBonus.id);
                      setIsDetailDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprobar Bono
                  </Button>
                )}
                
                {selectedBonus.status === 'approved' && userData.role === 'admin' && (
                  <Button 
                    onClick={() => {
                      handleMarkAsPaid(selectedBonus.id);
                      setIsDetailDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Marcar como Pagado
                  </Button>
                )}
                
                <Button 
                  onClick={() => setIsDetailDialogOpen(false)}
                  variant="outline"
                  className={selectedBonus.status === 'pending' && userData.role === 'admin' ? '' : 'flex-1'}
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