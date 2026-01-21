import React, { useState } from 'react';
import {
  IonModal,
  IonIcon,
  IonLoading
} from '@ionic/react';
import { 
  closeOutline, 
  chevronDown, 
  walletOutline, 
  speedometerOutline, 
  documentTextOutline, 
  flameOutline,
  homeOutline,
  personOutline,
  locationOutline
} from 'ionicons/icons';
import './LicForm.css';
// ДОБАВИЛ formatAddress В ИМПОРТЫ
import { formatDate, formatSum, getDebtStatus, getTotalDebt, formatAddress } from '../../useLics';

interface LicFormProps {
  isOpen: boolean;
  onClose: () => void;
  licAccount: any;
  loading?: boolean;
}

// Компонент Аккордеона
const AccordionSection: React.FC<{
  title: string;
  subtitle?: string;
  icon: string;
  colorClass: string; 
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, colorClass, isOpen, onToggle, children }) => (
  <div className={`accordion-section ${isOpen ? 'is-open' : ''}`}>
    <button className="accordion-header" onClick={onToggle}>
      <div className="header-left">
        <div className={`section-icon-box ${colorClass}`}>
          <IonIcon icon={icon} />
        </div>
        
        <div className="header-text-row">
          <div className="section-title">{title}</div>
          {subtitle && (
             <div className="status-badge">{subtitle}</div>
          )}
        </div>
      </div>
      
      <IonIcon icon={chevronDown} className="accordion-arrow" />
    </button>
    <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
      {children}
    </div>
  </div>
);

