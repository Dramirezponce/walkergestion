import { useState, useEffect, useCallback } from 'react';
import { SystemState } from '../types/app';
import { checkSupabaseConnection, SUPABASE_CONFIG } from '../lib/supabase';

export function useSystemState() {
  const [systemState, setSystemState] = useState<SystemState>('checking');
  const [systemErrors, setSystemErrors] = useState<string[]>([]);

  const handleRetrySystem = useCallback(() => {
    console.log('🔄 Reintentando verificación del sistema...');
    setSystemState('checking');
    setSystemErrors([]);
  }, []);

  // Verificación del sistema simplificada y más robusta
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkSystem = async () => {
      if (!mounted) return;

      try {
        console.log('🔍 Verificando sistema WalkerGestion...');
        
        // Verificar configuración básica
        if (!SUPABASE_CONFIG.hasValidConfig) {
          console.error('❌ Configuración de Supabase incompleta');
          if (mounted) {
            setSystemState('needs-setup');
            setSystemErrors(['Configuración de Supabase incompleta. Verifique las variables de entorno.']);
          }
          return;
        }

        // Timeout de seguridad más corto
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⏱️ Timeout en verificación del sistema - continuando...');
            setSystemState('ready');
            setSystemErrors([]);
          }
        }, 5000); // Reducido a 5 segundos

        // Verificación de conectividad básica
        const { connected, error: dbError } = await checkSupabaseConnection();
        
        if (!mounted) return;
        
        clearTimeout(timeoutId);

        if (connected) {
          console.log('✅ Sistema operativo');
          setSystemState('ready');
          setSystemErrors([]);
        } else {
          // No bloquear por problemas de conectividad, solo advertir
          console.warn('⚠️ Problemas de conectividad:', dbError);
          setSystemState('ready'); // Cambiado de 'error' a 'ready'
          setSystemErrors(dbError ? [`Advertencia de conectividad: ${dbError}`] : []);
        }

      } catch (error: any) {
        console.error('❌ Error verificando sistema:', error.message);
        
        if (mounted) {
          clearTimeout(timeoutId);
          // Continuar con advertencias en lugar de bloquear - sistema más robusto
          setSystemState('ready');
          setSystemErrors([`Advertencia del sistema: ${error.message}`]);
        }
      }
    };

    // Solo ejecutar si está en estado de verificación
    if (systemState === 'checking') {
      // Delay mínimo para evitar flashes
      const delayId = setTimeout(() => {
        if (mounted) {
          checkSystem();
        }
      }, 100); // Reducido para mejor UX

      return () => {
        mounted = false;
        clearTimeout(delayId);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [systemState]);

  return {
    systemState,
    systemErrors,
    setSystemState,
    setSystemErrors,
    handleRetrySystem
  };
}