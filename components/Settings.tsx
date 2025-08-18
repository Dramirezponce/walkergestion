import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { UserData } from '../types/app';

interface SettingsProps {
  userData: UserData;
}

export default function Settings({ userData }: SettingsProps) {
  if (!userData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold">Datos de usuario no disponibles</h3>
            <p className="text-muted-foreground">No se pudieron cargar los datos del usuario</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Personaliza la configuración del sistema y tu perfil
        </p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <SettingsIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Panel de configuración en desarrollo</h3>
          <p className="text-muted-foreground">
            Las opciones de configuración detalladas estarán disponibles próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}