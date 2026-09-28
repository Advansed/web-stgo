import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { arrowForwardOutline, arrowUpOutline, calendarOutline, chevronDownOutline, documentTextOutline, logOutOutline, mapOutline, refreshOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useLoginStore, useUser, useToken } from '../Store/loginStore';
import { useInvoices } from '../Store/invoiceStore';
import styles from './Home.module.css';

interface HomeInvoice {
  id?: string;
  number?: string;
  date?: string;
  plan_date?: string;
  complete_date?: string;
  status?: string;
  address?: string;
  description?: string;
  applicant?: string;
}

const ACTIVE_STATUSES = new Set(['Новый', 'Назначен', 'В работе', 'Отложен']);
const COMPLETED_STATUSES = new Set(['Завершен', 'Завершено', 'Выполнена', 'Выполнено']);

const localDay = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
};

const shortDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
};

type MetricProps = {
  label: string;
  value: number | string;
  detail: string;
  asset: string;
  tone: 'priority' | 'work' | 'done';
  loading?: boolean;
  action?: () => void;
  actionLabel?: string;
};

const MetricCard: React.FC<MetricProps> = ({ label, value, detail, asset, tone, loading, action, actionLabel }) => {
  const content = <>
    <div className={styles.metricCopy}>
      <span className={styles.metricLabel}>{label}</span>
      {loading ? <span className={styles.metricSkeleton} aria-hidden="true" /> : <strong className={styles.metricValue}>{value}</strong>}
      <span className={styles.metricDetail}>{detail}</span>
      {actionLabel && <span className={styles.metricAction}>{actionLabel}<IonIcon icon={arrowForwardOutline} aria-hidden="true" /></span>}
    </div>
    <img className={styles.metricAsset} src={asset} alt="" aria-hidden="true" width="400" height="400" />
  </>;
  const className = [styles.metric, styles[tone], action ? styles.metricInteractive : ''].join(' ');
  return action
    ? <button className={className} type="button" onClick={action} aria-label={`${label}: ${value}. ${actionLabel || ''}`}>{content}</button>
    : <article className={className} aria-label={loading ? `${label}: загрузка` : `${label}: ${value}`}>{content}</article>;
};

