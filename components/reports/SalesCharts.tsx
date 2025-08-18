import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { ReportData } from './types';
import { formatCurrency, getGrowthIcon, getGrowthColor } from './utils';
import { CHART_COLORS, CHART_CONFIG } from './constants';

interface SalesChartsProps {
  reportData: ReportData;
}

export default function SalesCharts({ reportData }: SalesChartsProps) {
  const { salesSummary, salesByType, salesByUnit, dailySales } = reportData;

  return (
    <div className="space-y-6">
      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatCurrency(salesSummary.totalRevenue)}</p>
                <p className={`text-xs ${getGrowthColor(salesSummary.growth)}`}>
                  {getGrowthIcon(salesSummary.growth)} {salesSummary.growth.toFixed(1)}% vs período anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Transacciones</p>
                <p className="text-2xl font-bold">{salesSummary.totalTransactions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Promedio: {formatCurrency(salesSummary.avgTransactionValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(salesSummary.avgTransactionValue)}</p>
                <p className="text-xs text-muted-foreground">
                  Por transacción
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ventas Diarias</CardTitle>
            <CardDescription>Evolución de ingresos en el período seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailySales} margin={CHART_CONFIG.margin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'sales' ? formatCurrency(value) : value,
                    name === 'sales' ? 'Ventas' : 'Transacciones'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Payment Type */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Tipo de Pago</CardTitle>
            <CardDescription>Distribución de métodos de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={salesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Monto']} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Business Unit */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ventas por Unidad de Negocio</CardTitle>
            <CardDescription>Comparativa de rendimiento entre unidades</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesByUnit} margin={CHART_CONFIG.margin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'sales' ? formatCurrency(value) : value,
                    name === 'sales' ? 'Ventas' : 'Transacciones'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" fill="#16a34a" name="Ventas" />
                <Bar yAxisId="right" dataKey="transactions" fill="#22c55e" name="Transacciones" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}