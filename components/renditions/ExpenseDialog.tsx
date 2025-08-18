import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus } from 'lucide-react';
import { PROVIDER_TYPES, PAYMENT_METHODS, DOCUMENT_TYPES } from './constants';
import type { ExpenseFormData } from './types';

interface ExpenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expenseData: ExpenseFormData;
  setExpenseData: (data: ExpenseFormData | ((prev: ExpenseFormData) => ExpenseFormData)) => void;
  onAddExpense: () => void;
}

export function ExpenseDialog({
  isOpen,
  onOpenChange,
  expenseData,
  setExpenseData,
  onAddExpense
}: ExpenseDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Gasto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
          <DialogDescription>
            Registra un gasto realizado con los fondos de la transferencia semanal
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descripción *</Label>
              <Input
                id="description"
                value={expenseData.description}
                onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del gasto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expense_amount">Monto *</Label>
              <Input
                id="expense_amount"
                type="number"
                min="0"
                step="0.01"
                value={expenseData.amount}
                onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expense_date">Fecha *</Label>
              <Input
                id="expense_date"
                type="date"
                value={expenseData.expense_date}
                onChange={(e) => setExpenseData(prev => ({ ...prev, expense_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="provider">Proveedor *</Label>
              <Input
                id="provider"
                value={expenseData.provider}
                onChange={(e) => setExpenseData(prev => ({ ...prev, provider: e.target.value }))}
                placeholder="Nombre del proveedor"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="provider_type">Tipo de Proveedor</Label>
              <Select 
                value={expenseData.provider_type} 
                onValueChange={(value) => setExpenseData(prev => ({ ...prev, provider_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pago</Label>
              <Select 
                value={expenseData.payment_method} 
                onValueChange={(value) => setExpenseData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document_type">Tipo de Documento</Label>
              <Select 
                value={expenseData.document_type} 
                onValueChange={(value: 'boleta' | 'factura') => setExpenseData(prev => ({ ...prev, document_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_number">Número de Documento</Label>
              <Input
                id="document_number"
                value={expenseData.document_number}
                onChange={(e) => setExpenseData(prev => ({ ...prev, document_number: e.target.value }))}
                placeholder="123456"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onAddExpense}>
            Agregar Gasto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}