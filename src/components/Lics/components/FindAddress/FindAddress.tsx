// src/components/Lics/AddressForm.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText
} from '@ionic/react';
import { locationOutline, ellipsisHorizontal, saveOutline } from 'ionicons/icons';
import './FindAddress.css';
import { ConfidenceLevel, StandardizedAddress, useDaData } from '../../../dadata-component';
import { useToast } from '../../../Toast/useToast';
import { AddressSuggestions } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';

interface LicsProps {
    initialAddress?: string;
    invoiceId?: string;
    onAddressChange?: (address: string, isStandardized: boolean) => void;
    onAddressSaved?: (address: string) => Promise<void>;
    onAddressClosed?: () => void;
    disabled?: boolean;
}

export function AddressForm({ 
    initialAddress = '', 
    invoiceId,
    onAddressChange, 
    onAddressSaved,
    onAddressClosed,
    disabled = false 
}: LicsProps) {
    const [address, setAddress] = useState<string>(initialAddress);
    const [standardizedAddress, setStandardizedAddress] = useState<any>({ address: "", lat: 0, lng: 0});
    const [saving, setSaving] = useState<boolean>(false);

    const toast = useToast();


    const handleSave = async () => {
        if (!onAddressSaved) return;
        
        const addressToSave = standardizedAddress;
        if (!addressToSave.address.trim()) {
            toast.warning('Введите адрес для сохранения');
            return;
        }

        setSaving(true);
        try {
            await onAddressSaved( standardizedAddress );
            toast.success('Адрес успешно сохранен');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            toast.error('Не удалось сохранить адрес');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="address-form">
            <IonCard className="address-form-card">
                <IonCardHeader className="address-form-header">
                    <IonCardTitle className="address-form-title">
                        <IonIcon icon={locationOutline} />
                        Ввод и стандартизация адреса
                    </IonCardTitle>
                    <IonText className="description-text">
                        Введите адрес. Стандартизация выполняется автоматически через 0.8 сек после окончания ввода.
                    </IonText>
                </IonCardHeader>

                <IonCardContent className="address-form-content">
                    <AddressSuggestions token='50bfb3453a528d091723900fdae5ca5a30369832'
                        value  = { {value: address} as any } 
                        onChange={(e)=>{
                            console.log(e?.value)
                            setStandardizedAddress({
                                address: e?.value as string,
                                lat:    e?.data.geo_lat,
                                lng:    e?.data.geo_lon,
                            })
                        }} 
                    />

                    <div className='mt-1 cl-prim'>
                        { standardizedAddress.address }
                    </div>

                    {/* Кнопки управления */}
                    <div className="address-buttons">

                        {onAddressSaved && (
                            <IonButton
                                expand  = "block"
                                fill    = "outline"
                                onClick = {handleSave}
                                disabled={saving || !standardizedAddress.address.trim()}
                            >
                                {saving ? (
                                    <>
                                        <IonSpinner name="crescent" className="address-form-spinner" />
                                        Сохранение...
                                    </>
                                ) : (
                                    <>
                                        <IonIcon icon={saveOutline} slot="start" />
                                        Сохранить адрес
                                    </>
                                )}
                            </IonButton>
                        )}
                            <IonButton
                                expand="block"
                                fill="outline"
                                onClick={ onAddressClosed }
                            >
                                {saving ? (
                                    <>
                                        <IonSpinner name="crescent" className="address-form-spinner" />
                                        Сохранение...
                                    </>
                                ) : (
                                    <>
                                        <IonIcon icon={saveOutline} slot="start" />
                                        Закрыть
                                    </>
                                )}
                            </IonButton>
                    </div>
                </IonCardContent>
            </IonCard>
        </div>
    );
}