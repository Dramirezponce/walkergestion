import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Database, Terminal, CheckCircle } from 'lucide-react';

interface RLSErrorHandlerProps {
  error?: string;
  onDismiss?: () => void;
  showInstructions?: boolean;
}

export default function RLSErrorHandler({ error, onDismiss, showInstructions = true }: RLSErrorHandlerProps) {
  const isRLSError = error?.includes('infinite recursion') || error?.includes('42P17');

  if (!isRLSError && !showInstructions) {
    return null;
  }

  // Versión compacta para el banner
  if (!showInstructions) {
    return (
      <div className="flex items-center justify-center space-x-3 text-sm">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-red-700">
          <strong>Error RLS:</strong> Sistema funcionando en modo seguro. 
        </span>
        <span className="text-red-600">
          Ejecutar <code className="bg-red-100 px-1 rounded">SUPABASE_EMERGENCY_FIX.sql</code> para solucionar.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Error Alert */}
      {isRLSError && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error de Configuración RLS:</strong> Se detectó recursión infinita en las políticas de seguridad de la base de datos.
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions Card */}
      {showInstructions && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              <Database className="h-5 w-5" />
              <span>🚨 Solución Requerida - Error RLS</span>
            </CardTitle>
            <CardDescription className="text-orange-600">
              Para solucionar este problema, ejecuta el script de emergencia en tu base de datos Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-orange-700">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Accede a tu Panel de Supabase</p>
                  <p className="text-sm text-orange-600">Ve a tu proyecto en https://supabase.com/dashboard</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Abre el Editor SQL</p>
                  <p className="text-sm text-orange-600">Navega a la sección "SQL Editor" en el panel izquierdo</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Ejecuta el Script de Emergencia</p>
                  <p className="text-sm text-orange-600">Copia y ejecuta el contenido del archivo <code>SUPABASE_EMERGENCY_FIX.sql</code></p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-green-700">Reinicia la Aplicación</p>
                  <p className="text-sm text-green-600">Recarga la página para verificar que el problema se ha solucionado</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Terminal className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-700">Script de Emergencia:</span>
              </div>
              <p className="text-xs text-orange-600 font-mono bg-orange-200 p-2 rounded">
                SUPABASE_EMERGENCY_FIX.sql
              </p>
              <p className="text-sm text-orange-600 mt-1">
                Este script elimina todas las políticas RLS problemáticas y deshabilita RLS temporalmente.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-700">¿Qué hace el script?</span>
              </div>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Elimina todas las políticas RLS que causan recursión infinita</li>
                <li>• Deshabilita RLS en todas las tablas temporalmente</li>
                <li>• Permite que la aplicación funcione sin restricciones de seguridad</li>
                <li>• Mantiene todos los datos intactos</li>
              </ul>
            </div>

            {onDismiss && (
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={onDismiss}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Entendido
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>💚⚪ WalkerGestion - Santiago Wanderers Edition</p>
        <p>🔧 Sistema temporalmente en modo seguro hasta resolver configuración RLS</p>
      </div>
    </div>
  );
}