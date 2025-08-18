import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Database, 
  Wifi, 
  Server,
  Activity,
  Clock
} from 'lucide-react';
import { verifySystemHealth, SUPABASE_CONFIG } from '../lib/supabase';

export default function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const health = await verifySystemHealth();
      setDiagnostics(health);
      setLastCheck(new Date());
    } catch (error) {
      console.error('❌ Error ejecutando diagnósticos:', error);
      setDiagnostics({ 
        ready: false, 
        errors: ['Error ejecutando diagnóstico del sistema'] 
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-600" />
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Diagnóstico del Sistema</h1>
          <p className="text-muted-foreground">
            Estado completo de WalkerGestión
          </p>
        </div>
        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Verificando...' : 'Ejecutar Diagnóstico'}
        </Button>
      </div>

      {lastCheck && (
        <div className="text-sm text-muted-foreground flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Última verificación: {lastCheck.toLocaleString()}
        </div>
      )}

      {diagnostics && (
        <div className="space-y-4">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Estado General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics.ready)}
                <div>
                  <p className="font-semibold">
                    {diagnostics.ready ? 'Sistema Operativo' : 'Sistema con Problemas'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {diagnostics.ready ? 
                      'Todos los componentes están funcionando correctamente' :
                      'Se detectaron problemas que requieren atención'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component Status */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Wifi className="h-4 w-4 mr-2" />
                  Conectividad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(diagnostics.connectivity)}
                  <span className="font-medium">
                    {diagnostics.connectivity ? 'Conectado' : 'Sin conexión'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Database className="h-4 w-4 mr-2" />
                  Base de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(diagnostics.database)}
                  <span className="font-medium">
                    {diagnostics.database ? 'Operativa' : 'Error'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Server className="h-4 w-4 mr-2" />
                  Backend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(diagnostics.backend)}
                  <span className="font-medium">
                    {diagnostics.backend ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">URL de Supabase</p>
                  <p className="font-mono text-sm">{SUPABASE_CONFIG.url}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project ID</p>
                  <p className="font-mono text-sm">{SUPABASE_CONFIG.projectId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {diagnostics.errors && diagnostics.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Errores detectados:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {diagnostics.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}