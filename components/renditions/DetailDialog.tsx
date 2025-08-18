import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface DetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  rendition: any;
  businessUnits: any[];
}

export function DetailDialog({
  isOpen,
  onOpenChange,
  rendition,
  businessUnits
}: DetailDialogProps) {
  const getBusinessUnitName = (id: string) => {
    const unit = businessUnits.find(u => u.id === id);
    return unit ? unit.name : `Unidad ${id}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Borrador', class: 'bg-gray-100 text-gray-800' },
      submitted: { label: 'Enviada', class: 'bg-blue-100 text-blue-800' },
      approved: { label: 'Aprobada', class: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rechazada', class: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    
    return (
      <Badge className={statusInfo.class}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="detail-description">
        <DialogHeader>
          <DialogTitle>Detalle de Rendición</DialogTitle>
          <DialogDescription id="detail-description">
            Información detallada de la rendición seleccionada
          </DialogDescription>
        </DialogHeader>
        
        {rendition && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Semana</label>
                <p className="font-semibold">{rendition.week_identifier}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Estado</label>
                <div className="mt-1">
                  {getStatusBadge(rendition.status)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Unidad de Negocio</label>
              <p className="font-semibold">{getBusinessUnitName(rendition.business_unit_id)}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Monto Transferido</label>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(rendition.transfer_amount)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Gastos</label>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(rendition.total_expenses || 0)}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Monto Restante</label>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(rendition.remaining_amount || (rendition.transfer_amount - (rendition.total_expenses || 0)))}
              </p>
            </div>

            {rendition.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas</label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded">{rendition.notes}</p>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}