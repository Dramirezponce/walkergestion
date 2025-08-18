import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Info, Settings, X } from 'lucide-react';

interface GracefulDegradationNoticeProps {
  missingFeatures?: string[];
  onConfigureDatabase?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function GracefulDegradationNotice({
  missingFeatures = [],
  onConfigureDatabase,
  onDismiss,
  className = ""
}: GracefulDegradationNoticeProps) {
  const defaultMissingFeatures = [
    'Rendiciones semanales',
    'Sistema de bonos',
    'Transferencias',
    'Alertas avanzadas'
  ];

  const features = missingFeatures.length > 0 ? missingFeatures : defaultMissingFeatures;

  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="space-y-2">
              <div>
                <strong>Sistema en Modo Básico</strong>
                <p className="text-sm mt-1">
                  WalkerGestion está funcionando con funcionalidades limitadas. 
                  Las siguientes características están disponibles parcialmente:
                </p>
              </div>
              <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                {features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              <p className="text-sm text-blue-700 mt-2">
                💡 Las funciones básicas como ventas y gestión de empresas están completamente operativas.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {onConfigureDatabase && (
              <Button
                size="sm"
                onClick={onConfigureDatabase}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Settings className="h-3 w-3 mr-1" />
                Configurar
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}