// stores/loginStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginCredentials, AuthState } from '../types/User';
import { login } from './api';


interface LoginStore extends AuthState {
    auth:               boolean;
    login:              (credentials: LoginCredentials) => Promise<boolean>;
    logout:             () => void;
    setLoading:         (loading: boolean) => void;
}

export const useLoginStore = create<LoginStore>()(
  persist(
    (set, get) => ({
      // Initial state
      auth:             false,
      user:             null,
      token:            null,
      isAuthenticated:  false,
      isLoading:        false,
      error:            null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('login', credentials)
          const res = await login( credentials.username, credentials.password )
          
            if(res.success){
                set({
                    auth:               true,
                    user:               res.data,
                    token:              res.data.token,
                    isAuthenticated:    true,
                    isLoading:          false,
                    error:              null
                });

                return true
            } else {

                return false

            }

        } catch (error:any) {
          set({ 
            isLoading: false, 
          });
            

          return false
        }
      },

      logout: () => {
        set({
          user:             null,
          token:            null,
          isAuthenticated:  false,
          isLoading:        false,
          error:            null
        });
        
        // Очищаем rememberMe
        localStorage.removeItem('ads_rememberMe');
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }

    }),
    {
      name: 'ads-auth-storage',
      partialize: (state) => ({ 
        user:             state.user,
        token:            state.token,
        isAuthenticated:  state.isAuthenticated
      })
    }
  )
);

export const useAuth = () => useLoginStore((state) => state.auth);