const Home: React.FC = () => {
  const history = useHistory();
  const logout = useLoginStore((state) => state.logout);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setProfileOpen(false); profileButtonRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [profileOpen]);
  const { user } = useUser();
  const { token } = useToken();
  const { data, loading, loaded, error, loadInvoices } = useInvoices();

  const invoices = data as HomeInvoice[];
  const today = localDay(new Date());
  const fullName = String(user?.fullName || user?.name || '').trim();
  const firstName = fullName.split(/\s+/)[0] || 'коллега';
  const dateLabel = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  const { active, overdue, completedToday, queue, recent } = useMemo(() => {
    const activeList = invoices.filter((invoice) => ACTIVE_STATUSES.has(String(invoice.status || '')));
    const overdueList = activeList.filter((invoice) =>
      Boolean(invoice.plan_date && String(invoice.plan_date).slice(0, 10) < today)
    ).sort((a, b) => String(a.plan_date).localeCompare(String(b.plan_date)));
    const completed = invoices.filter((invoice) =>
      COMPLETED_STATUSES.has(String(invoice.status || '')) &&
      String(invoice.complete_date || '').slice(0, 10) === today
    );
    const byDueDate = [...activeList].sort((a, b) =>
      String(a.plan_date || '9999').localeCompare(String(b.plan_date || '9999'))
    );
    const byCreatedDate = [...invoices].sort((a, b) =>
      String(b.date || '').localeCompare(String(a.date || ''))
    );
    return { active: activeList, overdue: overdueList, completedToday: completed.length, queue: byDueDate.slice(0, 3), recent: byCreatedDate.slice(0, 3) };
  }, [invoices, today]);

  const showLoading = !loaded && !error;
  const dataUnavailable = Boolean(error && !loaded);
  const firstDue = queue[0];
  const isOverdue = overdue.length > 0;
  const heroMessage = dataUnavailable
    ? 'Данные заявок недоступны. Повторите загрузку.'
    : showLoading
      ? 'Загружаем рабочие данные…'
    : isOverdue
      ? 'Срок по заявке № ' + (firstDue?.number || '—') + ' прошёл. Проверьте её в списке.'
      : active.length > 0
        ? 'У вас есть заявки в работе. Откройте список, чтобы продолжить.'
        : 'Активных заявок нет. Новые появятся здесь после загрузки.';

  const openInvoice = (invoice: HomeInvoice) => {
    if (invoice.id) history.push('/invoices', { openInvoiceId: invoice.id });
    else history.push('/invoices');
  };

  const retry = () => {
    if (token) void loadInvoices(token, true);
  };

  const go = (path: string) => history.push(path);

  return (
    <div className={styles.home}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            <img className={styles.brandMark} src="/assets/brand/stng-wordmark.png" alt="Саха Транснефтегаз" width="461" height="156" />
            <span className={styles.brandCaption}>Мобильный инспектор</span>
          </div>
          <div className={styles.profile} ref={profileRef}>
            <button className={styles.profileTrigger} ref={profileButtonRef} type="button" aria-haspopup="menu" aria-expanded={profileOpen} aria-controls="home-profile-menu" aria-label={'Профиль: ' + (fullName || 'Сотрудник')} onClick={() => setProfileOpen((value) => !value)}>
              <span className={styles.userText}><span>Рабочий профиль</span><strong>{fullName || 'Сотрудник'}</strong></span>
              <span className={styles.userAvatar} aria-hidden="true">{firstName.slice(0, 1).toUpperCase()}</span>
              <IonIcon icon={chevronDownOutline} className={styles.profileChevron} aria-hidden="true" />
            </button>
            {profileOpen && <div className={styles.profileMenu} id="home-profile-menu" role="menu" aria-label="Профиль">
              <div className={styles.profileIdentity}><span>Вы вошли как</span><strong>{fullName || 'Сотрудник'}</strong></div>
              <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); go('/invoices'); }}><IonIcon icon={mapOutline} aria-hidden="true" />Заявки и карта</button>
              <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); go('/lics'); }}><IonIcon icon={documentTextOutline} aria-hidden="true" />Лицевые счета</button>
              <button className={styles.logoutItem} type="button" role="menuitem" onClick={() => { setProfileOpen(false); logout(); }}><IonIcon icon={logOutOutline} aria-hidden="true" />Выйти из системы</button>
            </div>}
          </div>
        </div>
      </header>

      <main className={styles.shell}>
        <section className={styles.hero} aria-labelledby="home-title">
          <img className={styles.heroAsset} src="/assets/home/home-hero-gas-meter.webp" alt="" aria-hidden="true" width="1200" height="800" />
          <div className={styles.heroCopy}>
            <div className={`${styles.heroMeta} stng-header-eyebrow`}><span className={styles.metaDot} /><IonIcon icon={calendarOutline} />{dateLabel}</div>
            <h1 id="home-title" className="stng-header-title">{greeting()}, <span>{firstName}</span></h1>
            <p className={`stng-header-context ${isOverdue ? styles.heroAlert : ""}`}>{heroMessage}</p>
            <div className={styles.heroActions}>
              <button className={styles.primaryAction} type="button" onClick={dataUnavailable ? retry : () => go('/invoices')}>
                <IonIcon icon={dataUnavailable ? refreshOutline : mapOutline} aria-hidden="true" /><span>{dataUnavailable ? <><span className={styles.actionLong}>Повторить загрузку</span><span className={styles.actionShort}>Повторить</span></> : <><span className={styles.actionLong}>Открыть заявки</span><span className={styles.actionShort}>Заявки</span></>}</span><IonIcon icon={arrowForwardOutline} aria-hidden="true" />
              </button>
              <button className={styles.secondaryAction} type="button" onClick={() => go('/lics')}>
                <IonIcon icon={documentTextOutline} aria-hidden="true" /><span>Лицевые счета</span>
              </button>
            </div>
          </div>
          <div className={styles.heroFocus}>
            <span className={styles.focusLabel}>БЛИЖАЙШИЙ СРОК</span>
            {showLoading ? <strong>…</strong> : dataUnavailable ? <span>Данные недоступны</span> : queue[0] ? <>
              <strong className={styles.focusNumber}>№ {queue[0].number || '—'}</strong>
              <span>{queue[0].plan_date ? (String(queue[0].plan_date).slice(0, 10) < today ? 'Срок прошёл · ' : 'До · ') + shortDate(queue[0].plan_date) : queue[0].status}</span>
            </> : <span>Активных заявок нет</span>}
            <span className={styles.focusRule} />
          </div>
        </section>

        <section className={styles.overview} aria-labelledby="overview-title">
          <div className={styles.sectionHeading}><div><span className={styles.sectionKicker}>СВОДКА</span><h2 id="overview-title">Заявки и сроки</h2></div><span className={styles.sectionNote}>По данным заявок</span></div>
          <div className={styles.metrics}>
            {overdue.length > 0 && <MetricCard label="Просроченные заявки" value={dataUnavailable ? '—' : overdue.length} detail="Срок исполнения уже прошёл" tone="priority" asset="/assets/home/home-kpi-overdue.webp" loading={showLoading} action={!dataUnavailable && !showLoading ? () => openInvoice(overdue[0]) : undefined} actionLabel={!dataUnavailable && !showLoading ? 'Открыть ближайшую' : undefined} />}
            {overdue.length === 0 && <MetricCard label="Просроченные заявки" value={dataUnavailable ? '—' : 0} detail={dataUnavailable ? 'Данные недоступны' : showLoading ? 'Проверяем сроки' : 'Сроки в порядке'} tone="priority" asset="/assets/home/home-kpi-overdue.webp" loading={showLoading} />}
            <MetricCard label="Открытые заявки" value={dataUnavailable ? '—' : active.length} detail="Ещё не завершены в системе" tone="work" asset="/assets/home/home-kpi-open.webp" loading={showLoading} action={!dataUnavailable && !showLoading ? () => go('/invoices') : undefined} actionLabel={!dataUnavailable && !showLoading ? 'Список' : undefined} />
            <MetricCard label="Завершено сегодня" value={dataUnavailable ? '—' : completedToday} detail="По дате закрытия заявки" tone="done" asset="/assets/home/home-kpi-completed.webp" loading={showLoading} />
          </div>
        </section>

        <div className={styles.workGrid}>
          <section className={styles.queueSection} aria-labelledby="queue-title">
            <div className={styles.sectionHeading}>
              <div><span className={styles.sectionKicker}>ЗАЯВКИ</span><h2 id="queue-title">В работе</h2></div>
              <button className={styles.refreshButton} type="button" onClick={retry} disabled={loading || !token} aria-label={loading ? "Обновление заявок" : "Обновить заявки"}><IonIcon className={loading ? styles.refreshActive : undefined} icon={refreshOutline} aria-hidden="true" /><span>{loading ? "Обновляем" : "Обновить"}</span></button>
            </div>
            {error && <div className={styles.errorState} role="alert"><strong>Не удалось загрузить заявки</strong><span>{error}</span><button type="button" onClick={retry}>Повторить</button></div>}
            {showLoading ? (
              <div className={styles.queueList} aria-label="Загрузка заявок">{[0, 1].map((item) => <div className={styles.queueSkeleton} key={item}><span /><span /><span /></div>)}</div>
            ) : queue.length > 0 ? (
              <div className={styles.queueList}>
                {queue.map((invoice) => {
                  const due = String(invoice.plan_date || '').slice(0, 10);
                  const overdue = Boolean(due && due < today);
                  return <button className={styles.queueItem} type="button" onClick={() => openInvoice(invoice)} key={invoice.id || invoice.number} aria-label={"Открыть заявку № " + (invoice.number || "без номера")}>
                    <div className={styles.queueNumber}><span className={overdue ? styles.overdueDot : styles.normalDot} />Заявка № {invoice.number || 'без номера'}</div>
                    <strong>{invoice.address || invoice.description || 'Адрес не указан'}</strong>
                    <div className={styles.queueMeta}><span>{invoice.status || 'Статус не указан'}</span>{due && <span className={overdue ? styles.queueOverdue : undefined}>{overdue ? 'Срок прошёл · ' : 'Срок · '}{shortDate(invoice.plan_date)}</span>}</div>
                  </button>;
                })}
              </div>
            ) : !error && <div className={styles.emptyState}><strong>Активных заявок нет</strong><span>Новые заявки появятся здесь после загрузки из системы.</span></div>}
            <button className={styles.textLink} type="button" onClick={() => go('/invoices')}>Все заявки <IonIcon icon={arrowForwardOutline} aria-hidden="true" /></button>
          </section>

          <aside className={styles.sideColumn}>
            <section className={styles.navSection} aria-labelledby="nav-title">
              <div className={styles.sectionHeading}><div><span className={styles.sectionKicker}>ПОИСК</span><h2 id="nav-title">Лицевые счета</h2></div></div>
              <button className={styles.accountCard} type="button" onClick={() => go('/lics')}>
                <span className={styles.accountCopy}><strong>Найти лицевой счёт</strong><span>Поиск и данные абонента</span><span className={styles.accountAction}>Открыть поиск <IonIcon icon={arrowForwardOutline} aria-hidden="true" /></span></span>
                <img src="/assets/home/home-action-accounts.webp" alt="" aria-hidden="true" width="400" height="400" />
              </button>
            </section>

            <section className={styles.recentSection} aria-labelledby="recent-title">
              <div className={styles.sectionHeading}><div><span className={styles.sectionKicker}>ИСТОРИЯ</span><h2 id="recent-title">Недавние заявки</h2></div></div>
              {showLoading ? <div className={styles.recentSkeleton} aria-label="Загрузка списка" /> : recent.length > 0 ? (
                <ul className={styles.recentList}>{recent.map((invoice) => <li key={invoice.id || invoice.number}><span className={styles.recentPin} /><div><strong>№ {invoice.number || 'без номера'}</strong><span>{invoice.status || 'Статус не указан'}</span></div><time dateTime={invoice.date}>{shortDate(invoice.date)}</time></li>)}</ul>
              ) : <p className={styles.recentEmpty}>{dataUnavailable ? 'Данные временно недоступны.' : 'Заявок пока нет.'}</p>}
            </section>
          </aside>
        </div>

        <footer className={styles.footer}><span>АО «Сахатранснефтегаз»</span><span>Мобильный инспектор</span><IonIcon icon={arrowUpOutline} aria-hidden="true" /></footer>
      </main>
    </div>
  );
};

export default Home;
