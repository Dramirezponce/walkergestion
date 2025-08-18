import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

/**
 * PublicRoute Component
 * 
 * Protects public routes (like login/register) from authenticated users.
 * Redirects authenticated users to dashboard or return URL.
 */
export default function PublicRoute({
  children,
  redirectPath = '/dashboard'
}: PublicRouteProps) {
  const { user, profile, loading, initialized } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
          <div className="space-y-2">
            <h2 className="text-lg">WalkerGestion</h2>
            <p className="text-primary">💚⚪ Verde y Blanco</p>
            <p className="text-muted-foreground">
              Verificando autenticación...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate page
  if (user && profile) {
    // Check for return URL in query params
    const returnUrl = searchParams.get('returnUrl');
    
    if (returnUrl) {
      try {
        const decodedUrl = decodeURIComponent(returnUrl);
        // Validate that the return URL is safe (internal)
        if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
          console.log('🔄 Redirecting authenticated user to return URL:', decodedUrl);
          return <Navigate to={decodedUrl} replace />;
        }
      } catch (error) {
        console.warn('⚠️ Invalid return URL:', returnUrl);
      }
    }

    // Determine default redirect based on user role
    let defaultRedirect = redirectPath;
    
    if (profile.role === 'admin' && !profile.company_id) {
      // Admin without company needs to set up company first
      defaultRedirect = '/setup/company';
    } else if (profile.role === 'manager' && !profile.business_unit_id) {
      // Manager without business unit
      defaultRedirect = '/setup/business-unit';
    } else if (profile.role === 'cashier' && !profile.business_unit_id) {
      // Cashier without business unit
      defaultRedirect = '/setup/assignment';
    }

    console.log('🔄 Redirecting authenticated user to:', defaultRedirect);
    return <Navigate to={defaultRedirect} replace />;
  }

  // User is not authenticated, show public content
  return <>{children}</>;
}

/**
 * Component wrapper for pages that should only be visible to guests
 */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  return (
    <PublicRoute>
      {children}
    </PublicRoute>
  );
}

/**
 * Hook for managing authentication flows in public pages
 */
export function usePublicRouteNavigation() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getRedirectPath = (): string => {
    // Check for return URL
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) {
      try {
        const decodedUrl = decodeURIComponent(returnUrl);
        if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
          return decodedUrl;
        }
      } catch (error) {
        console.warn('⚠️ Invalid return URL:', returnUrl);
      }
    }

    // Default paths based on current location or user role
    if (location.pathname.includes('register')) {
      return '/setup/welcome';
    }

    return '/dashboard';
  };

  const navigateAfterAuth = (user: any, profile: any) => {
    const redirectPath = getRedirectPath();
    
    console.log('🎯 Post-auth navigation:', {
      user: user.email,
      role: profile.role,
      redirectPath
    });

    // The redirect will be handled by PublicRoute component
    window.location.href = redirectPath;
  };

  return {
    getRedirectPath,
    navigateAfterAuth,
    isAuthenticated: !!(user && profile)
  };
}