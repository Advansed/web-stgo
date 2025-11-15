// LicsList.tsx
import React from 'react';
import styles from './List.module.css';
import LicItem, { LicAccount, LicItemProps } from './LicItem';
import { formatAddress } from '../../useLics';

export interface LicsListProps {
  data: LicAccount[];
  loading: boolean;
  onLicClick: (lic: LicAccount) => void;
  onLicDel: (licCode: string) => void;
  formatSum: (amount: number) => string;
  getTotalDebt: (debts: LicAccount['debts']) => number;
  getDebtStatus: (debts: LicAccount['debts']) => 'none' | 'positive' | 'negative';
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

  return (
    <div className={styles.licsContainer}>
      
      <div className={styles.licsList}>
        {data.map((lic) => (
          <LicItem
            key={lic.id}
            lic={lic}
            onLicClick={onLicClick}
            onLicDel={onLicDel}
            formatSum={formatSum}
            getTotalDebt={getTotalDebt}
            getDebtStatus={getDebtStatus}
          />
        ))}
      </div>
      
      {data.length === 0 && (
        <div className={styles.empty}>Нет данных для отображения</div>
      )}
    </div>
  );
};

export default LicsList;