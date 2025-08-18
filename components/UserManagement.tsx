import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Users } from 'lucide-react';
import { UserData } from '../types/app';

interface UserManagementProps {
  userData: UserData;
}

export default function UserManagement({ userData }: UserManagementProps) {
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
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra usuarios, roles y permisos del sistema
        </p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Módulo en desarrollo</h3>
          <p className="text-muted-foreground">
            La gestión completa de usuarios estará disponible próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}