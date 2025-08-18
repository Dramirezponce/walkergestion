import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Bug, 
  Eye, 
  EyeOff, 
  User, 
  Shield, 
  Building, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface DebugPanelProps {
  userData?: any;
  appState?: any;
  emergencyUser?: any;
}

export default function DebugPanel({ userData, appState, emergencyUser }: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { user, profile, loading, initialized } = useAuth();

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
        >
          <Bug className="h-4 w-4 mr-1" />
          Debug
        </Button>
      </div>
    );
  }

  const getAuthStatus = () => {
    if (emergencyUser) return { status: 'emergency', color: 'bg-orange-100 text-orange-800', text: '🚨 Modo Emergencia' };
    if (loading) return { status: 'loading', color: 'bg-blue-100 text-blue-800', text: '🔄 Cargando' };
    if (!initialized) return { status: 'initializing', color: 'bg-yellow-100 text-yellow-800', text: '⚡ Inicializando' };
    if (user && profile) return { status: 'authenticated', color: 'bg-green-100 text-green-800', text: '✅ Autenticado' };
    return { status: 'unauthenticated', color: 'bg-red-100 text-red-800', text: '❌ Sin Auth' };
  };

  const authStatus = getAuthStatus();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md">
      <Card className="bg-white/95 backdrop-blur-sm border-2 border-blue-200 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Bug className="h-5 w-5 mr-2 text-blue-600" />
              Panel de Debug
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="p-1"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Estado de Auth */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Estado de Autenticación
            </h3>
            <Badge className={authStatus.color}>
              {authStatus.text}
            </Badge>
            <div className="text-xs text-gray-600 mt-1">
              Initialized: {initialized ? '✅' : '❌'} | Loading: {loading ? '🔄' : '✅'}
            </div>
          </div>

          {/* Usuario Actual */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <User className="h-4 w-4 mr-1" />
              Usuario Actual
            </h3>
            {emergencyUser ? (
              <Alert className="p-2 border-orange-200 bg-orange-50">
                <AlertDescription className="text-xs">
                  <strong>🚨 Usuario de Emergencia:</strong><br/>
                  Nombre: {emergencyUser.name}<br/>
                  Email: {emergencyUser.email}<br/>
                  Rol: {emergencyUser.role}
                </AlertDescription>
              </Alert>
            ) : userData ? (
              <Alert className="p-2 border-green-200 bg-green-50">
                <AlertDescription className="text-xs">
                  <strong>✅ Usuario Auth:</strong><br/>
                  Nombre: {userData.name}<br/>
                  Email: {userData.email}<br/>
                  Rol: {userData.role}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="p-2 border-gray-200 bg-gray-50">
                <AlertDescription className="text-xs">
                  No hay usuario activo
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Estado de la App */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <Building className="h-4 w-4 mr-1" />
              Estado de la App
            </h3>
            {appState && (
              <div className="text-xs space-y-1">
                <div>Página: <Badge variant="outline">{appState.currentPage}</Badge></div>
                <div>Cargando: {appState.isLoading ? '🔄' : '✅'}</div>
                <div>Necesita Setup: {appState.needsSetup ? '⚠️ Sí' : '✅ No'}</div>
                {appState.error && (
                  <div className="text-red-600">Error: {appState.error}</div>
                )}
              </div>
            )}
          </div>

          {/* Datos Técnicos */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Datos Técnicos
            </h3>
            <div className="text-xs space-y-1">
              <div>Auth User ID: {user?.id?.substring(0, 20) || 'null'}...</div>
              <div>Profile ID: {profile?.id?.substring(0, 20) || 'null'}...</div>
              <div>Company ID: {profile?.company_id || userData?.company_id || 'null'}</div>
              <div>Timestamp: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Acciones de Debug */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Acciones</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log('=== DEBUG STATE ===');
                  console.log('User:', user);
                  console.log('Profile:', profile);
                  console.log('UserData:', userData);
                  console.log('EmergencyUser:', emergencyUser);
                  console.log('AppState:', appState);
                  console.log('===================');
                }}
              >
                Log Estado
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Reload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}