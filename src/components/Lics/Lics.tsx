import React, { useEffect } from 'react';
import { IonLoading } from '@ionic/react';
import LicsList from './components/List/LicsList';
import FindLics from './components/FindLic/FindLics';
import { LicForm } from './components/LicsForm';
import styles from './Lics.module.css';

// Хуки
import { useAdd } from '../../Store/navigationStore';
import { useToken } from '../../Store/loginStore';
import { useLicsStore, useLicsActions } from '../../Store/licsStore';
import { formatSum, getTotalDebt, getDebtStatus } from './useLics'; 

const Lics: React.FC<any> = () => {
  const { data, loading, item, setItem } = useLicsStore();
  const { loadLics, addLic, delLic } = useLicsActions();
  const { token } = useToken();
  const { add, setAdd } = useAdd();

  useEffect(() => {
    if (token) {
        loadLics(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // === ИСПРАВЛЕННЫЙ ОБРАБОТЧИК ===
  const handleLicAdd = async (lic: any) => {
    // lic.name - это код (например "2410...")
    // lic.id   - это UUID (например "CF5B...")
    // Отправляем оба параметра!
    await addLic(token, lic.name, lic.id); 
    setAdd(false);
  };

  const handleLicDel = async (lc: string) => {
    await delLic(token, lc);
  };

  const isLicItem = item && (item.code !== undefined || item.debts !== undefined);

  return (
    <div className={styles.container}>
      {/* Убрал IonLoading на весь экран, чтобы не мигало при фоновом обновлении */}
      {/* <IonLoading isOpen={loading} message={"Загрузка..."} duration={5000} /> */}

      <div className={styles.licsContainer}>
        <LicsList 
            data={data || []}
            loading={loading}
            onLicClick={setItem}
            onLicDel={handleLicDel}
            formatSum={formatSum}
            getTotalDebt={getTotalDebt}
            getDebtStatus={getDebtStatus}
        />

        {isLicItem && (
            <LicForm 
                isOpen={true}
                licAccount={item}
                onClose={() => setItem(undefined)}
            /> 
        )}

        {add && (
          <FindLics
            isOpen={add}
            onClose={() => setAdd(false)}
            onSelect={handleLicAdd}
          />
        )}
      </div>
    </div>
  );
};

export default Lics;