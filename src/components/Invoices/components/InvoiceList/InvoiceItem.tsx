// InvoiceItem.tsx
import React from 'react';
import {
  IonCard,
  IonIcon,
} from '@ionic/react';
import {
  locationOutline,
  calendarOutline,
} from 'ionicons/icons';
import styles from './InvoiceItem.module.css';

export interface Worker {
  id:             string;
  name:           string;
  role:           string;
}

export interface Address {
  address:        string;
  lat:            number;
  lon:            number;
}

export interface Invoice {
  id:             string;
  number:         string;
  date:           string;
  lic:            string;
  service:        string | null;
  phone:          string | null;
  plan_date:      string;
  complete_date:  string;
  flag:           number;
  complete_text:  string | null;
  overdue:        number;
  character:      string | null;
  applicant:      string | null;
  address:        Address;
  status:         string;
  plot:           string;
  worker:         Worker;
}

interface InvoiceStatus {
  color: 'primary' | 'success' | 'warning' | 'danger' | 'medium';
  text: string;
}

interface InvoiceItemProps {
  invoice: Invoice;
  status: InvoiceStatus;
  onSelect: (invoice: any) => void;
  onCall: (phone: any, event: any) => void;
  formatDate: (dateString: string) => string;
  formatPhone?: (phone: string) => string;
}

export const InvoiceItem: React.FC<InvoiceItemProps> = ({
  invoice,
  status,
  onSelect,
  onCall,
  formatDate
}) => {
  const handleCardClick = () => {
    onSelect( invoice );
  };

  const handleCallClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCall(invoice.phone, event);
  };

  const getStatusText = () => {
    return invoice.status;
  };

  const getFullAddress = () => {
    let address = invoice.address.address;
    return address;
  };

  const getStatusClass = () => {
    if( invoice.status === 'Принята')
      return styles.status + ' ' + styles.statusNew 
    if( invoice.status === 'Передана')
      return styles.status + ' ' + styles.statusInProgress 
    if( invoice.status === 'Выполнена')
      return styles.status + ' ' + styles.statusCompleted 
    if( invoice.status === 'Отложена')
      return styles.status + ' ' + styles.statusOnHold
    if( invoice.status === 'Отклонена')
      return styles.status + ' ' + styles.statusRejected
    
    return 'status'
  }

  return (
    <IonCard 
      className={ invoice.address.lat ? styles.invoiceCard1 : styles.invoiceCard2 }
      data-status={status.color}
      onClick={handleCardClick}
      button
    >
      <div className={styles.cardContentWrapper}>
        {/* Заголовок */}
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.invoiceNumber}>
              #{invoice.number.trim()}
            </div>
            <p className={styles.invoiceDate}>
              {formatDate(invoice.date)}
            </p>
          </div>
          <div >
            <div
              className = { getStatusClass() }
            >
              <b>{getStatusText()}</b>
            </div>
          </div>
        </div>

        {/* Основной контент */}
        <div className={styles.cardContent}>
          {/* Адрес */}
          <div className={styles.infoSection}>
            <div className={styles.infoLabel}>
              <IonIcon icon={locationOutline} className={styles.labelIcon} />
              Адрес {getFullAddress()}
            </div>
          </div>

          {/* Даты */}
          {/* <div className={styles.datesRow}>
            <div className={styles.infoSection}>
              <div className={styles.infoLabel}>
                <IonIcon icon={calendarOutline} className={styles.labelIcon} />
                Удобное время
              </div>
              <p className={styles.infoValue}>
                {formatDate(invoice.plan_date)}
              </p>
            </div>

            <div className={styles.infoSection}>
              <div className={styles.infoLabel}>
                <IonIcon icon={calendarOutline} className={styles.labelIcon} />
                Факт. выполнение
              </div>
              <p className={styles.infoValue}>
                {formatDate(invoice.complete_date)}
              </p>
            </div>
          </div> */}

          {/* Дополнительная информация */}
          {/* {(invoice.Заявитель || invoice.ХарактерЗаявки) && (
            <div className={styles.additionalInfo}>
              {invoice.Заявитель && (
                <div className={styles.infoSection}>
                  <div className={styles.infoLabel}>
                    <IonIcon icon={personOutline} className={styles.labelIcon} />
                    Заявитель
                  </div>
                  <p className={styles.infoValue}>
                    {invoice.Заявитель}
                  </p>
                </div>
              )}

              {invoice.ХарактерЗаявки && (
                <div className={styles.infoSection}>
                  <div className={styles.infoLabel}>
                    <IonIcon icon={documentTextOutline} className={styles.labelIcon} />
                    Характер заявки
                  </div>
                  <p className={styles.infoValue}>
                    {invoice.ХарактерЗаявки}
                  </p>
                </div>
              )}
            </div>
          )} */}
        </div>

        {/* Футер */}
        {/* <div className={styles.cardFooter}>
          <div className={styles.accountInfo}>
            <span className={styles.accountItem}>
              ЛС: {invoice.ЛицевойСчет}
            </span>
            <div className={styles.plotInfo}>
              <span className={styles.accountItem}>
                Участок: 
              </span>
              <span className={styles.plotBadge}>
                {invoice.Участок}
              </span>
            </div>
          </div>

          <div className={styles.actionButtons}>
            {invoice.Телефон && (
              <IonButton
                fill="solid"
                size="small"
                className={`${styles.actionButton} ${styles.callButton}`}
                onClick={handleCallClick}
              >
                <IonIcon icon={callOutline} slot="start" />
                Позвонить
              </IonButton>
            )}
            
            <IonButton
              fill="outline"
              size="small"
              className={styles.actionButton}
            >
              Подробнее
            </IonButton>
          </div>
        </div> */}
      </div>
    </IonCard>
  );
};

export default React.memo(InvoiceItem);