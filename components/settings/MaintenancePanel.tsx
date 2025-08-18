import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Activity,
  TrendingUp,
  Users,
  Store,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { MAINTENANCE_ACTIONS } from './constants';
import { toast } from 'sonner';

interface Diagnostics {
  totalUsers: number;
  totalCompanies: number;
  totalBusinessUnits: number;
  totalSales: number;
  systemUptime: string;
  lastBackup: string;
}

interface MaintenancePanelProps {
  diagnostics: Diagnostics;
  saving: boolean;
  onMaintenanceAction: (action: 'backup' | 'restore' | 'cleanup') => void;
}

export default function MaintenancePanel({ 
  diagnostics, 
  saving, 
  onMaintenanceAction 
}: MaintenancePanelProps) {
  return (
    <div className="space-y-6">
      {/* Diagnóstico del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico del Sistema</CardTitle>
          <CardDescription>Información general sobre el estado y uso del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Usuarios</span>
              </div>
              <p className="text-2xl font-bold text-blue-800">{diagnostics.totalUsers}</p>
              <p className="text-sm text-blue-600">Usuarios registrados</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Store className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Empresas</span>
              </div>
              <p className="text-2xl font-bold text-green-800">{diagnostics.totalCompanies}</p>
              <p className="text-sm text-green-600">Empresas activas</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">Unidades</span>
              </div>
              <p className="text-2xl font-bold text-purple-800">{diagnostics.totalBusinessUnits}</p>
              <p className="text-sm text-purple-600">Unidades de negocio</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Ventas</span>
              </div>
              <p className="text-2xl font-bold text-yellow-800">{diagnostics.totalSales}</p>
              <p className="text-sm text-yellow-600">Registros de ventas</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="font-medium">Tiempo de Actividad</span>
              </div>
              <p className="text-xl font-bold">{diagnostics.systemUptime}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Último Backup</span>
              </div>
              <p className="text-xl font-bold">{diagnostics.lastBackup}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Herramientas de Mantenimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Herramientas de Mantenimiento</CardTitle>
          <CardDescription>Operaciones de mantenimiento y administración de datos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Backup de Datos</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Crear una copia de seguridad completa de todos los datos del sistema
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={saving}>
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Crear Backup
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Crear Backup</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se creará una copia de seguridad completa de todos los datos. Este proceso puede tomar varios minutos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onMaintenanceAction(MAINTENANCE_ACTIONS.BACKUP)}>
                      Crear Backup
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Restaurar Datos</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Restaurar el sistema desde un backup anterior
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={saving}>
                    <Upload className="h-4 w-4 mr-2" />
                    Restaurar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restaurar Sistema</AlertDialogTitle>
                    <AlertDialogDescription>
                      ⚠️ <strong>ADVERTENCIA:</strong> Esta operación reemplazará todos los datos actuales con el backup más reciente. 
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onMaintenanceAction(MAINTENANCE_ACTIONS.RESTORE)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Confirmar Restauración
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h4 className="font-medium">Limpieza de Datos</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Eliminar datos antiguos y optimizar la base de datos
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={saving}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Datos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpieza de Datos</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminarán registros antiguos, logs obsoletos y se optimizará la base de datos. 
                      Se recomienda crear un backup antes de continuar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onMaintenanceAction(MAINTENANCE_ACTIONS.CLEANUP)}>
                      Ejecutar Limpieza
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}