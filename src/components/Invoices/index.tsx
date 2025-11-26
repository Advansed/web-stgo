import React, { use, useEffect, useState } from 'react';
import { useHook } from './useHook';
import { InvoiceView } from './components/InvoiceView';
import { InvoiceActs } from './components/InvoiceActs';
import { InvoicePrintForm } from './components/InvoicePrintForm';
import { useNavigation } from './useNavigation';
import { useAdd, useItem } from '../../Store/navigationStore';
import InvMap from './components/InvoiceList/InvMap';


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
        get_inv_status
    } = useHook();


    const { item, setItem } = useItem()

    const [ view, setView ] = useState(false)

    const { navigation, navigateToPosition, goBack } = useNavigation()

    const { add } = useAdd();

    useEffect(()=>{
        console.log("refresshh")
        console.log("refres", invoices)
    },[add])

    const handleSelect = ( invoice: any) => {

        setItem( invoice );
        setView( true )
        // navigateToPosition( { position: 1, canCoBack: true } )

    }

    const renderCurrentPage = () => {
        
        switch (navigation.position) {

            case 0:
                return (
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
                );

            case 1:
                if (!item) {
                    return <div>Загрузка...</div>; // ✅ Заменить на это
                }

            case 2:
                if (!item) {
                    navigateToPosition({ position: 0, canCoBack: false });
                    return null;
                }
                return <InvoiceActs invoice={ item } />;

            case 3:
                if (!item) {
                    navigateToPosition(0);
                    return null;
                }
                return (
                    <InvoicePrintForm
                        invoice                 = { item }
                        formatDate              = { format_date }
                        formatPhone             = { format_phone }
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="invoices-page">
            {renderCurrentPage()}

        { item !== undefined && (
          <InvoiceView
                isOpen                  = { view }
                invoice                 = { item }
                invoiceStatus           = { get_inv_status( item ) }
                formatDate              = { format_date }
                formatPhone             = { format_phone }
                onNavigateToActs        = { () => navigateToPosition({ position: 2, canCoBack: true }) }
                onNavigateToPrint       = { () => navigateToPosition({ position: 3, canCoBack: true }) }
                onUpdateAddress         = { (id, address) => uppdate_address(id, address) }
                onClose                 = { () => { setView(false) }}
            />
        )}            


        </div>
    );
};

export default Invoices;