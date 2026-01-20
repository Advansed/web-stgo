import React from 'react';
import { IonIcon } from '@ionic/react';
import { calendarOutline, locationOutline } from 'ionicons/icons';
import styles from './InvoiceItem.module.css';

// Типы оставляем для надежности
export interface Worker { id: string; name: string; role: string; }
export interface Address { address: string; lat: number; lon: number; }
export interface Invoice {
  id: string; number: string; date: string; lic: string; service: string | null;
  phone: string | null; plan_date: string; complete_date: string; flag: number;
  complete_text: string | null; overdue: number; character: string | null;
  applicant: string | null; address: Address; status: string; plot: string;
  worker: Worker;
}
interface InvoiceStatus { color: string; text: string; }
interface InvoiceItemProps {
  invoice: Invoice;
  status: InvoiceStatus;
  onSelect: (invoice: Invoice) => void;
  onCall: (phone: any, event: any) => void;
  formatDate: (dateString: string) => string;
  formatPhone?: (phone: string) => string;
  isSelected?: boolean;
}

const InvoiceItem: React.FC<InvoiceItemProps> = ({ 
  invoice, 
  onSelect,
  formatDate,
  isSelected
}) => {
  
  const safeInvoice = invoice as any;

  // Безопасное получение адреса (защита от краша)
  const getDisplayAddress = () => {
    const addr = safeInvoice.address || safeInvoice.Адрес;
    if (!addr) return 'Адрес не указан';
    if (typeof addr === 'string') return addr;
    if (addr.address) return addr.address;
    if (addr.value) return addr.value;
    return 'Адрес не указан';
  };

  const getModernStatusClass = () => {
    const s = safeInvoice.status || safeInvoice.Статус;
    if (s === 'Принята' || s === 'Новый') return styles.statusNew;
    if (s === 'В работе' || s === 'Передана') return styles.statusInProgress;
    if (s === 'Выполнена') return styles.statusCompleted;
    if (s === 'Отложена') return styles.statusOnHold;
    if (s === 'Отклонена') return styles.statusRejected;
    return styles.statusNew;
  };

  return (
    <div 
      className={`${styles.invoiceCard} ${isSelected ? styles.cardSelected : ''} ${getModernStatusClass()}`}
      onClick={() => onSelect(invoice)}
    >
      {/* Хедер: Номер и Дата */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.number}>#{safeInvoice.number || safeInvoice.Номер}</span>
          <div className={styles.date}>
            <IonIcon icon={calendarOutline} style={{ fontSize: '12px' }} />
            {formatDate(safeInvoice.date || safeInvoice.Дата)}
          </div>
        </div>
        
        {/* Бейдж статуса */}
        <span className={styles.statusBadge}>{safeInvoice.status || safeInvoice.Статус}</span>
      </div>

      {/* Адрес - ТЕПЕРЬ БЕЗОПАСНЫЙ */}
      <div className={styles.address}>
         <IonIcon icon={locationOutline} style={{fontSize: '14px', marginRight: 6, color: '#94a3b8'}} />
         <span className={styles.addressText}>{getDisplayAddress()}</span>
      </div>

      {/* Имя заявителя */}
      <div className={styles.applicant}>
        {safeInvoice.applicant || safeInvoice.Контрагент || 'Не указан'}
      </div>

    </div>
  );
};

export default InvoiceItem;