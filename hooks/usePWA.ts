import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installApp: () => Promise<void>;
  updateApp: () => void;
}

export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  // Detectar cuando la app es instalable
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] App is installable');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Detectar cuando la app se instala
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] App is online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[PWA] App is offline');
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Detectar si ya está instalada
  useEffect(() => {
    const checkIfInstalled = () => {
      // Verificar si está ejecutándose en modo standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };

    checkIfInstalled();
  }, []);

  // Registrar service worker solo si está disponible y manejar errores
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Intentar registrar service worker de forma segura
      const registerServiceWorker = async () => {
        try {
          // Verificar si el archivo existe antes de registrar
          const response = await fetch('/sw.js', { method: 'HEAD' });
          
          if (response.ok) {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('[PWA] Service Worker registered successfully:', registration);

            // Detectar actualizaciones
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] Update available');
                    setIsUpdateAvailable(true);
                  }
                });
              }
            });
          } else {
            console.log('[PWA] Service Worker file not found, running without SW');
          }
        } catch (error) {
          console.log('[PWA] Service Worker registration failed (gracefully handled):', error.message);
          // No mostrar error al usuario, la app funciona sin SW
        }
      };

      // Registrar cuando la página cargue
      if (document.readyState === 'loading') {
        window.addEventListener('load', registerServiceWorker);
      } else {
        registerServiceWorker();
      }

      return () => {
        window.removeEventListener('load', registerServiceWorker);
      };
    } else {
      console.log('[PWA] Service Workers not supported in this browser');
    }
  }, []);

  // Función para instalar la app
  const installApp = useCallback(async (): Promise<void> => {
    if (!deferredPrompt) {
      // En entornos sin soporte completo de PWA, mostrar instrucciones
      const userAgent = navigator.userAgent.toLowerCase();
      let instructions = 'Para instalar esta aplicación:\n\n';
      
      if (userAgent.includes('chrome')) {
        instructions += '1. Haz clic en el menú (⋮) del navegador\n2. Selecciona "Instalar WalkerGestion"\n3. Confirma la instalación';
      } else if (userAgent.includes('firefox')) {
        instructions += '1. Haz clic en el menú (≡) del navegador\n2. Busca "Instalar esta aplicación"\n3. Sigue las instrucciones';
      } else if (userAgent.includes('safari')) {
        instructions += '1. Toca el botón de compartir\n2. Selecciona "Añadir a pantalla de inicio"\n3. Confirma la instalación';
      } else {
        instructions += '1. Busca la opción "Instalar app" en el menú del navegador\n2. Sigue las instrucciones de instalación';
      }
      
      alert(instructions);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('[PWA] User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA] Error during installation:', error);
      throw error;
    }
  }, [deferredPrompt]);

  // Función para actualizar la app
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration()
        .then((registration) => {
          if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        })
        .catch((error) => {
          console.log('[PWA] No service worker available for update:', error.message);
          // Recargar página como fallback
          window.location.reload();
        });
    } else {
      // Fallback: simplemente recargar la página
      window.location.reload();
    }
  }, []);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    installApp,
    updateApp
  };
}

// Hook para detectar si es móvil
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isMobileScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileUA || isMobileScreen);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}

// Hook para vibración (móviles)
export function useVibration() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.log('[PWA] Vibration not supported or failed:', error.message);
      }
    }
  }, []);

  const vibrateSuccess = useCallback(() => {
    vibrate([100, 50, 100]);
  }, [vibrate]);

  const vibrateError = useCallback(() => {
    vibrate([200, 100, 200, 100, 200]);
  }, [vibrate]);

  const vibrateNotification = useCallback(() => {
    vibrate([50, 50, 50]);
  }, [vibrate]);

  return {
    vibrate,
    vibrateSuccess,
    vibrateError,
    vibrateNotification
  };
}

// Hook para notificaciones
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (error) {
        console.log('[PWA] Notification permission request failed:', error.message);
        return 'denied';
      }
    }
    return 'denied';
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      try {
        const defaultOptions: NotificationOptions = {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          vibrate: [200, 100, 200],
          ...options
        };

        return new Notification(title, defaultOptions);
      } catch (error) {
        console.log('[PWA] Failed to show notification:', error.message);
        return null;
      }
    }
    return null;
  }, [permission]);

  return {
    permission,
    requestPermission,
    showNotification
  };
}