import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Wallet, Plus, Minus } from "lucide-react";
import Header from "@/components/header";
import TransactionModal from "@/components/transaction-modal";
import DailySummary from "@/components/daily-summary";
import AIInsights from "@/components/ai-insights";
import SpendingChart from "@/components/spending-chart";
import TrendsChart from "@/components/trends-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, getRelativeTime, getCategoryIcon } from "@/lib/utils";
import type { Transaction } from "@shared/schema";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acesso Negado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: summary, isLoading: summaryLoading } = useQuery<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  }>({
    queryKey: ["/api/user/summary"],
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/recent"],
  });

  const openModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const getTransactionIcon = (category: string) => {
    const iconName = getCategoryIcon(category);
    // For simplicity, using emoji icons as fallback
    const emojiIcons: Record<string, string> = {
      'utensils': '🍽️',
      'car': '🚗',
      'film': '🎬',
      'briefcase': '💼',
      'laptop': '💻',
      'heart': '❤️',
      'book': '📚',
      'home': '🏠',
      'tag': '🏷️',
    };
    return emojiIcons[iconName] || '🏷️';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView="dashboard" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Daily Summary with AI */}
        <DailySummary />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="card-whatsapp hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 mb-1">Receitas</p>
                  {summaryLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
                  ) : (
                    <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                      {formatCurrency(summary?.totalIncome || 0)}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                  <TrendingUp className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-whatsapp hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 mb-1">Despesas</p>
                  {summaryLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
                  ) : (
                    <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                      {formatCurrency(summary?.totalExpenses || 0)}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                  <TrendingDown className="text-red-600 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-whatsapp hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 mb-1">Saldo</p>
                  {summaryLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
                  ) : (
                    <p className="text-lg sm:text-2xl font-bold whatsapp-text truncate">
                      {formatCurrency(summary?.balance || 0)}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 whatsapp-green-light rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                  <Wallet className="whatsapp-text w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SpendingChart />
          <TrendsChart />
        </div>

        {/* AI Insights */}
        <AIInsights />

        {/* Quick Actions */}
        <Card className="card-whatsapp mt-8 mb-8">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button
                onClick={() => openModal('income')}
                className="flex items-center justify-center p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors text-green-700 h-auto"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="font-medium text-sm sm:text-base">Nova Receita</span>
              </Button>
              <Button
                onClick={() => openModal('expense')}
                className="flex items-center justify-center p-3 sm:p-4 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors text-red-700 h-auto"
                variant="outline"
              >
                <Minus className="w-4 h-4 mr-2" />
                <span className="font-medium text-sm sm:text-base">Nova Despesa</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="card-whatsapp">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Transações Recentes</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {transactionsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="w-10 h-10 rounded-full mr-3" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))
            ) : recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((transaction: Transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mr-3`}>
                        <span className="text-sm">{getTransactionIcon(transaction.category)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{getRelativeTime(transaction.date)}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm mt-1">Comece adicionando sua primeira transação!</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Floating Action Button (Mobile) */}
      <Button
        onClick={() => openModal('income')}
        className="fixed bottom-6 right-6 w-14 h-14 whatsapp-green whatsapp-green-hover text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 md:hidden p-0"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
      />
    </div>
  );
}
