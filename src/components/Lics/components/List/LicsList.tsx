import React, { useMemo } from 'react';
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
  const sortedData = useMemo(
    () => [...data].sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''))),
    [data]
  );

  if (loading && data.length === 0) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.licsContainer}>
      <div className={styles.licsList}>
        {sortedData.map((lic) => (
          <LicItem
              key           = { lic.code }
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
