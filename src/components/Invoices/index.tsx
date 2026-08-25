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
import { InvoiceView } from './components/InvoiceView';

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
    uppdate_address,
    upd_worker,
    upd_lic,
    get_inv_status
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

  const filteredInvoices = useMemo(() => {
    const search = searchText.toLowerCase();
    return invoices.filter((inv: any) => {
      return (
        String(inv.number || '').toLowerCase().includes(search) ||
        String(inv.applicant || '').toLowerCase().includes(search)
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

  const handleUpdateAddress = async (id: string, address: any) => {
    await uppdate_address(id, address);
    if (selected?.id === id) {
      setSelected((prev: any) => prev ? { ...prev, address, Адрес: address } : prev);
    }
  };

  const handleAssignWorker = async (worker: any | null) => {
    if (!selected) return;
    const st = worker ? 'В работе' : 'Новый';
    await upd_worker(selected.id, { worker, status: st });
    setSelected((prev: any) =>
      prev
        ? {
            ...prev,
            worker: worker || null,
            Работник: worker || null,
            status: st,
            Статус: st,
          }
        : prev
    );
  };

  const handleSaveInvoice = async (data: { status: string; comment: string; worker?: any }) => {
    if (!selected) return;
    await upd_worker(selected.id, {
      worker: data.worker || selected.worker,
      status: data.status,
      comment: data.comment,
    });
    setSelected((prev: any) =>
      prev
        ? {
            ...prev,
            worker: data.worker || prev.worker,
            Работник: data.worker || prev.Работник,
            status: data.status,
            Статус: data.status,
            comment: data.comment,
            Комментарий: data.comment,
          }
        : prev
    );
  };

  const handleUpdateLic = async (lic: any) => {
    if (selected) {
      await upd_lic(selected.id, lic);
      setSelected((prev: any) => prev ? { ...prev, lic } : prev);
    }
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
            placeholder="Поиск по номеру..."
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
                status={get_inv_status(invoice)}
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
        isOpen={mode === 'create'}
        onClose={() => setMode('none')}
        workers={workers}
        onCreated={async () => {
          setMode('none');
          await forceRefreshInvoices();
        }}
      />

      {selected && selected.number && (
        <InvoiceView
          isOpen={mode === 'view'}
          invoice={selected}
          invoiceStatus={get_inv_status(selected)}
          formatDate={format_date}
          formatPhone={format_phone}
          onUpdateLic={handleUpdateLic}
          onUpdateWorker={handleAssignWorker}
          onSaveInvoice={handleSaveInvoice}
          onNavigateToPrint={() => { }}
          onUpdateAddress={handleUpdateAddress}
          onClose={closeModals}
        />
      )}
    </div>
  );
};

export default Invoices;
