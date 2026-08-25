import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { isApiOk, getInvoices, setInvWorker } from './api';

/** Нормализация заявки 1С → канонические EN-поля для UI */
export const normalizeInvoice = (inv: any) => {
  const address = inv.address || inv.Адрес || { address: '', lat: 0, lon: 0 };
  const status = inv.status || inv.Статус;
  return {
    ...inv,
    id: inv.id || inv.Ссылка,
    address,
    status,
    number: inv.number || inv.Номер,
    date: inv.date || inv.Дата,
    applicant: inv.applicant || inv.Контрагент,
    phone: inv.phone || inv.Телефон,
    worker: inv.worker || inv.Работник,
    // dual-write для payload к 1С при необходимости
    Адрес: address,
    Статус: status,
  };
};

let loadInvoicesInFlight: Promise<any> | null = null;
let loadInvoicesToken: string | null = null;

interface InvoicesStore {
  data:         any[];
  loading:      boolean;
  setData:      (invoices: any[]) => void;
  setLoading:   (loading: boolean) => void;
  updateItem:   (updates: Partial<any>) => void;
  loadInvoices: (token: string, force?: boolean) => Promise<any>;
  assignWorker: (token: string, invoiceId: string, workerObj: any) => Promise<any>;
}

export const useInvoicesStore = create<InvoicesStore>()(
  devtools(
    (set, get) => ({
      data:    [],
      loading: false,

      setData:    (invoices) => set({ data: invoices }),
      setLoading: (loading) => set({ loading }),

      updateItem: (updates) => {
        const currentData = get().data;
        const newData = currentData.map((inv: any) => {
          if (inv.id === updates.id || inv.Ссылка === updates.id) {
            return { ...inv, ...updates };
          }
          return inv;
        });
        set({ data: newData });
      },

      loadInvoices: async (token, force = false) => {
        if (!force && loadInvoicesInFlight && loadInvoicesToken === token) {
          return loadInvoicesInFlight;
        }

        loadInvoicesToken = token;
        loadInvoicesInFlight = (async () => {
          set({ loading: true });
          try {
            const res = await getInvoices(token);
            if (isApiOk(res) || res.success) {
              const clean = (res.data || []).map(normalizeInvoice);
              set({ data: clean, loading: false });
            } else {
              set({ loading: false });
            }
            return res;
          } catch (e) {
            console.error(e);
            set({ loading: false });
            return { success: false, message: 'Ошибка сети' };
          } finally {
            loadInvoicesInFlight = null;
            loadInvoicesToken = null;
          }
        })();

        return loadInvoicesInFlight;
      },

      assignWorker: async (token, invoiceId, workerObj) => {
        try {
          const res = await setInvWorker({ token, id: invoiceId, worker: workerObj.id });

          if (res.success || isApiOk(res)) {
            const currentData = get().data;
            const newData = currentData.map((inv: any) => {
              if (inv.id === invoiceId || inv.Ссылка === invoiceId) {
                return {
                  ...inv,
                  worker: workerObj,
                  status: 'В работе',
                  Статус: 'В работе',
                };
              }
              return inv;
            });
            set({ data: newData });
          }
          return res;
        } catch (e) {
          console.error(e);
          return { success: false, message: 'Ошибка сети' };
        }
      },
    }),
    { name: 'invoices-store' }
  )
);

export const useInvoices = () => {
  const data         = useInvoicesStore((state) => state.data);
  const loading      = useInvoicesStore((state) => state.loading);
  const setData      = useInvoicesStore((state) => state.setData);
  const updateItem   = useInvoicesStore((state) => state.updateItem);
  const loadInvoices = useInvoicesStore((state) => state.loadInvoices);
  const assignWorker = useInvoicesStore((state) => state.assignWorker);
  return { data, loading, setData, updateItem, loadInvoices, assignWorker };
};
