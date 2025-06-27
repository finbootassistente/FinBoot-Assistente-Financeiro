import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Download, Filter, Calendar } from "lucide-react";
import Header from "@/components/header";
import TransactionModal from "@/components/transaction-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDateTime, getCategoryIcon } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
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

  // Generate PDF export
  const exportToPDF = async () => {
    if (!filteredTransactions.length) {
      toast({
        title: "Nenhuma transação",
        description: "Não há transações para exportar.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      
      // Header
      pdf.setFontSize(20);
      pdf.text("FinBot - Relatório de Transações", 20, 30);
      
      pdf.setFontSize(12);
      pdf.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45);
      pdf.text(`Total de transações: ${filteredTransactions.length}`, 20, 55);
      
      // Summary
      const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      pdf.text(`Total de receitas: R$ ${totalIncome.toFixed(2)}`, 20, 70);
      pdf.text(`Total de despesas: R$ ${totalExpenses.toFixed(2)}`, 20, 80);
      pdf.text(`Saldo: R$ ${(totalIncome - totalExpenses).toFixed(2)}`, 20, 90);
      
      // Transactions table
      let yPos = 110;
      pdf.setFontSize(10);
      pdf.text("Data", 20, yPos);
      pdf.text("Tipo", 60, yPos);
      pdf.text("Descrição", 90, yPos);
      pdf.text("Categoria", 130, yPos);
      pdf.text("Valor", 170, yPos);
      
      yPos += 10;
      pdf.line(20, yPos - 5, 190, yPos - 5);
      
      filteredTransactions.forEach((transaction, index) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 30;
        }
        
        const date = new Date(transaction.date).toLocaleDateString('pt-BR');
        const type = transaction.type === 'income' ? 'Receita' : 'Despesa';
        const description = transaction.description.length > 15 
          ? transaction.description.substring(0, 15) + '...' 
          : transaction.description;
        
        pdf.text(date, 20, yPos);
        pdf.text(type, 60, yPos);
        pdf.text(description, 90, yPos);
        pdf.text(transaction.category, 130, yPos);
        pdf.text(`R$ ${parseFloat(transaction.amount).toFixed(2)}`, 170, yPos);
        
        yPos += 8;
      });
      
      pdf.save(`finbot-transacoes-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF exportado",
        description: "O relatório foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Enhanced filtering with date support
  const filteredTransactions = transactions ? transactions.filter((transaction: Transaction) => {
    const typeMatch = typeFilter === "all" || transaction.type === typeFilter;
    const categoryMatch = categoryFilter === "all" || transaction.category === categoryFilter;
    
    // Date filtering
    let dateMatch = true;
    const transactionDate = new Date(transaction.date);
    const today = new Date();
    
    switch (dateFilter) {
      case 'today':
        dateMatch = transactionDate.toDateString() === today.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateMatch = transactionDate >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        dateMatch = transactionDate >= monthAgo;
        break;
      case 'year':
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        dateMatch = transactionDate >= yearAgo;
        break;
      case 'custom':
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          dateMatch = transactionDate >= start && transactionDate <= end;
        }
        break;
      default:
        dateMatch = true;
    }
    
    return typeMatch && categoryMatch && dateMatch;
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Enhanced Filters */}
        <Card className="card-whatsapp mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros de Transação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="sm:col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Período
                </Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Últimos 7 dias</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="year">Último ano</SelectItem>
                    <SelectItem value="custom">Período personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {dateFilter === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Data Inicial</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Data Final</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="card-whatsapp">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <h3 className="text-lg font-semibold text-gray-800">
                Todas as Transações ({filteredTransactions.length})
              </h3>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={exportToPDF}
                  disabled={isExporting || filteredTransactions.length === 0}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isExporting ? 'Exportando...' : 'Exportar PDF'}
                </Button>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="whatsapp-green whatsapp-green-hover text-white transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </div>
            </div>
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
                <div key={transaction.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                        <span className="text-sm sm:text-lg">{getTransactionIcon(transaction.category)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate text-sm sm:text-base">{transaction.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500">
                          <span className="truncate">{transaction.category}</span>
                          <span className="hidden sm:inline mx-1">•</span>
                          <span className="text-xs">{formatDateTime(transaction.date)}</span>
                        </div>
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
