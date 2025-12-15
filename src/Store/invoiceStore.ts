// src/Store/invoicesStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface InvoicesStore {
  update:     number
  data:       any;
  setData:    (invoices: any) => void;
  setUpdate:  ( upd: number) => void;
}
// ============================================
// ZUSTAND STORE
// ============================================

export const useInvoicesStore = create<InvoicesStore>()(
  devtools(
    (set) => ({

      update:           1,  

      data:             [],

      setData:          ( invoices)  => set({ data: invoices }),

      setUpdate:        ( upd ) => set({ update: upd })
    
    }),
    { name: 'invoices-store' }
  )
);

// ============================================
// СЕЛЕКТИВНЫЕ ХУКИ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ
// ============================================

export const useInvoices                = () => {
  const update      = useInvoicesStore( (state) => state.update)
  const data        = useInvoicesStore( (state) => state.data )
  const setData     = useInvoicesStore( (state) => state.setData )
  const setUpdate   = useInvoicesStore( (state) => state.setUpdate )
  return { data, setData, update, setUpdate }
};


// ============================================
// ACTIONS (совместимость)
// ============================================

