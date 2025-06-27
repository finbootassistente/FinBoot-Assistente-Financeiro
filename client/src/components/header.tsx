import { useState } from "react";
import { useLocation } from "wouter";
import { Bot, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  currentView: string;
}

export default function Header({ currentView }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'transactions', label: 'Transações', icon: '💸', path: '/transactions' },
    { id: 'admin', label: 'Admin', icon: '⚙️', path: '/admin' },
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 whatsapp-green rounded-full flex items-center justify-center mr-3">
                <Bot className="text-white text-sm w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">FinBot</h1>
            </div>
            
            <nav className="hidden md:flex space-x-4">
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
            </div>
          </div>
        )}
      </header>
    </>
  );
}
