import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DailySummary() {
  const { data: dailySummary, isLoading } = useQuery<{
    summary: string;
    todaySpent: number;
    currentBalance: number;
    todayTransactionsCount: number;
  }>({
    queryKey: ["/api/ai/daily-summary"],
  });

  if (isLoading) {
    return (
      <Card className="card-whatsapp mb-6">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dailySummary) return null;

  return (
    <Card className="card-whatsapp mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <Brain className="text-white w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
              Resumo do Seu Dia
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">IA</span>
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">{dailySummary.summary}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Gasto Hoje</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(dailySummary.todaySpent)}
                    </p>
                  </div>
                  <TrendingUp className="text-red-500 w-8 h-8" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Saldo Atual</p>
                    <p className={`text-xl font-bold ${dailySummary.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(dailySummary.currentBalance)}
                    </p>
                  </div>
                  <AlertCircle className={`w-8 h-8 ${dailySummary.currentBalance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}