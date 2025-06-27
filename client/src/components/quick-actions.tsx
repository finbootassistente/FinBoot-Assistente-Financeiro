import { Plus, Minus, TrendingUp, MessageSquare, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onOpenChat: () => void;
}

export default function QuickActions({ onAddIncome, onAddExpense, onOpenChat }: QuickActionsProps) {
  const actions = [
    {
      id: 'income',
      title: 'Adicionar Receita',
      description: 'Registre uma nova entrada',
      icon: Plus,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: onAddIncome
    },
    {
      id: 'expense',
      title: 'Adicionar Despesa',
      description: 'Registre um novo gasto',
      icon: Minus,
      color: 'bg-red-500 hover:bg-red-600',
      onClick: onAddExpense
    },
    {
      id: 'chat',
      title: 'Assistente IA',
      description: 'Converse com o assistente',
      icon: MessageSquare,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: onOpenChat
    },
    {
      id: 'analysis',
      title: 'Análise Rápida',
      description: 'Ver insights financeiros',
      icon: TrendingUp,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => {
        // Scroll para a seção de insights
        const insightsSection = document.querySelector('[data-section="insights"]');
        insightsSection?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                onClick={action.onClick}
                className={`${action.color} text-white h-auto flex flex-col items-center gap-2 p-4 min-h-[80px]`}
                variant="default"
              >
                <Icon className="w-5 h-5" />
                <div className="text-center">
                  <div className="text-xs font-medium">{action.title}</div>
                  <div className="text-xs opacity-90 hidden md:block">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {/* Informações de contato */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Dúvidas ou suporte?</p>
            <a 
              href="mailto:finbootassistente@gmail.com" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              finbootassistente@gmail.com
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}