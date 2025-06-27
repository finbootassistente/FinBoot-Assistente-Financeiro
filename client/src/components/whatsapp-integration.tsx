import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WhatsAppIntegration() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLinked, setIsLinked] = useState(false);
  const { toast } = useToast();

  const linkMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest("POST", "/api/whatsapp/link", { phoneNumber: phone });
      return response.json();
    },
    onSuccess: (data) => {
      setIsLinked(true);
      toast({
        title: "WhatsApp vinculado!",
        description: data.message,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao vincular WhatsApp",
        description: error.message || "Verifique o formato do número e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    // Formatar número para incluir código do país se não tiver
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    linkMutation.mutate(formattedPhone);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          Integração WhatsApp
        </CardTitle>
        <CardDescription>
          Vincule seu WhatsApp para usar o FinBot diretamente nas suas conversas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isLinked ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Digite seu número com DDD (ex: 11999999999) para vincular ao WhatsApp Business.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Número do WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="11999999999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    disabled={linkMutation.isPending}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Formato: DDD + número (sem símbolos)
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!phoneNumber.trim() || linkMutation.isPending}
              >
                {linkMutation.isPending ? "Vinculando..." : "Vincular WhatsApp"}
              </Button>
            </form>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Como funciona:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Vincule seu número aqui</li>
                <li>• Envie mensagens como "gastei 50 reais com mercado"</li>
                <li>• Receba confirmações automáticas</li>
                <li>• Consulte saldo com "qual meu saldo?"</li>
              </ul>
            </div>
          </>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ WhatsApp vinculado com sucesso! Agora você pode enviar comandos financeiros diretamente pelo WhatsApp.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Comandos disponíveis:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Registrar gastos:</strong> "gastei 50 reais com mercado"</p>
            <p><strong>Registrar receitas:</strong> "recebi 1200 do salário"</p>
            <p><strong>Consultar saldo:</strong> "qual meu saldo?"</p>
            <p><strong>Ver extrato:</strong> "extrato do mês"</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
          <div className="text-center text-sm text-gray-600">
            <p>Dúvidas ou suporte?</p>
            <a 
              href="mailto:finbootassistente@gmail.com" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              finbootassistente@gmail.com
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}