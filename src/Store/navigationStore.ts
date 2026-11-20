// src/Store/navigationStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface WorkerData {
    id:             string;
    name:           string;
    status:         'available' | 'busy' | 'offline' | 'on_break';
    avatarUrl:      string;
    role:           string;
    rating:         number;
    in_work:        number;
    completed:      number;
    lat?:           number;
    lon?:           number;
    location_updated_at?: string;
}

export const useNavigationStore = create<any>()(
  devtools(
    (set) => ({

        currentRoute:         { route: '/invoices', page: 0 },
        history:              [{ route: '/invoices', page: 0 }],
        item:                 undefined,
        add:                  false,
        update:               1,
        workers:              [],

        setCurrentRoute:      (route) => set((state) => ({
            currentRoute: route,
            history: [...state.history, route]
        })),

        back: () => set((state) => {
            if (state.history.length > 1) {
                const newHistory = state.history.slice(0, -1);
                return {
                history: newHistory,
                currentRoute: newHistory[newHistory.length - 1]
                };
            }
            return state;
        }),

        setItem:                ( item ) => set({ item }),

        setAdd:                 ( add ) => set({ add }),

        setUpdate:              ( update ) => set({ update }),

        setWorkers:             ( workers ) => set({ workers })
    }),
    { name: 'navigation-store' }
  )
);

export const useRoutes  = (  ) => {
    const currentRoute          = useNavigationStore( (state) => state.currentRoute );
    const setRoute              = useNavigationStore( (state) => state.setCurrentRoute );
    const back                  = useNavigationStore( (state) => state.back );

    const goBack        = ( ) => back()

  return { currentRoute, setRoute, goBack };
};

export const useItem    = ( ) => {
    const item                  = useNavigationStore( (state) => state.item )
    const setItem               = useNavigationStore( (state) => state.setItem )

    return { item, setItem }
}

export const useAdd     = ( ) => {
    const add                  = useNavigationStore( (state) => state.add )
    const setAdd               = useNavigationStore( (state) => state.setAdd )

    return { add, setAdd }
}

export const useUpdate     = ( ) => {
    const update                  = useNavigationStore( (state) => state.update )
    const setUpdate               = useNavigationStore( (state) => state.setUpdate )

    return { update, setUpdate }
}

export const useWorkers    = ( ) => {
    const workers                  = useNavigationStore( (state) => state.workers )
    const setWorkers               = useNavigationStore( (state) => state.setWorkers )

    return { workers, setWorkers }
}


