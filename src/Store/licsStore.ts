import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getLic, getLics, isApiOk, addLic as apiAddLic, delLic as apiDelLic } from './api';

let loadLicsInFlight: Promise<any> | null = null;
let loadLicsInFlightToken: string | null = null;

interface LicsState {
  data:         any[];
  item:         any;
  loading:      boolean;

  setData:      ( data: any) => void;
  setItem:      ( item: any) => void;
  setLoading:   ( loading: boolean) => void;

  loadLics:     ( token: string, force?: boolean) => Promise<any>;
  addLic:       ( token: string, lc: string, id: string) => Promise<any>;
  delLic:       ( token: string, lc: string) => Promise<any>;
  getLicByCode: ( token: string, code: string) => Promise<any>;
}

const uniqByCode = (list: any[]) =>
  list.filter(
    (item: { code: string }, index: number, arr: { code: string }[]) =>
      arr.findIndex((x) => String(x.code) === String(item.code)) === index
  );

export const useLicsStore = create<LicsState>()(
  devtools(
    (set, get) => ({
      data:         [],
      loading:      false,
      item:         null,

      setData:      (data) => set({ data }),
      setItem:      (item) => set({ item }),
      setLoading:   (loading) => set({ loading }),

      loadLics:     async (token, force = false) => {
        if (!force && loadLicsInFlight && loadLicsInFlightToken === token) {
          return loadLicsInFlight;
        }

        const hasData = Array.isArray(get().data) && get().data.length > 0;
        loadLicsInFlightToken = token;
        loadLicsInFlight = (async () => {
          if (!hasData) set({ loading: true });
          try {
              const res = await getLics(token);

              if (res.ok) {
                const list = res.data || [];
                set({ data: uniqByCode(list), loading: false });
              } else {
                console.warn('[LICS] Нет данных или ошибка:', res);
                set({ loading: false, ...(hasData ? {} : { data: [] }) });
              }

              return res;
          } catch (err: any) {
            console.error('[LICS] Ошибка сети:', err);
            set({ loading: false });
            return { success: false, message: 'Ошибка сети' };
          } finally {
            loadLicsInFlight = null;
            loadLicsInFlightToken = null;
          }
        })();

        return loadLicsInFlight;
      },

      addLic:       async (token, lc, id) => {
        try {
            const res = await apiAddLic(token, lc, id);

            if (isApiOk(res) || res.success) {
                const exists = get().data?.some((x: any) => String(x.code) === String(lc));
                if (!exists) {
                  const licRes = await getLic(token, lc);
                  const card = licRes?.ok && licRes.data
                    ? { ...licRes.data, id, code: lc }
                    : { id, code: lc, name: '', address: '', debts: [] };
                  set({ data: uniqByCode([...get().data, card]) });
                }
                void get().loadLics(token);
            }
            return res;
        } catch (e) {
            console.error(e);
            return { success: false, message: 'Ошибка сети' };
        }
      },

      delLic:       async (token, lc) => {
        const prev = get().data || [];
        const next = prev.filter((x: any) => String(x.code) !== String(lc));
        set({ data: next });
        if (String(get().item?.code) === String(lc)) {
          set({ item: null });
        }

        try {
            const res = await apiDelLic(token, lc);

            if (!(isApiOk(res) || res.success)) {
              set({ data: prev });
            }
            return res;
        } catch (e) {
            console.error(e);
            set({ data: prev });
            return { success: false, message: 'Ошибка сети' };
        }
      },

      getLicByCode: async (token, code) => getLic(token, code),
    }),
    { name: 'lics-store' }
  )
);

export const useLicsActions = () => {
    const addLic = useLicsStore((s) => s.addLic);
    const delLic = useLicsStore((s) => s.delLic);
    const loadLics = useLicsStore((s) => s.loadLics);
    const getLicByCode = useLicsStore((s) => s.getLicByCode);
    return { addLic, delLic, loadLics, getLicByCode };
};

export const useData = () => useLicsStore(s => s.data);
export const useLicsLoading = () => useLicsStore(s => s.loading);
/** @deprecated конфликт с loginStore.useLoading */
export const useLoading = useLicsLoading;
