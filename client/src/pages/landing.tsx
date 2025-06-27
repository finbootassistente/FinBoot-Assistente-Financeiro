import { Bot, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center animate-scale-in">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 whatsapp-green rounded-full mx-auto flex items-center justify-center mb-4">
            <Bot className="text-white text-4xl w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FinBot</h1>
          <p className="text-gray-600">Seu assistente financeiro inteligente</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={handleLogin}
            className="w-full whatsapp-green whatsapp-green-hover text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg h-auto"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Entrar
          </Button>
          
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="w-full border-2 border-green-200 text-green-700 hover:bg-green-50 font-semibold py-4 px-6 rounded-xl transition-all duration-200 h-auto"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Criar Conta
          </Button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Controle suas finanças de forma simples e intuitiva</p>
        </div>
      </div>
    </div>
  );
}
