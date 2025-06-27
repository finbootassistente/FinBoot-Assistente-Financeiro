import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: adminStatus, isLoading: isAdminLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/is-admin"],
    retry: false,
    enabled: !!user, // Only check admin status if user is authenticated
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: adminStatus?.isAdmin || false,
    isAdminLoading,
  };
}