const LicForm: React.FC<LicFormProps> = ({
  isOpen,
  onClose,
  licAccount,
  loading = false
}) => {
  const [openSections, setOpenSections] = useState({
    debts: true, 
    counters: false,
    agrees: false,
    equips: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!licAccount) return null;

  const debts = licAccount.debts || [];
  const counters = licAccount.counters || [];
  const agrees = licAccount.agrees || [];
  const equips = licAccount.equips || [];

  const totalDebt = getTotalDebt(debts);

  return (
    <>
      <IonLoading isOpen={loading} />
      
      <IonModal 
        isOpen={isOpen} 
        onDidDismiss={onClose}
        className="lics-form-modal"
      >
        {/* --- ШАПКА --- */}
        <div className="lic-modal-header">
          <div className="lic-modal-title">
            <IonIcon icon={homeOutline} />
            Карточка абонента
          </div>
          <button onClick={onClose} className="close-btn">
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        {/* --- КОНТЕНТ --- */}
        <div className="lic-content">
          
          {/* Главный блок */}
          <div className="lic-hero">
            <div className="hero-top">
              <div>
                <div className="hero-code">{licAccount.code}</div>
                <div className="hero-subtitle">
                  <IonIcon icon={locationOutline} />
                  {licAccount.plot ? `Участок: ${licAccount.plot}` : 'Участок не указан'}
                </div>
              </div>
              <div className="account-badge">Активен</div>
            </div>

            <div className="hero-details">
               <div className="detail-row">
                 <IonIcon icon={personOutline} className="detail-icon" />
                 <div className="detail-text">
                    <strong>Абонент</strong>
                    {licAccount.name}
                 </div>
               </div>
               <div className="detail-row">
                 <IonIcon icon={locationOutline} className="detail-icon" />
                 <div className="detail-text">
                    <strong>Адрес</strong>
                    {/* ВОТ ЗДЕСЬ ИСПРАВИЛ: теперь выводит address через форматтер */}
                    {licAccount.address ? formatAddress(licAccount.address) : 'Адрес не указан'}
                 </div>
               </div>
            </div>
          </div>

          {/* Список секций */}
          <div className="accordion-container">

            {/* 1. ЗАДОЛЖЕННОСТЬ */}
            <AccordionSection
              title="Задолженность"
              subtitle={totalDebt > 0 ? `Долг: ${formatSum(totalDebt)}` : 'Нет задолженности'}
              icon={walletOutline}
              colorClass="bg-red"
              isOpen={openSections.debts}
              onToggle={() => toggleSection('debts')}
            >
              <div className={`debt-card ${totalDebt > 0 ? 'debt-total' : 'debt-ok'}`}>
                <span>Итого к оплате:</span>
                <span>{formatSum(totalDebt)}</span>
              </div>
              
              {debts.length > 0 ? (
                <div style={{marginTop: 10}}>
                  {debts.map((debt: any, index: number) => (
                    <div key={index} className="debt-row">
                      <span className="text-label">{debt.label}</span>
                      <span className="text-value" style={{color: debt.sum > 0 ? '#ef4444' : '#10b981'}}>
                        {formatSum(debt.sum)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Начислений не найдено</div>
              )}
            </AccordionSection>

            {/* 2. ПРИБОРЫ УЧЕТА */}
            <AccordionSection
              title="Приборы учета"
              subtitle={`${counters.length} счетчиков`}
              icon={speedometerOutline}
              colorClass="bg-blue"
              isOpen={openSections.counters}
              onToggle={() => toggleSection('counters')}
            >
              {counters.length > 0 ? counters.map((counter: any, index: number) => (
                <div key={index} className="counter-card">
                  <div className="counter-header">
                    <span className="counter-name">{counter.name}</span>
                    <span className="counter-badge">{counter.tip}</span>
                  </div>
                  <div className="counter-value">{counter.indice}</div>
                  <div className="counter-date">
                    Дата показаний: {formatDate(counter.period)}
                  </div>
                  <div className="card-row" style={{marginTop: 4, fontSize: 12}}>
                    <span className="text-label">Пломба:</span>
                    <span className="text-value">{counter.seal || 'Нет'} ({formatDate(counter.seal_date)})</span>
                  </div>
                </div>
              )) : (
                <div className="empty-state">Приборы учета отсутствуют</div>
              )}
            </AccordionSection>

            {/* 3. ДОГОВОРЫ */}
            <AccordionSection
              title="Договоры"
              subtitle={agrees.length > 0 ? 'Есть активные договоры' : 'Нет договоров'}
              icon={documentTextOutline}
              colorClass="bg-green"
              isOpen={openSections.agrees}
              onToggle={() => toggleSection('agrees')}
            >
               {agrees.length > 0 ? agrees.map((agree: any, index: number) => (
                 <div key={index} className="simple-card">
                    <div className="card-row">
                       <span className="text-value" style={{fontWeight: 600}}>{agree.name}</span>
                       <span className={agree.status?.toLowerCase().includes('действ') ? 'status-active' : 'text-label'}>
                          {agree.status}
                       </span>
                    </div>
                    <div className="card-row">
                       <span className="text-label">Номер:</span>
                       <span>{agree.number}</span>
                    </div>
                    <div className="card-row">
                       <span className="text-label">Дата:</span>
                       <span>{formatDate(agree.begin_date)}</span>
                    </div>
                 </div>
               )) : <div className="empty-state">Договоры не найдены</div>}
            </AccordionSection>

            {/* 4. ГАЗОВОЕ ОБОРУДОВАНИЕ */}
            <AccordionSection
              title="Оборудование"
              subtitle={`${equips.length} ед.`}
              icon={flameOutline}
              colorClass="bg-orange"
              isOpen={openSections.equips}
              onToggle={() => toggleSection('equips')}
            >
              {equips.length > 0 ? equips.map((equip: any, index: number) => (
                 <div key={index} className="simple-card">
                    <div className="card-row">
                       <span className="text-value">{equip.name}</span>
                       <span className={equip.active === 'true' ? 'status-active' : 'status-inactive'}>
                          {equip.active === 'true' ? 'Активно' : 'Неактивно'}
                       </span>
                    </div>
                    <div className="card-row">
                       <span className="text-label">Тип:</span>
                       <span>{equip.tip}</span>
                    </div>
                    <div className="card-row">
                       <span className="text-label">Инв. номер:</span>
                       <span style={{fontFamily: 'monospace'}}>{equip.number}</span>
                    </div>
                 </div>
               )) : <div className="empty-state">Оборудование не найдено</div>}
            </AccordionSection>

          </div>
        </div>
      </IonModal>
    </>
  );
};

export default LicForm;