import React from 'react';
import { IonIcon } from '@ionic/react';
import { callOutline, locationOutline, personOutline } from 'ionicons/icons';
import { formatDate, formatSum, getDisplayAddress } from '../../../../utils/format';

export interface LicAccountCardProps {
  licAccount: any;
  embedded?: boolean;
}

const text = (value: any): string => value == null ? '' : String(value).trim();

const DataRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="lic-data-row"><dt>{label}</dt><dd>{value}</dd></div>
);

const LicAccountCard: React.FC<LicAccountCardProps> = ({ licAccount, embedded = false }) => {
  if (!licAccount) return null;

  const name = text(licAccount.name || licAccount.applicant);
  const address = licAccount.address ? getDisplayAddress(licAccount.address) : '';
  const plot = text(licAccount.plot);
  const objectName = typeof licAccount.object === 'string' ? text(licAccount.object) : '';
  const phone = text(licAccount.phone);
  const email = text(licAccount.email);
  const equipments = Array.isArray(licAccount.equipments) ? licAccount.equipments : [];
  const counters = Array.isArray(licAccount.counters) ? licAccount.counters : [];
  const agreements = Array.isArray(licAccount.agreements) ? licAccount.agreements : [];
  const debts = Array.isArray(licAccount.debts)
    ? licAccount.debts.filter((item: any) => item?.sum != null && Number.isFinite(Number(item.sum)))
    : [];
  const totalDebt = debts.reduce((total: number, item: any) => total + Number(item.sum), 0);

  return (
    <div className={'lic-detail-content' + (embedded ? ' lic-detail-content--embedded' : '')}>
      <section className="lic-identity" aria-label="Данные абонента">
        <div className="lic-identity-copy">
          <p className="lic-section-kicker">Лицевой счёт</p>
          <h2>{text(licAccount.code) || 'Номер не указан'}</h2>
          {name && <p className="lic-identity-name"><IonIcon icon={personOutline} aria-hidden="true" />{name}</p>}
          {address && <p className="lic-identity-address"><IonIcon icon={locationOutline} aria-hidden="true" />{address}</p>}
        </div>
        <img src="/assets/home/home-action-accounts.webp" alt="" aria-hidden="true" />
      </section>

      <div className="lic-detail-grid">
        <div className="lic-detail-column lic-detail-column--main">
        {(address || plot || objectName) && <section className="lic-panel lic-panel--address">
          <h3>Адрес и объект</h3>
          <dl>
            {address && <DataRow label="Адрес" value={address} />}
            {plot && <DataRow label="Участок" value={plot} />}
            {objectName && <DataRow label="Объект" value={objectName} />}
          </dl>
        </section>}

        {(phone || email) && <section className="lic-panel lic-panel--contacts">
          <h3>Контакты</h3>
          <dl>
            {phone && <DataRow label="Телефон" value={<span><IonIcon icon={callOutline} aria-hidden="true" /> {phone}</span>} />}
            {email && <DataRow label="Электронная почта" value={email} />}
          </dl>
        </section>}

        {agreements.length > 0 && <section className="lic-panel lic-panel--agreements">
          <h3>Договоры <span>{agreements.length}</span></h3>
          <div className="lic-record-list">
            {agreements.map((item: any, index: number) => <div className="lic-record" key={item.id || index}>
              <strong>{text(item.name || item.service_name) || 'Договор'}</strong>
              <dl>
                {item.service_name && item.name && <DataRow label="Услуга" value={text(item.service_name)} />}
                {item.start_date && <DataRow label="Начало" value={formatDate(item.start_date)} />}
                {item.end_date && <DataRow label="Окончание" value={formatDate(item.end_date)} />}
              </dl>
            </div>)}
          </div>
        </section>}

        {debts.length > 0 && <section className="lic-panel lic-panel--calculations">
          <h3>Расчёты</h3>
          <dl>
            {debts.map((item: any, index: number) => <DataRow key={index} label={text(item.label || item.type) || 'Начисление'} value={formatSum(Number(item.sum))} />)}
            <DataRow label="Итого по данным счёта" value={<strong>{formatSum(totalDebt)}</strong>} />
          </dl>
        </section>}
        </div>
        <div className="lic-detail-column lic-detail-column--side">
        {equipments.length > 0 && <section className="lic-panel lic-panel--equipment">
          <h3>Оборудование <span>{equipments.length}</span></h3>
          <div className="lic-record-list">
            {equipments.map((item: any, index: number) => <div className="lic-record" key={item.code || item.number || index}>
              <strong>{text(item.name || item.model || item.code) || 'Оборудование'}</strong>
              <dl>
                {item.type && <DataRow label="Тип" value={text(item.type)} />}
                {item.model && <DataRow label="Модель" value={text(item.model)} />}
                {item.number && <DataRow label="Номер" value={text(item.number)} />}
                {item.release_year && <DataRow label="Год выпуска" value={text(item.release_year)} />}
              </dl>
            </div>)}
          </div>
        </section>}

        {counters.length > 0 && <section className="lic-panel lic-panel--counters">
          <h3>Приборы учёта <span>{counters.length}</span></h3>
          <div className="lic-record-list">
            {counters.map((item: any, index: number) => <div className="lic-record" key={item.id || item.number || index}>
              <strong>{text(item.name || item.tip) || 'Прибор учёта'}</strong>
              <dl>
                {item.tip && item.name && <DataRow label="Тип" value={text(item.tip)} />}
                {(item.predIndice ?? item.indice) != null && <DataRow label="Показание" value={text(item.predIndice ?? item.indice)} />}
                {(item.predPeriod || item.period) && <DataRow label="Период" value={formatDate(item.predPeriod || item.period)} />}
                {item.seal && <DataRow label="Пломба" value={text(item.seal)} />}
                {item.seal_date && <DataRow label="Дата пломбы" value={formatDate(item.seal_date)} />}
              </dl>
            </div>)}
          </div>
        </section>}
        </div>
      </div>
    </div>
  );
};

export default LicAccountCard;
