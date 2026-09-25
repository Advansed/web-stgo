import React from 'react';
import { IonIcon } from '@ionic/react';
import { calendarOutline, locationOutline } from 'ionicons/icons';
import styles from './InvoiceItem.module.css';

export interface InvoiceWork {
  id: string;
  equip_id?: string;
  work_id?: string;
  /** наименование оборудования */
  equipment?: string;
  /** наименование работы */
  work?: string;
  amount: number;
  price: number;
  sum: number;
  sum_vat: number;
}

export interface Invoice {
  id: string;
  lic_id?: string;
  serv_id?: string;
  number: string;
  date: string;
  description?: string;
  comment?: string;
  lic?: string;
  applicant?: string | null;
  address?: string | { address: string; lat?: number; lon?: number };
  executor?: string | null;
  works?: InvoiceWork[];
  primaryWork?: InvoiceWork | null;
  service?: string | null;
  status?: string;
  worker?: { id: string; name: string; role?: string };
  character?: string | null;
  phone?: string | null;
}

interface InvoiceStatus { color: string; text: string; }
interface InvoiceItemProps {
  invoice: Invoice;
  status?: InvoiceStatus;
  onSelect: (invoice: Invoice) => void;
  onCall?: (phone: any, event: any) => void;
  formatDate: (dateString: string) => string;
  formatPhone?: (phone: string) => string;
  isSelected?: boolean;
}

const STATUS_CLASS: Record<string, string> = {
  'новый': 'statusNew',
  'новая': 'statusNew',
  'назначен': 'statusAssigned',
  'назначена': 'statusAssigned',
  'в работе': 'statusInProgress',
  'отложен': 'statusOnHold',
  'отложена': 'statusOnHold',
  'завершен': 'statusCompleted',
  'завершена': 'statusCompleted',
  'выполнена': 'statusCompleted',
  'отменена': 'statusRejected',
};

const statusClassName = (status: string) =>
  styles[STATUS_CLASS[status.toLowerCase()]] || styles.statusNew;

const InvoiceItem: React.FC<InvoiceItemProps> = ({
  invoice,
  onSelect,
  formatDate,
  isSelected
}) => {
  const safeInvoice = invoice as any;
  const works: InvoiceWork[] = Array.isArray(safeInvoice.works) ? safeInvoice.works : [];

  const getDisplayAddress = () => {
    const addr = safeInvoice.address;
    if (!addr) return 'Адрес не указан';
    if (typeof addr === 'string') return addr;
    if (addr.address) return addr.address;
    return 'Адрес не указан';
  };

  const description = safeInvoice.description || safeInvoice.service || '';
  const applicant = safeInvoice.applicant || '';
  const worksCount = works.length;
  const statusText = String(safeInvoice.status || safeInvoice.Статус || 'Новый').trim() || 'Новый';

  return (
    <div
      className={`${styles.invoiceCard} ${isSelected ? styles.cardSelected : ''} ${statusClassName(statusText)}`}
      onClick={() => onSelect(invoice)}
    >
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.number}>#{safeInvoice.number || safeInvoice.Номер}</span>
          <div className={styles.date}>
            <IonIcon icon={calendarOutline} style={{ fontSize: '12px' }} />
            {formatDate(safeInvoice.date || safeInvoice.Дата)}
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.statusBadge}>{statusText}</span>
          {worksCount > 1 && (
            <span className={styles.worksBadge}>{worksCount} работ</span>
          )}
        </div>
      </div>

      {description && (
        <div className={styles.applicant} style={{ fontWeight: 600, color: '#1e293b' }}>
          {description}
        </div>
      )}

      <div className={styles.address}>
        <IonIcon icon={locationOutline} style={{ fontSize: '14px', marginRight: 6, color: '#94a3b8', flexShrink: 0 }} />
        <span className={styles.addressText}>{getDisplayAddress()}</span>
      </div>

      {applicant && (
        <div className={styles.applicant}>
          {applicant}
        </div>
      )}
    </div>
  );
};

export default InvoiceItem;
