import { useState, useEffect, useCallback } from 'react';

const ALLOWED_PAGES = [
  'dashboard', 'companies', 'sales', 'cashflows', 
  'reports', 'bonuses', 'alerts', 'users', 'settings'
];

export function usePageNavigation() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Inicializar página desde URL - solo una vez
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        if (pageParam && ALLOWED_PAGES.includes(pageParam)) {
          setCurrentPage(pageParam);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error inicializando página desde URL:', error);
    }
  }, []);

  const handleNavigate = useCallback((page: string) => {
    try {
      setCurrentPage(page);
      
      // Actualizar URL para deep linking
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (error) {
      console.warn('⚠️ Error navegando a página:', page, error);
    }
  }, []);

  return {
    currentPage,
    handleNavigate,
    setCurrentPage
  };
}