import React from 'react';
import { IonIcon } from '@ionic/react';
import { arrowForwardOutline, locationOutline, trashOutline } from 'ionicons/icons';
import { getDisplayAddress } from '../../../../utils/format';
import styles from './List.module.css';

export interface LicAccount {
  id: string;
  code: string;
  name?: string;
  applicant?: string;
  address?: string | { address?: string; value?: string };
  debts?: Array<{ type?: string; amount?: number; sum?: number; currency?: string }>;
}

interface LicItemProps {
  lic: LicAccount;
  onLicClick: (lic: LicAccount) => void;
  onDeleteRequest: (lic: LicAccount) => void;
}

const LicItem: React.FC<LicItemProps> = ({ lic, onLicClick, onDeleteRequest }) => {
  const code = String(lic.code || '').trim() || 'Без номера';
  const name = String(lic.name || lic.applicant || '').trim();
  const address = getDisplayAddress(lic.address);

  return (
    <article className={styles.card} role="listitem">
      <button type="button" className={styles.openButton} onClick={() => onLicClick(lic)} aria-label={`Открыть лицевой счёт ${code}. ${name}. ${address}`}>
        <span className={styles.kicker}>Лицевой счёт</span>
        <strong className={styles.code}>{code}</strong>
        <span className={styles.name}>{name || 'Абонент не указан'}</span>
        <span className={styles.address}><IonIcon icon={locationOutline} aria-hidden="true" />{address}</span>
        <span className={styles.openCue}>Открыть карточку <IonIcon icon={arrowForwardOutline} aria-hidden="true" /></span>
      </button>
      <button type="button" className={styles.deleteButton} onClick={() => onDeleteRequest(lic)} aria-label={`Удалить лицевой счёт ${code}`} title="Удалить из списка">
        <IonIcon icon={trashOutline} aria-hidden="true" />
      </button>
    </article>
  );
};

export default LicItem;
