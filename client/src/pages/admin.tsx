import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserPlus, TrendingUp, Search } from "lucide-react";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getRelativeTime } from "@/lib/utils";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.isAdmin !== "true")) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    activeToday: number;
    newThisMonth: number;
    retentionRate: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const getInitials = (user: User): string => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName || lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600', 
      'bg-purple-100 text-purple-600',
      'bg-red-100 text-red-600',
      'bg-yellow-100 text-yellow-600',
      'bg-indigo-100 text-indigo-600',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email || 'Usuário';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView="admin" />
      
      <div className="max-w-7xl mx-auto mobile-container py-6">
        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-whatsapp">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Usuários</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-800">{stats?.totalUsers || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="text-blue-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-whatsapp">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ativos Hoje</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{stats?.activeToday || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="text-green-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-whatsapp">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Novos (Mês)</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold whatsapp-text">{stats?.newThisMonth || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 whatsapp-green-light rounded-full flex items-center justify-center">
                  <UserPlus className="whatsapp-text w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-whatsapp">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Taxa Retenção</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-purple-600">{stats?.retentionRate || 0}%</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-purple-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="card-whatsapp">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Usuários do Sistema</h3>
            <div className="flex space-x-2 w-full sm:w-auto">
              <Input 
                type="text" 
                placeholder="Buscar usuário..." 
                className="flex-1 sm:w-64"
              />
              <Button className="whatsapp-green whatsapp-green-hover text-white px-4 py-2 rounded-lg transition-colors">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Skeleton className="w-10 h-10 rounded-full mr-3" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-4 w-32" />
                      </td>
                    </tr>
                  ))
                ) : users && users.length > 0 ? (
                  users.map((user: User) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getAvatarColor(getUserDisplayName(user))}`}>
                            <span className="text-sm font-medium">{getInitials(user)}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{getUserDisplayName(user)}</div>
                            <div className="text-sm text-gray-500">#{user.id.toString().padStart(3, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="secondary"
                          className={user.isAdmin === 'true' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                        >
                          {user.isAdmin === 'true' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.updatedAt ? getRelativeTime(user.updatedAt) : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <p>Nenhum usuário encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {users && users.length > 0 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{users.length}</span> de <span className="font-medium">{users.length}</span> usuários
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>Anterior</Button>
                <Button className="whatsapp-green text-white" size="sm">1</Button>
                <Button variant="outline" size="sm" disabled>Próximo</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
