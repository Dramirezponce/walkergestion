import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { BusinessUnit, GoalFormData } from './types';

interface GoalConfigFormProps {
  show: boolean;
  onClose: () => void;
  businessUnits: BusinessUnit[];
  formData: GoalFormData;
  onFormChange: (data: Partial<GoalFormData>) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function GoalConfigForm({
  show,
  onClose,
  businessUnits,
  formData,
  onFormChange,
  onSubmit,
  loading
}: GoalConfigFormProps) {
  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Meta Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_unit">Unidad de Negocio *</Label>
              <Select 
                value={formData.business_unit_id} 
                onValueChange={(value) => onFormChange({ business_unit_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad de negocio" />
                </SelectTrigger>
                <SelectContent>
                  {businessUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="month_year">Mes</Label>
              <Input
                type="month"
                id="month_year"
                value={formData.month_year}
                onChange={(e) => onFormChange({ month_year: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_amount">Meta de Ventas *</Label>
              <Input
                type="number"
                id="target_amount"
                placeholder="3500000"
                value={formData.target_amount}
                onChange={(e) => onFormChange({ target_amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus_percentage">Porcentaje de Bono (%)*</Label>
              <Input
                type="number"
                step="0.1"
                id="bonus_percentage"
                placeholder="5.0"
                value={formData.bonus_percentage}
                onChange={(e) => onFormChange({ bonus_percentage: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent mr-2"></div>
                  Creando...
                </>
              ) : (
                'Configurar Meta'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}