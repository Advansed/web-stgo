import React, { useMemo } from 'react';
import styles from './List.module.css';
import LicItem, { LicAccount } from './LicItem';

interface LicsListProps {
  data: LicAccount[];
  onLicClick: (lic: LicAccount) => void;
  onDeleteRequest: (lic: LicAccount) => void;
}

const LicsList: React.FC<LicsListProps> = ({ data, onLicClick, onDeleteRequest }) => {
  const sortedData = useMemo(
    () => [...data].sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), 'ru-RU', { numeric: true })),
    [data]
  );

  return (
    <div className={styles.list} role="list" aria-label="Лицевые счета">
      {sortedData.map((lic) => (
        <LicItem key={lic.code || lic.id} lic={lic} onLicClick={onLicClick} onDeleteRequest={onDeleteRequest} />
      ))}
    </div>
  );
};

export default LicsList;
