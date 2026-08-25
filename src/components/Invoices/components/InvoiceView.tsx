import React, { useState, useEffect, useRef } from 'react';
import styles from './InvoiceView.module.css';
import { Invoice } from './InvoiceList/InvoiceItem';
import { IonModal, IonIcon, IonSpinner } from '@ionic/react';
import {
  closeOutline, printOutline, locationOutline, personOutline,
  walletOutline, timeOutline, documentTextOutline,
  checkmarkCircleOutline, alertCircleOutline, constructOutline,
  searchOutline, ellipsisHorizontal, chatbubbleOutline,
  eyeOutline, saveOutline, statsChartOutline, closeCircleOutline,
  addCircleOutline,
} from 'ionicons/icons';
import { AddressForm } from '../../Lics/components/FindAddress/FindAddress';
import FindLics from '../../Lics/components/FindLic/FindLics';
import { LicForm } from '../../Lics/components/LicsForm';
import WorkerPicker from './WorkerPicker';
import { useToken } from '../../../Store/loginStore';
import { useWorkers, WorkerData } from '../../../Store/navigationStore';
import { getLic } from '../../../Store/api';
import { useToast } from '../../Toast';
import { formatDate, getDisplayAddress as formatDisplayAddress } from '../../../utils/format';

type WorkStatus = 'Новый' | 'В работе' | 'Выполнена' | 'Отложена' | 'Отменена';
const WORK_STATUSES: WorkStatus[] = ['Новый', 'В работе', 'Выполнена', 'Отложена', 'Отменена'];

interface InvoiceModalProps {
  invoice:            Invoice;
  invoiceStatus:      any;
  formatDate?:        (dateString: string) => string;
  formatPhone?:       (phone: string) => string;
  onNavigateToPrint:  () => void;
  onUpdateWorker?:    (worker: WorkerData | null) => void | Promise<void>;
  onSaveInvoice?:     (data: { status: string; comment: string; worker?: any }) => void | Promise<void>;
  onUpdateAddress?:   (invoiceId: string, newAddress: any) => void;
  onUpdateLic?:       ( lic: any ) => void;
  isOpen:             boolean;
  onClose:            () => void;
}

const extractLicCode = (invoice: any): string => {
  if (!invoice) return '';
  const raw =
    invoice.lic ??
    invoice.ЛС ??
    invoice.лс ??
    invoice.lic_code ??
    invoice.lc ??
    '';

  if (raw == null || raw === '') return '';
  if (typeof raw === 'string' || typeof raw === 'number') {
    const s = String(raw).trim();
    return s === '[object Object]' ? '' : s;
  }
  if (typeof raw === 'object') {
    const code = raw.code ?? raw.lc ?? raw.name ?? raw.номер ?? raw.Номер ?? '';
    return String(code).trim();
  }
  return '';
};

const extractComment = (invoice: any): string => {
  const raw = invoice?.comment ?? invoice?.Комментарий ?? invoice?.complete_text ?? '';
  return typeof raw === 'string' ? raw : '';
};

