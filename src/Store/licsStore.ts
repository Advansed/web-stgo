import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
// ВАЖНО: Импортируем getData (V2 API)
import { post, getData } from './api'; 

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

export const useLicsStore = create<LicsStore>()(
  devtools(
    (set) => ({
      data:         [],
      loading:      false,
      item:         null,

      setData:      (data) => set({ data }),
      setItem:      (item) => set({ item }),
      setLoading:   (loading) => set({ loading }),

      loadLics:     async (token) => {
        // Убрал setLoading(true), чтобы лишний раз не дергать перерисовку родителя
        try {
            // ФИКС: getData вместо post (так как метод get_lics в V2)
            const res = await getData('get_lics', { token })
            
            if (res.success) {
              set({ data: res.data })
              return res
            } else {
              set({ data: [] }) 
              return res  
            } 
        } catch (err:any) {
          return {success: false, message: "Ошибка сети"}
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

// ВОЗВРАЩАЕМ ФУНКЦИЮ (LoadLics), А НЕ ДАННЫЕ
export const useGetLics    = () => {
    const loadLics = useLicsStore( (state) => state.loadLics )    
    return loadLics
};