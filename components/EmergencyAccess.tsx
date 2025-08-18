import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  ShieldAlert, 
  LogIn, 
  AlertTriangle, 
  Crown,
  Zap,
  ArrowRight,
  Key
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EmergencyAccessProps {
  onEmergencyLogin: () => void;
}

export default function EmergencyAccess({ onEmergencyLogin }: EmergencyAccessProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEmergencyAccess = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsActivating(true);
    
    try {
      toast.info('🚨 Activando acceso de emergencia...', { duration: 2000 });
      
      // Simular proceso de activación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('🎯 Acceso de emergencia activado', {
        description: 'Ingresando al sistema como Daniel Ramírez',
        duration: 3000
      });
      
      // Ejecutar el callback para establecer el estado de login
      onEmergencyLogin();
      
    } catch (error) {
      toast.error('Error en acceso de emergencia');
      console.error('Error:', error);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón principal de acceso de emergencia */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <ShieldAlert className="h-6 w-6 text-orange-600 mr-2" />
            <CardTitle className="text-lg text-orange-800">
              Acceso de Emergencia
            </CardTitle>
          </div>
          <CardDescription className="text-orange-700">
            Bypass directo para pruebas y acceso inmediato
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="border-orange-300 bg-orange-100/50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p className="font-medium">
                  ⚡ Acceso inmediato sin autenticación
                </p>
                <p className="text-sm">
                  Esta función omite todos los procesos de login y te da acceso directo 
                  como Daniel Ramírez (Administrador Principal).
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {!showConfirmation ? (
            <Button
              onClick={handleEmergencyAccess}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
              size="lg"
              disabled={isActivating}
            >
              <Key className="h-5 w-5 mr-3" />
              ACTIVAR ACCESO DE EMERGENCIA
            </Button>
          ) : (
            <div className="space-y-3">
              <Alert className="border-red-300 bg-red-100/50">
                <Crown className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <p className="font-bold">¿Estás seguro?</p>
                    <p className="text-sm">
                      Esto te dará acceso completo como <strong>Daniel Ramírez</strong> con permisos de administrador.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button
                        onClick={() => setShowConfirmation(false)}
                        variant="outline"
                        size="sm"
                        className="text-gray-600"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleEmergencyAccess}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                        disabled={isActivating}
                      >
                        {isActivating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Activando...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Confirmar Acceso
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Información del usuario que se activará */}
          <div className="p-3 bg-white rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Usuario que se activará:</span>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-sm">
                <strong>Nombre:</strong> Daniel Ramírez
              </div>
              <div className="text-sm">
                <strong>Email:</strong> d.ramirez.ponce@gmail.com
              </div>
              <div className="text-sm">
                <strong>Rol:</strong> Administrador Principal
              </div>
              <div className="text-sm">
                <strong>Permisos:</strong> Acceso completo a todas las funcionalidades
              </div>
            </div>
          </div>

          {/* Funcionalidades que estarán disponibles */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-2">
              🎯 Funcionalidades disponibles después del acceso:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
              <div className="flex items-center space-x-1">
                <ArrowRight className="h-3 w-3" />
                <span>Dashboard Principal</span>
              </div>
              <div className="flex items-center space-x-1">
                <ArrowRight className="h-3 w-3" />
                <span>Gestión de Ventas</span>
              </div>
              <div className="flex items-center space-x-1">
                <ArrowRight className="h-3 w-3" />
                <span>Control de Rendiciones</span>
              </div>
              <div className="flex items-center space-x-1">
                <ArrowRight className="h-3 w-3" />
                <span>Reportes y Análisis</span>
              </div>
              <div className="flex items-center space-x-1">
                <ArrowRight className="h-3 w-3" />
                <span>Gestión de Usuarios</span>
              </div>
              <div className="flex items-center space-x-1">
                <ArrowRight className="h-3 w-3" />
                <span>Configuración Global</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}