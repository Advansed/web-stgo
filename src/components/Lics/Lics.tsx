import React, { useEffect, useState } from 'react';
import LicsList from './components/List/LicsList';
import FindLics from './components/FindLic/FindLics';
import { useLics } from './useLics';
import styles from './Lics.module.css';
import { LicForm } from './components/LicsForm';
import { formatSum, getDebtStatus, getTotalDebt } from './useLics';
import { useAdd } from '../../Store/navigationStore';
import { IonLoading } from '@ionic/react';

const Lics: React.FC<any> = () => {
  const {

    data,
    item,
    loading,

    addLics,
    deleteLics,
    setItem

  } = useLics();

  const { add, setAdd }        = useAdd()
  

  const handleLicAdd = (lic: any) => {
    console.log('lic', lic)
    addLics( {id: lic.id, code: lic.name } )
  };
  const handleLicDel = (lic: string) => {
    deleteLics( lic )
  };

  useEffect(()=>{
    console.log( add )
  },[add])
  
  return (
    <div className={styles.container}>
      <IonLoading isOpen = { loading } message={"Подождите..."} />  

      <div className={styles.content}>
        
        <LicsList 
            data            = { data }
            loading         = { loading }
            onLicClick      = { setItem }
            onLicDel        = { handleLicDel }
            formatSum       = { formatSum }
            getTotalDebt    = { getTotalDebt }
            getDebtStatus   = { getDebtStatus }
        />

        { item !== undefined && (
            <LicForm 
                isOpen          = { item !== null }
                licAccount      = { item }
                onClose         = { ()=> setItem( undefined ) }
            /> )
        }

        { add  && (
          <FindLics
            isOpen          = { add }
            onClose         = { () => setAdd( false ) }
            onSelect        = { handleLicAdd }
          />
        )}
      </div>
    </div>
  );
};

export default Lics;