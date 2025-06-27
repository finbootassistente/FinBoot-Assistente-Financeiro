import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Header from "@/components/header";
import TransactionModal from "@/components/transaction-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDateTime, getCategoryIcon } from "@/lib/utils";
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const categories = [
    "Alimentação",
    "Transporte", 
    "Entretenimento",
    "Trabalho",
    "Freelance",
    "Saúde",
    "Educação",
    "Casa",
    "Outros"
  ];

  const filteredTransactions = transactions ? transactions.filter((transaction: Transaction) => {
    const typeMatch = typeFilter === "all" || transaction.type === typeFilter;
    const categoryMatch = categoryFilter === "all" || transaction.category === categoryFilter;
    return typeMatch && categoryMatch;
  }) : [];

  const getTransactionIcon = (category: string) => {
    const iconName = getCategoryIcon(category);
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
      <Header currentView="transactions" />
      
      <div className="max-w-7xl mx-auto mobile-container py-6">
        {/* Filters */}
        <Card className="card-whatsapp mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Data Inicial</Label>
                <Input type="date" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Data Final</Label>
                <Input type="date" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="card-whatsapp">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Todas as Transações ({filteredTransactions.length})
            </h3>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="whatsapp-green whatsapp-green-hover text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </div>
          
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="w-12 h-12 rounded-full mr-4" />
                      <div>
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32 mb-1" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction: Transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mr-4`}>
                        <span className="text-lg">{getTransactionIcon(transaction.category)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.category} • {formatDateTime(transaction.date)}
                        </p>
                        <Badge 
                          variant="secondary"
                          className={`mt-1 ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm mt-1">Ajuste os filtros ou adicione uma nova transação</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Floating Action Button (Mobile) */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 whatsapp-green whatsapp-green-hover text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 md:hidden p-0"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
