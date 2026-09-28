import React, { useState, useCallback, useEffect, useRef } from 'react';
import { IonModal, IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline, searchOutline, locationOutline, keypadOutline, addOutline, personOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useLics } from './useFindLics';
import type { DropdownOption } from './useFindLics';
import { getLic } from '../../../../Store/api';
import { useToken } from '../../../../Store/loginStore';
import { formatAddress } from '../../../../utils/format';
import './FindLics.css';
import DropdownFilter from './DropDownFilter';


interface LicsFormProps {
    address?: string;
    invoiceId?: string;
    onSelect: (lic: any) => Promise<boolean | void> | boolean | void;
    isOpen: boolean;
    onClose: () => void;
    contextClass?: string;
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
    onClose,
    contextClass,
}) => {
    const [mode, setMode] = useState<SearchMode>('code');
    const {
        uluses, settlements, streets, houses, kv, lics, loading, error,
        loadedUluses, loadedStreets, loadedHouses,
        loadUluses, loadSettlements, loadStreets, loadHouses, loadKv, loadLics,
    } = useLics(isOpen && mode === 'address');

    const { token } = useToken();

    const [codeInput, setCodeInput] = useState('');
    const [searchingCode, setSearchingCode] = useState(false);
    const [addingLic, setAddingLic] = useState(false);
    const [codeError, setCodeError] = useState('');
    const [foundLic, setFoundLic] = useState<FoundLic | null>(null);
    const [selected, setSelected] = useState<Partial<Record<'ulus' | 'settle' | 'street' | 'house' | 'kv', DropdownOption>>>({});
    const searchId = useRef(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);
    const accountsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            searchId.current += 1;
            setCodeInput('');
            setMode('code');
            setFoundLic(null);
            setCodeError('');
            setSearchingCode(false);
            setAddingLic(false);
            setSelected({});
        }
    }, [isOpen]);

    const handleSearchByCode = useCallback(async () => {
        const code = codeInput.trim();
        if (!code) {
            setCodeError('Введите код лицевого счёта.');
            return;
        }
        if (!token) {
            setCodeError('Сессия завершена. Войдите снова.');
            return;
        }

        const currentSearch = ++searchId.current;
        setSearchingCode(true);
        setFoundLic(null);
        setCodeError('');
        try {
            const res = await getLic(token, code);
            if (currentSearch !== searchId.current) return;
            const data = res.data;

            if (res.ok && data?.id !== undefined && data?.id !== null) {
                setFoundLic({
                    id: String(data.id),
                    code: String(data.code || code),
                    name: data.name || data.applicant || '',
                    address: typeof data.address === 'string' ? data.address : (data.address?.address || ''),
                });
            } else {
                setCodeError(res?.message || 'Лицевой счёт не найден. Проверьте код и попробуйте снова.');
            }
        } catch {
            if (currentSearch === searchId.current) setCodeError('Не удалось выполнить поиск. Проверьте соединение и попробуйте снова.');
        } finally {
            if (currentSearch === searchId.current) setSearchingCode(false);
        }
    }, [codeInput, token]);

    const handleAdd = useCallback(async () => {
        if (!foundLic || addingLic) return;
        setAddingLic(true);
        setCodeError('');
        try {
            const added = await onSelect({
                type: 'lics',
                name: foundLic.code,
                id: foundLic.id,
                address: foundLic.address || '',
                applicant: foundLic.name || '',
                fio: foundLic.name || '',
            });
            if (added === false) setCodeError('Не удалось добавить лицевой счёт. Повторите попытку.');
            else onClose();
        } catch {
            setCodeError('Не удалось добавить лицевой счёт. Проверьте соединение.');
        } finally {
            setAddingLic(false);
        }
    }, [foundLic, addingLic, onSelect, onClose]);

    const addressTrail = [selected.ulus, selected.settle, selected.street, selected.house, selected.kv]
        .filter(Boolean).map((item) => item!.name).join(' → ');

    const handleAddressSelect = useCallback((item: DropdownOption) => {
        setFoundLic(null);
        setCodeError('');
        switch (item.type) {
            case 'ulus':
                setSelected({ ulus: item });
                loadSettlements(item.items || []);
                break;
            case 'settle':
                setSelected((current) => ({ ulus: current.ulus, settle: item }));
                void loadStreets(String(item.id));
                break;
            case 'street':
                setSelected((current) => ({ ulus: current.ulus, settle: current.settle, street: item }));
                void loadHouses(String(item.id));
                break;
            case 'house':
            case 'build':
                setSelected((current) => ({ ulus: current.ulus, settle: current.settle, street: current.street, house: item }));
                if (item.type === 'house') loadLics(item.items || []);
                else loadKv(item.items || []);
                break;
            case 'kv':
                setSelected((current) => ({ ...current, kv: item }));
                loadLics(item.items || []);
                break;
        }
    }, [loadSettlements, loadStreets, loadHouses, loadKv, loadLics]);

    const clearAddressFrom = useCallback((level: 'ulus' | 'settle' | 'street' | 'house' | 'kv') => {
        setFoundLic(null);
        setCodeError('');
        setSelected((current) => {
            if (level === 'ulus') return {};
            if (level === 'settle') return { ulus: current.ulus };
            if (level === 'street') return { ulus: current.ulus, settle: current.settle };
            if (level === 'house') return { ulus: current.ulus, settle: current.settle, street: current.street };
            return { ulus: current.ulus, settle: current.settle, street: current.street, house: current.house };
        });
    }, []);

    useEffect(() => {
        if (mode !== 'address' || lics.length !== 1 || !(selected.house?.type === 'house' || selected.kv)) return;
        const option = lics[0];
        const record = option.record || {};
        setFoundLic({
            id: String(record.id ?? option.id),
            code: String(record.code ?? option.name),
            name: record.name || record.applicant || record.fio || record.abonent || '',
            address: typeof record.address === 'string' ? record.address : (record.address?.address || addressTrail),
        });
    }, [mode, lics, selected.house, selected.kv, addressTrail]);

    const chooseAccount = (option: DropdownOption) => {
        const record = option.record || {};
        setCodeError('');
        setFoundLic({
            id: String(record.id ?? option.id),
            code: String(record.code ?? option.name),
            name: record.name || record.applicant || record.fio || record.abonent || '',
            address: typeof record.address === 'string' ? record.address : (record.address?.address || addressTrail),
        });
    };

    const revealInModal = useCallback((target: HTMLElement | null, alignTop = false) => {
        const scroller = contentRef.current;
        if (!scroller || !target) return;
        const area = scroller.getBoundingClientRect();
        const item = target.getBoundingClientRect();
        const gap = 24;
        const delta = alignTop
            ? item.top - area.top - gap
            : item.bottom > area.bottom - gap
                ? item.bottom - area.bottom + gap
                : item.top < area.top + gap ? item.top - area.top - gap : 0;
        if (Math.abs(delta) > 1) {
            scroller.scrollTo({
                top: scroller.scrollTop + delta,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            });
        }
    }, []);

    useEffect(() => {
        if (mode !== 'address' || !foundLic) return;
        const frame = requestAnimationFrame(() => revealInModal(resultRef.current));
        return () => cancelAnimationFrame(frame);
    }, [mode, foundLic, revealInModal]);

    useEffect(() => {
        if (mode !== 'address' || lics.length < 2 || !(selected.house?.type === 'house' || selected.kv)) return;
        const frame = requestAnimationFrame(() => revealInModal(accountsRef.current, true));
        return () => cancelAnimationFrame(frame);
    }, [mode, lics, selected.house, selected.kv, revealInModal]);

    const foundCard = foundLic ? (
        <div ref={resultRef} className="found-lic-card" aria-label="Найденный лицевой счёт">
            <div className="found-lic-heading"><IonIcon icon={checkmarkCircleOutline} /> Лицевой счёт найден</div>
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
                disabled={addingLic}
            >
                {addingLic ? <IonSpinner name="dots" /> : <IonIcon icon={addOutline} />}
                {addingLic ? 'Добавляем…' : 'Добавить лицевой счёт'}
            </button>
        </div>
    ) : null;

    return (
        <>
            
            <IonModal 
                isOpen={isOpen} 
                onDidDismiss={onClose}
                className={`find-lic-modal ${mode === 'address' ? 'find-lic-modal--address' : ''} ${contextClass || ''}`}
            >
                <div className="find-lics-header stng-modal-header">
                    <div className="find-lics-header-copy stng-header-stack">
                        <span className="find-lics-eyebrow stng-header-eyebrow">Лицевые счета</span>
                        <div className="find-lics-title stng-header-title">
                            <span>Поиск лицевого счёта</span>
                        </div>
                        {address && <div className="find-lics-address stng-header-context">{address}</div>}
                    </div>
                    <button type="button" onClick={onClose} className="find-lics-close stng-header-close" aria-label="Закрыть поиск">
                        <IonIcon icon={closeOutline} />
                    </button>
                </div>

                <div className="find-lics-tabs">
                    <button
                        type="button"
                        className={`find-lics-tab ${mode === 'code' ? 'active' : ''}`}
                        aria-pressed={mode === 'code'}
                        onClick={() => { setMode('code'); setFoundLic(null); setCodeError(''); }}
                    >
                        <IonIcon icon={keypadOutline} />
                        По коду
                    </button>
                    <button
                        type="button"
                        className={`find-lics-tab ${mode === 'address' ? 'active' : ''}`}
                        aria-pressed={mode === 'address'}
                        onClick={() => { searchId.current += 1; setSearchingCode(false); setMode('address'); setSelected({}); setFoundLic(null); setCodeError(''); }}
                    >
                        <IonIcon icon={locationOutline} />
                        По адресу
                    </button>
                </div>
                
                <div ref={contentRef} className={`find-lics-content ${mode === 'address' ? 'find-lics-content--address' : ''}`}>
                    {mode === 'code' ? (
                        <div className="find-by-code-layout">
                            <div className="find-by-code-main">
                                <p className="find-by-code-intro">Введите код с квитанции или карточки абонента, чтобы найти и добавить счёт.</p>
                                <form className="find-by-code-box" onSubmit={(event) => { event.preventDefault(); void handleSearchByCode(); }}>
                                <label className="find-by-code-label" htmlFor="find-lic-code">Код лицевого счёта</label>
                                <input
                                    id="find-lic-code"
                                    type="text"
                                    className="find-by-code-input"
                                    value={codeInput}
                                    onChange={(e) => {
                                        searchId.current += 1;
                                        setCodeInput(e.target.value);
                                        setFoundLic(null);
                                        setCodeError('');
                                        setSearchingCode(false);
                                    }}
                                    placeholder="Например, 12345678"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    aria-invalid={Boolean(codeError)}
                                    aria-describedby={codeError ? 'find-lic-error' : 'find-lic-hint'}
                                />
                                <span id="find-lic-hint" className="find-by-code-hint">Код можно ввести без пробелов по краям.</span>

                                <button
                                    type="submit"
                                    className="add-lic-action-btn find-by-code-submit"
                                    disabled={searchingCode || !codeInput.trim()}
                                >
                                    {searchingCode
                                        ? <IonSpinner name="dots" />
                                        : <IonIcon icon={searchOutline} />}
                                    {searchingCode ? 'Ищем счёт…' : 'Найти лицевой счёт'}
                                </button>
                                </form>

                                {searchingCode && <div className="find-by-code-status" role="status">Проверяем код лицевого счёта…</div>}
                                {codeError && <div id="find-lic-error" className="find-by-code-error" role="alert">{codeError}</div>}

                                {foundCard}
                            </div>
                            <div className="find-by-code-art" aria-hidden="true">
                                <img src="/assets/home/home-action-accounts.webp" alt="" />
                            </div>
                        </div>
                    ) : (
                        <div className="find-by-address-layout">
                            <div className="info-crumb-box">
                                <IonIcon icon={locationOutline} className="info-crumb-icon" />
                                <span>{addressTrail || 'Выберите район или улус'}</span>
                            </div>

                            <div className="lics-level-container">
                                <label className="lics-level-label">Район / Улус</label>
                                <DropdownFilter label="Район / Улус" options={uluses} selected={selected.ulus}
                                    onSelect={handleAddressSelect} onClear={() => clearAddressFrom('ulus')}
                                    loading={loading === 'ulus'} disabled={loading === 'ulus'}
                                    placeholder={loading === 'ulus' ? 'Загружаем районы…' : 'Выберите район или улус'} />
                                {error === 'ulus' && <div className="address-level-error" role="alert">Не удалось загрузить список. <button type="button" onClick={() => void loadUluses()}>Повторить</button></div>}
                                {loadedUluses && !error && !uluses.length && <div className="address-level-empty">Ничего не найдено</div>}
                            </div>

                            <div className="lics-level-container">
                                <label className="lics-level-label">Населённый пункт</label>
                                <DropdownFilter label="Населённый пункт" options={settlements} selected={selected.settle}
                                    onSelect={handleAddressSelect} onClear={() => clearAddressFrom('settle')}
                                    disabled={!selected.ulus} placeholder="Выберите населённый пункт" />
                                {selected.ulus && !settlements.length && <div className="address-level-empty">Ничего не найдено</div>}
                            </div>

                            <div className="lics-level-container">
                                <label className="lics-level-label">Улица</label>
                                <DropdownFilter label="Улица" options={streets} selected={selected.street}
                                    onSelect={handleAddressSelect} onClear={() => clearAddressFrom('street')}
                                    loading={loading === 'street'} disabled={!selected.settle || loading === 'street'}
                                    placeholder={loading === 'street' ? 'Загружаем улицы…' : 'Выберите улицу'} />
                                {error === 'street' && <div className="address-level-error" role="alert">Не удалось загрузить список. <button type="button" onClick={() => selected.settle && void loadStreets(String(selected.settle.id))}>Повторить</button></div>}
                                {selected.settle && loadedStreets && !error && !streets.length && <div className="address-level-empty">Ничего не найдено</div>}
                            </div>

                            <div className="lics-level-container">
                                <label className="lics-level-label">Дом</label>
                                <DropdownFilter label="Дом" options={houses} selected={selected.house}
                                    onSelect={handleAddressSelect} onClear={() => clearAddressFrom('house')}
                                    loading={loading === 'house'} disabled={!selected.street || loading === 'house'}
                                    placeholder={loading === 'house' ? 'Загружаем дома…' : 'Выберите дом'} />
                                {error === 'house' && <div className="address-level-error" role="alert">Не удалось загрузить список. <button type="button" onClick={() => selected.street && void loadHouses(String(selected.street.id))}>Повторить</button></div>}
                                {selected.street && loadedHouses && !error && !houses.length && <div className="address-level-empty">Ничего не найдено</div>}
                            </div>

                            {selected.house?.type === 'build' && <div className="lics-level-container">
                                <label className="lics-level-label">Квартира</label>
                                <DropdownFilter label="Квартира" options={kv} selected={selected.kv}
                                    onSelect={handleAddressSelect} onClear={() => clearAddressFrom('kv')}
                                    placeholder="Выберите квартиру" />
                                {!kv.length && <div className="address-level-empty">Ничего не найдено</div>}
                            </div>}

                            {((selected.house?.type === 'house') || selected.kv) && !lics.length && <div className="address-level-empty address-result-empty">По этому адресу лицевые счета не найдены.</div>}
                            {lics.length > 1 && (selected.house?.type === 'house' || selected.kv) && <div ref={accountsRef} className="address-accounts">
                                <h3>Лицевые счета по адресу</h3>
                                {lics.map((option) => <button type="button" key={String(option.id)} className="address-account-option" onClick={() => chooseAccount(option)}>
                                    <span>{option.name}</span>
                                    {option.record?.name && <small>{option.record.name}</small>}
                                </button>)}
                            </div>}
                            {codeError && <div className="find-by-code-error" role="alert">{codeError}</div>}
                            {foundCard}
                        </div>
                    )}
                </div>
            </IonModal>
        </>
    );
};

export default React.memo( FindLics );
