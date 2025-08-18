import React, { useState, useEffect } from 'react';
import { Toaster, toast } from "sonner";
import { supabase, isConfigured } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/auth/LoginPage';
import MainLayout from './components/layout/MainLayout';
import LoadingScreen from './components/ui/LoadingScreen';
import ErrorBoundary from './components/ui/ErrorBoundary';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Verificar configuración
        if (isConfigured) {
          console.log('✅ WalkerGestión - Modo Producción');
        } else {
          console.log('🎭 WalkerGestión - Modo Demo');
        }
        
        setAppReady(true);
      } catch (error) {
        console.error('Error inicializando app:', error);
        toast.error('Error al inicializar la aplicación');
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!appReady || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginPage />
        <Toaster position="top-right" richColors />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <MainLayout user={user} onSignOut={signOut}>
  <h1>Dashboard</h1>
</MainLayout>
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  );
}