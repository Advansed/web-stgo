// InvoiceView.tsx
import React, { useCallback, useState } from 'react';
import { 
  IonButton, 
  IonCard, 
  IonChip, 
  IonIcon, 
  IonItem, 
  IonLabel, 
  IonList, 
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonButtons
} from '@ionic/react';
import { 
  callOutline, 
  locationOutline, 
  personCircleOutline, 
  searchOutline, 
  checkmarkCircleOutline, 
  warningOutline, 
  alertCircleOutline, 
  documentTextOutline,
  calendarOutline, 
  codeWorkingOutline, 
  ellipsisHorizontalOutline,
  printOutline,
  documentsOutline,
  closeOutline
} from 'ionicons/icons';
import styles from './InvoiceView.module.css';
import { AddressForm } from '../../Lics/components/FindAddress/FindAddress';
import { FindLics } from '../../Lics';


interface InvoiceStatus {
  color: 'primary' | 'success' | 'warning' | 'danger' | 'medium';
  text: string;
}

interface InvoiceViewProps {
  invoice: any;
  invoiceStatus: InvoiceStatus;
  formatDate: (dateString: string) => string;
  formatPhone?: (phone: string) => string;
  onNavigateToActs: () => void;
  onNavigateToPrint: () => void;
  onUpdateAddress?: (invoiceId: string, newAddress: string) => Promise<{success: boolean, message?: string}>;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  invoice,
  invoiceStatus,
  formatDate,
  formatPhone,
  onNavigateToActs,
  onNavigateToPrint,
  onUpdateAddress,
  isOpen,
  onClose
}) => {
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isAddressSearchModalOpen, setIsAddressSearchModalOpen] = useState(false);
  const [isAccountSearchModalOpen, setIsAccountSearchModalOpen] = useState(false);

  const handleCall = useCallback(() => {
    if (!invoice.Телефон) return;
    
    try {
      window.open(`tel:${invoice.Телефон}`);
    } catch (error) {
      console.error('Ошибка при попытке звонка:', error);
    }
  }, [invoice.Телефон]);

  console.log('view', invoice )

  const handleAddressSearch = useCallback(() => {
    console.log( "current address", invoice.Адрес.address )
    setIsAddressSearchModalOpen(true);
  }, []);

  const handleAccountSearch = useCallback(() => {
    setIsAccountSearchModalOpen(true);
  }, []);

  const handleAddressUpdate = useCallback(async (newAddress: any) => {
    if (!onUpdateAddress) return;
    
    setIsUpdatingAddress(true);
    try {
      const result = await onUpdateAddress(invoice.Ссылка, newAddress);
      if (result.success) {
        setIsAddressSearchModalOpen(false);
      }
    } catch (error) {
      console.error('Ошибка обновления адреса:', error);
    } finally {
      setIsUpdatingAddress(false);
    }
  }, [onUpdateAddress, invoice.Ссылка]);

  const getStatusIcon = () => {
    switch (invoiceStatus?.color) {
      case 'success': return checkmarkCircleOutline;
      case 'warning': return warningOutline;
      case 'danger': return alertCircleOutline;
      default: return alertCircleOutline;
    }
  };

  const getStatusColor = () => {
    return invoiceStatus?.color || 'medium';
  };

  const getStatusClass = () => {
    return `status${invoiceStatus?.color.charAt(0).toUpperCase() + invoiceStatus?.color.slice(1)}`;
  };

  const getFullAddress = () => {
    return (invoice.Адрес as any).address;
  };

  const getStatusText = () => {
    if (invoice.ФлагВыполнения === 1) return 'Выполнена';
    if (invoice.Просрочена === 1) return 'Просрочена';
    return 'В работе';
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose}
      className={styles.invoiceModal}
    >
      <IonHeader className={styles.modalHeader}>
        <IonToolbar className={styles.modalToolbar}>
          <IonButtons slot="start">
            <IonButton 
              onClick={onClose}
              className={styles.closeButton}
            >
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle className={styles.modalTitle}>Детали заявки</IonTitle>
          <IonButtons slot="end">
            <IonButton 
              onClick={onNavigateToPrint}
              className={styles.printButton}
            >
              <IonIcon icon={printOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className={styles.modalContent}>
        <div className={styles.invoiceContainer}>
          {/* Заголовок карточки */}
          <div className={styles.invoiceHeader}>
            <div className={styles.invoiceTitle}>
              <h2>#{invoice.Номер.trim()}</h2>
              <p className={styles.invoiceSubtitle}>
                {formatDate(invoice.Дата)}
              </p>
            </div>
            <IonChip 
              color={getStatusColor()} 
              className={`${styles.statusChip} ${styles[getStatusClass()]}`}
            >
              <IonIcon icon={getStatusIcon()} />
              {getStatusText()}
            </IonChip>
          </div>

          {/* Основная информация */}
          <IonList className={styles.invoiceList}>
            {/* Адрес */}
            <IonItem className={styles.invoiceItem}>
              <IonIcon icon={locationOutline} slot="start" />
              <IonLabel>
                <div className={styles.itemHeader}>Адрес</div>
                <div className={styles.itemContent}>{getFullAddress()}</div>
                <div className={styles.itemSubtext}>
                  Участок: <span className={styles.infoBadge}>{invoice.Участок}</span>
                </div>
              </IonLabel>
              <IonButton 
                fill="outline" 
                color="primary"
                slot="end"
                onClick={handleAddressSearch}
                disabled={isUpdatingAddress}
                className={styles.actionButton}
              >
                {isUpdatingAddress ? (
                  <IonSpinner name="dots" />
                ) : (
                  <IonIcon icon={searchOutline} />
                )}
              </IonButton>
            </IonItem>

            {/* Заявитель */}
            {invoice.Заявитель && (
              <IonItem className={styles.invoiceItem}>
                <IonIcon icon={personCircleOutline} slot="start" />
                <IonLabel>
                  <div className={styles.itemHeader}>Заявитель</div>
                  <div className={styles.itemContent}>{invoice.Заявитель}</div>
                </IonLabel>
              </IonItem>
            )}

            {/* Телефон */}
            {invoice.Телефон && (
              <IonItem className={styles.invoiceItem}>
                <IonIcon icon={callOutline} slot="start" />
                <IonLabel>
                  <div className={styles.itemHeader}>Телефон</div>
                  <div className={styles.itemContent}>
                    {formatPhone ? formatPhone(invoice.Телефон) : invoice.Телефон}
                  </div>
                </IonLabel>
                <IonButton 
                  fill="solid" 
                  color="success"
                  slot="end"
                  onClick={handleCall}
                  className={styles.callButton}
                >
                  <IonIcon icon={callOutline} />
                </IonButton>
              </IonItem>
            )}

            {/* Лицевой счет */}
            <IonItem className={styles.invoiceItem}>
              <IonIcon icon={codeWorkingOutline} slot="start" />
              <IonLabel>
                <div className={styles.itemHeader}>Лицевой счет</div>
                <div className={styles.itemContent}>{invoice.ЛицевойСчет}</div>
              </IonLabel>
              <IonButton 
                fill="outline" 
                color="primary"
                onClick={handleAccountSearch}
                slot="end"
                className={styles.actionButton}
              >
                <IonIcon icon={ellipsisHorizontalOutline} />
              </IonButton>
            </IonItem>

            {/* Характер заявки */}
            {invoice.ХарактерЗаявки && (
              <IonItem className={styles.invoiceItem}>
                <IonIcon icon={documentTextOutline} slot="start" />
                <IonLabel>
                  <div className={styles.itemHeader}>Характер заявки</div>
                  <div className={styles.itemContent}>{invoice.ХарактерЗаявки}</div>
                </IonLabel>
              </IonItem>
            )}

            {/* Время выполнения */}
            <IonItem className={styles.invoiceItem}>
              <IonIcon icon={calendarOutline} slot="start" />
              <IonLabel>
                <div className={styles.itemHeader}>Сроки выполнения</div>
                <div className={styles.infoSection}>
                  <div className={styles.itemContent}>
                    Удобное время: {formatDate(invoice.ВремяУдобноеДляЗаказчика)}
                  </div>
                </div>
                <div className={styles.infoSection}>
                  <div className={styles.itemContent}>
                    Фактическое выполнение: {formatDate(invoice.ВремяФактическогоВыполнения)}
                  </div>
                </div>
              </IonLabel>
            </IonItem>

            {/* Комментарий */}
            {invoice.КомментарийПоВыполнению && (
              <IonItem className={styles.invoiceItem}>
                <IonIcon icon={documentTextOutline} slot="start" />
                <IonLabel>
                  <div className={styles.itemHeader}>Комментарий по выполнению</div>
                  <div className={styles.itemContent}>{invoice.КомментарийПоВыполнению}</div>
                </IonLabel>
              </IonItem>
            )}

            {/* Текст заявки */}
            {invoice.ТекстЗаявки && (
              <IonItem className={styles.invoiceItem}>
                <IonIcon icon={documentTextOutline} slot="start" />
                <IonLabel>
                  <div className={styles.itemHeader}>Текст заявки</div>
                  <div className={styles.itemContent}>{invoice.ТекстЗаявки}</div>
                </IonLabel>
              </IonItem>
            )}
          </IonList>

          {/* Кнопка актов */}
          <div className={styles.footerActions}>
            <IonButton 
              expand="block"
              color="primary"
              className={styles.actsButton}
              onClick={onNavigateToActs}
            >
              <IonIcon icon={documentsOutline} slot="start" />
              Передать к исполнению
            </IonButton>
          </div>
        </div>

        {/* Модальные окна */}
        <IonModal isOpen={isAddressSearchModalOpen} onDidDismiss={() => setIsAddressSearchModalOpen(false)}>
          <AddressForm
            initialAddress={ invoice.Адрес.address }
            invoiceId={invoice.Ссылка}
            onAddressSaved={handleAddressUpdate}
            disabled={isUpdatingAddress}
            onAddressClosed={() => setIsAddressSearchModalOpen(false)}
          /> 
        </IonModal>

        <IonModal isOpen={isAccountSearchModalOpen} onDidDismiss={() => setIsAccountSearchModalOpen(false)}>
          <FindLics 
            address={ invoice.Адрес.address }
            invoiceId={invoice.Ссылка}
            onSelect={(lic: string) => {
              setIsAccountSearchModalOpen(false);
            }}
            isOpen={isAccountSearchModalOpen}
            onClose={() => setIsAccountSearchModalOpen(false)}
          /> 
        </IonModal>
      </IonContent>
    </IonModal>
  );
};