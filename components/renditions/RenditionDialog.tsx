import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Plus, FileText } from 'lucide-react';

interface RenditionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  businessUnits: any[];
  transfers: any[];
  availableTransfers: any[];
  error: string | null;
  formLoading: boolean;
  expenses: any[];
  setExpenses: (expenses: any[]) => void;
  expenseData: any;
  setExpenseData: (data: any) => void;
  isExpenseDialogOpen: boolean;
  setIsExpenseDialogOpen: (open: boolean) => void;
  onCreateRendition: () => void;
  onAddExpense: () => void;
  onRemoveExpense: (index: number) => void;
  userRole: string;
}

export function RenditionDialog({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  businessUnits,
  transfers,
  availableTransfers,
  error,
  formLoading,
  expenses,
  onCreateRendition,
  userRole
}: RenditionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Nueva Rendición
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby="rendition-description">
        <DialogHeader>
          <DialogTitle>Nueva Rendición</DialogTitle>
          <DialogDescription id="rendition-description">
            Crear una nueva rendición de gastos para una transferencia semanal
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="transfer_id">Transferencia</Label>
            <Select
              value={formData.transfer_id}
              onValueChange={(value) => {
                const transfer = transfers.find(t => t.id === value);
                setFormData({ 
                  ...formData, 
                  transfer_id: value,
                  transfer_amount: transfer ? transfer.amount.toString() : '',
                  week_identifier: transfer ? transfer.week_identifier : ''
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar transferencia" />
              </SelectTrigger>
              <SelectContent>
                {availableTransfers.map((transfer) => (
                  <SelectItem key={transfer.id} value={transfer.id}>
                    {transfer.week_identifier} - ${transfer.amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_unit_id">Unidad de Negocio</Label>
            <Select
              value={formData.business_unit_id}
              onValueChange={(value) => setFormData({ ...formData, business_unit_id: value })}
              disabled={userRole === 'cashier'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar unidad" />
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
            <Label htmlFor="transfer_amount">Monto de Transferencia</Label>
            <Input
              id="transfer_amount"
              type="number"
              value={formData.transfer_amount}
              onChange={(e) => setFormData({ ...formData, transfer_amount: e.target.value })}
              placeholder="100000"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas sobre la rendición..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onCreateRendition} disabled={formLoading}>
              {formLoading ? 'Creando...' : 'Crear Rendición'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}