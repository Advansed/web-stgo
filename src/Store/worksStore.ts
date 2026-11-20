import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getWorks, getWorkTypes, WorkKind, WorkType } from './api';

interface WorksStore {
  works: WorkType[];
  workTypes: WorkKind[];
  worksLoading: boolean;
  workTypesLoading: boolean;
  worksLoaded: boolean;
  workTypesLoaded: boolean;
  catalogToken: string | null;
  loadCatalog: (token: string) => Promise<void>;
  clear: () => void;
}

const emptyCatalog = {
  works: [] as WorkType[],
  workTypes: [] as WorkKind[],
  worksLoading: false,
  workTypesLoading: false,
  worksLoaded: false,
  workTypesLoaded: false,
  catalogToken: null as string | null,
};

let generation = 0;
let flight: { token: string; promise: Promise<void> } | null = null;

export const useWorksStore = create<WorksStore>()(
  devtools(
    (set, get) => ({
      ...emptyCatalog,

      clear: () => {
        generation += 1;
        flight = null;
        set({ ...emptyCatalog });
      },

      loadCatalog: (token) => {
        if (!token) return Promise.resolve();

        const current = get();
        const sameToken = current.catalogToken === token;
        if (sameToken && current.worksLoaded && current.workTypesLoaded) {
          return Promise.resolve();
        }
        if (flight?.token === token) return flight.promise;

        if (flight) {
          generation += 1;
          flight = null;
        }

        const gen = generation;
        const needWorks = !(sameToken && current.worksLoaded);
        const needTypes = !(sameToken && current.workTypesLoaded);

        const promise = (async () => {
          set({
            catalogToken: token,
            worksLoading: needWorks,
            workTypesLoading: needTypes,
            ...(sameToken
              ? {}
              : { works: [], workTypes: [], worksLoaded: false, workTypesLoaded: false }),
          });

          try {
            const [worksRes, typesRes] = await Promise.all([
              needWorks ? getWorks(token) : Promise.resolve(null),
              needTypes ? getWorkTypes(token) : Promise.resolve(null),
            ]);
            if (gen !== generation || get().catalogToken !== token) return;

            const next: Partial<WorksStore> = {};
            if (needWorks) {
              next.worksLoading = false;
              if (worksRes?.ok) {
                next.works = worksRes.data;
                next.worksLoaded = true;
              }
            }
            if (needTypes) {
              next.workTypesLoading = false;
              if (typesRes?.ok) {
                next.workTypes = typesRes.data;
                next.workTypesLoaded = true;
              }
            }
            set(next);
          } catch {
            if (gen === generation && get().catalogToken === token) {
              set({ worksLoading: false, workTypesLoading: false });
            }
          }
        })();

        flight = { token, promise };
        void promise.finally(() => {
          if (flight?.promise === promise) flight = null;
        });
        return promise;
      },
    }),
    { name: 'works-store' }
  )
);
