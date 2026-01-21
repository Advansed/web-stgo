import React from 'react';
import styles from './List.module.css';
import LicItem, { LicAccount } from './LicItem';

export interface LicsListProps {
  data:           LicAccount[];
  loading:        boolean;
  onLicClick:     ( lic: LicAccount ) => void;
  onLicDel:       ( licCode: string ) => void;
  formatSum:      ( amount: number ) => string;
  getTotalDebt:   ( debts: LicAccount['debts'] ) => number;
  getDebtStatus:  ( debts: LicAccount['debts'] ) => 'none' | 'positive' | 'negative';
}

const LicsList: React.FC<LicsListProps> = ({
  data,
  loading,
  onLicClick,
  onLicDel,
  formatSum,
  getTotalDebt,
  getDebtStatus
}) => {
  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  // === 3. ИСПРАВЛЕНИЕ ПОРЯДКА (Сортировка) ===
  // Сортируем данные, чтобы список не прыгал.
  // Например, по коду (возрастание): 100... -> 200... -> 300...
  // Если хочешь строго "Новые внизу", и сервер отдает "Новые сверху",
  // то используй: const sortedData = [...data].reverse();
  
  // Я рекомендую сортировку по коду - это самое привычное для глаз:
  const sortedData = [...data].sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className={styles.licsContainer}>
      
      <div className={styles.licsList}>
        {sortedData.map((lic) => (
          <LicItem
              key           = { lic.id } // Важно: используем уникальный ID
              lic           = { lic }
              onLicClick    = { onLicClick }
              onLicDel      = { onLicDel }
              formatSum     = { formatSum }
              getTotalDebt  = { getTotalDebt }
              getDebtStatus = { getDebtStatus }
          />
        ))}
      </div>
      
      {data.length === 0 && (
        <div className={styles.empty}>Нет привязанных лицевых счетов</div>
      )}
    </div>
  );
};

export default LicsList;