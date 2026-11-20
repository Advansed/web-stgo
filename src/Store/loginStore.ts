// stores/loginStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Drop a previous session before hydration so a saved token cannot sign the user in.
if (typeof window !== 'undefined') {
  window.localStorage.removeItem('ads-auth-storage');
}

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

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      logout: () => set({ auth: false, token: null, user: null }),

    }),
    {
      name: 'ads-auth-storage',
      partialize: (state) => ({ 
        user:  state.user,
        token: state.token,
        auth:  state.auth,
      }),
      // A stored token must not open the app. Login is only the form button.
      merge: (_persistedState, currentState) => ({
        ...currentState,
        auth: false,
        token: null,
        user: null,
      }),
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
