import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

const COLORS = [
  '#25D366', // WhatsApp green
  '#128C7E', // Dark green
  '#075E54', // Very dark green
  '#34B7F1', // Light blue
  '#ECE5DD', // Light gray
  '#DCF8C6', // Light green
  '#FFF2CC', // Light yellow
  '#FFE4E1', // Light pink
];

export default function SpendingChart() {
  const { data: categoriesData, isLoading } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/categories"],
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-800">{data.category}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(data.amount)} ({data.percentage.toFixed(1)}%)
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
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 flex items-center justify-center">
            <Skeleton className="w-48 h-48 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!categoriesData || categoriesData.length === 0) {
    return (
      <Card className="card-whatsapp">
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">Nenhum gasto registrado ainda.</p>
            <p className="text-sm text-gray-500 mt-1">Adicione algumas despesas para ver o gráfico!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-whatsapp">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gastos por Categoria</span>
          <span className="text-sm font-normal text-gray-600">
            Total: {formatCurrency(categoriesData.reduce((sum, item) => sum + item.amount, 0))}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoriesData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="amount"
              >
                {categoriesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend customizada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categoriesData.slice(0, 6).map((item, index) => (
            <div key={item.category} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-700 truncate">
                {item.category}
              </span>
              <span className="text-sm font-medium text-gray-900 ml-auto">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}