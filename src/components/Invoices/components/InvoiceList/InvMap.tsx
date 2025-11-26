import React, { useCallback } from 'react'; 
import { 
    IonButton, 
    IonRefresher, 
    IonRefresherContent, 
    IonText 
} from '@ionic/react'; 
import styles from './InvoiceList.module.css'; 
import InvoiceItem from './InvoiceItem'; 
import Maps from '../../../Maps/Maps';

export const InvMap: React.FC<any> = ({ 
    invoices, 
    loading, 
    refreshing, 
    onRefresh, 
    onInvoiceSelect, 
    getInvoiceStatus, 
    formatDate, 
    formatPhone, 
    selectedInvoice, // Выбранная заявка для отображения на карте 
    mapRouteData // Данные для построения маршрута на карте 
}) => { 

    const handleRefresh = useCallback(async (event: CustomEvent) => { 
        await onRefresh(); 
        event.detail.complete(); 
    }, [onRefresh]); 

    const handleInvoiceSelect = useCallback((invoiceId: string) => { 
        onInvoiceSelect(invoiceId); 
    }, [onInvoiceSelect]); 

    const handleCall = useCallback((phone: string, event: React.MouseEvent) => { 
        event.stopPropagation(); 
        if (phone) { 
            window.open(`tel:${phone}`); 
        } 
    }, []); 

    const render = (invoices: any) => { 
        let elem = <></> 
        
        for(let i = 0; i < invoices.length; i++){ 
            const invoice = invoices[i] 
            if(invoice) 
                elem = <> 
                    { elem } 
                    <InvoiceItem 
                        key         = { invoice?.Ссылка } 
                        invoice     = { invoice } 
                        status      = { getInvoiceStatus(invoice) } 
                        onSelect    = { handleInvoiceSelect } 
                        onCall      = { handleCall } 
                        formatDate  = { formatDate } 
                        formatPhone = { formatPhone } 
                        // isSelected  = { selectedInvoice?.id === invoice?.Ссылка } // Подсветка выбранной заявки 
                    /> 
                </> 
        } 
        return elem 
    } 

    return ( 
        <div className={styles.invoicePageWithMap}> 
            {/* Левая часть - список заявок */} 
            <div className={styles.invoicesPanel}> {/* ДОБАВЛЕН КЛАСС */}
                <div className={styles.invoicePageHeader}> 
                    <h2 className={styles.invoicePageTitle}>Заявки</h2> 
                    <p className={styles.invoicePageSubtitle}>Всего: {invoices.length}</p> 
                </div> 

                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}> 
                    <IonRefresherContent /> 
                </IonRefresher> 

                <div className={styles.invoicePageContent}> 
                    {loading && !refreshing ? ( 
                        <div className={styles.loadingState}> 
                            <IonText color="medium">Загрузка заявок...</IonText> 
                        </div> 
                    ) : invoices.length === 0 ? ( 
                        <div className={styles.emptyState}> 
                            <IonText color="medium">Нет заявок</IonText> 
                            <IonButton fill="clear" onClick={onRefresh}> 
                                Обновить 
                            </IonButton> 
                        </div> 
                    ) : ( 
                        <div className={styles.invoicesList}> 
                            { render(invoices) } 
                        </div> 
                    )} 
                </div> 
            </div> 

            {/* Правая часть - Яндекс карта */} 
            <div className={styles.mapPanel}> {/* ДОБАВЛЕН КЛАСС */}
                    <Maps
                        invoices = { invoices }
                    /> 
            </div> 
        </div> 
    ); 
}; 

export default React.memo( InvMap );