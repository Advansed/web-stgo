import React, { useCallback } from 'react';
import { 
    IonButton, 
    IonRefresher, 
    IonRefresherContent, 
    IonText
} from '@ionic/react';
import { InvoiceItem } from './InvoiceItem';
import styles from './InvoiceList.module.css';

export const InvoicesList: React.FC<any> = ({
    invoices,
    loading,
    refreshing,
    onRefresh,
    onInvoiceSelect,
    getInvoiceStatus,
    formatDate,
    formatPhone
}) => {


    const handleRefresh             = useCallback(async (event: CustomEvent) => {
        await onRefresh();
        event.detail.complete();
    }, [onRefresh]);


    const handleInvoiceSelect       = useCallback((invoiceId: string) => {
        onInvoiceSelect(invoiceId);
    }, [onInvoiceSelect]);


    const handleCall                = useCallback((phone: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (phone) {
            window.open(`tel:${phone}`);
        }
    }, []);

    const render                    = (invoices:any) => {
        let elem = <></>

        console.log("render", invoices) 
        for(let i = 0; i < invoices.length;i++){
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
                    />

                </>
        }

        return elem 
    }

    return (
        <div className={styles.invoicePage}>
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
    );
    
};

export default React.memo(InvoicesList);