// Обновленный InvExecute.tsx
import React, { useState, useEffect } from 'react';
import styles from './InvExecute.module.css';
import { useWorkers } from '../../../Store/navigationStore';
import { IonChip } from '@ionic/react';
import { Invoice } from './InvoiceList/InvoiceItem';

interface Executor {
  id:                   string;
  name:                 string;
  role:                 string;
  rating:               number;
  currentWorkload:      number;
  isAvailable:          boolean;
}

// Типы статусов
type WorkStatus = 'Принята' | 'Передана' | 'Выполнена' | 'Отложена' | 'Отклонена';

interface ActExecutionModalProps {
  invoice:              Invoice;
  isOpen:               boolean;
  onClose:              () => void;
  onAssignToExecutor:   ( assignmentData: { 
    worker:             Executor; 
    comment:            string; 
    priority:           string;
    status:             WorkStatus;
  } ) => Promise<void>;
}

const getStatus = ( status ) => {
    if( status === "Новый" ) 
        return "В работе"  as WorkStatus
    
    if( status === "В работе" ) 
        return "Выполнен"  as WorkStatus
    
    return 'В работе' as WorkStatus
}

export const InvExecute: React.FC<ActExecutionModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onAssignToExecutor
}) => {
  const [selectedExecutor, setSelectedExecutor] = useState<any>();
  const [comment, setComment] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [status, setStatus] = useState<WorkStatus>( getStatus( invoice.status ));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllExecutors, setShowAllExecutors] = useState(true);
  
  // Получаем workers из store
  const { workers } = useWorkers();

  // Преобразуем workers в формат исполнителей
  const executors: Executor[] = workers.map((worker: Executor) => ({
    id:                 worker.id || worker.id || Math.random().toString(),
    name:          worker.name || 'Неизвестный исполнитель',
    role:               worker.role || 'Специалист',
    rating:             worker.rating || 4.5,
    currentWorkload:    worker.currentWorkload || 0,
    isAvailable:        worker.isAvailable !== false
  }));

  useEffect(() => {
    if (isOpen && workers.length === 0) {
      console.log('Загрузка списка исполнителей...');
    }
  }, [isOpen, workers.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExecutor) return;

    setIsSubmitting(true);
    try {
      await onAssignToExecutor({
        worker: selectedExecutor, 
        comment, 
        priority,
        status
      });
      onClose();
      // Сброс формы
      setSelectedExecutor('');
      setComment('');
      setPriority('normal');
      setStatus('Принята');
      setShowAllExecutors(true);
    } catch (error) {
      console.error('Ошибка при назначении исполнителя:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecutorClick = (executor: Executor) => {
    if (!executor.isAvailable) return;
    
    // Если кликаем на уже выбранного исполнителя - отменяем выбор
    if (selectedExecutor?.id === executor.id) {
      setSelectedExecutor(null);
      setShowAllExecutors(true);
    } else {
      // Выбираем нового исполнителя и показываем только его
      setSelectedExecutor(executor);
      setShowAllExecutors(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedExecutor(null);
    setShowAllExecutors(true);
  };

  const getWorkloadColor      = (workload: number) => {
    if (workload < 3) return styles.workloadLow;
    if (workload < 6) return styles.workloadMedium;
    return styles.workloadHigh;
  };

  const getWorkloadText       = (workload: number) => {
    if (workload < 3) return 'Низкая';
    if (workload < 6) return 'Средняя';
    return 'Высокая';
  };

  // Функция для получения полного адреса
  const getFullAddress        = () => {
    if (!invoice.address) return 'Адрес не указан';
    return invoice.address.address;
  };

  // Функция для получения класса цвета статуса
  const getStatusColorClass   = (statusOption: WorkStatus) => {
    switch (statusOption) {
      case 'Принята':     return styles.statusNew;
      case 'Передана':  return styles.statusInProgress;
      case 'Выполнена':  return styles.statusCompleted;
      case 'Отложена':   return styles.statusOnHold;
      case 'Отклонена':  return styles.statusRejected;
      default:          return '';
    }
  };

  if (!isOpen) return null;

  // Определяем, какие исполнители показывать
  const executorsToShow = showAllExecutors 
    ? executors 
    : [selectedExecutor].filter(Boolean);

  return (
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
            <h2 className={styles.modalTitle}>Передача на исполнение</h2>
            <div className={styles.headerSpacer}></div>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.invoiceContainer}>
            {/* Информация о заявке */}
            <div className={styles.invoiceInfo}>
              <div className={styles.infoHeader}>
                <h3>Заявка #{invoice.number?.trim()}</h3>
                <div className={`${styles.statusChip} ${styles.statusPrimary}`}>
                  К исполнению
                </div>
              </div>
              
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Адрес:</span>
                  <span className={styles.infoValue}>{getFullAddress()}</span>
                </div>
                {invoice.plot && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Участок:</span>
                    <span className={styles.infoValue}>{invoice.plot}</span>
                  </div>
                )}
                {invoice.character && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Характер работ:</span>
                    <span className={styles.infoValue}>{invoice.character}</span>
                  </div>
                )}
                {invoice.service && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Описание:</span>
                    <span className={styles.infoValue}>{invoice.service}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Форма назначения исполнителя */}
            <form onSubmit={handleSubmit} className={styles.executionForm}>
              {/* Выбор статуса */}
              <div className={styles.formSection}>
                <label className={styles.sectionLabel}>
                  <span className={styles.labelIcon}>📊</span>
                  Статус работы *
                </label>
                <div className={styles.statusOptions}>
                  {(['Принята', 'Передана', 'Выполнена', 'Отложена', 'Отклонена'] as WorkStatus[]).map((statusOption) => (
                    <IonChip
                      key={statusOption}
                      outline={status !== statusOption}
                      color={status === statusOption ? 'primary' : 'medium'}
                      onClick={() => setStatus(statusOption)}
                      style={{ 
                        margin: '2px',
                        cursor: 'pointer',
                        border: status === statusOption ? '2px solid var(--ion-color-primary)' : '1px solid var(--ion-color-medium)'
                      }}
                    >
                      <span className={`${styles.statusIcon } ${getStatusColorClass(statusOption)}`}>
                        {statusOption === 'Принята' && '🆕'}
                        {statusOption === 'Передана' && '⚡'}
                        {statusOption === 'Выполнена' && '✅'}
                        {statusOption === 'Отложена' && '⏸️'}
                        {statusOption === 'Отклонена' && '❌'}
                      </span>
                      <span className='ml-1'>
                        { statusOption }
                      </span>
                    </IonChip>
                  ))}
                </div>
              </div>

              {/* Выбор исполнителя */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <label className={styles.sectionLabel}>
                    <span className={styles.labelIcon}>👤</span>
                    Выберите исполнителя *
                  </label>
                  
                  {selectedExecutor && !showAllExecutors && (
                    <button 
                      type="button"
                      onClick={handleCancelSelection}
                      className={styles.cancelSelectionButton}
                    >
                      Отменить выбор
                    </button>
                  )}
                </div>
                
                {executors.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Нет доступных исполнителей</p>
                    <button 
                      type="button" 
                      className={styles.refreshButton}
                      onClick={() => console.log('Обновить список исполнителей')}
                    >
                      Обновить список
                    </button>
                  </div>
                ) : (
                  <div className={styles.executorsList}>
                    {executorsToShow.map((executor) => (
                      <div
                        key={executor.id}
                        className={`${styles.executorCard} ${
                          selectedExecutor?.id === executor.id ? styles.executorSelected : ''
                        } ${!executor.isAvailable ? styles.executorDisabled : ''}`}
                        onClick={() => handleExecutorClick(executor)}
                      >
                        <div className={styles.executorMain}>
                          <div className={styles.executorName}>
                            {executor.name}
                            <span className={styles.executorSpecialty}>
                              {executor.role}
                            </span>
                          </div>
                          <div className={styles.executorRating}>
                            ⭐ {executor.rating.toFixed(1)}
                          </div>
                        </div>
                        <div className={styles.executorMeta}>
                          <div className={`${styles.workloadBadge} ${getWorkloadColor(executor.currentWorkload)}`}>
                            Загрузка: {getWorkloadText(executor.currentWorkload)}
                          </div>
                          <div className={styles.availability}>
                            {executor.isAvailable ? (
                              <span className={styles.available}>✓ Доступен</span>
                            ) : (
                              <span className={styles.unavailable}>✗ Недоступен</span>
                            )}
                          </div>
                        </div>
                        
                        {selectedExecutor?.id === executor.id && (
                          <div className={styles.selectionIndicator}>
                            ✅ Выбран
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {!showAllExecutors && executors.length > 1 && (
                      <div className={styles.showAllHint}>
                        <p>Показан только выбранный исполнитель. Нажмите на него еще раз или кнопку "Отменить выбор" чтобы увидеть всех.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Приоритет */}
              <div className={styles.formSection}>
                <label className={styles.sectionLabel}>
                  <span className={styles.labelIcon}>🎯</span>
                  Приоритет выполнения
                </label>
                <div className={styles.priorityOptions}>
                  <label className={styles.priorityOption}>
                    <input
                      type="radio"
                      name="priority"
                      value="low"
                      checked={priority === 'low'}
                      onChange={(e) => setPriority(e.target.value)}
                    />
                    <span className={styles.priorityLabel}>
                      <span className={styles.priorityIcon}>🟢</span>
                      Низкий
                    </span>
                  </label>
                  <label className={styles.priorityOption}>
                    <input
                      type="radio"
                      name="priority"
                      value="normal"
                      checked={priority === 'normal'}
                      onChange={(e) => setPriority(e.target.value)}
                    />
                    <span className={styles.priorityLabel}>
                      <span className={styles.priorityIcon}>🟡</span>
                      Обычный
                    </span>
                  </label>
                  <label className={styles.priorityOption}>
                    <input
                      type="radio"
                      name="priority"
                      value="high"
                      checked={priority === 'high'}
                      onChange={(e) => setPriority(e.target.value)}
                    />
                    <span className={styles.priorityLabel}>
                      <span className={styles.priorityIcon}>🔴</span>
                      Высокий
                    </span>
                  </label>
                </div>
              </div>

              {/* Комментарий */}
              <div className={styles.formSection}>
                <label className={styles.sectionLabel}>
                  <span className={styles.labelIcon}>💬</span>
                  Комментарий для исполнителя
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Дополнительные указания, особенности выполнения работ..."
                  className={styles.commentTextarea}
                  rows={4}
                />
              </div>

              {/* Кнопки */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!selectedExecutor || isSubmitting || executors.length === 0}
                  className={styles.submitButton}
                >
                  {isSubmitting ? (
                    <>
                      <span className={styles.loadingSpinner}></span>
                      Назначение...
                    </>
                  ) : (
                    'Назначить исполнителя'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};