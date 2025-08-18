import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Shield, Save, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { validateProfileData } from './utils';
import { toast } from 'sonner';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileSettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'cashier';
  };
  userProfile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  onSave: () => void;
  saving: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
}

export default function ProfileSettings({
  user,
  userProfile,
  onProfileChange,
  onSave,
  saving,
  showPassword,
  onTogglePassword
}: ProfileSettingsProps) {
  const handleSave = () => {
    const errors = validateProfileData(userProfile);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    onSave();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Perfil</CardTitle>
        <CardDescription>
          Actualiza tu información personal y credenciales de acceso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nombre Completo *</Label>
            <Input
              id="profile-name"
              value={userProfile.name}
              onChange={(e) => onProfileChange({ ...userProfile, name: e.target.value })}
              placeholder="Tu nombre completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email *</Label>
            <Input
              id="profile-email"
              type="email"
              value={userProfile.email}
              onChange={(e) => onProfileChange({ ...userProfile, email: e.target.value })}
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Teléfono</Label>
            <Input
              id="profile-phone"
              value={userProfile.phone}
              onChange={(e) => onProfileChange({ ...userProfile, phone: e.target.value })}
              placeholder="+56 9 1234 5678"
            />
          </div>
          <div className="space-y-2">
            <Label>Rol Actual</Label>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <Badge className="bg-green-100 text-green-800">
                {user.role === 'admin' ? 'Administrador' : user.role === 'manager' ? 'Encargado' : 'Cajero'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Cambiar Contraseña</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  value={userProfile.currentPassword}
                  onChange={(e) => onProfileChange({ ...userProfile, currentPassword: e.target.value })}
                  placeholder="Contraseña actual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={onTogglePassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={userProfile.newPassword}
                onChange={(e) => onProfileChange({ ...userProfile, newPassword: e.target.value })}
                placeholder="Nueva contraseña"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={userProfile.confirmPassword}
                onChange={(e) => onProfileChange({ ...userProfile, confirmPassword: e.target.value })}
                placeholder="Confirmar contraseña"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}