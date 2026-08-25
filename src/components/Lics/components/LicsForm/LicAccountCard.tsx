import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  chevronDown,
  walletOutline,
  speedometerOutline,
  documentTextOutline,
  flameOutline,
  personOutline,
  locationOutline,
} from 'ionicons/icons';
import './LicForm.css';
import { formatDate, formatSum, getTotalDebt, formatAddress } from '../../../../utils/format';

interface LicAgreement {
  id: string;
  name: string;
  service_name: string;
  start_date: string;
  end_date: string;
}

interface LicEquipment {
  code: string;
  name: string;
  type: string;
  release_year: string;
  model: string;
  number: string;
}

export interface LicAccountCardProps {
  licAccount: any;
  /** Компактный вид для встраивания (заявка) */
  embedded?: boolean;
}

const isAgreementActive = (endDate: string): boolean => {
  if (!endDate) return true;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return true;
  return end >= new Date();
};

const AccordionSection: React.FC<{
  title: string;
  subtitle?: string;
  icon: string;
  colorClass: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  scrollable?: boolean;
}> = ({ title, subtitle, icon, colorClass, isOpen, onToggle, children, sectionRef, contentRef, scrollable }) => (
  <div ref={sectionRef} className={`accordion-section ${isOpen ? 'is-open' : ''}`}>
    <button type="button" className="accordion-header" onClick={onToggle}>
      <div className="header-left">
        <div className={`section-icon-box ${colorClass}`}>
          <IonIcon icon={icon} />
        </div>
        <div className="header-text-row">
          <div className="section-title">{title}</div>
          {subtitle && <div className="status-badge">{subtitle}</div>}
        </div>
      </div>
      <IonIcon icon={chevronDown} className="accordion-arrow" />
    </button>
    <div
      ref={contentRef}
      className={`accordion-content ${isOpen ? 'open' : ''} ${scrollable ? 'scrollable' : ''}`}
    >
      {children}
    </div>
  </div>
);

