import React, { useMemo, useState, useEffect } from 'react';
import { IonModal, IonIcon } from '@ionic/react';
import { closeOutline, searchOutline, constructOutline } from 'ionicons/icons';
import InvWorker from './InvoiceList/InvWorker';
import { WorkerData } from '../../../Store/navigationStore';
import styles from './WorkerPicker.module.css';

interface WorkerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  workers: WorkerData[];
  selectedId?: string;
  onSelect: (worker: WorkerData | null) => void;
}

const WorkerPicker: React.FC<WorkerPickerProps> = ({
  isOpen,
  onClose,
  workers,
  selectedId,
  onSelect,
}) => {
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (isOpen) setSearchText('');
  }, [isOpen]);

  const sortedWorkers = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return [...workers]
      .filter((w) => !search || w.name.toLowerCase().includes(search))
      .sort((a, b) => {
        if (a.status === 'available' && b.status !== 'available') return -1;
        if (a.status !== 'available' && b.status === 'available') return 1;
        return a.name.localeCompare(b.name, 'ru');
      });
  }, [workers, searchText]);

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{
        '--height': 'auto',
        '--max-height': '80vh',
        '--border-radius': '24px',
        '--width': '100%',
        '--max-width': '480px',
      }}
    >
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.title}>
            <IonIcon icon={constructOutline} />
            Выбор исполнителя
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        <div className={styles.searchRow}>
          <IonIcon icon={searchOutline} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск сотрудника..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className={styles.list}>
          <button
            type="button"
            className={`${styles.clearOption} ${!selectedId ? styles.clearOptionActive : ''}`}
            onClick={() => {
              onSelect(null);
              onClose();
            }}
          >
            — не назначен —
          </button>

          {sortedWorkers.length === 0 ? (
            <div className={styles.empty}>Сотрудники не найдены</div>
          ) : (
            sortedWorkers.map((worker) => (
              <InvWorker
                key={worker.id}
                worker={worker}
                isSelected={selectedId === worker.id}
                onSelect={() => {
                  onSelect(worker);
                  onClose();
                }}
              />
            ))
          )}
        </div>
      </div>
    </IonModal>
  );
};

export default WorkerPicker;
