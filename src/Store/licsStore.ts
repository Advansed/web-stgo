import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { post } from './api'; 

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

      // 1. ПОЛУЧЕНИЕ
      loadLics:     async (token) => {
        set({ loading: true }); 
        try {
            console.log("🔄 [LICS] Загрузка списка...");
            const res = await post('get_lics', { token });
            
            // Проверяем и success: true, и error: false
            const isSuccess = res.success === true || res.error === false;

            if (isSuccess) {
              const list = res.data || [];
              console.log("✅ [LICS] Список получен:", list.length);
              set({ data: list });
            } else {
              console.warn("⚠️ [LICS] Нет данных или ошибка:", res);
              set({ data: [] });
            }
            
            set({ loading: false });
            return res;
        } catch (err:any) {
          console.error("❌ [LICS] Ошибка сети:", err);
          set({ loading: false });
          return {success: false, message: "Ошибка сети"}
        }
      },

      // 2. ДОБАВЛЕНИЕ (С ЗАДЕРЖКОЙ)
      addLic: async (token, lc, id) => {
        try {
            console.log("➕ [ADD] Отправка:", { lc, id });
            const res = await post('add_lic', { token, lc, id });
            console.log("➕ [ADD] Ответ:", res);

            if (res.success || res.error === false) {
                // === ВАЖНО: ЖДЕМ 1 СЕКУНДУ, ПОКА БАЗА СОХРАНИТ ===
                console.log("⏳ Ждем БД...");
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Теперь обновляем
                await get().loadLics(token);
            }
            return res;
        } catch (e) {
            console.error(e);
            return { success: false, message: 'Ошибка сети' };
        }
      },

      // 3. УДАЛЕНИЕ (ТОЖЕ С ЗАДЕРЖКОЙ)
      delLic: async (token, lc) => {
        try {
            const res = await post('del_lic', { token, lc });
            
            if (res.success || res.error === false) {
                // Ждем 500мс
                await new Promise(resolve => setTimeout(resolve, 500));
                await get().loadLics(token);
            }
            return res;
        } catch (e) {
            console.error(e);
            return { success: false, message: 'Ошибка сети' };
        }
      }
    }),
    { name: 'lics-store' }
  )
);

export const useLicsActions = () => {
    const { addLic, delLic, loadLics } = useLicsStore.getState();
    return { addLic, delLic, loadLics };
};

export const useData = () => useLicsStore(s => s.data);
export const useLoading = () => useLicsStore(s => s.loading);