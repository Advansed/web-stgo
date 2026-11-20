import React, { useState, useCallback, useEffect, useRef } from 'react';
import { IonModal, IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline, searchOutline, locationOutline, keypadOutline, addOutline, personOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useAddressSearch } from './useFindLics';
import type { DropdownOption } from './useFindLics';
import { FoundLicByAddress, getLic } from '../../../../Store/api';
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
        plotOptions, selectedPlot, plotsLoading, plotsError, setPlot,
        address: addressQuery, setAddress, results, searching, searchError, searched, loadPlots,
    } = useAddressSearch(isOpen && mode === 'address');

    const { token } = useToken();

    const [codeInput, setCodeInput] = useState('');
    const [searchingCode, setSearchingCode] = useState(false);
    const [openingCode, setOpeningCode] = useState('');
    const [addingLic, setAddingLic] = useState(false);
    const [codeError, setCodeError] = useState('');
    const [foundLic, setFoundLic] = useState<FoundLic | null>(null);
    const searchId = useRef(0);
    const openId = useRef(0);
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
            setOpeningCode('');
            openId.current += 1;
            setAddingLic(false);
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

    const chooseHit = useCallback(async (hit: FoundLicByAddress) => {
        if (!token) {
            setCodeError('Сессия завершена. Войдите снова.');
            return;
        }
        const current = ++openId.current;
        setOpeningCode(hit.code);
        setFoundLic(null);
        setCodeError('');
        try {
            const res = await getLic(token, hit.code);
            if (current !== openId.current) return;
            const data = res.data;
            if (res.ok && data?.id !== undefined && data?.id !== null) {
                const recordAddress = typeof data.address === 'string' ? data.address : (data.address?.address || '');
                setFoundLic({
                    id: String(data.id),
                    code: String(data.code || hit.code),
                    name: data.name || data.applicant || '',
                    address: recordAddress || hit.address_go,
                });
            } else {
                setCodeError(res?.message || 'Лицевой счёт не найден. Проверьте код и попробуйте снова.');
            }
        } catch {
            if (current === openId.current) setCodeError('Не удалось открыть лицевой счёт. Проверьте соединение.');
        } finally {
            if (current === openId.current) setOpeningCode('');
        }
    }, [token]);

    const selectPlot = (item: DropdownOption) => {
        setPlot(String(item.name));
        setFoundLic(null);
        setCodeError('');
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
        if (mode !== 'address' || results.length < 1) return;
        const frame = requestAnimationFrame(() => revealInModal(accountsRef.current, true));
        return () => cancelAnimationFrame(frame);
    }, [mode, results, revealInModal]);

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
                        onClick={() => { searchId.current += 1; openId.current += 1; setSearchingCode(false); setOpeningCode(''); setMode('address'); setFoundLic(null); setCodeError(''); }}
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
                                <span>{[selectedPlot?.name, addressQuery.trim()].filter(Boolean).join(' · ') || 'Выберите участок и введите адрес'}</span>
                            </div>

                            <div className="lics-level-container">
                                <label className="lics-level-label">Участок</label>
                                <DropdownFilter label="Участок" options={plotOptions} selected={selectedPlot}
                                    onSelect={selectPlot} onClear={() => { setPlot(''); setFoundLic(null); setCodeError(''); }}
                                    loading={plotsLoading} disabled={plotsLoading}
                                    placeholder={plotsLoading ? 'Загружаем участки…' : 'Выберите участок'} />
                                {plotsError && <div className="address-level-error" role="alert">Не удалось загрузить участки. <button type="button" onClick={() => void loadPlots()}>Повторить</button></div>}
                                {!plotsLoading && !plotsError && !plotOptions.length && <div className="address-level-empty">Участки не найдены</div>}
                            </div>

                            <div className="lics-level-container">
                                <label className="lics-level-label" htmlFor="find-lic-address">Адрес</label>
                                <input
                                    id="find-lic-address"
                                    type="search"
                                    className="find-by-code-input"
                                    value={addressQuery}
                                    onChange={(event) => { setAddress(event.target.value); setFoundLic(null); setCodeError(''); }}
                                    placeholder="Например, Ленина 154 7"
                                    autoComplete="off"
                                    disabled={!selectedPlot}
                                />
                            </div>

                            {searching && <div className="find-by-code-status" role="status">Ищем лицевые счета…</div>}
                            {searchError && <div className="address-level-error" role="alert">Не удалось выполнить поиск. Измените адрес и попробуйте снова.</div>}
                            {searched && !searching && !searchError && !results.length && <div className="address-level-empty address-result-empty">По этому адресу лицевые счета не найдены.</div>}
                            {results.length > 0 && <div ref={accountsRef} className="address-accounts">
                                <h3>Лицевые счета по адресу</h3>
                                {results.map((hit, index) => <button type="button" key={`${hit.code}#${index}`} className="address-account-option" onClick={() => void chooseHit(hit)} disabled={openingCode === hit.code}>
                                    <span>{hit.code}</span>
                                    {hit.address_go && <small>{hit.address_go}</small>}
                                </button>)}
                            </div>}
                            {openingCode && <div className="find-by-code-status" role="status">Открываем лицевой счёт…</div>}
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
