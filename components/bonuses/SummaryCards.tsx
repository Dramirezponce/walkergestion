import { Card, CardContent } from '../ui/card';
import { Trophy, DollarSign, Gift, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  metasAlcanzadas: number;
  totalBonosEntregados: number;
  bonosPendientes: number;
  currentMonth: string;
}

export default function SummaryCards({
  metasAlcanzadas,
  totalBonosEntregados,
  bonosPendientes,
  currentMonth
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Metas Alcanzadas</p>
              <p className="text-2xl">{metasAlcanzadas}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bonos Entregados</p>
              <p className="text-xl">${totalBonosEntregados.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Gift className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bonos Pendientes</p>
              <p className="text-xl">{bonosPendientes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mes Actual</p>
              <p className="text-xl">{currentMonth}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}