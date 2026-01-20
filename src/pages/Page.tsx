// Page.tsx
import React, { useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useParams } from 'react-router';
import { useHistory } from 'react-router-dom';
import { 
  addOutline, 
  arrowBackOutline, 
  businessOutline, 
  refreshOutline,
  notificationsOutline,
  logOutOutline
} from 'ionicons/icons';

import './Page.css';

// Компоненты страниц
import { Lics } from '../components/Lics';
import Invoices from '../components/Invoices';
import Home from './Home';

// Сторы
import { useAdd, useRoutes, useUpdate } from '../Store/navigationStore';
import { useUser } from '../Store/loginStore';

const Page: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const history = useHistory();

  const { user } = useUser();
  const { currentRoute } = useRoutes();
  const { setAdd } = useAdd();
  const { update, setUpdate } = useUpdate();

  const isInvoices = name === 'invoices';
  const isHome = name === 'home';

  // --- ХЕЛПЕР: Получение инициалов (Иван Иванов -> ИИ) ---
  const getInitials = (fullName: string | undefined) => {
    if (!fullName) return 'ST'; // ST = Staff (по умолчанию)
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[1][0]).toUpperCase();
  };

  // Рендер контента
  const PageContent = () => {
    switch (name) {
      case 'lics': return <Lics page={currentRoute.page} />;
      case 'invoices': return <Invoices />;
      case 'home': return <Home />;
      case 'settings': return <Home />;
      default: return <Home />;
    }
  };

  const getPageTitle = (n: string) => {
    switch (n) {
      case 'home': return 'Рабочий стол';
      case 'lics': return 'Лицевые счета';
      case 'invoices': return 'Заявки и Карта';
      case 'settings': return 'Настройки';
      default: return '';
    }
  };

  // Кнопки действий
  const renderActionButtons = (n: string) => {
    switch (n) {
      case 'lics':
        return (
          <div className="action-icon" onClick={() => setAdd(true)} title="Добавить лицевой счет">
            <IonIcon icon={addOutline} />
          </div>
        );

      case 'invoices':
        return (
          <div className="action-icon" onClick={() => setUpdate(update + 1)} title="Обновить данные">
             <IonIcon icon={refreshOutline} />
          </div>
        );

      default:
        return isHome ? (
           <div className="action-icon" title="Уведомления">
              <IonIcon icon={notificationsOutline} />
           </div>
        ) : <></>;
    }
  };

  return (
    <IonPage>
      {/* --- HEADER --- */}
      <IonHeader className="page-header" translucent={true}>
        <IonToolbar className="page-toolbar">
          <div className="header-content">
            
            {/* 1. ЛЕВАЯ ЧАСТЬ (Лого или Назад) */}
            <div className="header-left">
              {!isHome ? (
                <div className="back-btn-wrapper" onClick={() => history.push('/home')} title="Назад">
                  <IonIcon icon={arrowBackOutline} size="large" />
                </div>
              ) : (
                <div className="logo-container">
                    <div className="company-icon">
                       <IonIcon icon={businessOutline} />
                    </div>
                </div>
              )}
              
              <div className="company-info">
                 <span className="company-name">САХАТРАНСНЕФТЕГАЗ</span>
                 <span className="company-sub">Система управления</span>
              </div>
            </div>

            {/* 2. ЦЕНТР (Заголовок) */}
            <div className="header-center">
              <IonTitle className="page-title">{getPageTitle(name)}</IonTitle>
            </div>

            {/* 3. ПРАВАЯ ЧАСТЬ (Действия и Профиль) */}
            <div className="header-right">
              
              <div className="action-buttons">
                 {renderActionButtons(name)}
              </div>

              {/* Новый красивый профиль */}
              <div className="user-profile-pill" title="Профиль сотрудника">
                 <div className="user-text-info">
                    <span className="user-name">{user?.fullName?.split(' ')[0] || 'Сотрудник'}</span>
                    <span className="user-role">Онлайн</span>
                 </div>
                 <div className="user-avatar-gradient">
                    {getInitials(user?.fullName)}
                 </div>
              </div>

            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      {/* --- CONTENT --- */}
      <IonContent
        fullscreen
        className={isInvoices ? 'invoices-content' : undefined}
        scrollY={!isInvoices}
      >
        {isInvoices ? (
          <div className="invoices-content-inner">
            <PageContent />
          </div>
        ) : (
          <PageContent />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Page;