import React, { useState } from 'react';
import {
    IonIcon,
    IonSpinner
} from '@ionic/react';
import { 
    locationOutline, 
    saveOutline, 
    closeOutline, 
    informationCircleOutline 
} from 'ionicons/icons';
import './FindAddress.css';
import { useToast } from '../../../Toast/useToast';
import { AddressSuggestions } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';

interface AddressFormProps {
    initialAddress?: string;
    onAddressChange?: (address: string) => void;
    onClose?: () => void;
}

export function AddressForm({ 
    initialAddress = '', 
    onAddressChange,
    onClose
}: AddressFormProps) {
    // В react-dadata value требует объекта, если мы хотим предзаполнить
    const [addressQuery, setAddressQuery] = useState<string>(initialAddress);
    
    // Храним полный объект адреса
    const [standardizedAddress, setStandardizedAddress] = useState<any>({ 
        address: initialAddress, 
        lat: 0, 
        lon: 0 
    });
    
    const [saving, setSaving] = useState<boolean>(false);
    const toast = useToast();

    const handleSave = async () => {
        if (!onAddressChange) return;
        
        if (!standardizedAddress.address || !standardizedAddress.address.trim()) {
            toast.warning('Введите адрес для сохранения');
            return;
        }

        setSaving(true);
        try {
            // Передаем весь объект или строку (зависит от твоей логики в InvoiceView)
            // Обычно передают строку. Если нужно объект - передавай standardizedAddress
            await onAddressChange(standardizedAddress.address); 
            toast.success('Адрес успешно сохранен');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            toast.error('Не удалось сохранить адрес');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="address-form-wrapper">
            
            {/* ШАПКА */}
            <div className="address-header">
                <div className="address-title">
                    <IonIcon icon={locationOutline} />
                    Поиск адреса
                </div>
                {onClose && (
                    <button className="close-btn" onClick={onClose}>
                        <IonIcon icon={closeOutline} />
                    </button>
                )}
            </div>

            {/* КОНТЕНТ */}
            <div className="address-content">
                
                {/* Подсказка */}
                <div className="info-block">
                    <IonIcon icon={informationCircleOutline} className="info-icon" />
                    <div className="info-text">
                        Начните вводить адрес. Система автоматически исправит ошибки и предложит правильный вариант.
                    </div>
                </div>

                {/* Поле ввода Dadata */}
                <div className="dadata-container">
                    <AddressSuggestions 
                        token="50bfb3453a528d091723900fdae5ca5a30369832"
                        defaultQuery={initialAddress}
                        onChange={(e) => {
                            if (e) {
                                setStandardizedAddress({
                                    address: e.value,
                                    lat: parseFloat(e.data.geo_lat || '0'),
                                    lon: parseFloat(e.data.geo_lon || '0'),
                                });
                            }
                        }}
                        inputProps={{
                            placeholder: "Введите адрес (например, Ленина 1)",
                            className: "react-dadata__input" // Наш класс для стилизации
                        }}
                    />
                </div>

                {/* Результат выбора */}
                {standardizedAddress.address && standardizedAddress.address !== initialAddress && (
                    <div className="result-card">
                        <div className="result-label">Выбранный адрес</div>
                        <div className="result-value">
                            {standardizedAddress.address}
                        </div>
                    </div>
                )}

            </div>

            {/* ФУТЕР */}
            <div className="address-footer">
                <button 
                    className="save-btn" 
                    onClick={handleSave}
                    disabled={saving || !standardizedAddress.address}
                >
                    {saving ? (
                        <IonSpinner name="crescent" color="light" style={{width: 20, height: 20}} />
                    ) : (
                        <>
                            <IonIcon icon={saveOutline} />
                            Сохранить адрес
                        </>
                    )}
                </button>
            </div>

        </div>
    );
}