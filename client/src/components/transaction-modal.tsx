import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save, Plus, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'income' | 'expense';
  transaction?: {
    id: number;
    type: 'income' | 'expense';
    description: string;
    amount: string;
    category: string;
    date: string;
  };
}

export default function TransactionModal({ isOpen, onClose, type = 'income', transaction }: TransactionModalProps) {
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(transaction?.type || type);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!transaction;

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

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type || transactionType,
      description: transaction?.description || "",
      amount: transaction?.amount || "" as any,
      category: transaction?.category || "",
      date: transaction?.date || new Date().toISOString().split('T')[0],
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/summary"] });
      
      toast({
        title: "Sucesso!",
        description: "Transação criada com sucesso.",
      });
      
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao criar transação: ${error.message || "Tente novamente."}`,
        variant: "destructive",
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await apiRequest("PUT", `/api/transactions/${transaction!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/summary"] });
      
      toast({
        title: "Sucesso!",
        description: "Transação atualizada com sucesso.",
      });
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar transação: ${error.message || "Tente novamente."}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    const formData = { ...data, type: transactionType };
    if (isEditing) {
      updateTransactionMutation.mutate(formData);
    } else {
      createTransactionMutation.mutate(formData);
    }
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setTransactionType(newType);
    form.setValue('type', newType);
  };

  // Reset form when modal opens with new type
  useState(() => {
    if (isOpen) {
      setTransactionType(type);
      form.setValue('type', type);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>
              {isEditing 
                ? `Editar ${transactionType === 'income' ? 'Receita' : 'Despesa'}`
                : `Nova ${transactionType === 'income' ? 'Receita' : 'Despesa'}`
              }
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Transaction Type Buttons */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  variant="outline"
                  className={cn(
                    "p-3 font-medium transition-colors",
                    transactionType === 'income'
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  )}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Receita
                </Button>
                <Button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  variant="outline"
                  className={cn(
                    "p-3 font-medium transition-colors",
                    transactionType === 'expense'
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  )}
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Despesa
                </Button>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Almoço no restaurante" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 whatsapp-green whatsapp-green-hover text-white"
                disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
              >
                {(createTransactionMutation.isPending || updateTransactionMutation.isPending) ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? "Atualizar" : "Salvar"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
