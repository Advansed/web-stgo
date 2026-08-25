import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getLic, getLics, isApiOk, addLic as apiAddLic, delLic as apiDelLic } from './api'; 

let loadLicsInFlight: Promise<any> | null = null;
let loadLicsInFlightToken: string | null = null;

interface LicsState {
  data:         any;
  item:         any;
  loading:      boolean;
  
  setData:      ( data: any) => void;
  setItem:      ( item: any) => void;
  setLoading:   ( loading: boolean) => void;
  
  loadLics:     ( token: string) => Promise<any>;
  addLic:       ( token: string, lc: string, id: string) => Promise<any>;
  delLic:       ( token: string, lc: string) => Promise<any>;
  getLicByCode: ( token: string, code: string) => Promise<any>;
}

export const useLicsStore = create<LicsState>()(
  devtools(
    (set, get) => ({
      data:         [],
      loading:      false,
      item:         null,

      setData:      (data) => set({ data }),
      setItem:      (item) => set({ item }),
      setLoading:   (loading) => set({ loading }),

      loadLics:     async (token) => {
        if (loadLicsInFlight && loadLicsInFlightToken === token) {
          return loadLicsInFlight;
        }

        loadLicsInFlightToken = token;
        loadLicsInFlight = (async () => {
          set({ loading: true }); 
          try {
              const res = await getLics(token);

              if (res.ok) {
                const list = res.data || [];
                const uniqueList = list.filter(
                  (item: { code: string }, index: number, arr: { code: string }[]) =>
                    arr.findIndex((x) => x.code === item.code) === index
                );
                set({ data: uniqueList, loading: false });
              } else {
                console.warn('[LICS] Нет данных или ошибка:', res);
                set({ data: [], loading: false });
              }
              
              return res;
          } catch (err:any) {
            console.error('[LICS] Ошибка сети:', err);
            set({ loading: false });
            return {success: false, message: "Ошибка сети"}
          } finally {
            loadLicsInFlight = null;
            loadLicsInFlightToken = null;
          }
        })();

        return loadLicsInFlight;
      },

      addLic: async (token, lc, id) => {
        try {
            const res = await apiAddLic(token, lc, id);

            if (isApiOk(res) || res.success) {
                await get().loadLics(token);
                const found = get().data?.some((x: any) => String(x.code) === String(lc));
                if (!found) {
                  await new Promise((r) => setTimeout(r, 400));
                  await get().loadLics(token);
                }
            }
            return res;
        } catch (e) {
            console.error(e);
            return { success: false, message: 'Ошибка сети' };
        }
      },

      delLic: async (token, lc) => {
        try {
            const res = await apiDelLic(token, lc);
            
            if (isApiOk(res) || res.success) {
                await get().loadLics(token);
            }
            return res;
        } catch (e) {
            console.error(e);
            return { success: false, message: 'Ошибка сети' };
        }
      },

      getLicByCode: async (token, code) => getLic(token, code),
    }),
    { name: 'lics-store' }
  )
);

export const useLicsActions = () => {
    const { addLic, delLic, loadLics, getLicByCode } = useLicsStore.getState();
    return { addLic, delLic, loadLics, getLicByCode };
};

export const useData = () => useLicsStore(s => s.data);
export const useLicsLoading = () => useLicsStore(s => s.loading);
/** @deprecated конфликт с loginStore.useLoading */
export const useLoading = useLicsLoading;