const LicAccountCard: React.FC<LicAccountCardProps> = ({ licAccount, embedded = false }) => {
  const [openSections, setOpenSections] = useState({
    debts: true,
    counters: false,
    agrees: false,
    equips: false,
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const agreesSectionRef = useRef<HTMLDivElement>(null);
  const equipsSectionRef = useRef<HTMLDivElement>(null);
  const agreesContentRef = useRef<HTMLDivElement>(null);
  const equipsContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    setOpenSections({ debts: true, counters: false, agrees: false, equips: false });
  }, [licAccount?.code]);

  const scrollSectionToTop = (section: 'agrees' | 'equips') => {
    requestAnimationFrame(() => {
      const sectionRef = section === 'agrees' ? agreesSectionRef : equipsSectionRef;
      const innerRef = section === 'agrees' ? agreesContentRef : equipsContentRef;
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (innerRef.current) innerRef.current.scrollTop = 0;
    });
  };

  const toggleSection = (section: keyof typeof openSections) => {
    const willOpen = !openSections[section];
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    if (willOpen && (section === 'agrees' || section === 'equips')) {
      scrollSectionToTop(section);
    }
  };

  if (!licAccount) return null;

  const debts = licAccount.debts || [];
  const counters = licAccount.counters || [];
  const agreements: LicAgreement[] = licAccount.agreements || [];
  const equipments: LicEquipment[] = licAccount.equipments || [];
  const totalDebt = getTotalDebt(debts);

  const addressText = licAccount.address
    ? formatAddress(
        typeof licAccount.address === 'string'
          ? licAccount.address
          : licAccount.address.address || licAccount.address.value || ''
      )
    : 'Адрес не указан';

  return (
    <div
      ref={contentRef}
      className={`lic-content ${embedded ? 'lic-content--embedded' : ''}`}
    >
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
              {licAccount.name || licAccount.applicant || '—'}
            </div>
          </div>
          <div className="detail-row">
            <IonIcon icon={locationOutline} className="detail-icon" />
            <div className="detail-text">
              <strong>Адрес</strong>
              {addressText}
            </div>
          </div>
        </div>
      </div>

      <div className="accordion-container">
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
            <div style={{ marginTop: 10 }}>
              {debts.map((debt: any, index: number) => (
                <div key={index} className="debt-row">
                  <span className="text-label">{debt.label}</span>
                  <span className="text-value" style={{ color: debt.sum > 0 ? '#ef4444' : '#10b981' }}>
                    {formatSum(debt.sum)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Начислений не найдено</div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Приборы учета"
          subtitle={`${counters.length} счетчиков`}
          icon={speedometerOutline}
          colorClass="bg-blue"
          isOpen={openSections.counters}
          onToggle={() => toggleSection('counters')}
        >
          {counters.length > 0 ? (
            counters.map((counter: any, index: number) => {
              const currentValue = counter.predIndice ?? counter.indice;
              const currentPeriod = counter.predPeriod || counter.period;
              const prevValue = counter.predIndice != null ? counter.indice : null;
              const prevPeriod = counter.predIndice != null ? counter.period : null;

              return (
                <div key={index} className="counter-card">
                  <div className="counter-header">
                    <span className="counter-name">{counter.name || 'Счётчик'}</span>
                    {counter.tip && <span className="counter-badge">{counter.tip}</span>}
                  </div>

                  <div className={`counter-readings ${prevValue != null && prevValue !== '' ? 'has-prev' : ''}`}>
                    <div className="counter-reading current">
                      <div className="counter-reading-label">Текущее показание</div>
                      <div className="counter-reading-value">
                        <span className="counter-reading-main">
                          {currentValue != null && currentValue !== '' ? currentValue : '—'}
                        </span>
                        {currentPeriod && (
                          <span className="counter-reading-date">{formatDate(currentPeriod)}</span>
                        )}
                      </div>
                    </div>

                    {prevValue != null && prevValue !== '' && (
                      <div className="counter-reading previous">
                        <div className="counter-reading-label">Предыдущее</div>
                        <div className="counter-reading-value">
                          <span className="counter-reading-main">{prevValue}</span>
                          {prevPeriod && (
                            <span className="counter-reading-date">{formatDate(prevPeriod)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="counter-seal">
                    <span className="text-label">Пломба</span>
                    <span className="text-value">
                      {counter.seal || 'Нет'}
                      {counter.seal_date ? ` · ${formatDate(counter.seal_date)}` : ''}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">Приборы учета отсутствуют</div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Договоры"
          subtitle={
            agreements.length > 0
              ? `${agreements.length} ${agreements.length === 1 ? 'договор' : agreements.length < 5 ? 'договора' : 'договоров'}`
              : 'Нет договоров'
          }
          icon={documentTextOutline}
          colorClass="bg-green"
          isOpen={openSections.agrees}
          onToggle={() => toggleSection('agrees')}
          sectionRef={agreesSectionRef}
          contentRef={agreesContentRef}
          scrollable
        >
          {agreements.length > 0 ? (
            agreements.map((agreement, index) => {
              const active = isAgreementActive(agreement.end_date);
              return (
                <div key={agreement.id || `agree-${index}`} className="simple-card">
                  <div className="card-row">
                    <span className="text-value" style={{ fontWeight: 600 }}>{agreement.name}</span>
                    <span className={active ? 'status-active' : 'status-inactive'}>
                      {active ? 'Действует' : 'Завершён'}
                    </span>
                  </div>
                  <div className="card-row">
                    <span className="text-label">Услуга:</span>
                    <span>{agreement.service_name || '—'}</span>
                  </div>
                  <div className="card-row">
                    <span className="text-label">Начало:</span>
                    <span>{formatDate(agreement.start_date)}</span>
                  </div>
                  <div className="card-row">
                    <span className="text-label">Окончание:</span>
                    <span>{agreement.end_date ? formatDate(agreement.end_date) : 'бессрочно'}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">Договоры не найдены</div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Оборудование"
          subtitle={
            equipments.length > 0
              ? `${equipments.length} ${equipments.length === 1 ? 'единица' : equipments.length < 5 ? 'единицы' : 'единиц'}`
              : 'Нет оборудования'
          }
          icon={flameOutline}
          colorClass="bg-orange"
          isOpen={openSections.equips}
          onToggle={() => toggleSection('equips')}
          sectionRef={equipsSectionRef}
          contentRef={equipsContentRef}
          scrollable
        >
          {equipments.length > 0 ? (
            equipments.map((equipment, index) => (
              <div key={equipment.code || equipment.number || `equip-${index}`} className="simple-card">
                <div className="card-row">
                  <span className="text-value" style={{ fontWeight: 600 }}>{equipment.name || '—'}</span>
                  <span className="text-label">{equipment.code || '—'}</span>
                </div>
                <div className="card-row">
                  <span className="text-label">Тип:</span>
                  <span>{equipment.type || '—'}</span>
                </div>
                <div className="card-row">
                  <span className="text-label">Модель:</span>
                  <span>{equipment.model || '—'}</span>
                </div>
                <div className="card-row">
                  <span className="text-label">Год выпуска:</span>
                  <span>{equipment.release_year || '—'}</span>
                </div>
                <div className="card-row">
                  <span className="text-label">Инв. номер:</span>
                  <span style={{ fontFamily: 'monospace' }}>{equipment.number || '—'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">Оборудование не найдено</div>
          )}
        </AccordionSection>
      </div>
    </div>
  );
};

export default LicAccountCard;
