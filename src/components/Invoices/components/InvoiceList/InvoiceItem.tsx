// InvoiceItem.tsx
import React from 'react';
import {
  IonCard,
  IonChip,
  IonIcon,
  IonButton
} from '@ionic/react';
import {
  callOutline,
  locationOutline,
  calendarOutline,
  personOutline,
  documentTextOutline
} from 'ionicons/icons';
import styles from './InvoiceItem.module.css';

interface Invoice {
  Ссылка: string;
  Номер: string;
  Дата: string;
  ЛицевойСчет: string;
  ТекстЗаявки: string | null;
  Телефон: string | null;
  ВремяУдобноеДляЗаказчика: string;
  ВремяФактическогоВыполнения: string;
  ФлагВыполнения: number;
  КомментарийПоВыполнению: string | null;
  Просрочена: number;
  ХарактерЗаявки: string | null;
  Заявитель: string | null;
  Адрес: string;
  Дом: string;
  Квартира: string | null;
  Участок: string;
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
    onCall(invoice.Телефон, event);
  };

  const getStatusText = () => {
    if (invoice.ФлагВыполнения === 1) return 'Выполнена';
    if (invoice.Просрочена === 1) return 'Просрочена';
    return 'В работе';
  };

  const getFullAddress = () => {

    let address = (typeof invoice.Адрес) === 'string' ? invoice.Адрес : (invoice.Адрес as any).address;
    return address;
  };

  return (
    <IonCard 
      className={styles.invoiceCard}
      data-status={status.color}
      onClick={handleCardClick}
      button
    >
      <div className={styles.cardContentWrapper}>
        {/* Заголовок */}
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <h3 className={styles.invoiceNumber}>
              #{invoice.Номер.trim()}
            </h3>
            <p className={styles.invoiceDate}>
              {formatDate(invoice.Дата)}
            </p>
          </div>
          <IonChip 
            color={status.color} 
            className={styles.statusBadge}
          >
            {getStatusText()}
          </IonChip>
        </div>

        {/* Основной контент */}
        <div className={styles.cardContent}>
          {/* Адрес */}
          <div className={styles.infoSection}>
            <div className={styles.infoLabel}>
              <IonIcon icon={locationOutline} className={styles.labelIcon} />
              Адрес
            </div>
            <p className={`${styles.infoValue} ${styles.addressValue}`}>
              {getFullAddress()}
            </p>
          </div>

          {/* Даты */}
          <div className={styles.datesRow}>
            <div className={styles.infoSection}>
              <div className={styles.infoLabel}>
                <IonIcon icon={calendarOutline} className={styles.labelIcon} />
                Удобное время
              </div>
              <p className={styles.infoValue}>
                {formatDate(invoice.ВремяУдобноеДляЗаказчика)}
              </p>
            </div>

            <div className={styles.infoSection}>
              <div className={styles.infoLabel}>
                <IonIcon icon={calendarOutline} className={styles.labelIcon} />
                Факт. выполнение
              </div>
              <p className={styles.infoValue}>
                {formatDate(invoice.ВремяФактическогоВыполнения)}
              </p>
            </div>
          </div>

          {/* Дополнительная информация */}
          {(invoice.Заявитель || invoice.ХарактерЗаявки) && (
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
          )}
        </div>

        {/* Футер */}
        <div className={styles.cardFooter}>
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
        </div>
      </div>
    </IonCard>
  );
};

export default React.memo(InvoiceItem);