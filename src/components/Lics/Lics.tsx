import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LicsList from './components/List/LicsList';
import FindLics from './components/FindLic/FindLics';
import { LicForm } from './components/LicsForm';
import styles from './Lics.module.css';

import { useAdd } from '../../Store/navigationStore';
import { useToken } from '../../Store/loginStore';
import { useLicsStore, useLicsActions } from '../../Store/licsStore';
import { formatSum, getTotalDebt, getDebtStatus } from '../../utils/format'; 

const Lics: React.FC = () => {
  const data = useLicsStore((s) => s.data);
  const loading = useLicsStore((s) => s.loading);
  const item = useLicsStore((s) => s.item);
  const setItem = useLicsStore((s) => s.setItem);
  const { loadLics, addLic, delLic } = useLicsActions();
  const { token } = useToken();
  const { add, setAdd } = useAdd();
  const location = useLocation();

  useEffect(() => {
    if (token && location.pathname === '/lics') {
      loadLics(token);
    }
  }, [token, location.key, location.pathname, loadLics]);

  const handleLicAdd = async (lic: any) => {
    await addLic(token, lic.name, lic.id); 
    setAdd(false);
  };

  const handleLicDel = async (lc: string) => {
    await delLic(token, lc);
  };

  const isLicItem = item && (item.code !== undefined || item.debts !== undefined);

  return (
    <div className={styles.container}>
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
