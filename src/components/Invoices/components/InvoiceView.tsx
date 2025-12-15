// InvoiceModal.tsx
import React, { useCallback, useState } from 'react';
import styles from './InvoiceView.module.css';
import { Invoice } from './InvoiceList/InvoiceItem';
import { IonModal } from '@ionic/react';
import { AddressForm } from '../../Lics/components/FindAddress/FindAddress';

interface InvoiceStatus {
  color: 'primary' | 'success' | 'warning' | 'danger' | 'medium';
  text: string;
}

interface InvoiceModalProps {
  invoice:            Invoice;
  invoiceStatus:      InvoiceStatus;
  formatDate:         (dateString: string) => string;
  formatPhone?:       (phone: string) => string;
  onNavigateToActs:   () => void;
  onNavigateToPrint:  () => void;
  onUpdateAddress?:   (invoiceId: string, newAddress: string) => void;
  isOpen:             boolean;
  onClose:            () => void;
}

export const InvoiceView: React.FC<InvoiceModalProps> = ({
  invoice,
  invoiceStatus,
  formatDate,
  formatPhone,
  onNavigateToActs,
  onNavigateToPrint,
  onUpdateAddress,
  isOpen,
  onClose
}) => {
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  const handleCall = useCallback(() => {
    if (!invoice.phone) return;
    
    try {
      window.open(`tel:${invoice.phone}`);
    } catch (error) {
      console.error('Ошибка при попытке звонка:', error);
    }
  }, [invoice.phone]);


  const getStatusIcon = () => {
    switch (invoiceStatus?.color) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'danger': return '❗';
      default: return 'ℹ';
    }
  };

  const getStatusClass = () => {
    return `status${invoiceStatus?.color.charAt(0).toUpperCase() + invoiceStatus?.color.slice(1)}`;
  };

  const getFullAddress = () => {
    return invoice.address.address;
  };

  const getStatusText = () => {
    return invoice.status
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {/* Заголовок модального окна */}
          <div className={styles.modalHeader}>
            <div className={styles.modalToolbar}>
              <button 
                onClick={onClose}
                className={styles.closeButton}
              >
                ×
              </button>
              <h2 className={styles.modalTitle}>Детали заявки</h2>
              <button 
                onClick={onNavigateToPrint}
                className={styles.printButton}
              >
                🖨️
              </button>
            </div>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.invoiceContainer}>

              {/* Заголовок карточки */}
              <div className={styles.invoiceHeader}>
                <div className={styles.invoiceTitle}>
                  <h2>#{invoice.number?.trim()}</h2>
                  <p className={styles.invoiceSubtitle}>
                    {formatDate(invoice.date)}
                  </p>
                </div>
                <div className={`${styles.statusChip} ${styles[getStatusClass()]}`}>
                  <span className={styles.statusIcon}>{getStatusIcon()}</span>
                  {getStatusText()}
                </div>
              </div>

              {/* Основная информация */}
              <div className={styles.invoiceList}>
                {/* Адрес */}
                <div className={styles.invoiceItem}>
                  <div className={styles.itemIcon}>📍</div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>Адрес</div>
                    <div className={styles.itemText}>{getFullAddress()}</div>
                    <div className={styles.itemSubtext}>
                      Участок: <span className={styles.infoBadge}>{invoice.plot}</span>
                    </div>
                  </div>
                  <button 
                    onClick   = { () => setIsUpdatingAddress(true) }
                    disabled  = {isUpdatingAddress}
                    className = {styles.actionButton}
                  >
                    {isUpdatingAddress ? '⟳' : '🔍'}
                  </button>
                </div>

                {/* Заявитель */}
                {invoice.applicant && (
                  <div className={styles.invoiceItem}>
                    <div className={styles.itemIcon}>👤</div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>Заявитель</div>
                      <div className={styles.itemText}>{invoice.applicant}</div>
                    </div>
                  </div>
                )}

                {/* Телефон */}
                {invoice.phone && (
                  <div className={styles.invoiceItem}>
                    <div className={styles.itemIcon}>📞</div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>Телефон</div>
                      <div className={styles.itemText}>
                        {formatPhone ? formatPhone(invoice.phone) : invoice.phone}
                      </div>
                    </div>
                    <button 
                      onClick={handleCall}
                      className={styles.callButton}
                    >
                      📞 Позвонить
                    </button>
                  </div>
                )}

                {/* Лицевой счет */}
                <div className={styles.invoiceItem}>
                  <div className={styles.itemIcon}>🔢</div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>Лицевой счет</div>
                    <div className={styles.itemText}>{invoice.lic}</div>
                  </div>
                  <button className={styles.actionButton}>
                    ⋯
                  </button>
                </div>

                {/* Характер заявки */}
                {invoice.character && (
                  <div className={styles.invoiceItem}>
                    <div className={styles.itemIcon}>📄</div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>Характер заявки</div>
                      <div className={styles.itemText}>{invoice.character}</div>
                    </div>
                  </div>
                )}

                {/* Время выполнения */}
                <div className={styles.invoiceItem}>
                  <div className={styles.itemIcon}>📅</div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>Сроки выполнения</div>
                    <div className={styles.infoSection}>
                      <div className={styles.itemText}>
                        Удобное время: {formatDate(invoice.plan_date)}
                      </div>
                    </div>
                    <div className={styles.infoSection}>
                      <div className={styles.itemText}>
                        Фактическое выполнение: {formatDate(invoice.complete_date)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Комментарий */}
                {invoice.complete_text && (
                  <div className={styles.invoiceItem}>
                    <div className={styles.itemIcon}>💬</div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>Комментарий по выполнению</div>
                      <div className={styles.itemText}>{invoice.complete_text}</div>
                    </div>
                  </div>
                )}

                {/* Текст заявки */}
                {invoice.service && (
                  <div className={styles.invoiceItem}>
                    <div className={styles.itemIcon}>📝</div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>Текст заявки</div>
                      <div className={styles.itemText}>{invoice.service}</div>
                    </div>
                  </div>
                )}
                {/* Текст заявки */}
                {invoice.worker.name && (
                  <div className={styles.invoiceItem}>
                    <div className={styles.itemIcon}>📝</div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>Работник</div>
                      <div className={styles.itemText}>{invoice.worker.name + ' (' + invoice.worker.role + ')'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Кнопка актов */}
              { invoice.status === 'Новый' &&(
                <div className={styles.footerActions}>
                  <button 
                    className={styles.actsButton}
                    onClick={onNavigateToActs}
                  >
                    📋 Передать к исполнению
                  </button>
                </div>
              )}

              {/* Кнопка актов */}
              { invoice.status === 'В работе' &&(
                <div className={styles.footerActions}>
                  <button 
                    className={styles.actsButton}
                    onClick={onNavigateToActs}
                  >
                    📋 Передать к другому
                  </button>
                </div>
              )}

              { invoice.status !== 'Новый' && invoice.status !== 'В работе' &&(
                <div className={styles.footerActions}>
                  <button 
                    className={styles.actsButton}
                    onClick={onNavigateToActs}
                  >
                    📋 Изменить статус
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <IonModal
          isOpen        = { isUpdatingAddress } 
          onDidDismiss  = { () => setIsUpdatingAddress(false) }
      >
        <AddressForm 
            initialAddress    = { invoice.address.address } 
            onAddressChange   = { ( address ) => { 
                if( onUpdateAddress)
                    onUpdateAddress(invoice.id, address)
            } } 
            onClose           = { () => { setIsUpdatingAddress(false) } }
        />
      </IonModal>
    </>
  );
};