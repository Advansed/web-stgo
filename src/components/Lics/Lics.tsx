import React, { useState } from 'react';
import LicsList from './components/List/LicsList';
import FindLics from './components/FindLic/FindLics';
import { useLics } from './useLics';
import styles from './Lics.module.css';
import { LicForm } from './components/LicsForm';
import { formatAddress, formatSum, getDebtStatus, getTotalDebt } from './useLics';

const Lics: React.FC = () => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  
  const {

    data,
    item,
    loading,

    handleLicClick,
    addLics,
    deleteLics,
    setItem

  } = useLics();


  // Заменить состояние
  const [ isAddLicModalOpen, setIsAddLicModalOpen ] = useState<boolean>(false);

  // Заменить функции
  const openAddLicModal = () => {
    setIsAddLicModalOpen(true);
  };

  const closeAddLicModal = () => {
    setIsAddLicModalOpen(false);
  };

  const handleLicAdd = (lic: any) => {
    console.log('lic', lic)
    addLics( {id: lic.id, code: lic.name } )
    closeAddLicModal();
  };
  const handleLicDel = (lic: string) => {
    deleteLics( lic )
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className='flex fl-space'>
          <h1 className={styles.title}>Лицевые счета</h1>
          
          <div className={styles.actions}>
            <button 
              className={styles.addLicButton}
              onClick={openAddLicModal}
            >
              <span className={styles.buttonIcon}>➕</span>
              Добавить лицевой счет
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <LicsList 
          data            = { data }
          loading         = { loading }
          onLicClick      = { handleLicClick }
          onLicDel        = { handleLicDel }
          formatSum       = { formatSum }
          getTotalDebt    = { getTotalDebt }
          getDebtStatus   = { getDebtStatus }
        />
      </div>

      {isAddLicModalOpen && (
        <FindLics
          isOpen      = { isAddLicModalOpen }
          onClose     = { closeAddLicModal }
          onSelect    = { handleLicAdd }
        />
      )}

      {item && (
        <LicForm 
          isOpen      = { item !== null }
          licAccount  = { item }
          onClose     = { ()=> setItem( undefined ) }
        />  
      )}
    </div>
  );
};

export default Lics;