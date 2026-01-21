// LicItem.tsx
import React from 'react';
import styles from './List.module.css';
import { formatAddress } from '../../useLics';
import { IonIcon } from '@ionic/react';
import { 
  home, 
  business, 
  trashOutline, 
  alertCircle, 
  checkmarkCircle, 
  wallet 
} from 'ionicons/icons';

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

  // Класс статуса (используем его на родителе)
  const statusKey = `status${debtStatus.charAt(0).toUpperCase() + debtStatus.slice(1)}`;
  const cardClass = `${styles.licItemCard} ${styles[statusKey]}`;
  const textClass = styles[`text${debtStatus.charAt(0).toUpperCase() + debtStatus.slice(1)}`];

  // Подбираем иконку
  let StatusIcon = home;
  if (debtStatus === 'positive') StatusIcon = alertCircle;
  if (debtStatus === 'none') StatusIcon = checkmarkCircle;
  if (debtStatus === 'negative') StatusIcon = wallet;

  return (
    <div className={cardClass} onClick={handleClick}>
      
      {/* 1. Иконка статуса */}
      <div className={styles.iconBox}>
        <IonIcon icon={StatusIcon} />
      </div>

      {/* 2. Информация */}
      <div className={styles.infoBox}>
        <div className={styles.licCode}>{lic.code}</div>
        <div className={styles.licAddress}>
          {lic.address ? formatAddress(lic.address) : 'Адрес не указан'}
        </div>
      </div>

      {/* 3. Сумма */}
      <div className={styles.actionsBox}>
        <span className={`${styles.sumValue} ${textClass}`}>
          {formatSum(totalDebt)}
        </span>
        <span className={`${styles.sumLabel} ${textClass}`}>
            {debtStatus === 'positive' ? 'Долг' : 'Баланс'}
        </span>

        <button 
          className={styles.deleteButton} 
          onClick={handleDelete}
        >
            <IonIcon icon={trashOutline} />
        </button>
      </div>

    </div>
  );
};

export default LicItem;