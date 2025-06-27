import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, Lightbulb, Trophy, Target } from "lucide-react";

interface FinancialInsight {
  type: 'warning' | 'tip' | 'achievement' | 'suggestion';
  title: string;
  description: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
}

interface SpendingAnalysis {
  insights: FinancialInsight[];
  summary: {
    totalSpent: number;
    topCategories: Array<{ category: string; amount: number; percentage: number }>;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
    monthlyAverage: number;
  };
}

export default function AIInsights() {
  const { data: analysis, isLoading, error } = useQuery<SpendingAnalysis>({
    queryKey: ["/api/ai/analysis"],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'suggestion':
        return <Target className="w-5 h-5 text-green-500" />;
      default:
        return <Brain className="w-5 h-5 text-purple-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="card-whatsapp">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="w-5 h-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="card-whatsapp">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-500" />
            <span>Assistente Financeiro IA</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            {error ? "Erro ao carregar insights. Tente novamente mais tarde." : "Nenhum insight disponível no momento."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-whatsapp">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-purple-500" />
          <span>Insights Financeiros IA</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {analysis.insights.length} dicas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analysis.insights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Continue usando o app para receber insights personalizados!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analysis.insights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-white hover:shadow-sm transition-shadow"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-800 text-sm">
                      {insight.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getPriorityColor(insight.priority)} flex-shrink-0 ml-2`}
                    >
                      {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.category && (
                    <Badge variant="secondary" className="text-xs mt-2">
                      {insight.category}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}