import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo?: ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error capturado por ErrorBoundary:', error);
    console.error('🚨 Error Info:', {
      componentStack: errorInfo.componentStack
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // Force a re-render by reloading the page if needed
    if (this.state.error?.message?.includes('map is not a function') || 
        this.state.error?.message?.includes('Cannot read properties')) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      const isDataError = this.state.error?.message?.includes('map is not a function') ||
                         this.state.error?.message?.includes('Cannot read properties');
      
      return (
        <div className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="space-y-3">
                <div>
                  <strong>Error del Sistema</strong>
                  <p className="text-sm mt-1">
                    {isDataError 
                      ? 'Error de inicialización de datos. Los datos no se cargaron correctamente desde la base de datos.'
                      : 'Ha ocurrido un error inesperado en la aplicación.'}
                  </p>
                </div>
                {this.state.error && (
                  <div className="bg-red-100 border border-red-200 rounded p-2 text-xs">
                    <strong>Detalles técnicos:</strong><br />
                    {this.state.error.message}
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={this.handleRetry}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {isDataError ? 'Recargar Página' : 'Reintentar'}
                  </Button>
                  {isDataError && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/?page=settings'}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Ir a Configuración
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;