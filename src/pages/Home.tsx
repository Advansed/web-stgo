import React from 'react';
import { IonIcon } from '@ionic/react';
import { 
  mapOutline, documentTextOutline, settingsOutline, arrowForwardOutline,
  timeOutline, checkmarkCircle, alertCircle, searchOutline, qrCodeOutline,
  personAddOutline, notificationsOutline, calendarOutline, gridOutline, flashOutline
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

  // Статистика (Логика сохранена)
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

  // Конфигурация модулей с новыми стилями
  const modules = [
    { 
      key: 'invoices', 
      title: 'Карта заявок', 
      desc: 'Мониторинг, распределение и исполнение', 
      icon: mapOutline, 
      colorClass: styles.bgBlue,
      to: '/invoices' 
    },
    { 
      key: 'lics', 
      title: 'Лицевые счета', 
      desc: 'Реестр абонентов и история показаний', 
      icon: documentTextOutline, 
      colorClass: styles.bgGreen,
      to: '/lics' 
    },
    { 
      key: 'settings', 
      title: 'Настройки системы', 
      desc: 'Профиль, параметры и права доступа', 
      icon: settingsOutline, 
      colorClass: styles.bgGray,
      to: '/settings' 
    },
  ];

  // Лента событий (Данные сохранены)
  const recentEvents = [
    { id: 1, text: 'Иванов А. завершил заявку #4521', time: '5 мин назад', style: styles.dotSuccess, icon: checkmarkCircle },
    { id: 2, text: 'Новая аварийная заявка #4525', time: '12 мин назад', style: styles.dotAlert, icon: alertCircle },
    { id: 3, text: 'Сидоров В. вышел на смену', time: '30 мин назад', style: styles.dotInfo, icon: timeOutline },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        
        {/* === HEADER === */}
        <div className={styles.headerSection}>
          <div className={styles.greetingBlock}>
            <div className={styles.dateLabel}>
              <IonIcon icon={calendarOutline} /> {today}
            </div>
            <h1 className={styles.greeting}>
              {getGreeting()}, <span className={styles.userName}>{user?.fullName?.split(' ')[0] || 'Коллега'}</span>
            </h1>
          </div>
          
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} title="Уведомления">
              <IonIcon icon={notificationsOutline} />
            </button>
            <button className={styles.iconBtn} title="Профиль">
              <IonIcon icon={settingsOutline} />
            </button>
          </div>
        </div>

        {/* === QUICK ACTIONS === */}
        <div className={styles.quickActionsBar}>
          <div className={styles.actionChip} onClick={() => history.push('/invoices')}>
            <IonIcon icon={searchOutline} /> Поиск заявки
          </div>
          <div className={styles.actionChip}>
            <IonIcon icon={qrCodeOutline} /> Сканер QR
          </div>
          <div className={styles.actionChip}>
            <IonIcon icon={personAddOutline} /> Открыть смену
          </div>
          <div className={styles.actionChip}>
            <IonIcon icon={flashOutline} /> Аварийный режим
          </div>
        </div>

        {/* === STATS GRID === */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.orangeTheme}`}>
            <div className={styles.statIconWrapper}><IonIcon icon={alertCircle} /></div>
            <div>
              <div className={styles.statValue}>{activeInvoices}</div>
              <div className={styles.statLabel}>Заявок в работе</div>
            </div>
          </div>
          
          <div className={`${styles.statCard} ${styles.blueTheme}`}>
            <div className={styles.statIconWrapper}><IonIcon icon={personAddOutline} /></div>
            <div>
              <div className={styles.statValue}>{workersOnline}</div>
              <div className={styles.statLabel}>Сотрудников онлайн</div>
            </div>
          </div>
          
          <div className={`${styles.statCard} ${styles.greenTheme}`}>
            <div className={styles.statIconWrapper}><IonIcon icon={checkmarkCircle} /></div>
            <div>
              <div className={styles.statValue}>{completedToday}</div>
              <div className={styles.statLabel}>Выполнено сегодня</div>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT SPLIT === */}
        <div className={styles.mainLayout}>
          
          {/* Modules List */}
          <div>
            <div className={styles.sectionHeader}>
              <IonIcon icon={gridOutline} /> Модули системы
            </div>
            <div className={styles.modulesGrid}>
              {modules.map((m) => (
                <div key={m.key} className={styles.moduleRow} onClick={() => history.push(m.to)}>
                  <div className={styles.moduleLeft}>
                    <div className={`${styles.moduleIcon} ${m.colorClass}`}>
                      <IonIcon icon={m.icon} />
                    </div>
                    <div className={styles.moduleInfo}>
                      <div className={styles.moduleTitle}>{m.title}</div>
                      <div className={styles.moduleDesc}>{m.desc}</div>
                    </div>
                  </div>
                  <IonIcon icon={arrowForwardOutline} className={styles.moduleArrow} />
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <div className={styles.sectionHeader}>
              <IonIcon icon={timeOutline} /> Активность
            </div>
            <div className={styles.eventsContainer}>
              <div className={styles.timeline}>
                {recentEvents.map(ev => (
                  <div key={ev.id} className={styles.eventItem}>
                    <div className={`${styles.eventDot} ${ev.style}`}>
                      <IonIcon icon={ev.icon} />
                    </div>
                    <div className={styles.eventBody}>
                      <div className={styles.eventText}>{ev.text}</div>
                      <div className={styles.eventTime}>{ev.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Home;