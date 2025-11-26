// src/Store/licsStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { post } from './api';


interface LicsState {
  data:         any;
  item:         any;
  loading:      boolean;
}

interface LicsActions {
  setData:      ( data: any) => void;
  setItem:      ( item: any) => void;
  setLoading:   ( loading: boolean) => void;
  loadLics:     ( token: string) => any;
}

type LicsStore = LicsState & LicsActions;

// ============================================
// ZUSTAND STORE
// ============================================

export const useLicsStore = create<LicsStore>()(
  
  devtools(
    (set) => ({
      data:         [],
      loading:      false,

      setData:      (data) => set({ data }),
      setLoading:   (loading) => set({ loading }),

      loadLics:     async (token) => {
        set({ loading: true })

        try {
            const res = await post('get_lics', { token })
            console.log("lics", res.data)
            if (res.success) {
              set({ data: res.data })
              return res
            } else {
              return res  
            } 
        } catch (err:any) {
          return {success: false, message: "Ошибка получение данных"}
        } finally {
          set({ loading: false })
        }

      }

    }),
    { name: 'lics-store' }
  )
  
);


export const useData      = () => {
    const data    = useLicsStore( (state) => state.data );
    const setData = useLicsStore( (state) => state.setData );
    return { data, setData };
};


export const useLoading   = () => {
  const loading    = useLicsStore( (state) => state.loading );
  const setLoading = useLicsStore( (state) => state.setLoading );
  return { loading, setLoading };
};


 export const useGetLics    = () => {
    const loadLics = useLicsStore( (state) => state.data )    
    
    return loadLics

 };
