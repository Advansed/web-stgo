// LicItem.tsx
import React from 'react';
import styles from './List.module.css';
import { formatAddress } from '../../useLics';

export interface LicAccount {
  id: string;
  code: string;
  name: string;
  address: string;
  plot: string;
  debts: Array<{
    type: string;
    amount: number;
    currency: string;
  }>;
}

export interface LicItemProps {
  lic: LicAccount;
  onLicClick: (lic: LicAccount) => void;
  onLicDel: (licCode: string) => void;
  formatSum: (amount: number) => string;
  getTotalDebt: (debts: LicAccount['debts']) => number;
  getDebtStatus: (debts: LicAccount['debts']) => 'none' | 'positive' | 'negative';
}

const LicItem: React.FC<LicItemProps> = ({
  lic,
  onLicClick,
  onLicDel,
  formatSum,
  getTotalDebt,
  getDebtStatus
}) => {
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onLicDel(lic.code);
  };

  const handleClick = () => {
    onLicClick(lic);
  };

  const totalDebt = getTotalDebt(lic.debts);
  const debtStatus = getDebtStatus(lic.debts);

  return (
    <div 
      className={styles.licItemCard}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Лицевой счет ${lic.code}. ${lic.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles.licItemHeader}>
        <div className={styles.licCode} title={`Лицевой счет: ${lic.code}`}>
          {lic.code}
        </div>
        
        <div className={styles.licActions}>
          <div className={styles.debtContainer}>
            <span 
              className={`${styles.debtSum} ${styles[`debt${debtStatus.charAt(0).toUpperCase() + debtStatus.slice(1)}`]}`}
              title={`Общая задолженность: ${formatSum(totalDebt)}`}
            >
              {formatSum(totalDebt)}
            </span>
            
            {debtStatus === 'positive' && (
              <span 
                className={styles.debtIndicator}
                aria-label="Имеется задолженность"
                title="Имеется задолженность"
              >
                ●
              </span>
            )}
          </div>
          
          <button 
            className={styles.deleteButton}
            onClick={handleDelete}
            title="Удалить лицевой счет"
            aria-label={`Удалить лицевой счет ${lic.code}`}
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className={styles.licItemBody}>
        <div 
          className={styles.licName}
          title={lic.name}
        >
          {lic.name}
        </div>
        
        <div 
          className={styles.licAddress}
          title={`Адрес: ${formatAddress(lic.address)}`}
        >
          {formatAddress(lic.address || '')}
        </div>
        
        <div 
          className={styles.licPlot}
          title={`Участок: ${lic.plot}`}
        >
          Участок: {lic.plot}
        </div>
      </div>
    </div>
  );
};

export default LicItem;