import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { IonModal, IonLoading, IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline, searchOutline, locationOutline, keypadOutline, addOutline, personOutline } from 'ionicons/icons';
import { useLics } from './useFindLics';
import { getLic } from '../../../../Store/api';
import { useToken } from '../../../../Store/loginStore';
import { useToast } from '../../../Toast';
import { formatAddress } from '../../../../utils/format';
import './FindLics.css';
import DropdownFilter from './DropDownFilter';


interface LicsFormProps {
    address?: string;
    invoiceId?: string;
    onSelect: ( lic: any ) => void;
    isOpen: boolean;
    onClose: () => void;
}

type SearchMode = 'code' | 'address';

interface FoundLic {
    id: string;
    code: string;
    name?: string;
    address?: string;
}

const FindLics: React.FC<LicsFormProps> = ({ 
    address,
    onSelect, 
    isOpen, 
    onClose 
}) => {
    const { 
        uluses, settlements, streets, houses, kv, lics, loading,
        loadSettlements, loadStreets, loadHouses, loadKv, loadLics 
    } = useLics();

    const { token } = useToken();
    const toast = useToast();

    const [mode, setMode] = useState<SearchMode>('code');
    const [codeInput, setCodeInput] = useState('');
    const [searchingCode, setSearchingCode] = useState(false);
    const [foundLic, setFoundLic] = useState<FoundLic | null>(null);
    const [info, setInfo] = useState('Выберите улус или город');

    useEffect(() => {
        if (isOpen) {
            setCodeInput('');
            setMode('code');
            setFoundLic(null);
            setInfo('Выберите улус или город');
        }
    }, [isOpen]);

    const handleSearchByCode = useCallback(async () => {
        const code = codeInput.trim();
        if (!code) return toast.warning('Введите номер лицевого счета');
        if (!token) return toast.error('Нет токена авторизации');

        setSearchingCode(true);
        setFoundLic(null);
        try {
            const res = await getLic(token, code);
            const data = res.data;

            if (res.ok && data && (data.id || data.name || data.address)) {
                setFoundLic({
                    id: data.id ? String(data.id) : code,
                    code,
                    name: data.name || data.applicant || '',
                    address: typeof data.address === 'string' ? data.address : (data.address?.address || ''),
                });
            } else {
                toast.error(res?.message || 'Лицевой счет не найден');
            }
        } catch {
            toast.error('Ошибка сети при поиске ЛС');
        } finally {
            setSearchingCode(false);
        }
    }, [codeInput, token, toast]);

    const handleAdd = useCallback(() => {
        if (!foundLic) return;
        onSelect({
            type: 'lics',
            name: foundLic.code,
            id: foundLic.id,
            address: foundLic.address || '',
            applicant: foundLic.name || '',
            fio: foundLic.name || '',
        });
        onClose();
    }, [foundLic, onSelect, onClose]);

    const handleSelect = useCallback((item: any) => {
        switch (item.type) {
            case "ulus": 
                setFoundLic(null);
                setInfo( item.name )
                loadSettlements(item.items);
                break;
            case "settle":
                setFoundLic(null);
                setInfo( info + ' → ' + item.name )
                loadStreets(item.id);
                break;
            case "street":
                setFoundLic(null);
                setInfo( info + ' → ' + item.name )
                loadHouses(item.id);
                break;
            case "house":
                setFoundLic(null);
                setInfo( info + ' → ' + item.name )
                loadLics(item.items);
                break;
            case "build":
                setFoundLic(null);
                setInfo( info + ' → ' + item.name )
                loadKv(item.items);
                break;
            case "kv":
                setFoundLic(null);
                setInfo( info + ' → ' + item.name )
                loadLics(item.items);
                break;
            case "lics":
                setFoundLic({
                    id: String(item.id || ''),
                    code: String(item.name || ''),
                    name: item.fio || item.abonent || '',
                    address: info,
                });
                break;
        }
    }, [loadSettlements, loadStreets, loadHouses, loadKv, loadLics, info]);

    const levelConfig = useMemo(() => {
        const config: any = [];

        if (uluses.length > 0) {
            config.push({
                type: 'ulus', label: 'Район / Улус',
                render: () => <DropdownFilter options={uluses} onSelect={handleSelect} />
            });
        }
        if (settlements.length > 0) {
            config.push({
                type: 'settle', label: 'Населенный пункт',
                render: () => <DropdownFilter options={settlements} onSelect={handleSelect} />
            });
        }
        if (streets.length > 0) {
            config.push({
                type: 'street', label: 'Улица',
                render: () => <DropdownFilter options={streets} onSelect={handleSelect} />
            });
        }
        if (houses.length > 0) {
            config.push({
                type: 'house', label: 'Дом',
                render: () => <DropdownFilter options={houses} onSelect={handleSelect} />
            });
        }
        if (kv.length > 0) {
            config.push({
                type: 'kv', label: 'Квартира',
                render: () => <DropdownFilter options={kv} onSelect={handleSelect} />
            });
        }
        if (lics.length > 0) {
            config.push({
                type: 'lics', label: 'Лицевой счет',
                render: () => <DropdownFilter options={lics} onSelect={handleSelect} />
            });
        }
        return config;
    }, [uluses, settlements, streets, houses, kv, lics, handleSelect]);

    const foundCard = foundLic ? (
        <div className="found-lic-card">
            <div className="found-lic-code">{foundLic.code}</div>
            {(foundLic.name || foundLic.address) && (
                <div className="found-lic-details">
                    {foundLic.name && (
                        <div className="found-lic-row">
                            <IonIcon icon={personOutline} />
                            <span>{foundLic.name}</span>
                        </div>
                    )}
                    {foundLic.address && (
                        <div className="found-lic-row">
                            <IonIcon icon={locationOutline} />
                            <span>{formatAddress(foundLic.address)}</span>
                        </div>
                    )}
                </div>
            )}
            <button
                type="button"
                className="add-lic-action-btn"
                onClick={handleAdd}
            >
                <IonIcon icon={addOutline} />
                Добавить лицевой счет
            </button>
        </div>
    ) : null;

    return (
        <>
            <IonLoading isOpen={loading && mode === 'address'} message="Загрузка данных..." />
            
            <IonModal 
                isOpen={isOpen} 
                onDidDismiss={onClose}
                className="lics-form-modal"
            >
                <div className="find-lics-header">
                    <div>
                        <div className="find-lics-title">
                            <IonIcon icon={searchOutline} />
                            <span className='ml-05'>Поиск лицевого счета</span>
                        </div>
                        <div className='ml-2'>
                            { address}
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <IonIcon icon={closeOutline} />
                    </button>
                </div>

                <div className="find-lics-tabs">
                    <button
                        type="button"
                        className={`find-lics-tab ${mode === 'code' ? 'active' : ''}`}
                        onClick={() => { setMode('code'); setFoundLic(null); }}
                    >
                        <IonIcon icon={keypadOutline} />
                        По коду
                    </button>
                    <button
                        type="button"
                        className={`find-lics-tab ${mode === 'address' ? 'active' : ''}`}
                        onClick={() => { setMode('address'); setFoundLic(null); }}
                    >
                        <IonIcon icon={locationOutline} />
                        По адресу
                    </button>
                </div>
                
                <div className="find-lics-content">
                    {mode === 'code' ? (
                        <>
                            <div className="lics-level-container find-by-code-box">
                                <label className="lics-level-label">Номер лицевого счета</label>
                                <input
                                    type="text"
                                    className="find-by-code-input"
                                    value={codeInput}
                                    onChange={(e) => {
                                        setCodeInput(e.target.value);
                                        setFoundLic(null);
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchByCode()}
                                    placeholder="Введите код ЛС"
                                    disabled={searchingCode}
                                    inputMode="numeric"
                                    autoFocus
                                />

                                <button
                                    type="button"
                                    className="add-lic-action-btn find-by-code-submit"
                                    onClick={handleSearchByCode}
                                    disabled={searchingCode || !codeInput.trim()}
                                >
                                    {searchingCode
                                        ? <IonSpinner name="dots" />
                                        : <IonIcon icon={searchOutline} />}
                                    Найти лицевой счет
                                </button>
                            </div>

                            {foundCard}
                        </>
                    ) : (
                        <>
                            <div className="info-crumb-box">
                                <IonIcon icon={locationOutline} className="info-crumb-icon"/>
                                <span>{info}</span>
                            </div>

                            {levelConfig.map((config, index) => (
                                <div key={`${config.type}-${index}`} className="lics-level-container">
                                    <label className="lics-level-label">
                                        {config.label}
                                    </label>
                                    {config.render()}
                                </div>
                            ))}

                            {foundCard}
                        </>
                    )}
                </div>
            </IonModal>
        </>
    );
};

export default React.memo( FindLics );
