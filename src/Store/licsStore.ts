// src/Store/licsStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';


interface LicsState {
  data:         any;
  item:         any;
  loading:      boolean;
}

interface LicsActions {
  setData:      ( data: any) => void;
  setItem:      ( item: any) => void;
  setLoading:   ( loading: boolean) => void;
}

type LicsStore = LicsState & LicsActions;

// ============================================
// ZUSTAND STORE
// ============================================

export const useLicsStore = create<LicsStore>()(
  devtools(
    (set) => ({
      data:         [],
      item:         undefined,
      loading:      false,

      setData:      (data) => set({ data }),
      setItem:      (item) => set({ item }),
      setLoading:   (loading) => set({ loading })

    }),
    { name: 'lics-store' }
  )
);


export const    useData = () => {
    const data    = useLicsStore( (state) => state.data );
    const setData = useLicsStore( (state) => state.setData );
    return { data, setData };
};

export const    useItem = () => {
    const item    = useLicsStore( (state) => state.item );
    const setItem = useLicsStore( (state) => state.setItem );
    return { item, setItem };
};


export const    useLoading = () => {
  const loading    = useLicsStore( (state) => state.loading );
  const setLoading = useLicsStore( (state) => state.setLoading );
  return { loading, setLoading };
};
