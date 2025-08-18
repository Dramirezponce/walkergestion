import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { supabase } from '../../lib/supabase';

interface LoginFormProps {
  onSuccess: (user: any, profile: any) => void;
  onSwitchToRegister?: () => void;
  systemErrors?: string[];
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginForm({ onSuccess, onSwitchToRegister, systemErrors = [] }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validation rules
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email no válido';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Contraseña es requerida';
    if (password.length < 6) return 'Contraseña debe tener al menos 6 caracteres';
    return null;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear general error
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Intentando login para:', formData.email);

      // Attempt to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) {
        console.error('❌ Error de autenticación:', authError);
        
        // Handle specific auth errors
        switch (authError.message) {
          case 'Invalid login credentials':
            setError('Email o contraseña incorrectos');
            break;
          case 'Email not confirmed':
            setError('Debes confirmar tu email antes de iniciar sesión');
            break;
          case 'Too many requests':
            setError('Demasiados intentos. Intenta nuevamente en unos minutos');
            break;
          default:
            setError(authError.message || 'Error de autenticación');
        }
        return;
      }

      if (!authData.user) {
        setError('No se pudo autenticar el usuario');
        return;
      }

      console.log('✅ Usuario autenticado:', authData.user.email);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Error obteniendo perfil:', profileError);
        setError('No se pudo cargar el perfil del usuario');
        return;
      }

      if (!profile) {
        console.error('❌ Perfil no encontrado para usuario:', authData.user.id);
        setError('Perfil de usuario no encontrado. Contacta al administrador.');
        return;
      }

      console.log('✅ Perfil cargado:', profile.name, profile.role);

      // Update last login
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', authData.user.id);

      // Store session info if remember me is checked
      if (formData.rememberMe) {
        localStorage.setItem('walkergestion_remember', 'true');
      } else {
        localStorage.removeItem('walkergestion_remember');
      }

      // Clear form
      setFormData({
        email: '',
        password: '',
        rememberMe: false
      });

      console.log('🎉 Login exitoso para:', profile.name);
      onSuccess(authData.user, profile);

    } catch (error: any) {
      console.error('❌ Error inesperado en login:', error);
      setError('Error inesperado. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: 'd.ramirez.ponce@gmail.com',
      password: 'WalkerGestion2024!',
      rememberMe: false
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground text-2xl">🏢</span>
        </div>
        <div>
          <CardTitle className="text-2xl">WalkerGestion</CardTitle>
          <CardDescription className="text-primary">
            💚⚪ Verde y Blanco - Santiago Wanderers
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* System Errors */}
        {systemErrors.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              <div className="font-medium mb-1">Advertencias del sistema:</div>
              <ul className="text-sm space-y-1">
                {systemErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Login Error */}
        {error && (
          <Alert className="border-destructive/50 text-destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${validationErrors.email ? 'border-destructive' : ''}`}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {validationErrors.email && (
              <p className="text-sm text-destructive">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {validationErrors.password && (
              <p className="text-sm text-destructive">{validationErrors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={formData.rememberMe}
              onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
              className="rounded border-border"
              disabled={isLoading}
            />
            <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
              Recordar sesión
            </Label>
          </div>

          {/* Login Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>

        {/* Demo Login */}
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Demo</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            🎯 Usar credenciales de Daniel Ramírez
          </Button>
        </div>

        {/* Register Link */}
        {onSwitchToRegister && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-muted">
          <p className="text-xs text-muted-foreground">
            Sistema de Gestión Comercial<br />
            💚⚪ Santiago Wanderers
          </p>
        </div>
      </CardContent>
    </Card>
  );
}