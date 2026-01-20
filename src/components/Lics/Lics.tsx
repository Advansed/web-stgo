import React, { useEffect } from 'react';
import LicsList from './components/List/LicsList';
import FindLics from './components/FindLic/FindLics';
import { useLics, formatSum, getTotalDebt, getDebtStatus } from './useLics';
import styles from './Lics.module.css';
import { LicForm } from './components/LicsForm'; // Проверь путь
import { useAdd } from '../../Store/navigationStore';
import { IonLoading } from '@ionic/react';

const Lics: React.FC<any> = () => {
  const {
    data,
    item,
    loading,
    addLics,
    deleteLics,
    setItem,
    refreshData
  } = useLics();

  const { add, setAdd } = useAdd();

  // === ЗАПУСК ===
  useEffect(() => {
    setItem(undefined);
    
    // Запускаем функцию с проверкой.
    // Если глобальный update < 5 -> загрузит 1 раз и поставит 5.
    // При следующем ремаунте update уже 5 -> загрузка не пойдет.
    refreshData(); 

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleLicAdd = (lic: any) => {
    addLics({ id: lic.id, code: lic.name });
    setAdd(false);
  };

  const handleLicDel = (lic: string) => {
    deleteLics(lic);
  };

  const isLicItem = item && (item.code !== undefined || item.debts !== undefined);

  return (
    <div className={styles.container}>
      <IonLoading isOpen={loading} message={"Загрузка..."} duration={5000} />

      <div className={styles.content}>
        <LicsList 
            data={data}
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