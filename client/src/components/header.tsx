import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Logo from "./logo";

interface HeaderProps {
  currentView: string;
}

export default function Header({ currentView }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'transactions', label: 'Transações', icon: '💸', path: '/transactions' },
  ];

  // Only show admin for admin users
  if (isAdmin) {
    navigation.push({ id: 'admin', label: 'Admin', icon: '⚙️', path: '/admin' });
  }

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false);
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all queries to clear cached user data
      queryClient.clear();
      // Force reload to redirect to auth page
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao sair",
        description: error.message || "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserDisplayName = () => {
    if (!user) return "Usuário";
    if (user.name) {
      return user.name;
    }
    return user.email || "Usuário";
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <Logo size="sm" showText={true} className="min-w-0" />
            </div>
            
            <nav className="hidden md:flex items-center space-x-4">
              {navigation.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  variant="ghost"
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-colors",
                    currentView === item.id
                      ? "whatsapp-green-light whatsapp-text"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Button>
              ))}
              
              <div className="flex items-center ml-4 space-x-2 border-l border-gray-200 pl-4">
                <span className="text-sm text-gray-600">Olá, {getUserDisplayName()}</span>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </nav>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  variant="ghost"
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg font-medium transition-colors justify-start",
                    currentView === item.id
                      ? "whatsapp-green-light whatsapp-text"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Button>
              ))}
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-4 py-2 text-sm text-gray-600">
                  Olá, {getUserDisplayName()}
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full text-left px-4 py-3 rounded-lg font-medium transition-colors justify-start text-gray-600 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
