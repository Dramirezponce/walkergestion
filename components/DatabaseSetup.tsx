import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Loader2,
  RefreshCw,
  ArrowRight,
  Wrench
} from 'lucide-react';
import { api } from '../lib/supabase';

interface DatabaseSetupProps {
  onComplete: () => void;
  initialErrors?: string[];
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

export default function DatabaseSetup({ onComplete, initialErrors = [] }: DatabaseSetupProps) {
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: 'database',
      title: 'Crear Tablas de Base de Datos',
      description: 'Configurar todas las tablas necesarias para WalkerGestion',
      status: 'pending'
    },
    {
      id: 'policies',
      title: 'Configurar Políticas de Seguridad',
      description: 'Habilitar Row Level Security y políticas de acceso',
      status: 'pending'
    },
    {
      id: 'verification',
      title: 'Verificar Configuración',
      description: 'Confirmar que todas las tablas están funcionando correctamente',
      status: 'pending'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const updateStepStatus = (stepId: string, status: SetupStep['status'], error?: string) => {
    setSetupSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, error } : step
    ));
  };

  const runDatabaseSetup = async () => {
    try {
      setIsRunning(true);
      setSetupError(null);
      setSetupComplete(false);

      // Step 1: Create database tables
      setCurrentStep('database');
      updateStepStatus('database', 'running');
      
      console.log('🗄️ Iniciando configuración de base de datos...');
      const setupResult = await api.setupDatabase();
      
      if (setupResult.success) {
        updateStepStatus('database', 'success');
        console.log('✅ Tablas creadas exitosamente');
        
        // Step 2: Policies (already included in setup)
        setCurrentStep('policies');
        updateStepStatus('policies', 'running');
        
        // Simulate policy setup (already included in the database setup)
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateStepStatus('policies', 'success');
        console.log('✅ Políticas configuradas');
        
        // Step 3: Verification
        setCurrentStep('verification');
        updateStepStatus('verification', 'running');
        
        // Verify by trying to fetch companies (should work now)
        await api.getCompanies();
        updateStepStatus('verification', 'success');
        console.log('✅ Verificación completada');
        
        setSetupComplete(true);
        
      } else {
        throw new Error(setupResult.error || 'Error en configuración de base de datos');
      }
      
    } catch (error: any) {
      console.error('❌ Error en setup de base de datos:', error);
      const errorMessage = error.message || 'Error desconocido en configuración';
      
      if (currentStep) {
        updateStepStatus(currentStep, 'error', errorMessage);
      }
      
      setSetupError(errorMessage);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleRetry = () => {
    // Reset all steps
    setSetupSteps(prev => prev.map(step => ({ ...step, status: 'pending', error: undefined })));
    setSetupError(null);
    setSetupComplete(false);
    
    // Run setup again
    runDatabaseSetup();
  };

  const getProgress = () => {
    const completedSteps = setupSteps.filter(step => step.status === 'success').length;
    return (completedSteps / setupSteps.length) * 100;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Configuración de Base de Datos</h1>
          <p className="text-muted-foreground">
            WalkerGestion necesita configurar las tablas de la base de datos antes de comenzar
          </p>
        </div>

        {/* Initial errors */}
        {initialErrors.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p className="font-medium">Problemas detectados:</p>
                <ul className="text-sm space-y-1">
                  {initialErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Setup card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>Configuración Automática</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar */}
            {(isRunning || setupComplete) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="text-foreground">{Math.round(getProgress())}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
            )}

            {/* Setup steps */}
            <div className="space-y-4">
              {setupSteps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {step.status === 'pending' && (
                      <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                      </div>
                    )}
                    {step.status === 'running' && (
                      <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      </div>
                    )}
                    {step.status === 'success' && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                    {step.status === 'error' && (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${
                      step.status === 'success' ? 'text-green-700' :
                      step.status === 'error' ? 'text-red-700' :
                      step.status === 'running' ? 'text-primary' :
                      'text-foreground'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.error && (
                      <p className="text-sm text-red-600 mt-1">Error: {step.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Error message */}
            {setupError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <p className="font-medium">Error en la configuración:</p>
                    <p className="text-sm">{setupError}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success message */}
            {setupComplete && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-medium">¡Configuración completada exitosamente!</p>
                    <p className="text-sm">
                      Todas las tablas han sido creadas y el sistema está listo para usar.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex justify-center space-x-3">
              {!isRunning && !setupComplete && (
                <Button 
                  onClick={runDatabaseSetup}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Iniciar Configuración
                </Button>
              )}

              {setupError && (
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              )}

              {setupComplete && (
                <Button 
                  onClick={handleComplete}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continuar a WalkerGestion
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>🗄️ WalkerGestion - Sistema de Gestión Comercial</p>
          <p>💚⚪ Verde y Blanco - Configuración automática de base de datos</p>
          <p>Esta configuración solo necesita ejecutarse una vez</p>
        </div>
      </div>
    </div>
  );
}