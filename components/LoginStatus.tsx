import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';

interface LoginStatusProps {
  onStatusChange?: (isReady: boolean) => void;
}

export default function LoginStatus({ onStatusChange }: LoginStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkConnection();
    
    // Verificar conexión cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    
    try {
      const response = await fetch('https://boyhheuwgtyeevijxhzb.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWhoZXV3Z3R5ZWV2aWp4aHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTAyNTYsImV4cCI6MjA2OTU4NjI1Nn0.GJRf8cWJmFCZi_m0n7ubLUfwm0g6smuiyz_RMtmXcbY'
        },
        timeout: 5000
      } as any);
      
      if (response.ok) {
        setConnectionStatus('online');
        onStatusChange?.(true);
      } else {
        setConnectionStatus('offline');
        onStatusChange?.(false);
      }
    } catch (error) {
      console.warn('Connection check failed:', error);
      setConnectionStatus('offline');
      onStatusChange?.(false);
    }
    
    setLastCheck(new Date());
  };

  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'checking':
        return {
          icon: <Clock className="h-3 w-3 animate-spin" />,
          text: 'Verificando...',
          variant: 'secondary' as const,
          color: 'text-blue-600'
        };
      case 'online':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Sistema Listo',
          variant: 'secondary' as const,
          color: 'text-green-600 bg-green-50 border-green-200'
        };
      case 'offline':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Sin Conexión',
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="flex items-center justify-center space-x-2">
      <Badge 
        variant={status.variant}
        className={`${status.color} flex items-center space-x-1`}
      >
        {status.icon}
        <span className="text-xs">{status.text}</span>
      </Badge>
      
      {connectionStatus === 'online' && (
        <div className="flex items-center space-x-1 text-green-600">
          <Wifi className="h-3 w-3" />
          <span className="text-xs">Online</span>
        </div>
      )}
      
      {connectionStatus === 'offline' && (
        <div className="flex items-center space-x-1 text-red-600">
          <WifiOff className="h-3 w-3" />
          <span className="text-xs">Offline</span>
        </div>
      )}
      
      {lastCheck && (
        <span className="text-xs text-muted-foreground">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}