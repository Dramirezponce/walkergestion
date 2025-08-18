import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Signal, 
  SignalHigh,
  SignalMedium,
  SignalLow,
  Info,
  Zap
} from 'lucide-react';
import { useNetworkConnectivity } from '../hooks/useNetworkConnectivity';
import { toast } from 'sonner@2.0.3';

interface NetworkIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
}

export default function NetworkIndicator({ showDetails = false, compact = false }: NetworkIndicatorProps) {
  const { networkStatus, forceReconnect, getDetailedDiagnosis, isHealthy } = useNetworkConnectivity();
  const [showDetailedDiag, setShowDetailedDiag] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const [isRunningDiagnosis, setIsRunningDiagnosis] = useState(false);

  const getStatusDisplay = () => {
    if (networkStatus.isReconnecting) {
      return {
        icon: <RefreshCw className="h-3 w-3 animate-spin" />,
        text: 'Reconectando...',
        variant: 'secondary' as const,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        description: `Intento ${networkStatus.reconnectAttempts}`
      };
    }

    if (!networkStatus.isOnline) {
      return {
        icon: <WifiOff className="h-3 w-3" />,
        text: 'Sin Internet',
        variant: 'destructive' as const,
        color: 'text-red-600 bg-red-50 border-red-200',
        description: 'Sin conexión a internet'
      };
    }

    if (!networkStatus.isSupabaseReachable) {
      return {
        icon: <AlertTriangle className="h-3 w-3" />,
        text: 'Servidor No Disponible',
        variant: 'destructive' as const,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        description: 'No se puede conectar a WalkerGestión'
      };
    }

    // Conexión OK - mostrar calidad
    const qualityIcons = {
      excellent: <Signal className="h-3 w-3" />,
      good: <SignalHigh className="h-3 w-3" />,
      poor: <SignalMedium className="h-3 w-3" />,
      offline: <SignalLow className="h-3 w-3" />
    };

    const qualityColors = {
      excellent: 'text-green-600 bg-green-50 border-green-200',
      good: 'text-green-500 bg-green-50 border-green-200',
      poor: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      offline: 'text-red-600 bg-red-50 border-red-200'
    };

    const qualityTexts = {
      excellent: 'Excelente',
      good: 'Buena',
      poor: 'Lenta',
      offline: 'Offline'
    };

    return {
      icon: qualityIcons[networkStatus.connectionQuality],
      text: `Conexión ${qualityTexts[networkStatus.connectionQuality]}`,
      variant: networkStatus.connectionQuality === 'poor' ? 'secondary' : 'secondary' as const,
      color: qualityColors[networkStatus.connectionQuality],
      description: `Última verificación: ${networkStatus.lastConnected?.toLocaleTimeString() || 'Nunca'}`
    };
  };

  const handleReconnect = async () => {
    toast.info('Intentando reconectar...', { duration: 2000 });
    await forceReconnect();
  };

  const handleDetailedDiagnosis = async () => {
    setIsRunningDiagnosis(true);
    try {
      const diagnosis = await getDetailedDiagnosis();
      setDiagnosisData(diagnosis);
      setShowDetailedDiag(true);
    } catch (error) {
      toast.error('Error ejecutando diagnóstico');
    } finally {
      setIsRunningDiagnosis(false);
    }
  };

  const status = getStatusDisplay();

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <Badge 
          variant={status.variant}
          className={`${status.color} flex items-center space-x-1 text-xs`}
        >
          {status.icon}
        </Badge>
        {!isHealthy && (
          <Button
            onClick={handleReconnect}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            disabled={networkStatus.isReconnecting}
          >
            <RefreshCw className={`h-3 w-3 ${networkStatus.isReconnecting ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant={status.variant}
        className={`${status.color} flex items-center space-x-1`}
      >
        {status.icon}
        <span className="text-xs">{status.text}</span>
      </Badge>

      {showDetails && (
        <div className="flex items-center space-x-1">
          <Dialog open={showDetailedDiag} onOpenChange={setShowDetailedDiag}>
            <DialogTrigger asChild>
              <Button
                onClick={handleDetailedDiagnosis}
                size="sm"
                variant="ghost"
                disabled={isRunningDiagnosis}
                className="text-xs"
              >
                {isRunningDiagnosis ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Info className="h-3 w-3 mr-1" />
                )}
                Diagnóstico
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl" aria-describedby="connectivity-diagnosis-description">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>Diagnóstico de Conectividad</span>
                </DialogTitle>
              </DialogHeader>
              <div id="connectivity-diagnosis-description" className="sr-only">
                Diagnóstico detallado del estado de conectividad de WalkerGestión incluyendo tests de red y recomendaciones.
              </div>
              
              <div className="space-y-4">
                {diagnosisData && (
                  <>
                    {/* Estado actual */}
                    <Alert className={isHealthy ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      {isHealthy ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={isHealthy ? "text-green-800" : "text-red-800"}>
                        <div className="font-medium">
                          {isHealthy ? "✅ Sistema Conectado" : "❌ Problemas de Conectividad"}
                        </div>
                        <div className="text-sm mt-1">
                          {status.description}
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* Información del navegador */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Información del Navegador</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <div><strong>Estado:</strong> {diagnosisData.browser.onLine ? '🟢 Online' : '🔴 Offline'}</div>
                        <div><strong>Idioma:</strong> {diagnosisData.browser.language}</div>
                        <div><strong>Cookies:</strong> {diagnosisData.browser.cookieEnabled ? '✅' : '❌'}</div>
                        {diagnosisData.network.effectiveType !== 'unknown' && (
                          <div><strong>Tipo de Red:</strong> {diagnosisData.network.effectiveType}</div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Resultados de tests */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Tests de Conectividad</CardTitle>
                        <CardDescription className="text-xs">
                          Ejecutado: {diagnosisData.timestamp.toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {diagnosisData.tests.map((test: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center space-x-2">
                                {test.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="font-medium text-sm">{test.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {test.duration}ms
                                {test.error && (
                                  <div className="text-red-600 mt-1">{test.error}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Acciones recomendadas */}
                    {!isHealthy && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <div className="font-medium mb-2">Soluciones Recomendadas:</div>
                          <ul className="text-sm list-disc list-inside space-y-1">
                            {!networkStatus.isOnline && (
                              <>
                                <li>Verificar conexión a Internet (Wi-Fi/datos móviles)</li>
                                <li>Reiniciar router/modem si es necesario</li>
                                <li>Desactivar VPN temporalmente</li>
                              </>
                            )}
                            {networkStatus.isOnline && !networkStatus.isSupabaseReachable && (
                              <>
                                <li>Verificar que no haya bloqueo de firewall</li>
                                <li>Probar desde otra red (datos móviles)</li>
                                <li>Contactar soporte técnico</li>
                              </>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
                
                <div className="flex justify-between">
                  <Button
                    onClick={handleDetailedDiagnosis}
                    variant="outline"
                    size="sm"
                    disabled={isRunningDiagnosis}
                  >
                    {isRunningDiagnosis ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Actualizar Diagnóstico
                  </Button>
                  
                  <Button
                    onClick={handleReconnect}
                    size="sm"
                    disabled={networkStatus.isReconnecting}
                  >
                    {networkStatus.isReconnecting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Forzar Reconexión
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {!isHealthy && (
            <Button
              onClick={handleReconnect}
              size="sm"
              variant="outline"
              disabled={networkStatus.isReconnecting}
              className="text-xs"
            >
              {networkStatus.isReconnecting ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Reconectar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}