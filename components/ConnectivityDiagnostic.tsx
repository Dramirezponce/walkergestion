import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { checkSupabaseConnection, checkBackendHealth, SUPABASE_CONFIG } from '../lib/supabase';

interface DiagnosticResult {
  name: string;
  status: 'checking' | 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

export default function ConnectivityDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const diagnosticTests = [
    {
      name: 'Configuración Básica',
      test: async () => {
        if (!SUPABASE_CONFIG.hasValidConfig) {
          return {
            status: 'error' as const,
            message: 'Configuración de Supabase incompleta',
            details: [
              `URL: ${SUPABASE_CONFIG.url || 'No configurada'}`,
              `Proyecto: ${SUPABASE_CONFIG.projectId || 'No configurado'}`
            ]
          };
        }
        return {
          status: 'success' as const,
          message: 'Configuración válida',
          details: [
            `URL: ${SUPABASE_CONFIG.url}`,
            `Proyecto: ${SUPABASE_CONFIG.projectId}`
          ]
        };
      }
    },
    {
      name: 'Conectividad Internet',
      test: async () => {
        try {
          const response = await fetch('https://httpbin.org/status/200', {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          });
          
          if (response.ok) {
            return {
              status: 'success' as const,
              message: 'Conexión a internet OK',
              details: ['Conectividad básica verificada']
            };
          } else {
            return {
              status: 'warning' as const,
              message: 'Problemas de conectividad',
              details: [`Status: ${response.status}`]
            };
          }
        } catch (error: any) {
          return {
            status: 'error' as const,
            message: 'Sin conexión a internet',
            details: [error.message]
          };
        }
      }
    },
    {
      name: 'Supabase Auth',
      test: async () => {
        const result = await checkSupabaseConnection();
        return {
          status: result.connected ? 'success' : 'error' as const,
          message: result.connected ? 'Conexión exitosa' : 'Error de conexión',
          details: result.error ? [result.error] : ['Auth API responde correctamente']
        };
      }
    },
    {
      name: 'Backend Edge Functions',
      test: async () => {
        const result = await checkBackendHealth();
        return {
          status: result.healthy ? 'success' : 'warning' as const,
          message: result.healthy ? 'Backend disponible' : 'Backend no disponible',
          details: result.error ? [result.error] : ['Edge Functions funcionando']
        };
      }
    }
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    for (const diagnostic of diagnosticTests) {
      // Mostrar estado "checking"
      setResults(prev => [...prev, {
        name: diagnostic.name,
        status: 'checking',
        message: 'Verificando...'
      }]);

      try {
        const result = await diagnostic.test();
        
        // Actualizar con resultado real
        setResults(prev => prev.map(r => 
          r.name === diagnostic.name 
            ? { ...r, ...result }
            : r
        ));
      } catch (error: any) {
        setResults(prev => prev.map(r => 
          r.name === diagnostic.name 
            ? {
                ...r,
                status: 'error',
                message: 'Error en diagnóstico',
                details: [error.message]
              }
            : r
        ));
      }

      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  useEffect(() => {
    // Ejecutar diagnóstico automáticamente al cargar
    runDiagnostics();
  }, []); // Solo ejecutar una vez al montar

  const successCount = results.filter(r => r.status === 'success').length;
  const totalTests = diagnosticTests.length;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🩺 Diagnóstico de Conectividad</span>
          {!isRunning && results.length > 0 && (
            <span className={`text-sm ${successCount === totalTests ? 'text-green-600' : 'text-yellow-600'}`}>
              ({successCount}/{totalTests} exitosos)
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Verificando conectividad y configuración del sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={result.name}
              className="flex items-start space-x-3 p-3 border rounded-lg"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(result.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{result.name}</p>
                  <span className={`text-xs ${getStatusColor(result.status)}`}>
                    {result.status === 'checking' ? 'Verificando...' : result.status}
                  </span>
                </div>
                <p className={`text-sm ${getStatusColor(result.status)}`}>
                  {result.message}
                </p>
                
                {result.details && result.details.length > 0 && (
                  <div className="mt-2">
                    {result.details.map((detail, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        • {detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isRunning && results.length > 0 && (
          <div className="pt-4 border-t">
            {successCount === totalTests ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  <strong>✅ Sistema Funcionando:</strong> Todos los componentes están operativos.
                  Si experimentas problemas, intenta recargar la página.
                </AlertDescription>
              </Alert>
            ) : successCount >= 2 ? (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  <strong>⚠️ Funcionalidad Limitada:</strong> Algunos componentes no están disponibles.
                  La aplicación puede funcionar con limitaciones.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <strong>❌ Problemas Críticos:</strong> Múltiples componentes fallan.
                  Verifica tu conexión a internet y configuración.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Diagnosticando...' : 'Ejecutar Nuevamente'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}