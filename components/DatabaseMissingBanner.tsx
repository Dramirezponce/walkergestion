import { useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Database, 
  AlertTriangle, 
  Wrench, 
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react';
import { api } from '../lib/supabase';
import { toast } from 'sonner';

interface DatabaseMissingBannerProps {
  missingTables: string[];
  onDatabaseSetup?: () => void;
  onNavigateToSettings?: () => void;
  onDismiss?: () => void;
  userRole?: 'admin' | 'manager' | 'cashier';
}

export default function DatabaseMissingBanner({ 
  missingTables, 
  onDatabaseSetup,
  onNavigateToSettings,
  onDismiss,
  userRole = 'cashier'
}: DatabaseMissingBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const handleSetupDatabase = async () => {
    if (userRole !== 'admin') {
      toast.error('Solo los administradores pueden configurar la base de datos');
      return;
    }

    try {
      setIsSettingUp(true);
      console.log('🗄️ Configurando base de datos desde banner...');
      
      await api.setupDatabase();
      
      toast.success('Base de datos configurada exitosamente');
      
      if (onDatabaseSetup) {
        onDatabaseSetup();
      }
      
      // Recargar la página después de un breve delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error configurando base de datos:', error);
      toast.error(`Error configurando base de datos: ${error.message}`);
    } finally {
      setIsSettingUp(false);
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const tableNames: Record<string, string> = {
      'companies': 'Empresas',
      'business_units': 'Unidades de Negocio',
      'user_profiles': 'Perfiles de Usuario',
      'cash_registers': 'Cajas Registradoras',
      'sales': 'Ventas',
      'cashflows': 'Flujos de Caja',
      'transfers': 'Transferencias',
      'renditions': 'Rendiciones',
      'rendition_expenses': 'Gastos de Rendición',
      'goals': 'Metas',
      'alerts': 'Alertas'
    };
    return tableNames[tableName] || tableName;
  };

  const criticalTables = ['companies', 'user_profiles', 'business_units'];
  const hasCriticalMissing = missingTables.some(table => criticalTables.includes(table));

  return (
    <Alert className={`border-l-4 ${hasCriticalMissing ? 'border-l-red-500 bg-red-50' : 'border-l-orange-500 bg-orange-50'}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {hasCriticalMissing ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <Database className="h-5 w-5 text-orange-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className={`font-medium ${hasCriticalMissing ? 'text-red-800' : 'text-orange-800'}`}>
                {hasCriticalMissing ? '🚨 Configuración Crítica Requerida' : '⚠️ Base de Datos Incompleta'}
              </h4>
              <AlertDescription className={`mt-1 ${hasCriticalMissing ? 'text-red-700' : 'text-orange-700'}`}>
                {hasCriticalMissing ? (
                  <>Las tablas críticas del sistema no están configuradas. WalkerGestion no funcionará correctamente sin estas tablas.</>
                ) : (
                  <>Algunas funcionalidades pueden no estar disponibles porque faltan {missingTables.length} tabla(s) en la base de datos.</>
                )}
                
                {missingTables.length <= 3 ? (
                  <span className="ml-1">
                    Faltantes: {missingTables.map(getTableDisplayName).join(', ')}.
                  </span>
                ) : (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-1 text-sm underline hover:no-underline focus:outline-none"
                  >
                    {isExpanded ? 'Ver menos' : `Ver ${missingTables.length} tablas faltantes`}
                    {isExpanded ? <ChevronUp className="inline h-3 w-3 ml-1" /> : <ChevronDown className="inline h-3 w-3 ml-1" />}
                  </button>
                )}
              </AlertDescription>

              {isExpanded && (
                <div className="mt-3 space-y-2">
                  <p className={`text-sm font-medium ${hasCriticalMissing ? 'text-red-700' : 'text-orange-700'}`}>
                    Tablas faltantes:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {missingTables.map((table) => (
                      <Badge 
                        key={table} 
                        variant="outline" 
                        className={`text-xs ${
                          criticalTables.includes(table) 
                            ? 'border-red-300 text-red-700 bg-red-100' 
                            : 'border-orange-300 text-orange-700 bg-orange-100'
                        }`}
                      >
                        {criticalTables.includes(table) && '🚨 '}
                        {getTableDisplayName(table)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className={`h-8 w-8 p-0 ${hasCriticalMissing ? 'hover:bg-red-100' : 'hover:bg-orange-100'}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {userRole === 'admin' ? (
              <>
                <Button
                  onClick={handleSetupDatabase}
                  disabled={isSettingUp}
                  size="sm"
                  className={`${
                    hasCriticalMissing 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  } text-white`}
                >
                  {isSettingUp ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border border-white border-r-transparent mr-2"></div>
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Wrench className="h-3 w-3 mr-2" />
                      Configurar Ahora
                    </>
                  )}
                </Button>
                
                {onNavigateToSettings && (
                  <Button
                    onClick={onNavigateToSettings}
                    variant="outline"
                    size="sm"
                    className={`${
                      hasCriticalMissing 
                        ? 'border-red-200 text-red-700 hover:bg-red-50' 
                        : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                    }`}
                  >
                    <Settings className="h-3 w-3 mr-2" />
                    Ir a Configuración
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <p className={`text-sm ${hasCriticalMissing ? 'text-red-600' : 'text-orange-600'}`}>
                  Contacta a un administrador para configurar la base de datos.
                </p>
                {onNavigateToSettings && (
                  <Button
                    onClick={onNavigateToSettings}
                    variant="outline"
                    size="sm"
                    className={`${
                      hasCriticalMissing 
                        ? 'border-red-200 text-red-700 hover:bg-red-50' 
                        : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                    }`}
                  >
                    <Settings className="h-3 w-3 mr-2" />
                    Ver Estado del Sistema
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}