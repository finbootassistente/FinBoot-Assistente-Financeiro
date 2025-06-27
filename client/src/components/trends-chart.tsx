import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TrendData {
  month: string;
  income: number;
  expenses: number;
}

export default function TrendsChart() {
  const { data: trendsData, isLoading } = useQuery<TrendData[]>({
    queryKey: ["/api/analytics/trends"],
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      };

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-800 mb-2">{formatMonth(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <p className="text-sm text-gray-600 mt-1 pt-1 border-t">
            Saldo: {formatCurrency(payload[0]?.payload?.income - payload[1]?.payload?.expenses || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="card-whatsapp">
        <CardHeader>
          <CardTitle>Tendências Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-64" />
        </CardContent>
      </Card>
    );
  }

  if (!trendsData || trendsData.length === 0) {
    return (
      <Card className="card-whatsapp">
        <CardHeader>
          <CardTitle>Tendências Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">Dados insuficientes para mostrar tendências.</p>
            <p className="text-sm text-gray-500 mt-1">Continue usando por alguns meses para ver o gráfico!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short' });
  };

  const chartData = trendsData.map(item => ({
    ...item,
    monthFormatted: formatMonth(item.month)
  }));

  return (
    <Card className="card-whatsapp">
      <CardHeader>
        <CardTitle>Tendências Mensais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="monthFormatted" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#25D366"
                strokeWidth={3}
                dot={{ fill: '#25D366', strokeWidth: 2, r: 4 }}
                name="Receitas"
                activeDot={{ r: 6, stroke: '#25D366', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#FF6B6B"
                strokeWidth={3}
                dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 4 }}
                name="Despesas"
                activeDot={{ r: 6, stroke: '#FF6B6B', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}