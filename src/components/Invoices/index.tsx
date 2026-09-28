import React, { useEffect, useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  addOutline, closeOutline, filterOutline, listOutline,
  mapOutline, peopleOutline, personOutline, refreshOutline, searchOutline,
  locateOutline, arrowForwardOutline, calendarOutline, removeOutline,
} from 'ionicons/icons';
import { useInvoices } from '../../Store/invoiceStore';
import { useToken } from '../../Store/loginStore';
import { useWorkers } from '../../Store/navigationStore';
import Maps, { MapLoadState, MapMetrics } from '../Maps/Maps';
import CreateInvoiceModal from './components/CreateInvoiceModal';
import InvoiceItem from './components/InvoiceList/InvoiceItem';
import { InvoiceFilter, formatDeadline, invoiceAddress, invoiceStatus, isInvoiceOverdue, matchesInvoiceFilter, matchesInvoiceSearch } from './invoicePresentation';
import styles from './components/InvoiceList/InvoiceList.module.css';

type ModalMode = 'none' | 'view' | 'create';
type InvoiceNavigationState = { openInvoiceId?: string };
type ViewMode = 'list' | 'map' | 'workers';

const FILTERS: { key: InvoiceFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'open', label: 'Открытые' },
  { key: 'overdue', label: 'Просроченные' },
  { key: 'completed', label: 'Завершённые' },
];

const localDay = () => {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
};

