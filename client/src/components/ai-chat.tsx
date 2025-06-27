import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Bot, User, X, MessageSquare, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  hasTransaction?: boolean;
  transactionType?: 'income' | 'expense';
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Olá! Sou o FinBot, seu assistente financeiro inteligente! 🤖💰\n\nPosso ajudar você a:\n• Registrar gastos e receitas automaticamente\n• Consultar seu saldo e extratos\n• Dar dicas personalizadas de economia\n\nTente falar comigo naturalmente:\n\"gastei 50 reais com mercado\"\n\"recebi 1200 do salário\"\n\"qual meu saldo?\"\n\"quanto gastei esse mês?\"",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", { message });
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString() + "_ai",
        content: data.response,
        isUser: false,
        timestamp: new Date(),
        hasTransaction: data.transactionCreated !== null,
        transactionType: data.transactionCreated?.type
      };
      setMessages(prev => [...prev, aiMessage]);

      // Se uma transação foi criada, atualizar os dados no cache
      if (data.transactionCreated) {
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/summary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions/recent'] });
        
        toast({
          title: "Transação registrada!",
          description: `${data.transactionCreated.type === 'income' ? 'Receita' : 'Despesa'} de R$ ${parseFloat(data.transactionCreated.amount).toFixed(2)} foi adicionada automaticamente.`,
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro no chat",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md h-[600px] flex flex-col bg-white dark:bg-gray-900 border-0 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-green-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>Assistente FinBot</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-green-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[80%] ${
                      message.isUser ? "flex-row-reverse" : "flex-row"
                    } items-end space-x-2`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={message.isUser ? "bg-blue-500 text-white" : "bg-green-500 text-white"}>
                        {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.isUser
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
                      }`}
                    >
                      {/* Indicador de transação criada */}
                      {message.hasTransaction && !message.isUser && (
                        <div className="mb-2 flex items-center gap-2">
                          <Badge 
                            variant={message.transactionType === 'income' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {message.transactionType === 'income' ? 'Receita' : 'Despesa'} Registrada
                          </Badge>
                          <DollarSign className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {formatDateTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="flex items-end space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-green-500 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: gastei 50 reais com mercado, qual meu saldo?, recebi 1200 do salário..."
                className="flex-1 rounded-full border-gray-300 dark:border-gray-600"
                disabled={chatMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || chatMutation.isPending}
                className="rounded-full bg-green-500 hover:bg-green-600 text-white"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}