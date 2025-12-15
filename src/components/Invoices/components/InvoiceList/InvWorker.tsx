import React from 'react';
import { 
    IonButton, 
    IonText,
    IonIcon,
    IonBadge,
    IonAvatar
} from '@ionic/react';
import { 
    callOutline, 
    locateOutline,
    checkmarkCircleOutline,
    timeOutline,
    personCircleOutline,
    starOutline,
    navigateOutline
} from 'ionicons/icons';
import styles from './InvWorker.module.css';

export interface WorkerProps {
    worker: {
        id: string;
        name: string;
        phone?: string;
        status: 'available' | 'busy' | 'offline' | 'on_break';
        currentLocation?: {
            lat: number;
            lng: number;
        };
        currentInvoiceId?: string;
        invoiceTitle?: string;
        skills?: string[];
        rating?: number;
        lastSeen?: string;
        distance?: number;
        avatarUrl?: string;
    };
    isSelected?: boolean;
    onSelect?: (workerId: string) => void;
    onCall?: (phone: string, event: React.MouseEvent) => void;
    onTrack?: (workerId: string) => void;
    onAssign?: (workerId: string, invoiceId?: string) => void;
    onUnassign?: (workerId: string) => void;
    formatDistance?: (distance: number) => string;
    showActions?: boolean;
}

export const InvWorker: React.FC<WorkerProps> = ({ 
    worker,
    isSelected = false,
    onSelect,
    onCall,
    onTrack,
    onAssign,
    onUnassign,
    formatDistance,
    showActions = true
}) => {

    const handleCardClick = () => {
        if (onSelect) {
            onSelect(worker.id);
        }
    };

    const handleCallClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (worker.phone && onCall) {
            onCall(worker.phone, e);
        }
    };

    const handleTrackClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onTrack) {
            onTrack(worker.id);
        }
    };

    const handleAssignClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAssign) {
            onAssign(worker.id, worker.currentInvoiceId);
        }
    };

    const handleUnassignClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUnassign) {
            onUnassign(worker.id);
        }
    };

    // Определение цвета статуса
    const getStatusColor = () => {
        switch(worker.status) {
            case 'available':
                return styles.statusAvailable;
            case 'busy':
                return styles.statusBusy;
            case 'offline':
                return styles.statusOffline;
            case 'on_break':
                return styles.statusBreak;
            default:
                return styles.statusDefault;
        }
    };

    // Текст статуса
    const getStatusText = () => {
        switch(worker.status) {
            case 'available':
                return 'Свободен';
            case 'busy':
                return 'Занят';
            case 'offline':
                return 'Не в сети';
            case 'on_break':
                return 'На перерыве';
            default:
                return worker.status;
        }
    };

    return (
        <div 
            className={`${styles.workerCard} ${isSelected ? styles.workerCardSelected : ''}`}
            onClick={handleCardClick}
        >
            {/* Заголовок карточки */}
            <div className={styles.workerHeader}>
                <div className={styles.workerAvatar}>
                    {worker.avatarUrl ? (
                        <img src={worker.avatarUrl} alt={worker.name} />
                    ) : (
                        <IonIcon icon={personCircleOutline} className={styles.avatarPlaceholder} />
                    )}
                </div>
                
                <div className={styles.workerBasicInfo}>
                    <IonText className={'ml-1 ' + styles.workerName}>
                        <b>{worker.name}</b>
                    </IonText>
                    
                    {/* <div className={styles.workerMeta}>
                        <div className={`${styles.statusBadge} ${getStatusColor()}`}>
                            {getStatusText()}
                        </div>
                        
                        {worker.rating !== undefined && (
                            <div className={styles.rating}>
                                <IonIcon icon={starOutline} />
                                <IonText className={styles.ratingValue}>
                                    {worker.rating.toFixed(1)}
                                </IonText>
                            </div>
                        )}
                    </div> */}
                </div>
            </div>

            {/* Информация о работнике */}
            {/* <div className={styles.workerInfo}>
                {worker.distance !== undefined && formatDistance && (
                    <div className={styles.infoRow}>
                        <IonIcon icon={locateOutline} className={styles.infoIcon} />
                        <IonText className={styles.infoText}>
                            {formatDistance(worker.distance)}
                        </IonText>
                    </div>
                )}
                
                {worker.lastSeen && (
                    <div className={styles.infoRow}>
                        <IonIcon icon={timeOutline} className={styles.infoIcon} />
                        <IonText className={styles.infoText}>
                            Активен: {worker.lastSeen}
                        </IonText>
                    </div>
                )}
                
                {worker.currentInvoiceId && worker.invoiceTitle && (
                    <div className={styles.infoRow}>
                        <IonIcon icon={checkmarkCircleOutline} className={styles.infoIcon} />
                        <IonText className={styles.infoText}>
                            Выполняет: {worker.invoiceTitle}
                        </IonText>
                    </div>
                )}
                
                {worker.skills && worker.skills.length > 0 && (
                    <div className={styles.skillsContainer}>
                        <IonText className={styles.skillsLabel}>Навыки:</IonText>
                        <div className={styles.skillsList}>
                            {worker.skills.slice(0, 3).map((skill, index) => (
                                <IonBadge 
                                    key={index} 
                                    color="light" 
                                    className={styles.skillBadge}
                                >
                                    {skill}
                                </IonBadge>
                            ))}
                            {worker.skills.length > 3 && (
                                <IonBadge color="light" className={styles.skillBadge}>
                                    +{worker.skills.length - 3}
                                </IonBadge>
                            )}
                        </div>
                    </div>
                )}
            </div> */}

            {/* Действия */}
            {/* {showActions && (
                <div className={styles.workerActions}>
                    {worker.phone && (
                        <IonButton 
                            size="small"
                            fill="clear"
                            className={styles.actionButton}
                            onClick={handleCallClick}
                            title="Позвонить"
                        >
                            <IonIcon icon={callOutline} slot="icon-only" />
                        </IonButton>
                    )}
                    
                    {worker.currentLocation && (
                        <IonButton 
                            size="small"
                            fill="clear"
                            className={styles.actionButton}
                            onClick={handleTrackClick}
                            title="Отслеживать"
                        >
                            <IonIcon icon={navigateOutline} slot="icon-only" />
                        </IonButton>
                    )}
                    
                    {worker.status === 'available' && onAssign ? (
                        <IonButton 
                            size="small"
                            fill="solid"
                            color="primary"
                            className={styles.assignButton}
                            onClick={handleAssignClick}
                        >
                            Назначить
                        </IonButton>
                    ) : worker.status === 'busy' && onUnassign ? (
                        <IonButton 
                            size="small"
                            fill="outline"
                            color="medium"
                            className={styles.unassignButton}
                            onClick={handleUnassignClick}
                        >
                            Освободить
                        </IonButton>
                    ) : null}
                </div>
            )} */}
        </div>
    );
};

export default React.memo(InvWorker);