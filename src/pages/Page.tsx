import React from 'react';
import { IonContent, IonHeader, IonIcon, IonPage, IonToolbar } from '@ionic/react';
import { useParams } from 'react-router';
import { Redirect, useHistory } from 'react-router-dom';
import { arrowBackOutline, documentTextOutline, folderOpenOutline } from 'ionicons/icons';
import './Page.css';
import { Lics } from '../components/Lics';
import Invoices from '../components/Invoices';
import Home from './Home';

const Page: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const history = useHistory();

  if (!['home', 'lics', 'invoices'].includes(name)) return <Redirect to="/home" />;
  const isInvoices = name === 'invoices';
  const isHome = name === 'home';

  return (
    <IonPage>
      {!isHome && <IonHeader className="page-header">
        <IonToolbar className="page-toolbar">
          <div className="page-header-content">
            <button className="page-back" type="button" onClick={() => history.push('/home')} aria-label="На главную" title="На главную">
              <IonIcon icon={arrowBackOutline} aria-hidden="true" />
            </button>
            <div className="page-brand">
              <img className="page-brand-wordmark" src="/assets/brand/stng-wordmark.png" alt="Сахатранснефтегаз" />
              <img className="page-brand-emblem" src="/assets/brand/stng-emblem.png" alt="Сахатранснефтегаз" />
            </div>
            <span className="page-section-name">{isInvoices ? 'Рабочие заявки' : 'Лицевые счета'}</span>
            <div className="page-header-actions">
              <button className="page-section-link" type="button" onClick={() => history.push(isInvoices ? '/lics' : '/invoices')} aria-label={isInvoices ? 'Лицевые счета' : 'Заявки'}>
                <IonIcon icon={isInvoices ? folderOpenOutline : documentTextOutline} aria-hidden="true" />
                <span>{isInvoices ? 'Лицевые счета' : 'Заявки'}</span>
              </button>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>}
      <IonContent fullscreen={isHome} className={isInvoices ? 'invoices-content' : isHome ? 'home-content' : undefined} scrollY={!isInvoices}>
        {isInvoices ? <div className="invoices-content-inner"><Invoices /></div> : isHome ? <Home /> : <Lics />}
      </IonContent>
    </IonPage>
  );
};

export default Page;
