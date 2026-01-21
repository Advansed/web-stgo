import React from 'react';
import { IonIcon, IonAvatar } from '@ionic/react';
import { 
  mapOutline, documentTextOutline, settingsOutline, arrowForwardOutline,
  timeOutline, checkmarkCircle, alertCircle, searchOutline, qrCodeOutline,
  personAddOutline, notificationsOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useUser } from '../Store/loginStore';
import { useInvoices } from '../Store/invoiceStore';
import { useWorkers } from '../Store/navigationStore';
import styles from './Home.module.css';

const Home: React.FC = () => {
  const history = useHistory();
  const { user } = useUser();
  const { data: invoices } = useInvoices();
  const { workers } = useWorkers();

  // Статистика
  const activeInvoices = invoices?.filter((i: any) => i.status === 'В работе' || i.status === 'Новый')?.length || 0;
  const workersOnline = workers?.length || 0;
  const completedToday = invoices?.filter((i: any) => i.status === 'Выполнена')?.length || 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  // Плитки меню
  const tiles = [
    { key: 'invoices', title: 'Карта заявок', desc: 'Мониторинг и исполнение', icon: mapOutline, style: styles.blueTheme, to: '/invoices' },
    { key: 'lics', title: 'Лицевые счета', desc: 'Реестр абонентов', icon: documentTextOutline, style: styles.greenTheme, to: '/lics' },
    { key: 'settings', title: 'Настройки', desc: 'Профиль и параметры', icon: settingsOutline, style: styles.grayTheme, to: '/settings' },
  ];

  // Имитация ленты событий (потом заменишь на реальные данные из сокетов или API)
  const recentEvents = [
    { id: 1, text: 'Иванов А. завершил заявку #4521', time: '5 мин назад', type: 'success', icon: checkmarkCircle },
    { id: 2, text: 'Новая аварийная заявка #4525', time: '12 мин назад', type: 'alert', icon: alertCircle },
    { id: 3, text: 'Сидоров В. вышел на смену', time: '30 мин назад', type: 'info', icon: timeOutline },
  ];

  return (
    <div className={styles.container}>
      
      {/* === HERO BANNER === */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.headerTop}>
            <div className={styles.dateBadge}><IonIcon icon={timeOutline} /> {today}</div>
            <div className={styles.notifBtn}><IonIcon icon={notificationsOutline} /></div>
          </div>
          
          <h1 className={styles.greeting}>
            {getGreeting()}, <br />
            <span className={styles.userName}>{user?.fullName?.split(' ')[0] || 'Коллега'}!</span>
          </h1>
          
          {/* Быстрые действия внутри баннера */}
          <div className={styles.quickActions}>
            <button className={styles.qBtn} onClick={() => history.push('/invoices')}>
              <IonIcon icon={searchOutline} /> Найти
            </button>
            <button className={styles.qBtn}>
              <IonIcon icon={qrCodeOutline} /> QR
            </button>
            <button className={styles.qBtn}>
              <IonIcon icon={personAddOutline} /> Смена
            </button>
          </div>
        </div>
        <div className={styles.heroDecor} />
      </div>

      {/* === СТАТИСТИКА === */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.bgOrange}`}><IonIcon icon={alertCircle} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeInvoices}</span>
            <span className={styles.statLabel}>В работе</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.bgBlue}`}><IonIcon icon={personAddOutline} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{workersOnline}</span>
            <span className={styles.statLabel}>В сети</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.bgGreen}`}><IonIcon icon={checkmarkCircle} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{completedToday}</span>
            <span className={styles.statLabel}>Готово</span>
          </div>
        </div>
      </div>

      {/* === ОСНОВНОЕ МЕНЮ === */}
      <h2 className={styles.sectionTitle}>Модули</h2>
      <div className={styles.grid}>
        {tiles.map((t) => (
          <div key={t.key} className={`${styles.tile} ${t.style}`} onClick={() => history.push(t.to)}>
            <div className={styles.tileHeader}>
              <div className={styles.iconContainer}><IonIcon icon={t.icon} /></div>
              <div className={styles.tileArrow}><IonIcon icon={arrowForwardOutline} /></div>
            </div>
            <div className={styles.tileContent}>
              <div className={styles.tileTitle}>{t.title}</div>
              <div className={styles.tileDesc}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* === ЛЕНТА СОБЫТИЙ (НОВОЕ) === */}
      <h2 className={styles.sectionTitle}>События сейчас</h2>
      <div className={styles.eventsList}>
        {recentEvents.map(ev => (
          <div key={ev.id} className={styles.eventItem}>
            <div className={`${styles.eventIcon} ${styles[ev.type]}`}>
              <IonIcon icon={ev.icon} />
            </div>
            <div className={styles.eventContent}>
              <div className={styles.eventText}>{ev.text}</div>
              <div className={styles.eventTime}>{ev.time}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Home;