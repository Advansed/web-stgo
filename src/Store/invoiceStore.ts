// src/Store/invoicesStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface InvoicesStore {
  data:     any;
  setData: (invoices: any) => void;
}
// ============================================
// ZUSTAND STORE
// ============================================

export const useInvoicesStore = create<InvoicesStore>()(
  devtools(
    (set) => ({

      data:             [],

      setData:          ( invoices)  => set({ data: invoices }),
    
    }),
    { name: 'invoices-store' }
  )
);

// ============================================
// СЕЛЕКТИВНЫЕ ХУКИ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ
// ============================================

export const useInvoices                = () => {
  const data      = useInvoicesStore( (state) => state.data )
  const setData   = useInvoicesStore( (state) => state.setData )

  return { data, setData }
};


// ============================================
// ACTIONS (совместимость)
// ============================================

