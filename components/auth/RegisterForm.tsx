import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Building, Loader2, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { supabase } from '../../lib/supabase';

interface RegisterFormProps {
  onSuccess: (user: any, profile: any) => void;
  onSwitchToLogin?: () => void;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'manager' | 'cashier';
  companyName: string;
  acceptTerms: boolean;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    companyName: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validation rules
  const validateName = (name: string): string | null => {
    if (!name) return 'Nombre es requerido';
    if (name.length < 2) return 'Nombre debe tener al menos 2 caracteres';
    if (name.length > 100) return 'Nombre muy largo';
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email no válido';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Contraseña es requerida';
    if (password.length < 8) return 'Contraseña debe tener al menos 8 caracteres';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Contraseña debe tener al menos una mayúscula, una minúscula y un número';
    }
    return null;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string | null => {
    if (!confirmPassword) return 'Confirmación de contraseña es requerida';
    if (confirmPassword !== password) return 'Las contraseñas no coinciden';
    return null;
  };

  const validateCompanyName = (companyName: string, role: string): string | null => {
    if (role === 'admin' && !companyName) return 'Nombre de empresa es requerido para administradores';
    if (companyName && companyName.length < 2) return 'Nombre de empresa debe tener al menos 2 caracteres';
    return null;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const nameError = validateName(formData.name);
    if (nameError) errors.name = nameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;
    
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    
    const companyNameError = validateCompanyName(formData.companyName, formData.role);
    if (companyNameError) errors.companyName = companyNameError;
    
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear general error and success
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('👤 Registrando nuevo usuario:', formData.email);

      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim(),
            role: formData.role
          }
        }
      });

      if (authError) {
        console.error('❌ Error en registro:', authError);
        
        switch (authError.message) {
          case 'User already registered':
            setError('Este email ya está registrado');
            break;
          case 'Password should be at least 6 characters':
            setError('La contraseña debe tener al menos 6 caracteres');
            break;
          default:
            setError(authError.message || 'Error en el registro');
        }
        return;
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario');
        return;
      }

      console.log('✅ Usuario auth creado:', authData.user.email);

      // Create company if admin
      let companyId: string | null = null;
      
      if (formData.role === 'admin' && formData.companyName) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.companyName.trim(),
            description: `Empresa creada por ${formData.name}`,
            is_active: true
          })
          .select('id')
          .single();

        if (companyError) {
          console.error('❌ Error creando empresa:', companyError);
          setError('Error creando la empresa. Intenta nuevamente.');
          return;
        }

        companyId = company.id;
        console.log('✅ Empresa creada:', companyId);
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: formData.email.trim(),
          name: formData.name.trim(),
          role: formData.role,
          company_id: companyId,
          is_active: true
        })
        .select('*')
        .single();

      if (profileError) {
        console.error('❌ Error creando perfil:', profileError);
        setError('Error creando el perfil de usuario. Contacta al soporte.');
        return;
      }

      console.log('✅ Perfil creado:', profile.name);

      // If email confirmation is required
      if (!authData.session) {
        setSuccess(
          'Registro exitoso! Por favor revisa tu email para confirmar tu cuenta antes de iniciar sesión.'
        );
        
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'admin',
          companyName: '',
          acceptTerms: false
        });
        
        return;
      }

      // If auto-logged in, proceed
      console.log('🎉 Registro y login automático exitoso');
      onSuccess(authData.user, profile);

    } catch (error: any) {
      console.error('❌ Error inesperado en registro:', error);
      setError('Error inesperado. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = React.useMemo(() => {
    const password = formData.password;
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    const levels = [
      { text: 'Muy débil', color: 'bg-red-500' },
      { text: 'Débil', color: 'bg-orange-500' },
      { text: 'Regular', color: 'bg-yellow-500' },
      { text: 'Buena', color: 'bg-blue-500' },
      { text: 'Excelente', color: 'bg-green-500' }
    ];
    
    return { score, ...levels[Math.min(score, 4)] };
  }, [formData.password]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground text-2xl">📝</span>
        </div>
        <div>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription className="text-primary">
            💚⚪ WalkerGestion - Santiago Wanderers
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="border-destructive/50 text-destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`pl-10 ${validationErrors.name ? 'border-destructive' : ''}`}
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
            {validationErrors.name && (
              <p className="text-sm text-destructive">{validationErrors.name}</p>
            )}
          </div>

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

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleInputChange('role', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">👤 Administrador</SelectItem>
                <SelectItem value="manager">👥 Encargado de Local</SelectItem>
                <SelectItem value="cashier">💰 Cajero</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.role === 'admin' && 'Acceso completo al sistema y gestión de empresa'}
              {formData.role === 'manager' && 'Gestión de local y supervisión de cajeros'}
              {formData.role === 'cashier' && 'Registro de ventas y operaciones básicas'}
            </p>
          </div>

          {/* Company Name (only for admins) */}
          {formData.role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la Empresa</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Nombre de tu empresa"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className={`pl-10 ${validationErrors.companyName ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.companyName && (
                <p className="text-sm text-destructive">{validationErrors.companyName}</p>
              )}
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Crea una contraseña segura"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                disabled={isLoading}
                autoComplete="new-password"
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
            
            {/* Password Strength */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Seguridad:</span>
                  <span className={passwordStrength.score >= 3 ? 'text-green-600' : 'text-muted-foreground'}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {validationErrors.password && (
              <p className="text-sm text-destructive">{validationErrors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirma tu contraseña"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`pl-10 pr-10 ${validationErrors.confirmPassword ? 'border-destructive' : ''}`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                className="mt-1 rounded border-border"
                disabled={isLoading}
              />
              <Label htmlFor="acceptTerms" className="text-sm cursor-pointer leading-relaxed">
                Acepto los{' '}
                <button type="button" className="text-primary hover:underline">
                  términos y condiciones
                </button>
                {' '}y la{' '}
                <button type="button" className="text-primary hover:underline">
                  política de privacidad
                </button>
                {' '}de WalkerGestion.
              </Label>
            </div>
            {validationErrors.acceptTerms && (
              <p className="text-sm text-destructive">{validationErrors.acceptTerms}</p>
            )}
          </div>

          {/* Register Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>
        </form>

        {/* Login Link */}
        {onSwitchToLogin && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Inicia sesión aquí
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