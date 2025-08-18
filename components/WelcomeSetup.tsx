import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Building2, MapPin, Plus, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string | null;
  business_unit_id: string | null;
}

interface WelcomeSetupProps {
  user: User;
  onSetupComplete: () => void;
}

interface Company {
  id: string;
  name: string;
  description?: string;
}

interface BusinessUnit {
  id: string;
  name: string;
  company_id: string;
}

export default function WelcomeSetup({ user, onSetupComplete }: WelcomeSetupProps) {
  // Si es el usuario simulado de Daniel, completar setup inmediatamente
  useEffect(() => {
    if (user.id.includes('admin-daniel-ramirez')) {
      console.log('🎭 Usuario Daniel simulado detectado en WelcomeSetup, completando automáticamente...');
      setTimeout(() => {
        onSetupComplete();
      }, 100);
      return;
    }
  }, [user.id, onSetupComplete]);
  const [step, setStep] = useState<'company' | 'business_unit' | 'complete'>('company');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Company form
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [createdCompany, setCreatedCompany] = useState<Company | null>(null);
  
  // Business Unit form
  const [businessUnitName, setBusinessUnitName] = useState('');
  const [businessUnitAddress, setBusinessUnitAddress] = useState('');
  const [createdBusinessUnit, setCreatedBusinessUnit] = useState<BusinessUnit | null>(null);

  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      setError('El nombre de la empresa es requerido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🏢 Creando empresa:', companyName);
      
      const company = await api.createCompany({
        name: companyName.trim(),
        description: companyDescription.trim() || undefined
      });

      console.log('✅ Empresa creada:', company);
      setCreatedCompany(company);
      setStep('business_unit');

    } catch (err: any) {
      console.error('❌ Error creando empresa:', err.message);
      setError(`Error creando empresa: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBusinessUnit = async () => {
    if (!businessUnitName.trim() || !createdCompany) {
      setError('El nombre de la unidad de negocio es requerido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🏪 Creando unidad de negocio:', businessUnitName);
      
      const businessUnit = await api.createBusinessUnit({
        company_id: createdCompany.id,
        name: businessUnitName.trim(),
        address: businessUnitAddress.trim() || undefined
      });

      console.log('✅ Unidad de negocio creada:', businessUnit);
      setCreatedBusinessUnit(businessUnit);
      
      // Actualizar perfil del usuario con la nueva empresa y unidad de negocio
      await updateUserProfile(createdCompany.id, businessUnit.id);

    } catch (err: any) {
      console.error('❌ Error creando unidad de negocio:', err.message);
      setError(`Error creando unidad de negocio: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (companyId: string, businessUnitId: string) => {
    try {
      console.log('👤 Actualizando perfil del usuario...');
      
      // Hacer la actualización directamente con Supabase
      const { supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          company_id: companyId, 
          business_unit_id: businessUnitId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Perfil actualizado:', data);
      setStep('complete');
      
      // Esperar un momento antes de completar la configuración
      setTimeout(() => {
        onSetupComplete();
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error actualizando perfil:', err.message);
      setError(`Error actualizando perfil: ${err.message}`);
    }
  };

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-4">
        <Card className="w-full max-w-md border-2 border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-green-800">¡Configuración Completa!</CardTitle>
            <CardDescription className="text-green-600">
              Tu empresa y unidad de negocio han sido creadas exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2 text-sm text-green-700">
              <p><strong>Empresa:</strong> {createdCompany?.name}</p>
              <p><strong>Unidad de Negocio:</strong> {createdBusinessUnit?.name}</p>
              <p><strong>Usuario:</strong> {user.name} ({user.role})</p>
            </div>
            
            <div className="bg-white/70 rounded-lg p-3">
              <p className="text-xs text-green-600">
                🎉 ¡Bienvenido a WalkerGestion!<br/>
                Ahora puedes comenzar a gestionar tu negocio
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-xs text-green-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirigiendo al dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary">¡Bienvenido a WalkerGestion!</h1>
          <p className="text-sm text-muted-foreground">💚⚪ Configuración inicial</p>
          <p className="text-xs text-muted-foreground">
            Hola <strong>{user.name}</strong>, configuremos tu empresa
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center space-x-2">
          <div className={`flex-1 h-2 rounded-full ${step === 'company' ? 'bg-primary' : 'bg-primary/30'}`}></div>
          <div className={`flex-1 h-2 rounded-full ${step === 'business_unit' ? 'bg-primary' : step === 'complete' ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex-1 h-2 rounded-full ${step === 'complete' ? 'bg-primary' : 'bg-muted'}`}></div>
        </div>

        {/* Company Creation */}
        {step === 'company' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Crear Empresa</span>
              </CardTitle>
              <CardDescription>
                Primero necesitamos crear la información de tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium">
                  Nombre de la Empresa *
                </label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="ej. Santiago Wanderers Retail"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companyDescription" className="text-sm font-medium">
                  Descripción (Opcional)
                </label>
                <Input
                  id="companyDescription"
                  type="text"
                  placeholder="Descripción breve de tu empresa"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                />
              </div>

              {error && (
                <Alert className="border-destructive/50 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleCreateCompany}
                className="w-full"
                disabled={isLoading || !companyName.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando empresa...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Empresa
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Business Unit Creation */}
        {step === 'business_unit' && createdCompany && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Crear Unidad de Negocio</span>
              </CardTitle>
              <CardDescription>
                Ahora creemos tu primera unidad de negocio para <strong>{createdCompany.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  ✅ Empresa <strong>{createdCompany.name}</strong> creada exitosamente
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="businessUnitName" className="text-sm font-medium">
                  Nombre de la Unidad de Negocio *
                </label>
                <Input
                  id="businessUnitName"
                  type="text"
                  placeholder="ej. Local Centro, Oficina Central, etc."
                  value={businessUnitName}
                  onChange={(e) => setBusinessUnitName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="businessUnitAddress" className="text-sm font-medium">
                  Dirección (Opcional)
                </label>
                <Input
                  id="businessUnitAddress"
                  type="text"
                  placeholder="Dirección de la unidad de negocio"
                  value={businessUnitAddress}
                  onChange={(e) => setBusinessUnitAddress(e.target.value)}
                />
              </div>

              {error && (
                <Alert className="border-destructive/50 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleCreateBusinessUnit}
                className="w-full"
                disabled={isLoading || !businessUnitName.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finalizando configuración...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Finalizar Configuración
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>WalkerGestion - Configuración Dinámica</p>
          <p>💚⚪ Verde y Blanco como Santiago Wanderers</p>
          <p>🗄️ Todas las empresas se crean desde la aplicación</p>
        </div>
      </div>
    </div>
  );
}