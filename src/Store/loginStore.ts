// stores/loginStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';


export const useLoginStore = create<any>()(
  persist(
    (set, get) => ({
      // Initial state
      auth:             false,
      user:             null,
      token:            null,
      isLoading:        false,

      setAuth:  ( auth: boolean) => set({ auth }),

      setUser:  ( data: any) => set({ user: data }),

      setToken:  ( token: string) => set({ token }),

      setLoading: (loading: boolean) => set({ isLoading: loading })

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

export const    useAuth = () => {
    const auth    = useLoginStore( (state) => state.auth );
    const setAuth = useLoginStore( (state) => state.setAuth );
    return { auth, setAuth };
};

export const    useToken = () => {
  const token    = useLoginStore( (state) => state.token );
  const setToken = useLoginStore( (state) => state.setToken );
  return { token, setToken };
};

export const    useUser = () => {
  const user    = useLoginStore( (state) => state.user );
  const setUser = useLoginStore( (state) => state.setUser );
  return { user, setUser };
};

export const    useLoading = () => {
  const loading    = useLoginStore( (state) => state.isLoading );
  const setLoading = useLoginStore( (state) => state.setLoading );
  return { loading, setLoading };
};
