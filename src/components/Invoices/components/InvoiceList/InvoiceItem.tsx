import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, arrowForwardOutline, calendarOutline, locationOutline, personOutline } from 'ionicons/icons';
import { formatDeadline, invoiceAddress, invoiceStatus, isInvoiceOverdue } from '../../invoicePresentation';
import styles from './InvoiceItem.module.css';

export interface InvoiceWork {
  id: string;
  equip_id?: string;
  work_id?: string;
  equipment?: string;
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
  plan_date?: string;
  complete_date?: string;
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

interface InvoiceItemProps {
  invoice: Invoice;
  onSelect: (invoice: Invoice) => void;
  isSelected?: boolean;
  today: string;
}

const InvoiceItem: React.FC<InvoiceItemProps> = ({ invoice, onSelect, isSelected, today }) => {
  const status = invoiceStatus(invoice);
  const overdue = isInvoiceOverdue(invoice, today);
  const number = String(invoice.number || (invoice as any).Номер || 'Без номера');
  const address = invoiceAddress(invoice);
  const description = String(invoice.description || invoice.service || '').trim();
  const worker = invoice.worker?.name?.trim();

  return (
    <button
      type="button"
      className={`${styles.invoiceCard} ${styles[status.tone]} ${overdue ? styles.overdue : ''} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(invoice)}
      aria-label={`Открыть заявку № ${number}. ${status.label}. ${address}`}
    >
      <span className={styles.cardTop}>
        <span className={styles.number}>№ {number}</span>
        <span className={`${styles.statusBadge} ${styles[status.tone]}`}>{status.label}</span>
      </span>

      <span className={styles.address}>
        <IonIcon icon={locationOutline} aria-hidden="true" />
        <span>{address}</span>
      </span>

      {description && <span className={styles.description}>{description}</span>}

      <span className={styles.cardBottom}>
        <span className={`${styles.deadline} ${overdue ? styles.deadlineOverdue : ''}`}>
          <IonIcon icon={overdue ? alertCircleOutline : calendarOutline} aria-hidden="true" />
          <span>{invoice.plan_date ? (overdue ? 'Просрочено: ' : 'Срок: ') : ''}{formatDeadline(invoice.plan_date)}</span>
        </span>
        {worker && <span className={styles.worker}><IonIcon icon={personOutline} aria-hidden="true" /><span>{worker}</span></span>}
        <IonIcon className={styles.openIcon} icon={arrowForwardOutline} aria-hidden="true" />
      </span>
    </button>
  );
};

export default React.memo(InvoiceItem);
