import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IonIcon, IonModal } from '@ionic/react';
import { closeOutline, refreshOutline } from 'ionicons/icons';
import { getLic } from '../../../../Store/api';
import { useToken } from '../../../../Store/loginStore';
import LicAccountCard from './LicAccountCard';
import './LicForm.css';

interface LicFormProps {
  isOpen: boolean;
  onClose: () => void;
  licAccount: any;
  loading?: boolean;
}

const LicForm: React.FC<LicFormProps> = ({ isOpen, onClose, licAccount }) => {
  const { token } = useToken();
  const code = String(licAccount?.code || '');
  const [record, setRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const loadRecord = useCallback(async () => {
    const id = ++requestId.current;
    setRecord(null);
    setError(false);
    setLoading(true);
    if (!token || !code) {
      setLoading(false);
      setError(true);
      return;
    }
    const response = await getLic(token, code);
    if (id !== requestId.current) return;
    const data = response?.data;
    if (response?.ok && response?.success !== false && data && typeof data === 'object' && (data.id != null || data.code)) {
      setRecord(data);
    } else {
      setError(true);
    }
    setLoading(false);
  }, [token, code]);

  useEffect(() => {
    if (isOpen && code) void loadRecord();
    return () => { requestId.current += 1; };
  }, [isOpen, code, loadRecord]);

  const fullAccount = record ? {
    ...record,
    code: record.code || code,
    name: record.name || record.applicant || licAccount?.name || licAccount?.applicant,
    address: record.address || licAccount?.address,
  } : null;

  return (
    <IonModal isOpen={isOpen && !!licAccount} onDidDismiss={onClose} className="lic-detail-modal">
      <div className="lic-modal-wrapper">
        <header className="lic-modal-header stng-modal-header">
          <div className="lic-modal-header-copy stng-header-stack">
            <span className="lic-modal-eyebrow stng-header-eyebrow">Лицевой счёт</span>
            <h1 className="stng-header-title">Карточка абонента</h1>
            {code && <span className="lic-modal-code stng-header-context">№ {code}</span>}
          </div>
          <button type="button" onClick={onClose} className="lic-modal-close stng-header-close" aria-label="Закрыть карточку">
            <IonIcon icon={closeOutline} aria-hidden="true" />
          </button>
        </header>
        <div className="lic-modal-body">
          {loading ? (
            <div className="lic-detail-loading" role="status" aria-label="Загружаем данные лицевого счёта">
              <span /><span /><span /><span />
              <p>Загружаем данные лицевого счёта…</p>
            </div>
          ) : error ? (
            <div className="lic-detail-error" role="alert">
              <h2>Не удалось загрузить данные лицевого счёта</h2>
              <p>Проверьте соединение и повторите попытку.</p>
              <button type="button" onClick={() => void loadRecord()}>
                <IonIcon icon={refreshOutline} aria-hidden="true" /> Повторить
              </button>
            </div>
          ) : fullAccount ? <LicAccountCard licAccount={fullAccount} /> : null}
        </div>
      </div>
    </IonModal>
  );
};

export default LicForm;
