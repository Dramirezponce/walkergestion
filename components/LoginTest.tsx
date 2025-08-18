import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Play, 
  RefreshCw,
  User,
  Shield,
  Building
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../hooks/useAuth';

export default function LoginTest() {
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'idle' | 'running' | 'success' | 'error';
    message: string;
  }>>([
    { name: 'Conexión Sistema', status: 'idle', message: 'No ejecutado' },
    { name: 'Función Login', status: 'idle', message: 'No ejecutado' },
    { name: 'Login Daniel', status: 'idle', message: 'No ejecutado' },
    { name: 'Perfil Cargado', status: 'idle', message: 'No ejecutado' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const { signIn } = useAuth();

  const updateTestResult = (index: number, status: typeof testResults[0]['status'], message: string) => {
    setTestResults(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message } : test
    ));
  };

  const runFullTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    console.log('🧪 === INICIANDO TEST COMPLETO DE LOGIN ===');

    try {
      // Test 1: Conexión del sistema
      updateTestResult(0, 'running', 'Verificando...');
      
      try {
        const response = await fetch('https://boyhheuwgtyeevijxhzb.supabase.co/rest/v1/', { 
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWhoZXV3Z3R5ZWV2aWp4aHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTAyNTYsImV4cCI6MjA2OTU4NjI1Nn0.GJRf8cWJmFCZi_m0n7ubLUfwm0g6smuiyz_RMtmXcbY'
          }
        });
        
        if (response.ok) {
          updateTestResult(0, 'success', 'Conexión estable');
        } else {
          updateTestResult(0, 'error', `HTTP ${response.status}`);
          return;
        }
      } catch (error) {
        updateTestResult(0, 'error', 'Sin internet');
        return;
      }

      // Test 2: Función de login disponible
      updateTestResult(1, 'running', 'Verificando...');
      
      if (typeof signIn === 'function') {
        updateTestResult(1, 'success', 'Función disponible');
      } else {
        updateTestResult(1, 'error', 'Función no encontrada');
        return;
      }

      // Test 3: Login de Daniel
      updateTestResult(2, 'running', 'Autenticando...');
      
      try {
        console.log('🔐 Intentando login con Daniel...');
        
        const result = await signIn('d.ramirez.ponce@gmail.com', 'admin123');
        
        if (result) {
          updateTestResult(2, 'success', 'Login exitoso');
          
          // Test 4: Verificar perfil
          updateTestResult(3, 'running', 'Verificando perfil...');
          
          // Esperar un poco para que se cargue el perfil
          setTimeout(() => {
            if (result.user) {
              updateTestResult(3, 'success', `Usuario: ${result.user.email}`);
              toast.success('¡Test completado!', {
                description: 'Daniel puede acceder al sistema correctamente',
                duration: 5000
              });
            } else {
              updateTestResult(3, 'error', 'Perfil no cargado');
            }
          }, 1000);
          
        } else {
          updateTestResult(2, 'error', 'Login falló');
          updateTestResult(3, 'error', 'No hay usuario');
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        updateTestResult(2, 'error', errorMessage);
        updateTestResult(3, 'error', 'Sin perfil');
      }

    } catch (error) {
      console.error('❌ Error en test completo:', error);
      toast.error('Error en test', {
        description: 'Hubo un error ejecutando el test completo'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const resetTest = () => {
    setTestResults(prev => prev.map(test => ({ 
      ...test, 
      status: 'idle' as const, 
      message: 'No ejecutado' 
    })));
  };

  const getStatusIcon = (status: typeof testResults[0]['status']) => {
    switch (status) {
      case 'idle':
        return <div className="w-4 h-4 rounded-full bg-gray-300"></div>;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: typeof testResults[0]['status']) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-50 border-gray-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  const allPassed = testResults.every(test => test.status === 'success');
  const hasErrors = testResults.some(test => test.status === 'error');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">Test de Login WalkerGestión</h1>
          <p className="text-muted-foreground">
            Verificación completa del sistema de autenticación para Daniel Ramírez
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resultados de tests */}
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        test.status === 'success' ? 'default' : 
                        test.status === 'error' ? 'destructive' : 
                        test.status === 'running' ? 'secondary' : 'outline'
                      }
                    >
                      {test.status === 'idle' ? 'Pendiente' : 
                       test.status === 'running' ? 'Ejecutando' :
                       test.status === 'success' ? 'Exitoso' : 'Error'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Estado general */}
            {allPassed && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-medium">✅ Sistema completamente funcional</p>
                    <p className="text-sm">Daniel puede acceder al sistema sin problemas. El login simulado está funcionando correctamente.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {hasErrors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">❌ Problemas detectados</p>
                    <p className="text-sm">Hay errores en el sistema que deben solucionarse antes de que Daniel pueda acceder.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={runFullTest}
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Ejecutando Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Ejecutar Test Completo
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetTest}
                variant="outline"
                disabled={isRunning}
              >
                Reiniciar
              </Button>
            </div>

            {/* Información adicional */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Usuario: Daniel Ramírez</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rol: Administrador</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Email: d.ramirez.ponce@gmail.com • Contraseña: admin123
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            size="sm"
          >
            Volver al Login Principal
          </Button>
        </div>
      </div>
    </div>
  );
}