const Invoices: React.FC = () => {
  const history = useHistory<InvoiceNavigationState>();
  const openInvoiceId = history.location.state?.openInvoiceId;
  const { data: invoices, loading, loaded, error, loadInvoices } = useInvoices();
  const { token } = useToken();
  const { workers } = useWorkers();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('list');
  const [mapStatus, setMapStatus] = useState<MapLoadState>('loading');
  const [mapMetrics, setMapMetrics] = useState<MapMetrics>({ source: 0, plotted: 0, pending: 0, unlocated: 0 });
  const [mapSelection, setMapSelection] = useState<any>(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [zoomRequest, setZoomRequest] = useState<{ step: number; direction: 1 | -1 }>({ step: 0, direction: 1 });
  const [retryRequest, setRetryRequest] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [mode, setMode] = useState<ModalMode>('none');


  const today = localDay();
  const initialLoading = !loaded && !error;
  const isUnavailable = !!error && !loaded;

  useEffect(() => {
    if (token) void loadInvoices(token);
  }, [token, loadInvoices]);

  useEffect(() => {
    if (!openInvoiceId || loading || !loaded) return;
    const target = invoices.find((invoice: any) => invoice.id === openInvoiceId || invoice.Ссылка === openInvoiceId);
    if (!target) return;
    setSelected(target);
    setMode('view');
    history.replace('/invoices', {});
  }, [openInvoiceId, loading, loaded, invoices, history]);

  const selectedInvoice = useMemo(() => {
    if (!selected) return null;
    return invoices.find((invoice: any) => invoice.id === selected.id || invoice.Ссылка === selected.id) || selected;
  }, [invoices, selected]);

  const counts = useMemo(() => ({
    all: invoices.length,
    open: invoices.filter((invoice: any) => invoiceStatus(invoice).open).length,
    overdue: invoices.filter((invoice: any) => isInvoiceOverdue(invoice, today)).length,
    completed: invoices.filter((invoice: any) => invoiceStatus(invoice).completed).length,
  }), [invoices, today]);

  const visibleInvoices = useMemo(() => invoices
    .filter((invoice: any) => matchesInvoiceFilter(invoice, filter, today) && matchesInvoiceSearch(invoice, query))
    .sort((a: any, b: any) => {
      const priority = (invoice: any) => isInvoiceOverdue(invoice, today) ? 0 : invoiceStatus(invoice).open ? 1 : invoiceStatus(invoice).completed ? 3 : 2;
      const rank = priority(a) - priority(b);
      if (rank) return rank;
      const dueA = String(a.plan_date || '');
      const dueB = String(b.plan_date || '');
      if (dueA && dueB && dueA !== dueB) return dueA.localeCompare(dueB);
      if (dueA && !dueB) return -1;
      if (!dueA && dueB) return 1;
      return String(b.date || '').localeCompare(String(a.date || ''));
    }), [invoices, filter, query, today]);

  const refresh = () => {
    if (token) void loadInvoices(token, true);
  };
  const closeModal = () => {
    setMode('none');
    setSelected(null);
  };
  const selectInvoice = (invoice: any) => {
    setMapSelection(invoice);
    setSelected(invoice);
    setMode('view');
  };

  useEffect(() => {
    if (mapSelection && !visibleInvoices.some((invoice: any) => invoice.id === mapSelection.id)) setMapSelection(null);
  }, [visibleInvoices, mapSelection]);

  const filterLabel = FILTERS.find((item) => item.key === filter)?.label || 'Все';
  const resultLabel = initialLoading
    ? 'Загружаем заявки'
    : isUnavailable
      ? 'Данные недоступны'
      : query || filter !== 'all'
        ? `Найдено: ${visibleInvoices.length} из ${invoices.length}`
        : `Всего заявок: ${invoices.length}`;

  return (
    <main className={`${styles.workspace} ${view === 'map' ? styles.mapWorkspace : ''}`}>
      <div className={styles.content}>
        <header className={`${styles.headingRow} stng-page-heading`}>
          <div>
            <p className={`${styles.eyebrow} stng-header-eyebrow`}>Рабочий список</p>
            <h1 className="stng-header-title">Заявки</h1>
            <p className={`${styles.subtitle} stng-header-context`}>Найдите заявку, проверьте срок и откройте работу.</p>
          </div>
          <div className={styles.desktopActions}>
            <button className={styles.ghostAction} type="button" onClick={refresh} disabled={loading || !token} aria-label={loading ? 'Обновление заявок' : 'Обновить заявки'}>
              <IonIcon icon={refreshOutline} aria-hidden="true" /><span>{loading ? 'Обновляем' : 'Обновить'}</span>
            </button>
            <button className={styles.primaryAction} type="button" onClick={() => setMode('create')}>
              <IonIcon icon={addOutline} aria-hidden="true" /><span>Новая заявка</span>
            </button>
          </div>
        </header>

        <div className={styles.workArea}>
          <section className={`${styles.listPanel} ${view !== 'list' ? styles.hideOnSmall : ''}`} aria-label="Список и поиск заявок">
            <div className={styles.listControls}>
              <div className={styles.searchRow}>
                <div className={styles.searchField}>
                  <IonIcon icon={searchOutline} aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Поиск заявок по номеру, адресу, описанию, сотруднику и статусу"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Номер или адрес"
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                  {query && <button type="button" className={styles.clearSearch} onClick={() => setQuery('')} aria-label="Очистить поиск"><IonIcon icon={closeOutline} aria-hidden="true" /></button>}
                </div>
                <button
                  type="button"
                  className={`${styles.filterToggle} ${filter !== 'all' ? styles.filterToggleActive : ''}`}
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                  aria-controls="invoice-filters"
                  aria-label={`Фильтры. Сейчас: ${filterLabel}`}
                >
                  <IonIcon icon={filterOutline} aria-hidden="true" />
                  <span>{filter === 'all' ? 'Фильтры' : filterLabel}</span>
                </button>
                <button className={styles.mobileRefresh} type="button" onClick={refresh} disabled={loading || !token} aria-label={loading ? 'Обновление заявок' : 'Обновить заявки'}>
                  <IonIcon icon={refreshOutline} aria-hidden="true" />
                </button>
              </div>

              <div id="invoice-filters" className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ''}`} aria-label="Фильтр заявок">
                <div className={styles.chips}>
                  {FILTERS.map((item) => <button
                    key={item.key}
                    type="button"
                    className={`${styles.chip} ${filter === item.key ? styles.chipActive : ''}`}
                    onClick={() => { setFilter(item.key); setFiltersOpen(false); }}
                    aria-pressed={filter === item.key}
                  >{item.label}<span>{counts[item.key]}</span></button>)}
                </div>
                {filter !== 'all' && <button className={styles.resetFilter} type="button" onClick={() => { setFilter('all'); setFiltersOpen(false); }}>Сбросить</button>}
              </div>

              <div className={styles.resultBar} aria-live="polite">
                <strong>{resultLabel}</strong>
                {filter === 'all' && !query && counts.overdue > 0 && !isUnavailable && <span className={styles.overdueCount}>Просрочено: {counts.overdue}</span>}
              </div>
            </div>

            <div className={styles.listScroll} aria-busy={initialLoading}>
              {error && <div className={styles.errorState} role="alert"><strong>Не удалось загрузить заявки</strong><span>{error}</span><button type="button" onClick={refresh} disabled={loading}>Повторить</button></div>}
              {initialLoading ? (
                <div className={styles.skeletonList} aria-label="Загрузка заявок">
                  {[0, 1, 2, 3].map((item) => <div className={styles.skeletonCard} key={item}><span /><span /><span /><span /></div>)}
                </div>
              ) : !isUnavailable && visibleInvoices.length > 0 ? (
                <div className={styles.invoiceList}>
                  {visibleInvoices.map((invoice: any) => <InvoiceItem
                    key={invoice.id || invoice.Ссылка}
                    invoice={invoice}
                    onSelect={selectInvoice}
                    isSelected={selected?.id === invoice.id && mode === 'view'}
                    today={today}
                  />)}
                </div>
              ) : !isUnavailable && (
                <div className={styles.emptyState}>
                  <strong>{query ? 'По запросу ничего не найдено' : filter !== 'all' ? 'Нет заявок с выбранным фильтром' : 'Заявок пока нет'}</strong>
                  <p>{query ? 'Проверьте номер, адрес или описание.' : filter !== 'all' ? 'Попробуйте другой статус или покажите все заявки.' : 'Новые заявки появятся здесь после загрузки из системы.'}</p>
                  {query ? <button type="button" onClick={() => setQuery('')}>Очистить поиск</button> : filter !== 'all' ? <button type="button" onClick={() => setFilter('all')}>Сбросить фильтр</button> : null}
                </div>
              )}
            </div>
          </section>

          <section className={`${styles.mapPanel} ${view !== 'map' ? styles.hideOnSmall : ''}`} aria-label="Карта заявок">
            <div className={styles.panelHeader}>
              <div className={styles.mapHeading}>
                <strong>Карта заявок</strong>
                <span>{isUnavailable ? 'Данные недоступны' : `На карте: ${mapMetrics.plotted} из ${visibleInvoices.length}`}{(filter !== 'all' || query) && <b className={styles.mapAppliedFilter}> · {filter !== 'all' ? filterLabel : 'Поиск'}</b>}</span>
              </div>
              <div className={styles.mapHeaderActions}>
                {filter !== 'all' && <span className={styles.mapFilterIndicator}>{filterLabel}</span>}
                {query && <span className={styles.mapFilterIndicator}>Поиск</span>}
                <button className={styles.mapListAction} type="button" onClick={() => setView('list')} aria-label="К списку заявок">К списку</button>
                <button className={styles.mapFitAction} type="button" onClick={() => setFitRequest((value) => value + 1)} disabled={mapStatus !== 'ready' || mapMetrics.plotted === 0} aria-label="Показать все заявки на карте">
                  <IonIcon icon={locateOutline} aria-hidden="true" /><span>Показать все</span>
                </button>
              </div>
            </div>
            <div className={styles.mapCanvas}>
              <Maps
                invoices={visibleInvoices}
                selectedId={mapSelection?.id}
                onSelectInvoice={setMapSelection}
                onStatusChange={setMapStatus}
                onMetricsChange={setMapMetrics}
                fitRequest={fitRequest}
                zoomRequest={zoomRequest}
                retryRequest={retryRequest}
              />
              {mapStatus === 'ready' && visibleInvoices.length > 0 && <div className={styles.mapZoomControls} aria-label="Масштаб карты">
                <button type="button" onClick={() => setZoomRequest((value) => ({ step: value.step + 1, direction: 1 }))} aria-label="Увеличить масштаб карты"><IonIcon icon={addOutline} aria-hidden="true" /></button>
                <button type="button" onClick={() => setZoomRequest((value) => ({ step: value.step + 1, direction: -1 }))} aria-label="Уменьшить масштаб карты"><IonIcon icon={removeOutline} aria-hidden="true" /></button>
              </div>}
              {!initialLoading && !isUnavailable && visibleInvoices.length === 0 ? (
                <div className={styles.mapOverlay} role="status">
                  <IonIcon icon={mapOutline} aria-hidden="true" />
                  <strong>Нет заявок для отображения</strong>
                  <span>{query ? 'Измените или очистите поиск в списке.' : filter !== 'all' ? 'Сбросьте фильтр в списке заявок.' : 'Когда появятся заявки, их расположение будет показано здесь.'}</span>
                  {(query || filter !== 'all') && <button type="button" onClick={() => setView('list')}>К списку заявок</button>}
                </div>
              ) : mapStatus !== 'ready' || initialLoading || isUnavailable ? (
                <div className={styles.mapOverlay} role="status">
                  <IonIcon icon={mapOutline} aria-hidden="true" />
                  <strong>{isUnavailable ? 'Заявки сейчас недоступны' : mapStatus === 'error' ? 'Карта временно недоступна' : 'Загружаем карту'}</strong>
                  <span>{isUnavailable ? 'Обновите список заявок и повторите.' : mapStatus === 'error' ? 'Список заявок продолжает работать. Попробуйте загрузить карту ещё раз.' : 'Подключаем сервис карт и размещаем заявки…'}</span>
                  {mapStatus === 'error' && <button type="button" onClick={() => setRetryRequest((value) => value + 1)}>Повторить</button>}
                  {isUnavailable && <button type="button" onClick={refresh}>Обновить заявки</button>}
                  {mapStatus === 'loading' && <span className={styles.mapProgress} aria-hidden="true" />}
                </div>
              ) : null}
              {mapStatus === 'ready' && mapMetrics.pending === 0 && mapMetrics.unlocated > 0 && visibleInvoices.length > 0 &&
                <p className={styles.mapNotice}>У части заявок нет координат · {mapMetrics.unlocated}</p>}
              {mapStatus === 'ready' && mapSelection && visibleInvoices.some((invoice: any) => invoice.id === mapSelection.id) &&
                <div className={styles.mapPreview} role="group" aria-label={`Выбрана заявка № ${mapSelection.number || 'без номера'}`}>
                  <div className={styles.mapPreviewTop}>
                    <strong>№ {mapSelection.number || 'Без номера'}</strong>
                    <span className={`${styles.mapPreviewStatus} ${isInvoiceOverdue(mapSelection, today) ? styles.mapPreviewStatusOverdue : ''}`}>{invoiceStatus(mapSelection).label}</span>
                    <button type="button" onClick={() => setMapSelection(null)} aria-label="Закрыть просмотр заявки"><IonIcon icon={closeOutline} aria-hidden="true" /></button>
                  </div>
                  <p>{invoiceAddress(mapSelection)}</p>
                  <div className={styles.mapPreviewBottom}>
                    <span className={isInvoiceOverdue(mapSelection, today) ? styles.mapPreviewDeadlineOverdue : ''}><IonIcon icon={calendarOutline} aria-hidden="true" />{mapSelection.plan_date ? `${isInvoiceOverdue(mapSelection, today) ? 'Просрочено: ' : 'Срок: '}${formatDeadline(mapSelection.plan_date)}` : 'Срок не указан'}</span>
                    <button type="button" onClick={() => selectInvoice(mapSelection)}>Открыть заявку <IonIcon icon={arrowForwardOutline} aria-hidden="true" /></button>
                  </div>
                </div>}
            </div>
          </section>

          <aside className={`${styles.workersPanel} ${view !== 'workers' ? styles.hideOnSmall : ''}`} aria-label="Сотрудники">
            <div className={styles.panelHeader}><strong>Сотрудники</strong><span>{workers.length}</span></div>
            <div className={styles.workersList}>
              {workers.length > 0 ? workers.map((worker: any) => <div className={styles.workerRow} key={worker.id}>
                <span className={styles.workerIcon}><IonIcon icon={personOutline} aria-hidden="true" /></span>
                <span className={styles.workerText}><strong>{worker.name || 'Без имени'}</strong><small>{worker.role || 'Сотрудник'}</small>
                  {(worker.in_work != null || worker.completed != null) && <small>{worker.in_work != null ? `В работе: ${worker.in_work}` : ''}{worker.in_work != null && worker.completed != null ? ' · ' : ''}{worker.completed != null ? `Завершено: ${worker.completed}` : ''}</small>}
                </span>
              </div>) : <p className={styles.workersEmpty}>Данные о сотрудниках пока недоступны.</p>}
            </div>
          </aside>
        </div>
      </div>

      <nav className={styles.mobileDock} aria-label="Разделы заявок">
        <button className={view === 'list' ? styles.dockActive : ''} type="button" onClick={() => setView('list')} aria-current={view === 'list' ? 'page' : undefined}><IonIcon icon={listOutline} aria-hidden="true" /><span>Список</span></button>
        <button className={view === 'map' ? styles.dockActive : ''} type="button" onClick={() => setView('map')} aria-current={view === 'map' ? 'page' : undefined}><IonIcon icon={mapOutline} aria-hidden="true" /><span>Карта</span></button>
        <button className={view === 'workers' ? styles.dockActive : ''} type="button" onClick={() => setView('workers')} aria-current={view === 'workers' ? 'page' : undefined}><IonIcon icon={peopleOutline} aria-hidden="true" /><span>Команда</span></button>
        <button className={styles.dockCreate} type="button" onClick={() => setMode('create')}><IonIcon icon={addOutline} aria-hidden="true" /><span>Новая</span></button>
      </nav>

      <CreateInvoiceModal
        isOpen={mode !== 'none'}
        invoice={mode === 'view' ? selectedInvoice : null}
        onClose={closeModal}
        workers={workers}
        onCreated={() => { closeModal(); refresh(); }}
        onSaved={() => { closeModal(); refresh(); }}
      />
    </main>
  );
};

export default Invoices;
