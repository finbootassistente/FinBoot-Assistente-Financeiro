import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, UserPlus, Activity } from "lucide-react";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, getRelativeTime } from "@/lib/utils";
import type { User } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user, isAdmin } = useAuth();

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
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
  }, [isAuthenticated, authLoading, isAdmin, toast]);

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
    if (user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      } else {
        return user.name[0].toUpperCase();
      }
    } else if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = (user: User): string => {
    if (user.name) {
      return user.name;
    } else {
      return user.email || 'Usuário';
    }
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView="admin" />
      
      <div className="max-w-7xl mx-auto mobile-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-2">Gerencie usuários e monitore estatísticas do sistema</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">usuários registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos Hoje</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.activeToday || 0}
              </div>
              <p className="text-xs text-muted-foreground">usuários ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos este Mês</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.newThisMonth || 0}
              </div>
              <p className="text-xs text-muted-foreground">novos usuários</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.retentionRate || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">usuários retornaram</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <p className="text-sm text-gray-600">
              {usersLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${users?.length || 0} usuários registrados no total`
              )}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Usuário</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Tipo</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Cadastro</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Último Acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Skeleton className="w-10 h-10 rounded-full mr-3" />
                            <div>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-6 w-16" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-6 py-4">
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
                              <span className="text-sm font-medium text-white">{getInitials(user)}</span>
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
                            className={user.isAdmin ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                          >
                            {user.isAdmin ? 'Admin' : 'Usuário'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.updatedAt ? getRelativeTime(user.updatedAt) : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}