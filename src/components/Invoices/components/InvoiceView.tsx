import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './InvoiceView.module.css';
import { Invoice, InvoiceWork } from './InvoiceList/InvoiceItem';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  closeOutline, printOutline, locationOutline, personOutline,
  walletOutline, timeOutline, documentTextOutline,
  constructOutline, cogOutline, briefcaseOutline,
  chatbubbleOutline, eyeOutline, chevronDownOutline,
} from 'ionicons/icons';
import { LicForm } from '../../Lics/components/LicsForm';
import { useToken } from '../../../Store/loginStore';
import { useWorkers } from '../../../Store/navigationStore';
import { useInvoices } from '../../../Store/invoiceStore';
import { getLic, isApiOk } from '../../../Store/api';
import { useToast } from '../../Toast';
import { formatDate } from '../../../utils/format';

interface InvoiceModalProps {
  invoice: Invoice;
  formatDate?: (dateString: string) => string;
  onNavigateToPrint?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const formatMoney = (n: number) =>
  Number(n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const InvoiceView: React.FC<InvoiceModalProps> = ({
  invoice,
  onNavigateToPrint,
  isOpen,
  onClose,
}) => {
  const [isViewingLic, setIsViewingLic]     = useState(false);
  const [licData, setLicData]               = useState<any>(null);
  const [licLoading, setLicLoading]         = useState(false);
  const [executorOpen, setExecutorOpen]     = useState(false);
  const [executorSaving, setExecutorSaving] = useState(false);
  const { token }                           = useToken();
  const { workers }                         = useWorkers();
  const { data: invoices, assignWorker }    = useInvoices();
  const toast                               = useToast();
  const currentInvoiceId                    = useRef(invoice?.id);

  const safeInvoice                         = useMemo(() => {
    const fromStore = invoices.find(
      (inv: any) => inv.id === invoice?.id || inv.Ссылка === invoice?.id
    );
    return (fromStore || invoice) as any;
  }, [invoices, invoice]);
  const works: InvoiceWork[]                = Array.isArray(safeInvoice.works) ? safeInvoice.works : [];
  const comment                             = typeof safeInvoice.comment === 'string' ? safeInvoice.comment : '';
  const description                         = safeInvoice.description || safeInvoice.service || '';
  const licCode                             = String(safeInvoice.lic || '').trim();
  const applicant                           = safeInvoice.applicant || '';
  const address                             = typeof safeInvoice.address === 'string' ? safeInvoice.address: (safeInvoice.address?.address || '');
  const executorId                          = String(safeInvoice.executor || safeInvoice.worker?.id || '').trim();

  const selectedWorker                      = useMemo(
    () => workers.find((w: any) => String(w.id) === executorId),
    [workers, executorId]
  );
  const executorName                        = selectedWorker?.name || (executorId ? executorId : 'Не назначен');

  useEffect(() => {
    if (invoice?.id && invoice.id !== currentInvoiceId.current) {
      currentInvoiceId.current = invoice.id;
      setLicData(null);
      setIsViewingLic(false);
      setExecutorOpen(false);
    }
  }, [invoice?.id]);

  useEffect(() => {
    if (!isOpen) {
      setLicData(null);
      setIsViewingLic(false);
      setLicLoading(false);
      setExecutorOpen(false);
    }
  }, [isOpen]);

  const openLicCard = async () => {
    if (!licCode) {
      toast.warning('Лицевой счет не привязан');
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

  const handlePickExecutor = async (worker: any) => {
    if (!token) {
      toast.error('Нет токена авторизации');
      return;
    }
    if (!worker?.id) return;
    if (String(worker.id) === executorId) {
      setExecutorOpen(false);
      return;
    }

    setExecutorSaving(true);
    try {
      const res = await assignWorker(token, safeInvoice.id, worker);
      if (res?.success || isApiOk(res)) {
        toast.success(res?.message || 'Исполнитель назначен');
        setExecutorOpen(false);
      } else {
        toast.error(res?.message || 'Не удалось назначить исполнителя');
      }
    } catch {
      toast.error('Ошибка сети при назначении');
    } finally {
      setExecutorSaving(false);
    }
  };

  const safeString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') return val.name || val.value || '';
    return '';
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
                {onNavigateToPrint && (
                  <button type="button" className={styles.iconBtn} onClick={onNavigateToPrint}>
                    <IonIcon icon={printOutline} />
                  </button>
                )}
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
            </div>

            <div className={styles.detailsList}>
              {description && (
                <div className={styles.detailCard}>
                  <div className={`${styles.iconBox} ${styles.bgOrange}`}>
                    <IonIcon icon={documentTextOutline} />
                  </div>
                  <div className={styles.contentData}>
                    <div className={styles.label}>Описание</div>
                    <div className={styles.value} style={{ whiteSpace: 'pre-wrap' }}>
                      {description}
                    </div>
                  </div>
                </div>
              )}

              {address && (
                <div className={styles.detailCard}>
                  <div className={`${styles.iconBox} ${styles.bgRed}`}>
                    <IonIcon icon={locationOutline} />
                  </div>
                  <div className={styles.contentData}>
                    <div className={styles.label}>Адрес</div>
                    <div className={styles.value}>{address}</div>
                  </div>
                </div>
              )}

              {applicant && (
                <div className={styles.detailCard}>
                  <div className={`${styles.iconBox} ${styles.bgBlue}`}>
                    <IonIcon icon={personOutline} />
                  </div>
                  <div className={styles.contentData}>
                    <div className={styles.label}>Заявитель</div>
                    <div className={styles.value}>{applicant}</div>
                  </div>
                </div>
              )}

              <div className={styles.detailCard}>
                <div className={`${styles.iconBox} ${styles.bgPurple}`}>
                  <IonIcon icon={walletOutline} />
                </div>
                <div className={styles.contentData} style={{ flex: 1 }}>
                  <div className={styles.label}>Лицевой счет</div>
                  <div className={styles.value}>{licCode || 'Без Л/С'}</div>
                </div>
                <div className={styles.actionSlot}>
                  <button
                    type        = "button"
                    className   = { styles.miniBtn }
                    onClick     = { openLicCard }
                    title       = "Карточка абонента"
                    disabled    = { licLoading || !licCode }
                  >
                    {licLoading ? <IonSpinner name="dots" /> : <IonIcon icon={eyeOutline} />}
                  </button>
                </div>
              </div>

              <div className={styles.executorWrap}>
                <button
                  type="button"
                  className={`${styles.detailCard} ${styles.executorToggle}`}
                  onClick={() => setExecutorOpen((open) => !open)}
                  disabled={executorSaving}
                  aria-expanded={executorOpen}
                >
                  <div className={`${styles.iconBox} ${styles.bgDark}`}>
                    {executorSaving
                      ? <IonSpinner name="dots" />
                      : <IonIcon icon={briefcaseOutline} />}
                  </div>
                  <div className={styles.contentData}>
                    <div className={styles.label}>Исполнитель</div>
                    <div className={styles.value}>{executorName}</div>
                  </div>
                  <IonIcon
                    icon={chevronDownOutline}
                    className={`${styles.executorChevron} ${executorOpen ? styles.executorChevronOpen : ''}`}
                  />
                </button>

                {executorOpen && (
                  <div className={styles.workersDropdown}>
                    {workers.length === 0 ? (
                      <div className={styles.workerEmpty}>Список сотрудников пуст</div>
                    ) : (
                      workers.map((worker: any) => {
                        const isActive = String(worker.id) === executorId;
                        return (
                          <button
                            key={worker.id}
                            type="button"
                            className={`${styles.workerOption} ${isActive ? styles.workerOptionActive : ''}`}
                            onClick={() => handlePickExecutor(worker)}
                            disabled={executorSaving}
                          >
                            <span className={styles.workerOptionName}>{worker.name || 'Без имени'}</span>
                            <span className={styles.workerOptionRole}>
                              {worker.role || 'Сотрудник'}
                              {worker.in_work > 0 ? ` · в работе: ${worker.in_work}` : ''}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {comment && (
                <div className={styles.commentSection}>
                  <div className={styles.commentLabel}>
                    <IonIcon icon={chatbubbleOutline} />
                    Комментарий
                  </div>
                  <div className={styles.value} style={{ whiteSpace: 'pre-wrap', padding: '0 4px' }}>
                    {comment}
                  </div>
                </div>
              )}

              <div className={styles.commentLabel} style={{ marginTop: 8, marginBottom: 4 }}>
                Работы ({works.length})
              </div>

              {works.length === 0 ? (
                <div className={styles.detailCard}>
                  <div className={styles.contentData}>
                    <div className={styles.value}>Нет строк работ</div>
                  </div>
                </div>
              ) : (
                works.map((w) => (
                  <div key={w.id || `${w.work_id}-${w.equip_id}`} className={styles.detailCard}>
                    <div className={styles.workRow}>
                      <div className={styles.workMain}>
                        {w.work && (
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div className={`${styles.iconBox} ${styles.bgOrange}`}>
                              <IonIcon icon={constructOutline} />
                            </div>
                            <div className={styles.contentData}>
                              <div className={styles.label}>Работа</div>
                              <div className={styles.value} style={{ whiteSpace: 'pre-wrap' }}>{w.work}</div>
                            </div>
                          </div>
                        )}

                        {w.equipment && (
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div className={`${styles.iconBox} ${styles.bgDark}`}>
                              <IonIcon icon={cogOutline} />
                            </div>
                            <div className={styles.contentData}>
                              <div className={styles.label}>Оборудование</div>
                              <div className={styles.value}>{w.equipment}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.workMoney}>
                        {w.amount > 0 && (
                          <div className={styles.moneyRow}>
                            <span className={styles.moneyLabel}>Кол-во</span>
                            <span className={styles.moneyValue}>{w.amount}</span>
                          </div>
                        )}
                        {w.price > 0 && (
                          <div className={styles.moneyRow}>
                            <span className={styles.moneyLabel}>Цена</span>
                            <span className={styles.moneyValue}>{formatMoney(w.price)}</span>
                          </div>
                        )}
                        {w.sum > 0 && (
                          <div className={styles.moneyRow}>
                            <span className={styles.moneyLabel}>Сумма</span>
                            <span className={styles.moneyValueSum}>{formatMoney(w.sum)}</span>
                          </div>
                        )}
                        {w.sum_vat > 0 && (
                          <div className={styles.moneyRow}>
                            <span className={styles.moneyLabel}>НДС</span>
                            <span className={styles.moneyValue}>{formatMoney(w.sum_vat)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

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
