import { useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Database, 
  AlertTriangle, 
  Wrench, 
  RefreshCw,
  ArrowRight 
} from 'lucide-react';
import { api } from '../lib/supabase';

interface TableMissingHandlerProps {
  tableName: string;
  children: React.ReactNode;
  onRetry?: () => void;
}

export default function TableMissingHandler({ 
  tableName, 
  children, 
  onRetry 
}: TableMissingHandlerProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState(false);

  const handleSetupDatabase = async () => {
    try {
      setIsSettingUp(true);
      setSetupError(null);
      
      console.log('🗄️ Configurando base de datos desde TableMissingHandler...');
      await api.setupDatabase();
      
      setSetupSuccess(true);
      
      // Esperar un poco y luego reintentar
      setTimeout(() => {
        if (onRetry) {
          onRetry();
        }
        setSetupSuccess(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error configurando base de datos:', error);
      setSetupError(error.message);
    } finally {
      setIsSettingUp(false);
    }
  };

  const getTableDisplayName = (table: string) => {
    const tableNames: { [key: string]: string } = {
      'renditions': 'rendiciones',
      'transfers': 'transferencias', 
      'sales': 'ventas',
      'companies': 'empresas',
      'business_units': 'unidades de negocio',
      'cash_registers': 'cajas registradoras',
      'goals': 'metas',
      'alerts': 'alertas',
      'users': 'usuarios',
      'user_profiles': 'perfiles de usuario'
    };
    
    return tableNames[table] || table;
  };

  if (setupSuccess) {
    return (
      <div className="p-6 text-center">
        <Card className="border-green-200 bg-green-50 max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  ¡Base de datos configurada!
                </h3>
                <p className="text-sm text-green-600 mt-2">
                  La tabla de {getTableDisplayName(tableName)} ha sido creada exitosamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Alert className="border-orange-200 bg-orange-50">
        <Database className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="space-y-4">
            <div>
              <strong>Tabla no configurada</strong>
              <p className="text-sm mt-1">
                La tabla de {getTableDisplayName(tableName)} no existe en la base de datos. 
                Es necesario configurar las tablas para usar esta funcionalidad.
              </p>
            </div>

            {setupError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">Error de configuración</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{setupError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleSetupDatabase}
                disabled={isSettingUp}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isSettingUp ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border border-white border-r-transparent mr-2"></div>
                    Configurando...
                  </>
                ) : (
                  <>
                    <Wrench className="h-3 w-3 mr-2" />
                    Configurar Base de Datos
                  </>
                )}
              </Button>
              
              {onRetry && (
                <Button 
                  onClick={onRetry}
                  variant="outline" 
                  size="sm"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Render children with a subtle overlay */}
      <div className="relative">
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center">
          <Card className="border-muted bg-background/90 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-center text-muted-foreground text-sm flex items-center justify-center">
                <Database className="h-4 w-4 mr-2" />
                Configuración requerida
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Configure la base de datos para acceder a {getTableDisplayName(tableName)}
              </p>
              <Button 
                onClick={handleSetupDatabase}
                disabled={isSettingUp}
                size="sm"
                variant="outline"
              >
                {isSettingUp ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-r-transparent mr-2"></div>
                    Configurando...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Configurar ahora
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}