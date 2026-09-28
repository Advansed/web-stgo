import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonAlert, IonIcon } from '@ionic/react';
import { addOutline, closeOutline, refreshOutline, searchOutline } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import LicsList from './components/List/LicsList';
import FindLics from './components/FindLic/FindLics';
import { LicForm } from './components/LicsForm';
import type { LicAccount } from './components/List/LicItem';
import styles from './Lics.module.css';

import { useAdd } from '../../Store/navigationStore';
import { useToken } from '../../Store/loginStore';
import { useLicsStore, useLicsActions } from '../../Store/licsStore';
import { isApiOk } from '../../Store/api';
import { getDisplayAddress } from '../../utils/format';

const Lics: React.FC = () => {
  const data = useLicsStore((state) => state.data);
  const loading = useLicsStore((state) => state.loading);
  const item = useLicsStore((state) => state.item);
  const setItem = useLicsStore((state) => state.setItem);
  const { loadLics, addLic, delLic } = useLicsActions();
  const { token } = useToken();
  const { add, setAdd } = useAdd();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<LicAccount | null>(null);
  const deleting = useRef(false);

  useEffect(() => {
    if (!token || location.pathname !== '/lics') return;
    let active = true;
    void loadLics(token).then((result) => {
      if (!active) return;
      setLoadError(!isApiOk(result));
      setLoaded(true);
    });
    return () => { active = false; };
  }, [token, location.pathname, loadLics]);

  const refresh = async () => {
    if (!token || refreshing) return;
    setRefreshing(true);
    setActionError('');
    try {
      const result = await loadLics(token, true);
      setLoadError(!isApiOk(result));
      setLoaded(true);
    } finally {
      setRefreshing(false);
    }
  };

  const visibleData = useMemo(() => {
    const words = query.toLocaleLowerCase('ru-RU').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return data;
    return data.filter((lic: LicAccount) => {
      const haystack = [
        lic.code,
        lic.name,
        lic.applicant,
        lic.address ? getDisplayAddress(lic.address) : '',
      ].map((value) => String(value || '')).join(' ').toLocaleLowerCase('ru-RU');
      return words.every((word) => haystack.includes(word));
    });
  }, [data, query]);

  const handleLicAdd = async (lic: any): Promise<boolean> => {
    const result = await addLic(token, lic.name, lic.id);
    return Boolean(isApiOk(result) || result?.success);
  };

  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target || deleting.current) return;
    deleting.current = true;
    setActionError('');
    try {
      const result = await delLic(token, target.code);
      if (!isApiOk(result)) setActionError('Не удалось удалить лицевой счёт. Повторите попытку.');
    } finally {
      deleting.current = false;
    }
  };

  const isLicItem = item && (item.code !== undefined || item.debts !== undefined);
  const initialLoading = (!loaded || loading) && data.length === 0;
  const noAccounts = loaded && !loading && !loadError && data.length === 0;
  const noSearchResults = data.length > 0 && visibleData.length === 0;

  return (
    <main className={styles.screen}>
      <div className={styles.workspace}>
        <header className={`${styles.heading} stng-page-heading`}>
          <div className={styles.headingCopy}>
            <p className={`${styles.eyebrow} stng-header-eyebrow`}>Работа с абонентами</p>
            <h1 className="stng-header-title">Лицевые счета</h1>
            <p className={`${styles.subtitle} stng-header-context`}>
              {initialLoading ? 'Загружаем список…' : query.trim() ? `Найдено: ${visibleData.length} из ${data.length}` : `Сохранено: ${data.length}`}
            </p>
          </div>
          <div className={styles.headingActions}>
            <button type="button" className={styles.refreshButton} onClick={() => void refresh()} disabled={refreshing || initialLoading} aria-label="Обновить лицевые счета" title="Обновить">
              <IonIcon icon={refreshOutline} aria-hidden="true" />
            </button>
            <button type="button" className={styles.findButton} onClick={() => setAdd(true)}>
              <IonIcon icon={addOutline} aria-hidden="true" />
              <span>Найти лицевой счёт</span>
            </button>
          </div>
        </header>

        <div className={styles.searchArea}>
          <div className={styles.searchBox}>
            <IonIcon icon={searchOutline} aria-hidden="true" />
            <input id="lics-search" aria-label="Поиск лицевых счетов" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Код, абонент или адрес" autoComplete="off" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск"><IonIcon icon={closeOutline} aria-hidden="true" /></button>}
          </div>
        </div>

        {actionError && <div className={styles.inlineError} role="alert">{actionError}</div>}
        {loadError && data.length > 0 && <div className={styles.inlineError} role="alert">Не удалось обновить список. Показаны ранее загруженные данные. <button type="button" onClick={() => void refresh()}>Повторить</button></div>}

        {initialLoading ? (
          <div className={styles.skeletonGrid} aria-label="Загружаем лицевые счета" aria-busy="true">
            {[0, 1, 2, 3].map((number) => <div key={number} className={styles.skeletonCard}><span /><strong /><i /><i /></div>)}
          </div>
        ) : loadError && data.length === 0 ? (
          <div className={styles.stateCard} role="alert">
            <h2>Не удалось загрузить лицевые счета</h2>
            <p>Проверьте соединение и повторите попытку.</p>
            <button type="button" onClick={() => void refresh()}>Повторить</button>
          </div>
        ) : noAccounts ? (
          <div className={styles.stateCard}>
            <h2>Лицевые счета пока не добавлены</h2>
            <p>Найдите счёт по коду или адресу, чтобы открыть его здесь.</p>
            <button type="button" onClick={() => setAdd(true)}>Найти лицевой счёт</button>
          </div>
        ) : noSearchResults ? (
          <div className={styles.stateCard}>
            <h2>По запросу ничего не найдено</h2>
            <p>Проверьте код, имя абонента или адрес.</p>
            <button type="button" onClick={() => setQuery('')}>Очистить поиск</button>
          </div>
        ) : (
          <LicsList data={visibleData} onLicClick={setItem} onDeleteRequest={setPendingDelete} />
        )}
      </div>

      <LicForm isOpen={!!isLicItem} licAccount={item} onClose={() => setItem(undefined)} />
      <FindLics isOpen={add} onClose={() => setAdd(false)} onSelect={handleLicAdd} />

      <IonAlert
        isOpen={!!pendingDelete}
        onDidDismiss={() => setPendingDelete(null)}
        header="Удалить лицевой счёт из списка?"
        subHeader={pendingDelete ? `№ ${pendingDelete.code}` : undefined}
        message="Связь будет удалена. При необходимости счёт можно найти и добавить снова."
        buttons={[
          { text: 'Отмена', role: 'cancel' },
          { text: 'Удалить', role: 'destructive', handler: () => { void confirmDelete(); } },
        ]}
        cssClass="lics-delete-alert"
      />
    </main>
  );
};

export default Lics;
