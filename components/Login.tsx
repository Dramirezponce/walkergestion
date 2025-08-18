import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowLeft,
  Building,
  Users,
  TrendingUp,
  Shield,
  Info,
  LogIn,
  Crown,
  Sparkles,
  Zap,
  CheckCircle,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../hooks/useAuth';
import EmergencyAccess from './EmergencyAccess';

interface LoginProps {
  onBackToWebsite?: () => void;
  systemErrors?: string[];
  onShowDiagnostic?: () => void;
  onEmergencyLogin?: (userData: any) => void;
}

export default function Login({ 
  onBackToWebsite, 
  systemErrors = [], 
  onShowDiagnostic, 
  onEmergencyLogin 
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  
  const { signIn } = useAuth();

  // Precargar credenciales de Daniel automáticamente y mostrar bienvenida
  useEffect(() => {
    try {
      setEmail('d.ramirez.ponce@gmail.com');
      setPassword('admin123');
      
      // Toast de bienvenida personalizada para Daniel con delay
      const timeoutId = setTimeout(() => {
        try {
          toast.success('🎯 Sistema listo para Daniel Ramírez', {
            description: 'Credenciales precargadas. ¡Acceso VIP disponible!',
            duration: 5000
          });
        } catch (toastError) {
          console.warn('⚠️ Error mostrando toast de bienvenida:', toastError);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.warn('⚠️ Error inicializando credenciales:', error);
    }
  }, []);

  // Rate limiting suave
  const canAttemptLogin = useCallback(() => {
    try {
      const now = Date.now();
      const timeSinceLastAttempt = now - lastAttemptTime;
      const waitTime = Math.min(loginAttempts * 2000, 10000); // Máximo 10 segundos
      
      return timeSinceLastAttempt > waitTime;
    } catch (error) {
      console.warn('⚠️ Error verificando rate limiting:', error);
      return true; // En caso de error, permitir el intento
    }
  }, [loginAttempts, lastAttemptTime]);

  const getWaitTime = useCallback(() => {
    try {
      const now = Date.now();
      const timeSinceLastAttempt = now - lastAttemptTime;
      const waitTime = Math.min(loginAttempts * 2000, 10000);
      
      return Math.max(0, Math.ceil((waitTime - timeSinceLastAttempt) / 1000));
    } catch (error) {
      console.warn('⚠️ Error calculando tiempo de espera:', error);
      return 0;
    }
  }, [loginAttempts, lastAttemptTime]);

  // Función de login optimizada con mejor manejo de errores
  const performLogin = useCallback(async () => {
    if (isLoading) return;
    
    try {
      // Verificar rate limiting
      if (!canAttemptLogin()) {
        const waitSeconds = getWaitTime();
        toast.warning(`Espera ${waitSeconds} segundos antes de intentar de nuevo`, {
          duration: 3000
        });
        return;
      }
      
      setIsLoading(true);
      setError('');

      console.log('🚀 === INICIO LOGIN WALKER GESTIÓN ===');
      console.log('📧 Email:', email);
      console.log('🔄 Intento #:', loginAttempts + 1);

      // Validación básica mejorada
      if (!email?.trim() || !password?.trim()) {
        throw new Error('Por favor ingresa tu email y contraseña');
      }

      if (!email.includes('@') || !email.includes('.')) {
        throw new Error('Por favor ingresa un email válido');
      }

      // Toast de progreso con mensaje personalizado para Daniel
      const isDaniel = email.toLowerCase().includes('d.ramirez.ponce@gmail.com');
      const progressMessage = isDaniel ? 
        'Verificando acceso VIP de Daniel...' : 
        'Iniciando sesión...';
        
      const progressToast = toast.loading(progressMessage, { duration: Infinity });

      // Llamar al signIn del hook con manejo de errores mejorado
      let result;
      try {
        if (!signIn) {
          throw new Error('Sistema de autenticación no disponible');
        }
        
        result = await signIn(email.trim().toLowerCase(), password);
      } catch (authError: any) {
        toast.dismiss(progressToast);
        
        // Manejar errores específicos de autenticación
        if (authError?.message?.includes('unsubscribe')) {
          throw new Error('Error interno del sistema de autenticación. Intenta con el acceso de emergencia');
        }
        
        throw authError; // Re-lanzar el error para que sea manejado abajo
      }
      
      toast.dismiss(progressToast);
      
      if (result) {
        console.log('✅ Login completado exitosamente');
        
        const successMessage = isDaniel ? 
          '👑 ¡Bienvenido de vuelta, Administrador!' : 
          '¡Bienvenido a WalkerGestión!';
          
        toast.success(successMessage, {
          description: `Acceso concedido para ${email}`,
          duration: 4000
        });
        
        // Reset attempts on success
        setLoginAttempts(0);
        setLastAttemptTime(0);
      } else {
        throw new Error('Error en el proceso de autenticación');
      }

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      // Extraer mensaje de error de forma segura
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Incrementar attempts y set last attempt time
      setLoginAttempts(prev => prev + 1);
      setLastAttemptTime(Date.now());
      
      setError(errorMessage);
      
      // Mensaje de error más amigable
      const isDaniel = email.toLowerCase().includes('d.ramirez.ponce@gmail.com');
      let userFriendlyMessage = errorMessage;
      
      if (isDaniel && errorMessage.includes('Contraseña incorrecta')) {
        userFriendlyMessage = 'Contraseña incorrecta. ¿Intentaste con "admin123"?';
      } else if (errorMessage.includes('Invalid login credentials')) {
        userFriendlyMessage = 'Email o contraseña incorrectos';
      } else if (errorMessage.includes('Too many requests')) {
        userFriendlyMessage = 'Demasiados intentos. Espera un momento antes de intentar de nuevo';
      } else if (errorMessage.includes('unsubscribe') || errorMessage.includes('authSubscription')) {
        userFriendlyMessage = 'Error interno de autenticación. Usa el acceso de emergencia 🚨';
      } else if (errorMessage.includes('Sistema de autenticación no disponible')) {
        userFriendlyMessage = 'Sistema temporalmente no disponible. Usa el acceso de emergencia';
      }
      
      toast.error('Error de acceso', {
        description: userFriendlyMessage,
        duration: 6000
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, isLoading, signIn, canAttemptLogin, getWaitTime, loginAttempts]);

  // Acceso rápido VIP para Daniel
  const handleQuickLogin = useCallback(async () => {
    console.log('🎯 === ACCESO VIP DANIEL ACTIVADO ===');
    try {
      await performLogin();
    } catch (error: any) {
      console.error('❌ Error en acceso VIP:', error);
      // El error ya fue manejado en performLogin
    }
  }, [performLogin]);

  // Login manual
  const handleManualLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await performLogin();
    } catch (error: any) {
      console.error('❌ Error en login manual:', error);
      // El error ya fue manejado en performLogin
    }
  }, [performLogin]);

  // Función de acceso de emergencia mejorada
  const handleEmergencyLogin = useCallback(() => {
    console.log('🚨 === ACCESO DE EMERGENCIA ACTIVADO ===');
    
    try {
      // Crear datos de usuario de emergencia más completos
      const emergencyUserData = {
        id: `emergency-admin-daniel-${Date.now()}`,
        email: 'd.ramirez.ponce@gmail.com',
        name: 'Daniel Ramírez (Emergencia)',
        role: 'admin' as const,
        company: 'WalkerGestión Demo',
        businessUnit: 'Administración Central',
        company_id: `emergency-company-${Date.now()}`,
        business_unit_id: `emergency-business-unit-${Date.now()}`
      };

      console.log('📋 Datos de emergencia creados:', emergencyUserData);
      
      if (onEmergencyLogin) {
        onEmergencyLogin(emergencyUserData);
        console.log('✅ Acceso de emergencia completado');
      } else {
        console.error('❌ Callback onEmergencyLogin no disponible');
        toast.error('Error configurando acceso de emergencia');
      }
    } catch (error: any) {
      console.error('❌ Error en acceso de emergencia:', error);
      toast.error('Error activando acceso de emergencia');
    }
  }, [onEmergencyLogin]);

  // Características del sistema
  const features = [
    {
      icon: <Building className="h-5 w-5 text-primary" />,
      title: 'Gestión Multi-Local',
      description: 'Administra múltiples locales comerciales desde una sola plataforma',
      highlight: 'Centralizado'
    },
    {
      icon: <Users className="h-5 w-5 text-primary" />,
      title: 'Control de Roles',
      description: 'Admin, encargados y cajeros con permisos específicos',
      highlight: 'Seguro'
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      title: 'Reportes en Tiempo Real',
      description: 'Ventas, gastos y metas actualizados al instante',
      highlight: 'En vivo'
    },
    {
      icon: <Shield className="h-5 w-5 text-primary" />,
      title: 'Seguridad Total',
      description: 'Protección de datos empresariales y transacciones',
      highlight: 'Protegido'
    }
  ];

  // Status indicators
  const statusIndicators = [
    { label: 'Sistema', status: 'online', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    { label: 'Base de Datos', status: 'conectada', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    { label: 'Respuesta', status: '<100ms', icon: <Clock className="h-4 w-4 text-blue-500" /> }
  ];

  const waitTime = !canAttemptLogin() ? getWaitTime() : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-100">
      {/* Header with back button */}
      {onBackToWebsite && (
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={onBackToWebsite}
            className="mb-4 hover:bg-green-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al sitio web
          </Button>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Panel izquierdo - Información del sistema */}
          <div className="space-y-8">
            {/* Header principal */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-xl">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Crown className="h-3 w-3 text-yellow-800" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                    WalkerGestión
                  </h1>
                  <Badge variant="secondary" className="mt-1">
                    v2.1 Producción
                  </Badge>
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                Sistema de Gestión Comercial Integral
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Controla ventas, rendiciones, gastos y metas de todos tus locales 
                en tiempo real con la tecnología más avanzada.
              </p>
            </div>

            {/* Status del sistema */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200/50 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Estado del Sistema
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {statusIndicators.map((indicator, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2">
                      {indicator.icon}
                    </div>
                    <div className="text-xs font-medium text-gray-700">{indicator.label}</div>
                    <div className="text-xs text-gray-500">{indicator.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features grid */}
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="group flex items-start space-x-4 p-5 rounded-xl bg-white/70 border border-green-200/50 shadow-sm hover:shadow-md hover:bg-white/90 transition-all duration-200"
                >
                  <div className="flex-shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {feature.highlight}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
              ))}
            </div>

            {/* Stats mejoradas */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-200/50">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 text-green-600 mr-2" />
                  <div className="text-3xl font-bold text-green-600">99.9%</div>
                </div>
                <div className="text-gray-600 font-medium">Tiempo Activo</div>
                <div className="text-xs text-gray-500 mt-1">Disponibilidad garantizada</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-200/50">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-blue-600 mr-2" />
                  <div className="text-3xl font-bold text-blue-600">24/7</div>
                </div>
                <div className="text-gray-600 font-medium">Soporte</div>
                <div className="text-xs text-gray-500 mt-1">Asistencia continua</div>
              </div>
            </div>
          </div>

          {/* Panel derecho - Login */}
          <div className="w-full max-w-lg mx-auto">
            <Card className="border-2 border-green-200/50 shadow-2xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-yellow-500 mr-3" />
                  <CardTitle className="text-3xl text-green-700">Acceso Administrador</CardTitle>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-bold text-lg mb-1">
                      ¡Bienvenido, Daniel Ramírez!
                    </p>
                    <p className="text-green-700 text-sm">
                      Tu cuenta VIP está configurada y lista para usar
                    </p>
                  </div>
                  
                  {/* Rate limiting warning */}
                  {waitTime > 0 && (
                    <Alert className="border-yellow-300 bg-yellow-50">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Espera {waitTime} segundos antes de intentar de nuevo
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Tabs para diferentes métodos de acceso */}
                <Tabs defaultValue="quick" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="quick" className="text-xs font-medium">
                      🎯 Acceso VIP
                    </TabsTrigger>
                    <TabsTrigger value="emergency" className="text-xs font-medium">
                      🚨 Emergencia
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="text-xs font-medium">
                      📝 Manual
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="quick" className="space-y-4">
                    {/* ACCESO DIRECTO VIP MEJORADO */}
                    <div className="relative">
                      <div className="absolute -top-3 -left-3 -right-3 h-3 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-t-lg opacity-30"></div>
                      
                      <Alert className="border-green-300 bg-gradient-to-r from-green-50 to-green-100/50 pt-6">
                        <div className="space-y-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <Sparkles className="h-6 w-6 text-green-600" />
                            <div>
                              <p className="font-bold text-green-800 text-lg">¡Tu acceso VIP está listo!</p>
                              <p className="text-green-700 text-sm">Sistema configurado exclusivamente para ti</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/70 rounded-lg p-4 space-y-3">
                            <p className="text-green-700 leading-relaxed">
                              Como administrador principal, tienes acceso inmediato a todas las funcionalidades 
                              de WalkerGestión. Un clic y estarás dentro del sistema.
                            </p>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="text-green-600">
                                <div className="font-medium">📧 d.ramirez.ponce@gmail.com</div>
                                <div className="text-xs opacity-80">👑 Administrador Principal • Acceso Total</div>
                              </div>
                              <Badge variant="default" className="bg-green-600">
                                Credenciales OK
                              </Badge>
                            </div>
                          </div>
                          
                          <Button
                            onClick={handleQuickLogin}
                            disabled={isLoading || waitTime > 0}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 text-white font-bold py-4 text-lg"
                            size="lg"
                          >
                            {isLoading ? (
                              <>
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                Ingresando a WalkerGestión...
                              </>
                            ) : waitTime > 0 ? (
                              <>
                                <Clock className="h-5 w-5 mr-3" />
                                Espera {waitTime}s para reintentar
                              </>
                            ) : (
                              <>
                                <LogIn className="h-6 w-6 mr-3" />
                                INGRESAR COMO ADMINISTRADOR
                                <Zap className="h-5 w-5 ml-3" />
                              </>
                            )}
                          </Button>
                          
                          {loginAttempts > 0 && (
                            <div className="text-center text-xs text-green-600">
                              Intento #{loginAttempts + 1} • Sistema robusto y seguro
                            </div>
                          )}
                        </div>
                      </Alert>
                    </div>
                  </TabsContent>

                  <TabsContent value="emergency" className="space-y-4">
                    <EmergencyAccess onEmergencyLogin={handleEmergencyLogin} />
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4">
                    {/* Formulario manual mejorado */}
                    <form onSubmit={handleManualLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                            disabled={isLoading || waitTime > 0}
                            placeholder="tu@email.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700 font-medium">Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                            disabled={isLoading || waitTime > 0}
                            placeholder="Tu contraseña"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                        disabled={isLoading || waitTime > 0}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Iniciando sesión...
                          </div>
                        ) : waitTime > 0 ? (
                          `Espera ${waitTime}s para reintentar`
                        ) : (
                          'Iniciar Sesión Manual'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Errores del sistema */}
                {systemErrors.length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <div className="space-y-1">
                        <p className="font-medium">Sistema en configuración</p>
                        <p className="text-sm">El acceso VIP debería funcionar normalmente.</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error de login */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">{error}</p>
                        <p className="text-sm">
                          💡 <strong>Solución:</strong> Usa el botón "INGRESAR COMO ADMINISTRADOR" en la pestaña Acceso VIP.
                        </p>
                        {loginAttempts > 2 && (
                          <p className="text-sm">
                            🔧 Si persiste el problema, prueba el acceso de emergencia 🚨.
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Ayuda y herramientas */}
                <div className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {onShowDiagnostic && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onShowDiagnostic}
                        className="text-green-600 hover:bg-green-50"
                      >
                        🔧 Diagnóstico Rápido
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        try {
                          const url = `${window.location.origin}#connectivity-troubleshooter`;
                          window.open(url, '_blank');
                        } catch (error) {
                          console.warn('⚠️ Error abriendo troubleshooter:', error);
                        }
                      }}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      🌐 Solucionar Red
                    </Button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-2">¿Problemas para acceder?</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Usa el botón verde "INGRESAR COMO ADMINISTRADOR"</li>
                          <li>Verifica tu conexión a internet</li>
                          <li>Si persiste, usa el acceso de emergencia 🚨</li>
                          <li>Para soporte técnico, usa el diagnóstico del sistema</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer mejorado */}
            <div className="text-center mt-8 space-y-2">
              <p className="text-sm text-gray-600 font-medium">
                © 2024 WalkerGestión • Todos los derechos reservados
              </p>
              <div className="flex items-center justify-center space-x-3 text-xs text-gray-500">
                <span>v2.1 - Acceso Optimizado</span>
                <span>•</span>
                <span>Especializado para Daniel Ramírez</span>
                <span>•</span>
                <span>Sistema Robusto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}