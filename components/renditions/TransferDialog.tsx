import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Plus } from 'lucide-react';

interface TransferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transferData: any;
  setTransferData: (data: any) => void;
  businessUnits: any[];
  error: string | null;
  formLoading: boolean;
  onCreateTransfer: () => void;
  userRole: string;
}

export function TransferDialog({
  isOpen,
  onOpenChange,
  transferData,
  setTransferData,
  businessUnits,
  error,
  formLoading,
  onCreateTransfer,
  userRole
}: TransferDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={userRole !== 'admin'}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Transferencia
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby="transfer-description">
        <DialogHeader>
          <DialogTitle>Nueva Transferencia Semanal</DialogTitle>
          <DialogDescription id="transfer-description">
            Crear una nueva transferencia de fondos hacia una unidad de negocio específica
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
            <Label htmlFor="to_business_unit">Unidad de Negocio Destino</Label>
            <Select
              value={transferData.to_business_unit_id}
              onValueChange={(value) => setTransferData({ ...transferData, to_business_unit_id: value })}
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
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
              placeholder="100000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="week_identifier">Identificador de Semana</Label>
            <Input
              id="week_identifier"
              value={transferData.week_identifier}
              onChange={(e) => setTransferData({ ...transferData, week_identifier: e.target.value })}
              placeholder="2024-W01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              placeholder="Notas adicionales sobre la transferencia..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onCreateTransfer} disabled={formLoading}>
              {formLoading ? 'Creando...' : 'Crear Transferencia'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}