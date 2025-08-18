import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, X, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { getStatusColor, formatDateTime } from './utils';

interface SystemStatus {
  connectivity: boolean;
  database: boolean;
  backend: boolean;
  overall: 'healthy' | 'warning' | 'error';
  lastCheck: string;
}

interface SystemStatusCardProps {
  systemStatus: SystemStatus;
  systemErrors: string[];
  statusLoading: boolean;
  onCheckStatus: () => void;
  onRetrySystem?: () => void;
}

export default function SystemStatusCard({ 
  systemStatus, 
  systemErrors, 
  statusLoading, 
  onCheckStatus,
  onRetrySystem 
}: SystemStatusCardProps) {
  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card className="border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-green-900">Estado del Sistema</CardTitle>
            <CardDescription>Monitoreo de conectividad y servicios</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCheckStatus}
            disabled={statusLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus.connectivity)}
              <span>Conectividad</span>
            </div>
            <Badge className={systemStatus.connectivity ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {systemStatus.connectivity ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus.database)}
              <span>Base de Datos</span>
            </div>
            <Badge className={systemStatus.database ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {systemStatus.database ? 'Operativa' : 'Error'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus.backend)}
              <span>Backend</span>
            </div>
            <Badge className={systemStatus.backend ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {systemStatus.backend ? 'Disponible' : 'No disponible'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`h-5 w-5 ${getStatusColor(systemStatus.overall)}`} />
            <span className={`font-medium ${getStatusColor(systemStatus.overall)}`}>
              Estado General: {systemStatus.overall === 'healthy' ? 'Saludable' : systemStatus.overall === 'warning' ? 'Advertencias' : 'Errores'}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Última verificación: {formatDateTime(systemStatus.lastCheck)}
          </span>
        </div>

        {systemErrors.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50 mt-4">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Advertencias del sistema:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {systemErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
              {onRetrySystem && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetrySystem}
                  className="mt-3"
                >
                  Verificar Sistema
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}