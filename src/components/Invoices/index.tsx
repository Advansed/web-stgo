import React, { useMemo, useState, useEffect } from 'react';
import {
  IonSearchbar,
  IonSpinner,
  IonIcon,
  IonButton
} from '@ionic/react';
import { filterOutline, addOutline } from 'ionicons/icons';

import { useHook } from './useHook';
import { useWorkers } from '../../Store/navigationStore';

import InvoiceItem from './components/InvoiceList/InvoiceItem';
import InvWorker from './components/InvoiceList/InvWorker';
import Maps from '../Maps/Maps';

import CreateInvoiceModal from './components/CreateInvoiceModal';

import styles from './components/InvoiceList/InvoiceList.module.css';

type ModalMode = 'none' | 'view' | 'create';

const Invoices: React.FC = () => {
  const {
    invoices,
    loading,
    refreshData,
    format_phone,
    format_date,
  } = useHook();

  const { workers } = useWorkers();

  const [searchText, setSearchText] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [mode, setMode] = useState<ModalMode>('none');

  useEffect(() => {
    refreshData();
    return () => {
      setSelected(null);
      setMode('none');
    };
  }, []);

  const selectedInvoice = useMemo(() => {
    if (!selected) return null;
    const fromStore = invoices.find(
      (inv: any) => inv.id === selected.id || inv.Ссылка === selected.id
    );
    return fromStore || selected;
  }, [invoices, selected]);

  const filteredInvoices = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    if (!search) return invoices;

    return invoices.filter((inv: any) => {
      if (String(inv.number || '').toLowerCase().includes(search)) return true;
      if (String(inv.description || '').toLowerCase().includes(search)) return true;
      if (String(inv.comment || '').toLowerCase().includes(search)) return true;
      if (String(inv.applicant || '').toLowerCase().includes(search)) return true;
      if (String(inv.lic || '').toLowerCase().includes(search)) return true;
      if (String(inv.address || '').toLowerCase().includes(search)) return true;

      const works = Array.isArray(inv.works) ? inv.works : [];
      return works.some((w: any) =>
        String(w.work || '').toLowerCase().includes(search) ||
        String(w.equipment || '').toLowerCase().includes(search)
      );
    });
  }, [invoices, searchText]);

  const sortedWorkers = useMemo(() => {
    return [...workers].sort((a: any, b: any) => {
      if (a.status === 'available' && b.status !== 'available') return -1;
      if (a.status !== 'available' && b.status === 'available') return 1;
      return 0;
    });
  }, [workers]);

  const handleSelectInvoice = (invoice: any) => {
    setSelected(invoice);
    setMode('view');
  };

  const closeModals = () => {
    setMode('none');
    setSelected(null);
  };

  const forceRefreshInvoices = async () => {
    setSearchText('');
    await refreshData();
  };

  return (
    <div className={styles.invoicePageWithMap}>
      <div className={styles.invoicesPanel}>
        <div className={styles.invoicesHeader}>
          <div className={styles.headerTopRow}>
            <h2 className={styles.panelTitle}>
              Заявки
              <span className={styles.countBadge}>{filteredInvoices.length}</span>
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IonButton
                fill="solid"
                size="small"
                onClick={() => setMode('create')}
                aria-label="Создать заявку"
              >
                <IonIcon slot="icon-only" icon={addOutline} />
              </IonButton>

              <IonButton fill="clear" size="small" className="filter-btn">
                <IonIcon slot="icon-only" icon={filterOutline} color="medium" />
              </IonButton>
            </div>
          </div>

          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Поиск: номер, описание, ЛС, адрес..."
            className="custom-searchbar"
          />
        </div>

        <div className={styles.invoicesContent}>
          {loading ? (
            <div className={styles.loadingState}>
              <IonSpinner name="crescent" />
            </div>
          ) : filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice: any) => (
              <InvoiceItem
                key={invoice.id}
                invoice={invoice}
                onSelect={handleSelectInvoice}
                onCall={() => { }}
                formatDate={format_date}
                formatPhone={format_phone}
                isSelected={selected?.id === invoice.id && mode === 'view'}
              />
            ))
          ) : (
            <div className={styles.emptyState}>Список пуст</div>
          )}
        </div>
      </div>

      <div className={styles.mapPanel}>
        <Maps invoices={filteredInvoices} />
      </div>

      <div className={styles.workersPanel}>
        <div className={styles.workersHeader}>
          <h2 className={styles.panelTitle}>
            Сотрудники
            <span className={styles.countBadge}>{workers.length}</span>
          </h2>
        </div>

        <div className={styles.workersContent}>
          {sortedWorkers.map((worker: any) => (
            <InvWorker
              key={worker.id}
              worker={worker}
              isSelected={selectedWorkerId === worker.id}
              onSelect={(id) => setSelectedWorkerId(id)}
            />
          ))}
        </div>
      </div>

      <CreateInvoiceModal
        isOpen={mode === 'create' || mode === 'view'}
        invoice={mode === 'view' ? selectedInvoice : null}
        onClose={closeModals}
        workers={workers}
        onCreated={async () => {
          closeModals();
          await forceRefreshInvoices();
        }}
        onSaved={async () => {
          closeModals();
          await forceRefreshInvoices();
        }}
      />
    </div>
  );
};

export default Invoices;