export const InvoiceView: React.FC<InvoiceModalProps> = ({
  invoice,
  onNavigateToPrint,
  onUpdateWorker,
  onSaveInvoice,
  onUpdateAddress,
  onUpdateLic,
  isOpen,
  onClose,
}) => {
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isUpdatingLic, setIsUpdatingLic] = useState(false);
  const [isSelectingWorker, setIsSelectingWorker] = useState(false);
  const [isViewingLic, setIsViewingLic] = useState(false);
  const [licData, setLicData] = useState<any>(null);
  const [licLoading, setLicLoading] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { token } = useToken();
  const { workers } = useWorkers();
  const toast = useToast();

  const [localAddress, setLocalAddress] = useState<any>(invoice?.address);
  const [localWorker, setLocalWorker] = useState<any>(invoice?.worker);
  const [localStatus, setLocalStatus] = useState<string>(invoice?.status || 'Новый');
  const [localComment, setLocalComment] = useState<string>(extractComment(invoice));
  const currentInvoiceId = useRef(invoice?.id);

  const safeInvoice = invoice as any;
  const licCode = extractLicCode(safeInvoice);

  useEffect(() => {
    if (invoice?.id && invoice.id !== currentInvoiceId.current) {
      currentInvoiceId.current = invoice.id;
      setLocalAddress(invoice.address);
      setLocalWorker(invoice.worker);
      setLocalStatus(invoice.status || (invoice as any).Статус || 'Новый');
      setLocalComment(extractComment(invoice));
      setLicData(null);
      setIsViewingLic(false);
      setStatusDropdownOpen(false);
      return;
    }
    if (invoice?.address) setLocalAddress(invoice.address);
    if (invoice?.worker !== undefined) setLocalWorker(invoice.worker);
    if (invoice?.status) setLocalStatus(invoice.status);
  }, [invoice?.id, invoice?.address, invoice?.worker, invoice?.status]);

  useEffect(() => {
    if (!isOpen) {
      setLicData(null);
      setIsViewingLic(false);
      setLicLoading(false);
      setIsSelectingWorker(false);
      setStatusDropdownOpen(false);
    }
  }, [isOpen]);

  const openLicCard = async () => {
    if (!licCode) {
      toast.warning('Лицевой счет не привязан');
      setIsUpdatingLic(true);
      return;
    }
    if (!token) {
      toast.error('Нет токена авторизации');
      return;
    }

    setLicLoading(true);
    setIsViewingLic(true);
    try {
      const res = await getLic(token, licCode);
      const data = res.data;
      const looksLikeLic =
        data &&
        typeof data === 'object' &&
        (data.code != null ||
          data.name != null ||
          data.address != null ||
          data.id != null ||
          Array.isArray(data.debts) ||
          Array.isArray(data.counters));

      if (res.ok && looksLikeLic) {
        setLicData({ ...data, code: data.code || licCode });
      } else {
        setLicData(null);
        setIsViewingLic(false);
        toast.error(res?.message || 'Данные ЛС не найдены');
      }
    } catch {
      setLicData(null);
      setIsViewingLic(false);
      toast.error('Ошибка загрузки ЛС');
    } finally {
      setLicLoading(false);
    }
  };

  const handleSave = async () => {
    if (!onSaveInvoice) return;
    setIsSaving(true);
    try {
      await onSaveInvoice({
        status: localStatus,
        comment: localComment,
        worker: localWorker,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const safeString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') return val.name || val.value || '';
    return '';
  };

  const getDisplayAddress = () =>
    formatDisplayAddress(localAddress || safeInvoice.address || safeInvoice.Адрес);

  const getStatusStyle = (status: string) => {
    const s = safeString(status);
    if (s === 'Новый') return styles.statusNew;
    if (s === 'В работе') return styles.statusWork;
    if (s === 'Выполнена') return styles.statusDone;
    if (s === 'Отложена') return styles.statusHold;
    if (s === 'Отменена') return styles.statusFail;
    return styles.statusFail;
  };

  const getStatusIcon = (status: string) => {
    const s = safeString(status);
    if (s === 'Новый') return addCircleOutline;
    if (s === 'В работе') return constructOutline;
    if (s === 'Выполнена') return checkmarkCircleOutline;
    if (s === 'Отложена') return alertCircleOutline;
    if (s === 'Отменена') return closeCircleOutline;
    return statsChartOutline;
  };

  if (!isOpen || !invoice) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.modalToolbar}>
              <div className={styles.modalTitle}>Заявка #{safeInvoice.number}</div>
              <div className={styles.headerButtons}>
                <button type="button" className={styles.iconBtn} onClick={onNavigateToPrint}>
                  <IonIcon icon={printOutline} />
                </button>
                <button type="button" className={styles.iconBtn} onClick={onClose}>
                  <IonIcon icon={closeOutline} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.heroSection}>
              <div className={styles.heroInfo}>
                <div className={styles.heroNumber}>#{safeString(safeInvoice.number)}</div>
                <div className={styles.heroDate}>
                  <IonIcon icon={timeOutline} />
                  {formatDate(safeString(safeInvoice.date))}
                </div>
              </div>
              <div className={styles.statusWrap}>
                <button
                  type="button"
                  className={`${styles.statusBadge} ${getStatusStyle(localStatus)} ${styles.statusBtn}`}
                  onClick={() => setStatusDropdownOpen((v) => !v)}
                >
                  <IonIcon icon={getStatusIcon(localStatus)} />
                  {localStatus}
                </button>
                {statusDropdownOpen && (
                  <div className={styles.statusOptions}>
                    {WORK_STATUSES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        className={`${styles.statusOption} ${localStatus === st ? styles.statusOptionActive : ''}`}
                        onClick={() => {
                          setLocalStatus(st);
                          setStatusDropdownOpen(false);
                        }}
                      >
                        <IonIcon icon={getStatusIcon(st)} />
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.detailCard}>
                <div className={`${styles.iconBox} ${styles.bgRed}`}>
                  <IonIcon icon={locationOutline} />
                </div>
                <div className={styles.contentData}>
                  <div className={styles.label}>Адрес объекта</div>
                  <div className={styles.value}>{getDisplayAddress()}</div>
                </div>
                <div className={styles.actionSlot}>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={() => setIsUpdatingAddress(true)}
                  >
                    <IonIcon icon={searchOutline} />
                  </button>
                </div>
              </div>

              {safeInvoice.applicant && (
                <div className={styles.detailCard}>
                  <div className={`${styles.iconBox} ${styles.bgBlue}`}>
                    <IonIcon icon={personOutline} />
                  </div>
                  <div className={styles.contentData}>
                    <div className={styles.label}>Заявитель</div>
                    <div className={styles.value}>{safeInvoice.applicant}</div>
                  </div>
                </div>
              )}

              <div
                className={styles.detailCard}
                role={onUpdateWorker ? 'button' : undefined}
                onClick={onUpdateWorker ? () => setIsSelectingWorker(true) : undefined}
                style={onUpdateWorker ? { cursor: 'pointer' } : undefined}
              >
                <div className={`${styles.iconBox} ${styles.bgDark}`}>
                  <IonIcon icon={constructOutline} />
                </div>
                <div className={styles.contentData}>
                  <div className={styles.label}>Исполнитель</div>
                  <div className={styles.value}>
                    {localWorker?.name || '— не назначен —'}
                  </div>
                </div>
                {onUpdateWorker && (
                  <div className={styles.actionSlot} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.miniBtn}
                      onClick={() => setIsSelectingWorker(true)}
                      title="Выбрать исполнителя"
                    >
                      <IonIcon icon={searchOutline} />
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.detailCard}>
                <div className={`${styles.iconBox} ${styles.bgPurple}`}>
                  <IonIcon icon={walletOutline} />
                </div>
                <div className={styles.contentData}>
                  <div className={styles.label}>Лицевой счет</div>
                  <div className={styles.value}>{licCode || 'Без Л/С'}</div>
                </div>
                <div className={styles.actionSlot}>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={openLicCard}
                    title="Карточка абонента"
                    disabled={licLoading}
                  >
                    {licLoading ? <IonSpinner name="dots" /> : <IonIcon icon={eyeOutline} />}
                  </button>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={() => setIsUpdatingLic(true)}
                    title="Выбрать лицевой счет"
                  >
                    <IonIcon icon={ellipsisHorizontal} />
                  </button>
                </div>
              </div>

              {(safeInvoice.service || safeInvoice.complete_text) && (
                <div className={styles.detailCard}>
                  <div className={`${styles.iconBox} ${styles.bgOrange}`}>
                    <IonIcon icon={documentTextOutline} />
                  </div>
                  <div className={styles.contentData}>
                    <div className={styles.label}>Описание работ</div>
                    <div className={styles.value} style={{ whiteSpace: 'pre-wrap' }}>
                      {safeInvoice.service || safeInvoice.complete_text}
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.commentSection}>
                <div className={styles.commentLabel}>
                  <IonIcon icon={chatbubbleOutline} />
                  Комментарий
                </div>
                <textarea
                  className={styles.commentTextarea}
                  placeholder="Укажите детали выполнения..."
                  value={localComment}
                  onChange={(e) => setLocalComment(e.target.value)}
                />
              </div>
            </div>
          </div>

          {onSaveInvoice && (
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.mainBtn}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <IonSpinner name="crescent" color="light" style={{ width: 20, height: 20 }} />
                ) : (
                  <IonIcon icon={saveOutline} />
                )}
                Сохранить
              </button>
            </div>
          )}
        </div>
      </div>

      <IonModal
        isOpen={isUpdatingAddress}
        onDidDismiss={() => setIsUpdatingAddress(false)}
        style={{
          '--height': 'auto',
          '--max-height': '80vh',
          '--border-radius': '24px',
          '--width': '100%',
          '--max-width': '680px',
        }}
      >
        <AddressForm
          initialAddress={getDisplayAddress()}
          onAddressChange={(data: any) => {
            if (data) {
              setLocalAddress(data);
              if (onUpdateAddress) onUpdateAddress(safeInvoice.id, data);
            }
            setIsUpdatingAddress(false);
          }}
          onClose={() => setIsUpdatingAddress(false)}
        />
      </IonModal>

      <FindLics
        address={getDisplayAddress()}
        isOpen={isUpdatingLic}
        onClose={() => setIsUpdatingLic(false)}
        onSelect={(item: any) => {
          if (item?.type === 'lics' && item?.name) {
            const newLic = { code: item.name, id: item.id, name: item.name };
            setLicData(null);
            if (onUpdateLic) onUpdateLic(newLic);
          }
          setIsUpdatingLic(false);
        }}
      />

      <WorkerPicker
        isOpen={isSelectingWorker}
        onClose={() => setIsSelectingWorker(false)}
        workers={workers}
        selectedId={localWorker?.id}
        onSelect={async (worker) => {
          setLocalWorker(worker);
          if (worker) {
            setLocalStatus('В работе');
          } else {
            setLocalStatus('Новый');
          }
          if (onUpdateWorker) await onUpdateWorker(worker);
        }}
      />

      <LicForm
        isOpen={isViewingLic}
        licAccount={licData}
        loading={licLoading}
        onClose={() => {
          setIsViewingLic(false);
          setLicData(null);
        }}
      />
    </>
  );
};
