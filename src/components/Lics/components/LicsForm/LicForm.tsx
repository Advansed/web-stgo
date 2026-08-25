import React from 'react';
import { IonModal, IonIcon, IonLoading } from '@ionic/react';
import { closeOutline, homeOutline } from 'ionicons/icons';
import './LicForm.css';
import LicAccountCard from './LicAccountCard';

interface LicFormProps {
  isOpen: boolean;
  onClose: () => void;
  licAccount: any;
  loading?: boolean;
}

const LicForm: React.FC<LicFormProps> = ({
  isOpen,
  onClose,
  licAccount,
  loading = false,
}) => {
  return (
    <>
      <IonLoading isOpen={loading && isOpen} message="Загрузка ЛС…" />

      <IonModal isOpen={isOpen && !!licAccount} onDidDismiss={onClose} className="lics-form-modal">
        {licAccount && (
          <div className="lic-modal-wrapper">
            <div className="lic-modal-header">
              <div className="lic-modal-title">
                <IonIcon icon={homeOutline} />
                Карточка абонента
              </div>
              <button type="button" onClick={onClose} className="close-btn">
                <IonIcon icon={closeOutline} />
              </button>
            </div>

            <LicAccountCard licAccount={licAccount} />
          </div>
        )}
      </IonModal>
    </>
  );
};

export default LicForm;
