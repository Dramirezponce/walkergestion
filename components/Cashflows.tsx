import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { UserData } from '../types/app';

interface CashflowsProps {
  userData: UserData;
}

export default function Cashflows({ userData }: CashflowsProps) {
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
        <h1 className="text-2xl font-bold">Flujo de Caja</h1>
        <p className="text-muted-foreground">
          Controla ingresos, gastos y flujo de efectivo en tiempo real
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$2,850,000</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
              Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">$450,000</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">$2,400,000</div>
            <p className="text-xs text-muted-foreground">Neto mensual</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Módulo en construcción</h3>
          <p className="text-muted-foreground">
            El sistema de flujo de caja detallado estará disponible próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}