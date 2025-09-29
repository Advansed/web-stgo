// hooks/useLogin.ts
import { useCallback }          from 'react';
import { useLoginStore }        from '../../Store/loginStore';
import { LoginCredentials }     from '../../types/User';

export const useLogin = () => {
  const { 
    user, token, isAuthenticated, isLoading, error, login, logout
  } = useLoginStore();

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    return await login(credentials);
  }, [login]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);


  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  }, [user]);

  const isRole = useCallback((role: number): boolean => {
    return user?.role === role;
  }, [user]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login: handleLogin,
    logout: handleLogout,
    hasPermission,
    isRole,
    
    // Shortcuts
    isAdmin: isRole( 1 ),
    isDispatcher: isRole( 2),
    isTechnician: isRole( 3)
  };
};