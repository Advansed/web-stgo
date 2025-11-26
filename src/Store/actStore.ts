// src/Store/actsStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ActCompletedData, ActPlombData, HouseInspectData } from './types'; // путь поправьте

// ============================================
// ТИПЫ STORE
// ============================================
interface ActsState {

    actComplete:                  ActCompletedData;

    actHouseInspect:              HouseInspectData;

    actPlomb:                     ActPlombData; // НОВЫЙ

    loading:                      boolean;
  
    saving:                       boolean;

}

interface ActsActions {
  setData:                        ( type, data: any)  => void;
  setLoading:                     ( loading: boolean) => void;
  setSaving:                      ( saving: boolean)  => void;
  reset:                          ( type: number )    => void
  setField:                       <K extends keyof any>(
    type:     number,
    field:    K,
    value:    any
  ) => void;
}

type ActsStore = ActsState & ActsActions;


export const initActCompleteData: ActCompletedData = {
  id:                             '',
  invoice_id:                     '',
  act_number:                     '',
  act_date:                       new Date().toISOString().split('T')[0],
  executor_name:                  '',
  executor_position:              '',
  client_name:                    '',
  address:                        '',
  work_description:               '',
  equipment_used:                 '',
  work_started_date:              new Date().toISOString().split('T')[0],
  work_completed_date:            new Date().toISOString().split('T')[0],
  quality_assessment:             '',
  defects_found:                  '',
  recommendations:                '',
  executor_signature:             '',
  client_signature:               '',
  representative_signature:       '',
  notes:                          ''
};

export const initialActHouseInspect: HouseInspectData = {
  id:                              undefined,
  invoice_id:                      undefined,
  act_number:                      '',
  act_date:                        new Date().toISOString().split('T')[0],
  act_time:                        new Date().toTimeString().slice(0, 5),
  account_number:                  '',
  address:                         '',
  street:                          '',
  house:                           '',
  apartment:                       '',
  organization_representative:     '',
  subscriber_name:                 '',
  subscriber_document:             '',
  subscriber_representative_name:  '',
  subscriber_representative_document: '',
  witness_name:                    '',
  witness_document:                '',
  violations_found:                '',
  living_area:                     undefined,
  non_living_area:                 undefined,
  residents_count:                 undefined,
  subscriber_opinion:              '',
  notes:                           '',
  meters:                          []
};

export const initialActPlomb: ActPlombData = {
  id:                       undefined,
  invoice_id:               undefined,
  act_number:               '',
  act_date:                 new Date().toISOString().split('T')[0],
  subscriber_name:          '',
  address:                  '',
  street:                   '',
  house:                    '',
  apartment:                '',
  usd_representative:       '',
  notes:                    '',
  meters:                   [{
    meter_number:           '',
    seal_number:            '',
    current_reading:        '',
    meter_type:             '',
    notes:                  '',
    sequence_order:         1
  }],
  recipient_signature:      '',
  receipt_date:             '',
  created_at:               '',
  updated_at:               ''
};

export const useActsStore = create<ActsStore>()(

  devtools((set) => ({
    
    actComplete:            { ...initActCompleteData },
    
    actHouseInspect:        initialActHouseInspect,

    actPlomb:               initialActPlomb,

    errors:                 {},
    loading:                false,
    saving:                 false,

    setData:                ( type, data ) => {
      switch( type ){
        case 0:     set({ actComplete: data });break;
        case 1:     set({ actHouseInspect: data });break;
        case 2:     set({ actPlomb: data });break;
        default: break;
      }
      
    },
    
    setLoading:             (loading) => set({ loading }),
    
    setField:               ( type, field, value) => {
      switch( type ) {
        
        case 0: set((state) => ({
                    actComplete: { ...state.actComplete, [field]: value }
                })); break;
        
        case 1: set((state) => ({
                    actHouseInspect: { ...state.actHouseInspect, [field]: value }
                })); break;
        
        case 2: set((state) => ({
                    actPlomb: { ...state.actPlomb, [field]: value }
                })); break;
        
        default: break;

      }
    },
    
    reset:       (type: number) => {
      switch( type ) {
        
        case 0: set({ actComplete: initActCompleteData })
        
        case 1: set({ actHouseInspect: initialActHouseInspect })

        case 2: set({ actPlomb: initialActPlomb })

      }
      
    }

  }), { name: 'acts-store' })

);


export const actsActions = {

  setActCompleteData:       ( data: ActCompletedData) => { useActsStore.getState().setData(0, data) },
  setActCompleteField:      < K extends keyof any >( field: K, value: any ) => useActsStore.getState().setField(0, field, value),
  resetActComplete:         ( ) => useActsStore.getState().reset( 0 ),

  setData:                  (type: number, data: HouseInspectData) => { useActsStore.getState().setData(type, data) },
  setField:                 <K extends keyof any>(type: number, field: K, value: any) => useActsStore.getState().setField(type, field, value),
  reset:                    (type: number) => useActsStore.getState().reset( type ),

  setLoading:               ( loading: boolean ) => useActsStore.getState().setLoading( loading )

};
