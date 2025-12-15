import React, { use, useEffect, useState } from 'react';
import { useHook } from './useHook';
import { InvoiceView } from './components/InvoiceView';
import { useItem, useUpdate } from '../../Store/navigationStore';
import InvMap from './components/InvoiceList/InvMap';
import { InvExecute } from './components/InvExecute';


declare global {
  interface Window {
    ymaps: any;
  }
}

const Invoices: React.FC = () => {
    
    const {
        invoices,
        loading,
        refreshData,
        format_phone,
        format_date,
        uppdate_address,
        upd_worker,
        get_inv_status
    } = useHook();

    const { update, setUpdate } = useUpdate();

    const { item, setItem } = useItem()

    const [ view, setView ] = useState(false)
    const [ exec, setExec ] = useState(false)
    
    useEffect(()=>{
        refreshData( update )
    },[ update ])

    const handleSelect = ( invoice: any) => {

        setItem( invoice );
        setView( true )

    }

    const handleUpdateAddress = async(id, address ) => {
        await uppdate_address(id, address )
        setUpdate( update + 1 );
    }
    const handleUpdateWorker = async(id, worker ) => {
        await upd_worker(id, worker )
        setUpdate( update + 1 );
    }

    return (
        <div className="invoices-page">
            
            <InvMap
                invoices            = { invoices }
                loading             = { loading }
                refreshing          = { loading }
                onRefresh           = { refreshData }
                onInvoiceSelect     = { handleSelect }
                getInvoiceStatus    = { get_inv_status }
                formatDate          = { format_date }
                formatPhone         = { format_phone }
                selectedInvoice     = { setItem }
                mapRouteData        = { item ? {
                    startCoords:    [ 55.751244, 37.618423 ], // Координаты склада
                    endCoords:      [ 55.751310, 37.618445 ], // Координаты клиента
                    licInfo:        item.cargoDetails
                } : null}
            />

        { item !== undefined && (
          <InvoiceView
                isOpen                  = { view }
                invoice                 = { item }
                invoiceStatus           = { get_inv_status( item ) }
                formatDate              = { format_date }
                formatPhone             = { format_phone }
                onNavigateToActs        = { () => { setExec( true ) } }
                onNavigateToPrint       = { () => { } }
                onUpdateAddress         = { handleUpdateAddress }
                onClose                 = { () => { setView(false) }}
            />
        )}            

        { item !== undefined && (
            <InvExecute
                invoice                 = { item }
                isOpen                  = { exec }
                onClose                 = { () => setExec( false ) }
                onAssignToExecutor      = { async (worker) => handleUpdateWorker(item.id, worker) }
            />
        )}            
        </div>
    );
};

export default Invoices;