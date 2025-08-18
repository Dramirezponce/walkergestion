import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, TrendingUp, BarChart3, FileText } from 'lucide-react';
import { UserData } from '../types/app';

interface ReportsProps {
  userData: UserData;
}

export default function Reports({ userData }: ReportsProps) {
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
        <h1 className="text-2xl font-bold">Reportes y Análisis</h1>
        <p className="text-muted-foreground">
          Genera reportes detallados de ventas, gastos y rendimiento
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Reporte de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Análisis detallado de ventas por período, unidad y tipo de pago
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Análisis de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Desglose de gastos operativos y rendiciones por categoría
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Reporte Financiero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Estado financiero consolidado con balance de ingresos y gastos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Funcionalidad en desarrollo</h3>
          <p className="text-muted-foreground">
            El módulo de reportes estará disponible próximamente con gráficos interactivos y exportación a PDF.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}