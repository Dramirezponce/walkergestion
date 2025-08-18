import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'cashier';
  requiredRoles?: ('admin' | 'manager' | 'cashier')[];
  fallbackPath?: string;
}

/**
 * PrivateRoute Component
 * 
 * Protects routes based on authentication and role requirements.
 * Redirects unauthenticated users to login with return URL.
 * Redirects unauthorized users to appropriate error page.
 */
export default function PrivateRoute({
  children,
  requiredRole,
  requiredRoles,
  fallbackPath = '/unauthorized'
}: PrivateRouteProps) {
  const { user, profile, loading, initialized } = useAuth();
  const location = useLocation();

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
              {!initialized ? 'Inicializando autenticación...' : 'Verificando permisos...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !profile) {
    const returnUrl = location.pathname + location.search;
    return (
      <Navigate 
        to={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`} 
        replace 
      />
    );
  }

  // Check if user account is active
  if (!profile.is_active) {
    return (
      <Navigate 
        to="/unauthorized?reason=account_disabled" 
        replace 
      />
    );
  }

  // Check role requirements
  if (requiredRole || requiredRoles) {
    const userRole = profile.role;
    const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : []);
    
    if (!allowedRoles.includes(userRole)) {
      console.warn(
        `❌ Access denied: User role '${userRole}' not in allowed roles:`, 
        allowedRoles
      );
      
      return (
        <Navigate 
          to={`${fallbackPath}?reason=insufficient_role&required=${allowedRoles.join(',')}&current=${userRole}`} 
          replace 
        />
      );
    }
  }

  // Additional business rules
  if (profile.role === 'manager' && !profile.business_unit_id) {
    console.warn('❌ Manager without assigned business unit');
    return (
      <Navigate 
        to="/unauthorized?reason=no_business_unit" 
        replace 
      />
    );
  }

  if (profile.role === 'cashier' && !profile.business_unit_id) {
    console.warn('❌ Cashier without assigned business unit');
    return (
      <Navigate 
        to="/unauthorized?reason=no_business_unit" 
        replace 
      />
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Hook for checking permissions within components
 */
export function usePermissions() {
  const { profile } = useAuth();

  const hasRole = (role: 'admin' | 'manager' | 'cashier'): boolean => {
    return profile?.role === role;
  };

  const hasAnyRole = (roles: ('admin' | 'manager' | 'cashier')[]): boolean => {
    return profile ? roles.includes(profile.role) : false;
  };

  const canAccessBusinessUnit = (businessUnitId: string): boolean => {
    if (!profile) return false;

    // Admin can access any business unit in their company
    if (profile.role === 'admin') {
      return true; // Would need to check company ownership
    }

    // Manager and cashier can only access their assigned business unit
    return profile.business_unit_id === businessUnitId;
  };

  const canManageUsers = (): boolean => {
    return profile?.role === 'admin';
  };

  const canManageCompany = (): boolean => {
    return profile?.role === 'admin';
  };

  const canViewReports = (): boolean => {
    return profile ? ['admin', 'manager'].includes(profile.role) : false;
  };

  const canProcessRenditions = (): boolean => {
    return profile ? ['admin', 'manager'].includes(profile.role) : false;
  };

  const canApproveBonuses = (): boolean => {
    return profile?.role === 'admin';
  };

  const canCreateGoals = (): boolean => {
    return profile ? ['admin', 'manager'].includes(profile.role) : false;
  };

  return {
    profile,
    hasRole,
    hasAnyRole,
    canAccessBusinessUnit,
    canManageUsers,
    canManageCompany,
    canViewReports,
    canProcessRenditions,
    canApproveBonuses,
    canCreateGoals
  };
}

/**
 * Component for conditionally rendering content based on permissions
 */
interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'cashier';
  requiredRoles?: ('admin' | 'manager' | 'cashier')[];
  fallback?: React.ReactNode;
  businessUnitId?: string;
}

export function PermissionGate({
  children,
  requiredRole,
  requiredRoles,
  fallback = null,
  businessUnitId
}: PermissionGateProps) {
  const { hasRole, hasAnyRole, canAccessBusinessUnit } = usePermissions();

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  // Check business unit access
  if (businessUnitId && !canAccessBusinessUnit(businessUnitId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting components with permissions
 */
export function withPermissions<T extends {}>(
  Component: React.ComponentType<T>,
  requiredRole?: 'admin' | 'manager' | 'cashier',
  requiredRoles?: ('admin' | 'manager' | 'cashier')[]
) {
  return function ProtectedComponent(props: T) {
    return (
      <PermissionGate 
        requiredRole={requiredRole} 
        requiredRoles={requiredRoles}
        fallback={
          <div className="text-center p-6">
            <h3 className="text-lg mb-2">Acceso Denegado</h3>
            <p className="text-muted-foreground">
              No tienes permisos para ver este contenido.
            </p>
          </div>
        }
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
}