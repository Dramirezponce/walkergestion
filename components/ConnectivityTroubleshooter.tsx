import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface ConnectivityTroubleshooterProps {
  onBack?: () => void;
  onFixed?: () => void;
}

export default function ConnectivityTroubleshooter({ onBack, onFixed }: ConnectivityTroubleshooterProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'pass' | 'fail' | 'testing';
    message: string;
  }>>([]);

  const runConnectivityTest = async () => {
    setIsTesting(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Conectividad General',
        test: () => navigator.onLine,
        passMessage: 'Conexión a internet disponible',
        failMessage: 'Sin conexión a internet'
      },
      {
        name: 'DNS Resolution',
        test: async () => {
          try {
            await fetch('https://www.google.com', { mode: 'no-cors' });
            return true;
          } catch {
            return false;
          }
        },
        passMessage: 'DNS funcionando correctamente',
        failMessage: 'Problemas de DNS detectados'
      },
      {
        name: 'Supabase Connectivity',
        test: async () => {
          try {
            const response = await fetch('https://supabase.com', { mode: 'no-cors' });
            return true;
          } catch {
            return false;
          }
        },
        passMessage: 'Supabase es accesible',
        failMessage: 'Supabase no es accesible'
      }
    ];

    for (const test of tests) {
      setTestResults(prev => [...prev, {
        name: test.name,
        status: 'testing',
        message: 'Verificando...'
      }]);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const passed = await test.test();
      
      setTestResults(prev => prev.map(result => 
        result.name === test.name ? {
          ...result,
          status: passed ? 'pass' : 'fail',
          message: passed ? test.passMessage : test.failMessage
        } : result
      ));
    }

    setIsTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Solucionador de Conectividad</h1>
            <p className="text-muted-foreground">Diagnostica y soluciona problemas de conexión</p>
          </div>
        </div>

        {/* Network Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {isOnline ? (
                <Wifi className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 mr-2 text-red-600" />
              )}
              Estado de Conectividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {isOnline ? 'Conectado a Internet' : 'Sin Conexión a Internet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Estado de la conexión de red del navegador
                </p>
              </div>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados de Pruebas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={runConnectivityTest}
            disabled={isTesting}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Verificando...' : 'Ejecutar Pruebas'}
          </Button>
          
          {onFixed && testResults.every(r => r.status === 'pass') && (
            <Button onClick={onFixed} variant="default">
              <CheckCircle className="h-4 w-4 mr-2" />
              Problema Solucionado
            </Button>
          )}
        </div>

        {/* Help Information */}
        <Card>
          <CardHeader>
            <CardTitle>Soluciones Comunes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Si no hay conexión a internet:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                  <li>Verifica tu conexión WiFi o datos móviles</li>
                  <li>Reinicia tu router o modem</li>
                  <li>Contacta a tu proveedor de internet</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium">Si hay problemas con Supabase:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                  <li>Verifica que no hay firewalls bloqueando la conexión</li>
                  <li>Intenta desde otra red (datos móviles)</li>
                  <li>Usa el acceso de emergencia en la pantalla de login</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}