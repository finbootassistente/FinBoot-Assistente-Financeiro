import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDateTime, getCategoryIcon } from "@/lib/utils";
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

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

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/transactions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/summary"] });
      
      toast({
        title: "Sucesso!",
        description: "Transação excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir transação: ${error.message || "Tente novamente."}`,
        variant: "destructive",
      });
    },
  });

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteTransactionMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

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
                    <div className="flex items-center flex-1">
                      <div className={`w-12 h-12 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mr-4`}>
                        <span className="text-lg">{getTransactionIcon(transaction.category)}</span>
                      </div>
                      <div className="flex-1">
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
                    <div className="flex items-center space-x-3">
                      <div className="text-right mr-3">
                        <span className={`font-semibold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTransaction(transaction)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          disabled={deleteTransactionMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
        onClose={handleCloseModal}
        transaction={editingTransaction ? {
          id: editingTransaction.id,
          type: editingTransaction.type as 'income' | 'expense',
          description: editingTransaction.description,
          amount: editingTransaction.amount,
          category: editingTransaction.category,
          date: editingTransaction.date.toString().split('T')[0]
        } : undefined}
      />
    </div>
  );
}
