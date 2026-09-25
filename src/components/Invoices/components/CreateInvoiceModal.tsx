import React, { useMemo, useState, useEffect } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  constructOutline,
  closeOutline,
  searchOutline,
  locationOutline,
  personOutline,
  callOutline,
  briefcaseOutline,
  folderOpenOutline,
  documentTextOutline,
  chatbubbleOutline,
  calendarOutline,
  checkmarkDoneOutline,
  chevronDownOutline,
} from 'ionicons/icons';

import { getLic, getWorks, getWorkTypes, WorkType, WorkKind } from '../../../Store/api';
import { saveInvoice } from '../../../Store/invoiceStore';
import { useToken } from '../../../Store/loginStore';
import { useLicsStore } from '../../../Store/licsStore';
import { useToast } from '../../Toast';
import { getDisplayAddress } from '../../../utils/format';

import { AddressSuggestions } from 'react-dadata';
import type { DaDataAddressSuggestion } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';

import FindLics from '../../Lics/components/FindLic/FindLics';

import './CreateInvoiceModal.css';

const DADATA_TOKEN = '50bfb3453a528d091723900fdae5ca5a30369832';

const toCoord = (raw: any): number => {
  if (raw == null || raw === '') return 0;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const coordsFromSuggestion = (suggestion?: DaDataAddressSuggestion | null) => {
  const data: any = suggestion?.data || {};
  return {
    lat: toCoord(data.geo_lat ?? data.lat ?? data.latitude),
    lon: toCoord(data.geo_lon ?? data.lon ?? data.longitude ?? data.lng),
  };
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workers: any[];
  invoice?: any | null;
  onCreated?: () => void;
  onSaved?: () => void;
};

const STATUSES = ['Новый', 'Назначен', 'В работе', 'Отложен', 'Завершен'] as const;

const newWorkId = () =>
  (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;

const vatFromSum = (sum: number) =>
  Math.round((Number(sum) || 0) * 22 / 122 * 100) / 100;

const money = (n: number) =>
  Number(n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const equipLabel = (eq: any) =>
  String(eq?.model || eq?.name || eq?.number || eq?.code || '').trim();

const parseEquipments = (raw: any) => {
  let list = raw;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return list.filter((eq) => eq && (eq.id || eq.model || eq.name || eq.number || eq.type));
};

const toWorkPayload = (row: any) => ({
  id: String(row.id || ''),
  equip_id: String(row.equip_id || ''),
  work_id: String(row.work_id || ''),
  work: String(row.work || ''),
  equipment: String(row.equipment || ''),
  amount: Number(row.amount) || 1,
  price: Number(row.price) || 0,
  sum: Number(row.sum) || 0,
  sum_vat: Number(row.sum_vat) || 0,
});

const makeWorkRow = (eq: any, workType?: WorkType | null) => {
  const amount = Number(eq.amount) > 0 ? Number(eq.amount) : 1;
  const basePrice = Number(eq.tarif ?? eq.price) || 0;
  const price = Number(workType?.price) || basePrice;
  const sum = Math.round(amount * price * 100) / 100;
  return {
    id: newWorkId(),
    equip_id: String(eq.id || eq.equip_id || ''),
    work_id: workType?.id || '',
    work: workType?.name || '',
    equipment: equipLabel(eq),
    amount,
    price,
    basePrice,
    sum,
    sum_vat: vatFromSum(sum),
  };
};

const matchesQuery = (query: string, ...parts: any[]) => {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const hay = parts.map((p) => String(p || '').toLowerCase()).join(' ');
  return q.split(/\s+/).every((word) => hay.includes(word));
};

const statusPillClass = (st: string, active: boolean) => {
  if (!active) return 'statusPill';
  if (st === 'Назначен') return 'statusPill statusPillAssigned';
  if (st === 'В работе') return 'statusPill statusPillWork';
  if (st === 'Отложен') return 'statusPill statusPillHold';
  if (st === 'Завершен') return 'statusPill statusPillDone';
  return 'statusPill statusPillActive';
};

const mapInvoiceWorks = (raw: any) => {
  let list = raw;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return list.map((w: any) => {
    const amount = Number(w.amount) > 0 ? Number(w.amount) : 1;
    const price = Number(w.price) || 0;
    const sum = Number(w.sum) || Math.round(amount * price * 100) / 100;
    return {
      id: String(w.id || newWorkId()),
      equip_id: String(w.equip_id || w.equipment_id || ''),
      work_id: String(w.work_id || ''),
      work: String(w.work || ''),
      equipment: String(w.equipment || '').trim(),
      amount,
      price,
      basePrice: price,
      sum,
      sum_vat: Number(w.sum_vat) || vatFromSum(sum),
    };
  });
};

const addrFromInvoice = (inv: any) => {
  if (typeof inv?.address === 'string') return inv.address;
  if (inv?.address && typeof inv.address === 'object') {
    return String(inv.address.address || inv.address.value || '');
  }
  return String(inv?.Адрес || '');
};

const toDateInputValue = (raw?: string) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return '';
};

const fromDateInputValue = (value: string) => {
  if (!value) return '';
  return `${value}T00:00:00`;
};

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  workers,
  invoice = null,
  onCreated,
  onSaved,
}: Props) {
  const toast = useToast();
  const { token } = useToken();
  const isEdit = !!(invoice?.id || invoice?.Ссылка);

  const [loading, setLoading] = useState(false);
  const [pickLicOpen, setPickLicOpen] = useState(false);

  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [lic, setLic] = useState<{ id: string; code: string; name: string } | null>(null);
  const [applicant, setApplicant] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<string>('');
  const [addressLat, setAddressLat] = useState(0);
  const [addressLon, setAddressLon] = useState(0);
  const [addressSuggest, setAddressSuggest] = useState<DaDataAddressSuggestion | undefined>();
  const [addressWidgetKey, setAddressWidgetKey] = useState(0);
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [completeDate, setCompleteDate] = useState('');

  const [executorId, setExecutorId] = useState<string>('');
  const [status, setStatus] = useState<string>('Новый');
  const [priceWorks, setPriceWorks] = useState<WorkType[]>([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [workKinds, setWorkKinds] = useState<WorkKind[]>([]);
  const [workKindsLoading, setWorkKindsLoading] = useState(false);
  const [workKindId, setWorkKindId] = useState('');
  const [workKindName, setWorkKindName] = useState('');

  const [activePage, setActivePage] = useState<'header' | 'works'>('header');
  const [executorOpen, setExecutorOpen] = useState(false);
  const [workKindOpen, setWorkKindOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [invoiceWorks, setInvoiceWorks] = useState<any[]>([]);
  const [openWorkId, setOpenWorkId] = useState('');
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [priceSearch, setPriceSearch] = useState('');

  const selectedExecutor = useMemo(
    () => workers.find((w: any) => String(w.id) === executorId),
    [executorId, workers]
  );

  const selectedWorkKind = useMemo(() => {
    const fromList = workKinds.find((w) => String(w.id) === workKindId);
    if (fromList) return fromList;
    if (workKindId && workKindName) return { id: workKindId, name: workKindName };
    return null;
  }, [workKinds, workKindId, workKindName]);

  const statusOptions = useMemo(() => {
    if (status && !(STATUSES as readonly string[]).includes(status)) {
      return [...STATUSES, status];
    }
    return STATUSES as readonly string[];
  }, [status]);

  const reset = () => {
    setInvoiceId('');
    setInvoiceNumber('');
    setInvoiceDate('');
    setLic(null);
    setApplicant('');
    setPhone('');
    setAddress('');
    setAddressLat(0);
    setAddressLon(0);
    setAddressSuggest(undefined);
    setAddressWidgetKey((k) => k + 1);
    setDescription('');
    setComment('');
    setPlanDate('');
    setCompleteDate('');
    setExecutorId('');
    setWorkKindId('');
    setWorkKindName('');
    setStatus('Новый');
    setActivePage('header');
    setExecutorOpen(false);
    setWorkKindOpen(false);
    setSearchText('');
    setInvoiceWorks([]);
    setOpenWorkId('');
    setPriceListOpen(false);
    setPriceSearch('');
  };

  const applyAddress = (
    nextAddress: string,
    lat = 0,
    lon = 0,
    suggest?: DaDataAddressSuggestion,
    remount = false
  ) => {
    setAddress(nextAddress);
    setAddressLat(toCoord(lat));
    setAddressLon(toCoord(lon));
    setAddressSuggest(suggest);
    if (remount) setAddressWidgetKey((k) => k + 1);
  };

  const hydrateFromInvoice = (inv: any) => {
    const id = String(inv.id || inv.Ссылка || '');
    const licId = String(inv.lic_id || inv.Lic_id || '');
    const licCode = String(inv.lic || inv.ЛС || '').trim();
    const kindId = String(inv.work_type_id || inv.serv_id || inv.Serv_id || '').trim();
    const kindName = String(inv.work_type || inv.character || '').trim();
    const addr = addrFromInvoice(inv);
    setInvoiceId(id);
    setInvoiceNumber(String(inv.number || inv.Номер || '').trim());
    setInvoiceDate(String(inv.date || inv.Дата || '').trim());
    setLic(licId || licCode ? { id: licId, code: licCode, name: String(inv.applicant || '') } : null);
    setApplicant(String(inv.applicant || inv.Контрагент || '').trim());
    setPhone(String(inv.phone || inv.Телефон || '').trim());
    applyAddress(addr, toCoord(inv.lat), toCoord(inv.lon), undefined, true);
    setDescription(String(inv.description || inv.service || '').trim());
    setComment(String(inv.comment || inv.complete_text || inv.Комментарий || '').trim());
    setPlanDate(toDateInputValue(inv.plan_date));
    setCompleteDate(toDateInputValue(inv.complete_date));
    setExecutorId(String(inv.executor || inv.worker?.id || '').trim());
    setWorkKindId(kindId);
    setWorkKindName(kindName);
    setStatus(String(inv.status || inv.Статус || 'Новый'));
    setInvoiceWorks(mapInvoiceWorks(inv.works));
    setActivePage('header');
    setExecutorOpen(false);
    setWorkKindOpen(false);
    setSearchText('');
    setOpenWorkId('');
    setPriceListOpen(false);
    setPriceSearch('');
  };

  useEffect(() => {
    if (!isOpen) return;
    if (invoice?.id || invoice?.Ссылка) {
      hydrateFromInvoice(invoice);
    } else {
      reset();
    }
  }, [isOpen, invoice?.id, invoice?.Ссылка]);

  useEffect(() => {
    if (!isOpen || !token) return;

    let cancelled = false;
    setWorksLoading(true);
    setWorkKindsLoading(true);

    void getWorks(token)
      .then((res) => {
        if (cancelled) return;
        setPriceWorks(res.ok ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setPriceWorks([]);
      })
      .finally(() => {
        if (!cancelled) setWorksLoading(false);
      });

    void getWorkTypes(token)
      .then((res) => {
        if (cancelled) return;
        setWorkKinds(res.ok ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setWorkKinds([]);
      })
      .finally(() => {
        if (!cancelled) setWorkKindsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  useEffect(() => {
    if (!workKindId || workKindName) return;
    const found = workKinds.find((w) => String(w.id) === workKindId);
    if (found?.name) setWorkKindName(found.name);
  }, [workKinds, workKindId, workKindName]);

  const filteredWorkers = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return workers;
    return workers.filter((w: any) => String(w.name || '').toLowerCase().includes(q));
  }, [workers, searchText]);

  const filteredPriceWorks = useMemo(
    () => priceWorks.filter((work) => matchesQuery(priceSearch, work.name)),
    [priceWorks, priceSearch]
  );

  const patchWork = (id: string, patch: Record<string, any>) => {
    setInvoiceWorks((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        const amount = Number(next.amount) > 0 ? Number(next.amount) : 1;
        const price = Number(next.price) || 0;
        const sum = Math.round(amount * price * 100) / 100;
        return { ...next, amount, price, sum, sum_vat: vatFromSum(sum) };
      })
    );
  };

  const pickExecutor = (id: string) => {
    setExecutorId(id);
    setExecutorOpen(false);
    if (!id) {
      setStatus('Новый');
      return;
    }
    setStatus((prev) => (prev === 'Новый' || !prev ? 'Назначен' : prev));
  };

  const pickStatus = (next: string) => {
    setStatus(next);
    if (next === 'Новый' && executorId) {
      setExecutorId('');
    }
  };

  const closeAll = () => {
    setPickLicOpen(false);
    setLoading(false);
    onClose();
  };

  const applyLicData = (licId: string, licCode: string, data: {
    applicant?: string;
    address?: string;
    phone?: string;
    equipments?: any[];
  }) => {
    const applicantName = data.applicant?.trim() || '';
    const licAddress = data.address?.trim() || '';

    setLic({ id: licId, code: licCode, name: applicantName });
    if (applicantName) setApplicant(applicantName);
    if (licAddress) applyAddress(licAddress, 0, 0, undefined, true);
    if (data.phone) setPhone(String(data.phone));
    const list = parseEquipments(data.equipments || []);
    setInvoiceWorks(list.map((eq) => makeWorkRow(eq)));
    setOpenWorkId('');
    setPriceListOpen(false);
    setPriceSearch('');
    if (list.length > 0) setActivePage('works');
  };

  const handlePickLic = (licItem: any) => {
    if (isEdit) return;
    if (!token) {
      toast.error('Нет token — перелогинься');
      return;
    }
    if (licItem?.type !== 'lics') return;

    const licId = String(licItem.id || '');
    const licCode = String(licItem.name || '');
    if (!licId || !licCode) {
      toast.error('Не удалось прочитать ЛС');
      return;
    }

    const pickedAddress = getDisplayAddress(licItem.address);
    const pickedApplicant = String(licItem.applicant || licItem.fio || '').trim();

    const finishPick = (data: {
      applicant?: string;
      address?: string;
      phone?: string;
      equipments?: any[];
    }) => {
      applyLicData(licId, licCode, data);
      void useLicsStore.getState().addLic(token, licCode, licId);
      setPickLicOpen(false);
      toast.success('Лицевой счет выбран');
    };

    void getLic(token, licCode)
      .then((res) => {
        const data = res.data;
        if (res.ok && data) {
          finishPick({
            applicant: data.name || data.applicant || pickedApplicant,
            address:
              (getDisplayAddress(data.address) !== 'Адрес не указан' && getDisplayAddress(data.address))
              || (pickedAddress !== 'Адрес не указан' ? pickedAddress : ''),
            phone: data.phone,
            equipments: data.equipments,
          });
        } else {
          finishPick({ applicant: pickedApplicant, address: pickedAddress });
        }
      })
      .catch(() => {
        finishPick({ applicant: pickedApplicant, address: pickedAddress });
      });
  };

  const handleSave = async () => {
    if (!token) return toast.error('Нет token — перелогинься');
    if (!lic?.id) {
      setActivePage('header');
      return toast.warning('Выберите лицевой счет');
    }
    if (!address.trim()) {
      setActivePage('header');
      return toast.warning('Не указан адрес');
    }
    if (!applicant.trim()) {
      setActivePage('header');
      return toast.warning('Не указан заявитель');
    }
    const worksPayload = invoiceWorks.filter((row) => row.work_id).map(toWorkPayload);
    if (worksPayload.length === 0) {
      setActivePage('works');
      return toast.warning('Выберите прейскурант хотя бы для одного оборудования');
    }

    const id = isEdit
      ? invoiceId
      : ((crypto as any)?.randomUUID ? (crypto as any).randomUUID() : String(Date.now()));

    const invoiceDraft = {
      id,
      lic_id: lic.id,
      number: isEdit ? invoiceNumber : '',
      date: isEdit ? invoiceDate : '',
      applicant: applicant.trim(),
      phone: phone.trim(),
      address: address.trim(),
      lat: addressLat,
      lon: addressLon,
      lic: lic.code,
      description: description.trim(),
      comment: comment.trim(),
      plan_date: fromDateInputValue(planDate),
      complete_date: fromDateInputValue(completeDate),
      status: status || 'Новый',
      executor: selectedExecutor?.id || '',
      work_type_id: selectedWorkKind?.id || workKindId || '',
      work_type: selectedWorkKind?.name || workKindName || '',
      serv_id: selectedWorkKind?.id || workKindId || '',
      works: worksPayload,
    };

    setLoading(true);
    try {
      const res = await saveInvoice(invoiceDraft, token, {
        executor: selectedExecutor?.id || null,
        description: description.trim(),
        comment: comment.trim(),
        address: address.trim(),
        lat: addressLat,
        lon: addressLon,
        plan_date: fromDateInputValue(planDate),
        complete_date: fromDateInputValue(completeDate),
        status: status || 'Новый',
        work_type_id: selectedWorkKind?.id || workKindId || '',
        work_type: selectedWorkKind?.name || workKindName || '',
        serv_id: selectedWorkKind?.id || workKindId || '',
        works: worksPayload,
      });

      if (res?.success) {
        toast.success(res?.message || 'Данные успешно сохранены');
        if (!isEdit) reset();
        closeAll();
        if (isEdit) onSaved?.();
        else onCreated?.();
      } else {
        toast.error(res?.message || (isEdit ? 'Ошибка сохранения' : 'Ошибка создания'));
      }
    } catch {
      toast.error(isEdit ? 'Ошибка сети при сохранении' : 'Ошибка сети при создании');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = isEdit
    ? (invoiceNumber ? `Заявка №${invoiceNumber}` : 'Заявка')
    : 'Новая заявка';

  return (
    <>
      <div className="modalOverlay" onClick={closeAll}>
        <div className="modalContent" onClick={(e) => e.stopPropagation()}>
          <div className="create-invoice-modal__toolbar">
            <div className="create-invoice-modal__titleBlock">
              <div className="create-invoice-modal__title">{title}</div>
              {isEdit && invoiceDate && (
                <div className="create-invoice-modal__subtitle">{invoiceDate}</div>
              )}
            </div>
            <button type="button" className="close-btn" onClick={closeAll}>
              <IonIcon icon={closeOutline} />
            </button>
          </div>

          <div className="create-invoice-modal__tabs">
            <button
              type="button"
              className={`create-invoice-modal__tab ${activePage === 'header' ? 'create-invoice-modal__tabActive' : ''}`}
              onClick={() => {
                setActivePage('header');
                setOpenWorkId('');
                setPriceListOpen(false);
              }}
            >
              Лицевая
            </button>
            <button
              type="button"
              className={`create-invoice-modal__tab ${activePage === 'works' ? 'create-invoice-modal__tabActive' : ''}`}
              onClick={() => {
                setActivePage('works');
                setExecutorOpen(false);
                setWorkKindOpen(false);
              }}
            >
              Табличная
              {invoiceWorks.length > 0 && (
                <span className="create-invoice-modal__tabBadge">{invoiceWorks.length}</span>
              )}
            </button>
          </div>

          <div className="create-invoice-modal__body">
            {activePage === 'header' && (
              <>
                <div className="fieldGrid fieldGrid2">
                  {isEdit ? (
                    <div className="fieldRow">
                      <div className="iconBox bgPurple"><IonIcon icon={folderOpenOutline} /></div>
                      <div className="fieldBody">
                        <div className="fieldLabel">Лицевой счет</div>
                        <div className={`fieldValue ${lic?.code ? '' : 'fieldValueMuted'}`}>
                          {lic?.code || 'Не указан'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="fieldRow fieldRowClick"
                      onClick={() => setPickLicOpen(true)}
                    >
                      <div className="iconBox bgPurple"><IonIcon icon={folderOpenOutline} /></div>
                      <div className="fieldBody">
                        <div className="fieldLabel">Лицевой счет</div>
                        <div className={`fieldValue ${lic?.code ? '' : 'fieldValueMuted'}`}>
                          {lic?.code || 'Выберите лицевой счет'}
                        </div>
                      </div>
                      <IonIcon icon={searchOutline} className="fieldAction" />
                    </button>
                  )}

                  <div className="fieldRow">
                    <div className="iconBox bgBlue"><IonIcon icon={documentTextOutline} /></div>
                    <div className="fieldBody">
                      <div className="fieldLabel">Статус</div>
                      <div className="statusPills statusPillsWrap">
                        {statusOptions.map((st) => (
                          <button
                            key={st}
                            type="button"
                            className={statusPillClass(st, status === st)}
                            onClick={() => pickStatus(st)}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="fieldRow fieldRowTop addressField">
                  <div className="iconBox bgRed"><IonIcon icon={locationOutline} /></div>
                  <div className="fieldBody">
                    <div className="fieldLabel">Адрес</div>
                    <div className="addressSuggest">
                      <AddressSuggestions
                        key={addressWidgetKey}
                        token={DADATA_TOKEN}
                        defaultQuery={address}
                        value={addressSuggest}
                        onChange={(suggestion) => {
                          if (!suggestion) {
                            applyAddress(address, 0, 0, undefined);
                            return;
                          }
                          const { lat, lon } = coordsFromSuggestion(suggestion);
                          applyAddress(suggestion.value || '', lat, lon, suggestion);
                        }}
                        inputProps={{
                          placeholder: 'Начните вводить адрес…',
                          className: 'addressSuggestInput',
                          onChange: (e) => {
                            const next = (e.target as HTMLInputElement).value;
                            setAddress(next);
                            if (!next.trim()) {
                              setAddressSuggest(undefined);
                              setAddressLat(0);
                              setAddressLon(0);
                            }
                          },
                        }}
                      />
                    </div>
                    {(addressLat !== 0 || addressLon !== 0) && (
                      <div className="addressCoords">
                        lat: {addressLat.toFixed(6)} · lon: {addressLon.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="fieldGrid fieldGrid2">
                  <div className="fieldRow">
                    <div className="iconBox bgGreen"><IonIcon icon={callOutline} /></div>
                    <div className="fieldBody">
                      <div className="fieldLabel">Телефон</div>
                      <input
                        className="fieldInput"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Номер телефона"
                        type="tel"
                      />
                    </div>
                  </div>

                  <div className="executorField">
                    <button
                      type="button"
                      className="fieldRow fieldRowClick executorToggle"
                      onClick={() => {
                        setWorkKindOpen((v) => !v);
                        setExecutorOpen(false);
                        setOpenWorkId('');
                        setPriceListOpen(false);
                      }}
                    >
                      <div className="iconBox bgOrange"><IonIcon icon={constructOutline} /></div>
                      <div className="fieldBody">
                        <div className="fieldLabel">Вид работ</div>
                        <div className={`fieldValue ${selectedWorkKind ? '' : 'fieldValueMuted'}`}>
                          {workKindsLoading
                            ? 'Загрузка…'
                            : (selectedWorkKind?.name || 'Выберите вид работ')}
                        </div>
                      </div>
                      {workKindsLoading
                        ? <IonSpinner name="dots" />
                        : <IonIcon icon={chevronDownOutline} className={`fieldChevron ${workKindOpen ? 'fieldChevronOpen' : ''}`} />}
                    </button>

                    {workKindOpen && (
                      <div className="workKindDropdown">
                        <button
                          type="button"
                          className={`workKindOption ${!workKindId ? 'workKindOptionActive' : ''}`}
                          onClick={() => {
                            setWorkKindId('');
                            setWorkKindName('');
                            setWorkKindOpen(false);
                          }}
                        >
                          <span className="workKindOptionMark" />
                          <span className="workKindOptionName">Не выбран</span>
                        </button>

                        {workKinds.length === 0 ? (
                          <div className="emptyState">Виды работ не загружены</div>
                        ) : workKinds.map((kind) => (
                          <button
                            key={kind.id}
                            type="button"
                            className={`workKindOption ${String(kind.id) === workKindId ? 'workKindOptionActive' : ''}`}
                            onClick={() => {
                              setWorkKindId(kind.id);
                              setWorkKindName(kind.name);
                              setWorkKindOpen(false);
                            }}
                          >
                            <span className="workKindOptionMark" />
                            <span className="workKindOptionName">{kind.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="fieldGrid fieldGrid2">
                  <div className="fieldRow">
                    <div className="iconBox bgBlue"><IonIcon icon={personOutline} /></div>
                    <div className="fieldBody">
                      <div className="fieldLabel">Заявитель</div>
                      <input
                        className="fieldInput"
                        value={applicant}
                        onChange={(e) => setApplicant(e.target.value)}
                        placeholder="ФИО заявителя"
                      />
                    </div>
                  </div>

                  <div className="executorField">
                    <button
                      type="button"
                      className="fieldRow fieldRowClick executorToggle"
                      onClick={() => {
                        setExecutorOpen((v) => !v);
                        setWorkKindOpen(false);
                        setOpenWorkId('');
                        setPriceListOpen(false);
                      }}
                    >
                      <div className="iconBox bgDark"><IonIcon icon={briefcaseOutline} /></div>
                      <div className="fieldBody">
                        <div className="fieldLabel">Исполнитель</div>
                        <div className={`fieldValue ${selectedExecutor ? '' : 'fieldValueMuted'}`}>
                          {selectedExecutor?.name || 'Не назначать'}
                        </div>
                      </div>
                      <IonIcon icon={chevronDownOutline} className={`fieldChevron ${executorOpen ? 'fieldChevronOpen' : ''}`} />
                    </button>

                    {executorOpen && (
                      <div className="workersDropdown">
                        <div className="searchWrap">
                          <IonIcon icon={searchOutline} />
                          <input
                            className="searchInput"
                            placeholder="Поиск сотрудника…"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                          />
                        </div>

                        <button
                          type="button"
                          className={`workerOption ${!executorId ? 'workerOptionActive' : ''}`}
                          onClick={() => pickExecutor('')}
                        >
                          <span className="workerOptionName">Не назначать</span>
                        </button>

                        {filteredWorkers.length === 0 ? (
                          <div className="emptyState">Нет сотрудников</div>
                        ) : filteredWorkers.map((worker: any) => (
                          <button
                            key={worker.id}
                            type="button"
                            className={`workerOption ${String(worker.id) === executorId ? 'workerOptionActive' : ''}`}
                            onClick={() => pickExecutor(worker.id)}
                          >
                            <span className="workerOptionName">{worker.name || 'Без имени'}</span>
                            <span className="workerOptionRole">{worker.role || 'Сотрудник'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="fieldGrid fieldGrid2">
                  <div className="fieldRow">
                    <div className="iconBox bgBlue"><IonIcon icon={calendarOutline} /></div>
                    <div className="fieldBody">
                      <div className="fieldLabel">Планируемая дата</div>
                      <input
                        className="fieldInput"
                        type="date"
                        value={planDate}
                        onChange={(e) => setPlanDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="fieldRow">
                    <div className="iconBox bgGreen"><IonIcon icon={checkmarkDoneOutline} /></div>
                    <div className="fieldBody">
                      <div className="fieldLabel">Дата выполнения</div>
                      <input
                        className="fieldInput"
                        type="date"
                        value={completeDate}
                        onChange={(e) => setCompleteDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="fieldRow fieldRowTop">
                  <div className="iconBox bgOrange"><IonIcon icon={documentTextOutline} /></div>
                  <div className="fieldBody">
                    <div className="fieldLabel">Описание работ</div>
                    <textarea
                      className="fieldTextarea"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Что нужно выполнить"
                    />
                  </div>
                </div>

                <div className="fieldRow fieldRowTop">
                  <div className="iconBox bgDark"><IonIcon icon={chatbubbleOutline} /></div>
                  <div className="fieldBody">
                    <div className="fieldLabel">Комментарий</div>
                    <textarea
                      className="fieldTextarea"
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Комментарий к заявке"
                    />
                  </div>
                </div>
              </>
            )}

            {activePage === 'works' && (
              <div className="worksSection">
                <div className="worksSectionHeader">
                  <div className="worksSectionTitle">Оборудование и работы</div>
                  {invoiceWorks.length > 0 && (
                    <span className="worksSectionCount">{invoiceWorks.length}</span>
                  )}
                </div>

                {invoiceWorks.length === 0 ? (
                  <div className="emptyState emptyStateLarge">
                    {lic?.code
                      ? 'У выбранного лицевого счёта нет оборудования'
                      : isEdit
                        ? 'В заявке нет строк оборудования'
                        : 'Сначала выберите лицевой счёт на странице «Лицевая»'}
                  </div>
                ) : (
                  <div className="worksCards">
                    {invoiceWorks.map((row) => {
                      const isOpenRow = openWorkId === row.id;
                      return (
                        <div key={row.id} className={`workCard ${isOpenRow ? 'workCardOpen' : ''} ${row.work_id ? 'workCardReady' : ''}`}>
                          <div className="workCardTop">
                            <div className="iconBox bgOrange"><IonIcon icon={constructOutline} /></div>
                            <div className="fieldBody">
                              <div className="fieldLabel">Оборудование</div>
                              <div className="fieldValue">{row.equipment || 'Без названия'}</div>
                            </div>
                            <button
                              type="button"
                              className="worksRemove"
                              title="Убрать"
                              onClick={() => {
                                setInvoiceWorks((prev) => prev.filter((w) => w.id !== row.id));
                                if (openWorkId === row.id) {
                                  setOpenWorkId('');
                                  setPriceListOpen(false);
                                }
                              }}
                            >
                              <IonIcon icon={closeOutline} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="workCardPriceBtn"
                            onClick={() => {
                              const nextOpen = isOpenRow ? '' : row.id;
                              setOpenWorkId(nextOpen);
                              setExecutorOpen(false);
                              setPriceListOpen(!!nextOpen);
                              setPriceSearch('');
                            }}
                          >
                            <div className="fieldBody">
                              <div className="fieldLabel">Прейскурант</div>
                              <div className={`fieldValue fieldValueWrap ${row.work ? '' : 'fieldValueMuted'}`}>
                                {worksLoading ? 'Загрузка…' : (row.work || 'Выберите работу')}
                              </div>
                            </div>
                            {worksLoading
                              ? <IonSpinner name="dots" />
                              : <IonIcon icon={chevronDownOutline} className={`fieldChevron ${isOpenRow && priceListOpen ? 'fieldChevronOpen' : ''}`} />}
                          </button>

                          {isOpenRow && priceListOpen && (
                            <div className="workList">
                              <div className="searchWrap">
                                <IonIcon icon={searchOutline} />
                                <input
                                  className="searchInput"
                                  autoFocus
                                  placeholder="Поиск по прейскуранту…"
                                  value={priceSearch}
                                  onChange={(e) => setPriceSearch(e.target.value)}
                                />
                              </div>
                              {filteredPriceWorks.length === 0 ? (
                                <div className="emptyState">{priceWorks.length === 0 ? 'Прейскурант пуст' : 'Ничего не найдено'}</div>
                              ) : filteredPriceWorks.map((work) => (
                                <button
                                  key={work.id}
                                  type="button"
                                  className={`workOption ${row.work_id === work.id ? 'workOptionActive' : ''}`}
                                  onClick={() => {
                                    patchWork(row.id, {
                                      work_id: work.id,
                                      work: work.name,
                                      price: Number(work.price) || row.basePrice || 0,
                                    });
                                    setPriceListOpen(false);
                                    setPriceSearch('');
                                    setOpenWorkId('');
                                  }}
                                >
                                  <span className="workOptionMark" />
                                  <span className="workOptionName">{work.name}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="workCardMeta">
                            <div className="workCardAmount">
                              <div className="fieldLabel">Кол-во</div>
                              <input
                                className="fieldInput"
                                type="number"
                                min={1}
                                step={1}
                                value={row.amount}
                                onChange={(e) => patchWork(row.id, { amount: Math.max(1, Number(e.target.value) || 1) })}
                              />
                            </div>
                            <div className="workCardSum">
                              <div className="fieldLabel">Сумма</div>
                              <div className="fieldValue">{money(row.sum)}</div>
                              <div className="workCardSumHint">{money(row.price)} × {row.amount}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="create-invoice-modal__footer">
            <div className="footer-buttons">
              <button
                type="button"
                className="action-btn cancel-btn"
                onClick={() => { if (!isEdit) reset(); closeAll(); }}
                disabled={loading}
              >
                {isEdit ? 'Закрыть' : 'Отмена'}
              </button>
              <button
                type="button"
                className="action-btn submit-btn"
                onClick={handleSave}
                disabled={loading}
              >
                {loading
                  ? (isEdit ? 'Сохраняю…' : 'Создаю…')
                  : (isEdit ? 'Сохранить' : 'Создать')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <FindLics
        isOpen={pickLicOpen}
        onClose={() => setPickLicOpen(false)}
        onSelect={handlePickLic}
      />
    </>
  );
}
