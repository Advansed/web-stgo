import React, { useMemo, useState, useEffect, useRef } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  constructOutline,
  closeOutline,
  searchOutline,
  chevronDownOutline,
  addOutline,
  trashOutline,
} from 'ionicons/icons';

import { getLic, getWorks, getWorkTypes, WorkType, WorkKind } from '../../../Store/api';
import { saveInvoice } from '../../../Store/invoiceStore';
import { useToken } from '../../../Store/loginStore';
import { useLicsStore } from '../../../Store/licsStore';
import { useToast } from '../../Toast';
import { getDisplayAddress } from '../../../utils/format';
import { formatDeadline, invoiceStatus, isInvoiceOverdue } from '../invoicePresentation';

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
  const basePrice = 0;
  const price = Number(workType?.price) || 0;
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
  const tone = st === 'Назначен' ? 'Assigned'
    : st === 'В работе' ? 'Work'
    : st === 'Отложен' ? 'Hold'
    : st === 'Завершен' ? 'Done'
    : 'New';
  return `statusPill statusPill${tone}${active ? ' statusPillSelected' : ''}`;
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
  const savingRef = useRef(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [workKindSearch, setWorkKindSearch] = useState('');
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
  const [accountEquipments, setAccountEquipments] = useState<any[]>([]);
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
    setAccountEquipments([]);
    setOpenWorkId('');
    setPriceListOpen(false);
    setPriceSearch('');
    setWorkKindSearch('');
    setValidationErrors({});
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
    const rows = mapInvoiceWorks(inv.works);
    const listedEquipment = parseEquipments(inv.equipments);
    const linkedEquipment = rows.filter((row) => row.equip_id || row.equipment)
      .map((row) => ({ id: row.equip_id, model: row.equipment }));
    setAccountEquipments(listedEquipment.length ? listedEquipment : linkedEquipment.filter(
      (eq, index, all) => all.findIndex((item) => String(item.id) === String(eq.id) && item.model === eq.model) === index
    ));
    setInvoiceWorks(rows);
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

  const addWork = () => {
    if (!lic?.id) return;
    const row = makeWorkRow(accountEquipments.length === 1 ? accountEquipments[0] : {});
    setInvoiceWorks((prev) => [...prev, row]);
    setOpenWorkId(row.id);
    setPriceListOpen(true);
    setPriceSearch('');
    setValidationErrors((prev) => ({ ...prev, works: '' }));
    requestAnimationFrame(() => {
      document.getElementById(`work-row-${row.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      document.getElementById(`work-search-${row.id}`)?.focus({ preventScroll: true });
    });
  };

  const removeWork = (id: string) => {
    setInvoiceWorks((prev) => prev.filter((row) => row.id !== id));
    if (openWorkId === id) {
      setOpenWorkId('');
      setPriceListOpen(false);
    }
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
    if (savingRef.current) return;
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
    setAccountEquipments(list);
    setInvoiceWorks([]);
    setOpenWorkId('');
    setPriceListOpen(false);
    setPriceSearch('');
    setActivePage('header');
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

  const focusInvalid = (field: string, page: 'header' | 'works' = 'header') => {
    setActivePage(page);
    requestAnimationFrame(() => {
      const id = field === 'works' ? 'new-invoice-works-tab' : 'new-invoice-' + field;
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus({ preventScroll: true });
    });
  };

  const handleSave = async () => {
    if (savingRef.current || loading) return;
    setValidationErrors({});
    if (!token) return toast.error('Нет token — перелогинься');
    if (!lic?.id) {
      setValidationErrors({ lic: 'В заявке не указан лицевой счёт' });
      focusInvalid('lic');
      return toast.warning('Выберите лицевой счет');
    }
    if (!address.trim()) {
      setValidationErrors({ address: 'Укажите адрес объекта' });
      focusInvalid('address');
      return toast.warning('Не указан адрес');
    }
    if (!applicant.trim()) {
      setValidationErrors({ applicant: 'Укажите заявителя' });
      focusInvalid('applicant');
      return toast.warning('Не указан заявитель');
    }
    const worksPayload = invoiceWorks.filter((row) => row.work_id).map(toWorkPayload);
    if (worksPayload.length === 0) {
      setValidationErrors({ works: 'Выберите хотя бы одну работу по прейскуранту' });
      focusInvalid('works', 'works');
      return toast.warning('Выберите хотя бы одну работу по прейскуранту');
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

    savingRef.current = true;
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
        savingRef.current = false;
        closeAll();
        if (isEdit) onSaved?.();
        else onCreated?.();
      } else {
        setValidationErrors({ save: res?.message || 'Не удалось сохранить заявку' });
        toast.error(res?.message || (isEdit ? 'Ошибка сохранения' : 'Ошибка создания'));
      }
    } catch {
      setValidationErrors({ save: 'Ошибка сети при сохранении заявки' });
      toast.error(isEdit ? 'Ошибка сети при сохранении' : 'Ошибка сети при создании');
    } finally {
      savingRef.current = false;
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = isEdit
    ? (invoiceNumber ? `Заявка №${invoiceNumber}` : 'Заявка')
    : 'Новая заявка';

  const statusPresentation = invoiceStatus({ status });
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  const overdue = isEdit && isInvoiceOverdue({ status, plan_date: planDate }, today);

  return (
    <>
      <div className="modalOverlay createInvoiceOverlay" onClick={closeAll}>
        <div className={`modalContent createInvoiceNew${isEdit ? ' editInvoice' : ''}`} role="dialog" aria-modal="true" aria-labelledby="create-invoice-title" onClick={(e) => e.stopPropagation()}>
          <div className="create-invoice-modal__toolbar stng-modal-header">
            <div className="create-invoice-modal__titleBlock stng-header-stack">
              <span className="stng-header-eyebrow">Рабочая заявка</span>
              <div className="editInvoiceTitleLine">
                <div id="create-invoice-title" className="create-invoice-modal__title stng-header-title">{title}</div>
                {isEdit && <span className={`editInvoiceBadge editInvoiceBadge--${overdue ? 'overdue' : statusPresentation.tone}`}>{overdue ? `Просрочена · ${statusPresentation.label}` : statusPresentation.label}</span>}
              </div>
              {isEdit ? (
                <div className="create-invoice-modal__subtitle editInvoiceSubtitle stng-header-context">
                  <span>{address || 'Адрес не указан'}</span>
                  {planDate && <span>Срок: {formatDeadline(planDate)}</span>}
                  {invoiceDate && <span>Создана: {formatDeadline(invoiceDate)}</span>}
                </div>
              ) : <div className="create-invoice-modal__subtitle stng-header-context">Создание новой рабочей заявки</div>}
            </div>
            <button type="button" className="close-btn stng-header-close" onClick={closeAll} aria-label="Закрыть форму заявки" disabled={loading}>
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
              id="new-invoice-works-tab"
              type="button"
              className={`create-invoice-modal__tab ${activePage === 'works' ? 'create-invoice-modal__tabActive' : ''}`}
              onClick={() => {
                setActivePage('works');
                setExecutorOpen(false);
                setWorkKindOpen(false);
              }}
            >
              Табличная
              {validationErrors.works ? <span className="create-invoice-modal__tabBadge worksTabError" aria-label="Ошибка в работах">!</span> : invoiceWorks.length > 0 && <span className="create-invoice-modal__tabBadge">{invoiceWorks.length}</span>}
            </button>
          </div>

          <div className="create-invoice-modal__body">
            {activePage === 'header' && (isEdit ?
              <div className="newInvoiceForm editInvoiceForm">
                <section className="newInvoiceSection" aria-labelledby="edit-invoice-account-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">01</span>
                    <div><h2 id="edit-invoice-account-heading">Абонент</h2><p>Лицевой счёт связан с этой заявкой. Контактные данные можно уточнить.</p></div>
                  </div>
                  <div id="new-invoice-lic" className="editInvoiceReadonly" aria-label="Лицевой счёт" tabIndex={-1}>
                    <span>Лицевой счёт</span>
                    <strong>{lic?.code || 'Не указан'}</strong>
                  </div>
                  <div className="newInvoiceTwoFields">
                    <label className="newInvoiceField" htmlFor="new-invoice-applicant">
                      <span>Заявитель <b>*</b></span>
                      <input id="new-invoice-applicant" value={applicant} onChange={(e) => { setApplicant(e.target.value); setValidationErrors((prev) => ({ ...prev, applicant: '' })); }} aria-invalid={!!validationErrors.applicant} placeholder="ФИО заявителя" />
                      {validationErrors.applicant && <small className="newInvoiceError" role="alert">{validationErrors.applicant}</small>}
                    </label>
                    <label className="newInvoiceField" htmlFor="edit-invoice-phone">
                      <span>Телефон <em>необязательно</em></span>
                      <input id="edit-invoice-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Номер для связи" />
                    </label>
                  </div>
                  {validationErrors.lic && <p className="newInvoiceError" role="alert">{validationErrors.lic}</p>}
                </section>

                <section className="newInvoiceSection" aria-labelledby="edit-invoice-address-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">02</span>
                    <div><h2 id="edit-invoice-address-heading">Адрес объекта</h2><p>Проверьте адрес, по которому выполняется заявка.</p></div>
                  </div>
                  <label className="newInvoiceField newInvoiceAddressField" htmlFor="new-invoice-address">
                    <span>Адрес <b>*</b></span>
                    <span className="addressSuggest">
                      <AddressSuggestions
                        key={addressWidgetKey}
                        token={DADATA_TOKEN}
                        defaultQuery={address}
                        value={addressSuggest}
                        onChange={(suggestion) => {
                          if (!suggestion) { applyAddress(address, 0, 0, undefined); return; }
                          const { lat, lon } = coordsFromSuggestion(suggestion);
                          applyAddress(suggestion.value || '', lat, lon, suggestion);
                          setValidationErrors((prev) => ({ ...prev, address: '' }));
                        }}
                        inputProps={{
                          id: 'new-invoice-address',
                          placeholder: 'Улица, дом, населённый пункт',
                          className: 'addressSuggestInput',
                          'aria-invalid': !!validationErrors.address,
                          onChange: (e) => {
                            const next = (e.target as HTMLInputElement).value;
                            setAddress(next);
                            setValidationErrors((prev) => ({ ...prev, address: '' }));
                            if (!next.trim()) { setAddressSuggest(undefined); setAddressLat(0); setAddressLon(0); }
                          },
                        }}
                      />
                    </span>
                    {validationErrors.address && <small className="newInvoiceError" role="alert">{validationErrors.address}</small>}
                  </label>
                </section>

                <section className="newInvoiceSection" aria-labelledby="edit-invoice-details-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">03</span>
                    <div><h2 id="edit-invoice-details-heading">Данные заявки</h2><p>Задача и информация для выполнения работ.</p></div>
                  </div>
                  <div className="newInvoiceField newInvoiceSelect">
                    <span>Вид работ <em>необязательно</em></span>
                    <button type="button" className="newInvoicePicker" onClick={() => { setWorkKindOpen((value) => !value); setExecutorOpen(false); }} aria-expanded={workKindOpen}>
                      <strong>{workKindsLoading ? 'Загружаем виды работ…' : selectedWorkKind?.name || 'Выберите вид работ'}</strong>
                      <IonIcon icon={chevronDownOutline} aria-hidden="true" />
                    </button>
                    {workKindOpen && <div className="newInvoiceOptions">
                      <input type="search" aria-label="Поиск вида работ" placeholder="Найти вид работ" value={workKindSearch} onChange={(e) => setWorkKindSearch(e.target.value)} />
                      {workKindsLoading ? <p>Загрузка…</p> : <>
                        <button type="button" onClick={() => { setWorkKindId(''); setWorkKindName(''); setWorkKindOpen(false); }}>Не выбран</button>
                        {workKinds.filter((kind) => matchesQuery(workKindSearch, kind.name)).map((kind) => <button type="button" key={kind.id} onClick={() => { setWorkKindId(kind.id); setWorkKindName(kind.name); setWorkKindOpen(false); }}>{kind.name}</button>)}
                        {workKinds.filter((kind) => matchesQuery(workKindSearch, kind.name)).length === 0 && <p>Ничего не найдено</p>}
                      </>}
                    </div>}
                  </div>
                  <label className="newInvoiceField" htmlFor="edit-invoice-description">
                    <span>Описание работ <em>необязательно</em></span>
                    <textarea id="edit-invoice-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Что нужно сделать на объекте" />
                  </label>
                  <label className="newInvoiceField" htmlFor="edit-invoice-comment">
                    <span>Комментарий <em>необязательно</em></span>
                    <textarea id="edit-invoice-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Дополнительная информация" />
                  </label>
                </section>

                <section className="newInvoiceSection" aria-labelledby="edit-invoice-progress-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">04</span>
                    <div><h2 id="edit-invoice-progress-heading">Исполнение и сроки</h2><p>Состояние заявки и ответственный сотрудник.</p></div>
                  </div>
                  <div className="newInvoiceField">
                    <span>Статус</span>
                    <div className="statusPills statusPillsWrap" role="group" aria-label="Статус заявки">
                      {statusOptions.map((st) => <button key={st} type="button" className={statusPillClass(st, status === st)} onClick={() => pickStatus(st)} aria-pressed={status === st}>{st}</button>)}
                    </div>
                  </div>
                  <div className="newInvoiceField newInvoiceSelect">
                    <span>Исполнитель <em>необязательно</em></span>
                    <button type="button" className="newInvoicePicker" onClick={() => { setExecutorOpen((value) => !value); setWorkKindOpen(false); }} aria-expanded={executorOpen}>
                      <strong>{selectedExecutor?.name || (executorId ? invoice?.worker?.name : '') || 'Не назначать'}</strong>
                      <IonIcon icon={chevronDownOutline} aria-hidden="true" />
                    </button>
                    {executorOpen && <div className="newInvoiceOptions">
                      <input type="search" aria-label="Поиск сотрудника" placeholder="Найти сотрудника" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                      <button type="button" onClick={() => pickExecutor('')}>Не назначать</button>
                      {filteredWorkers.map((worker: any) => <button type="button" key={worker.id} onClick={() => pickExecutor(String(worker.id))}>{worker.name || 'Без имени'}{worker.role && <small>{worker.role}</small>}</button>)}
                      {filteredWorkers.length === 0 && <p>Сотрудники не найдены</p>}
                    </div>}
                  </div>
                  <div className="newInvoiceTwoFields">
                    <label className="newInvoiceField" htmlFor="edit-invoice-plan-date">
                      <span>Планируемая дата <em>необязательно</em></span>
                      <input id="edit-invoice-plan-date" type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
                    </label>
                    <label className="newInvoiceField" htmlFor="edit-invoice-complete-date">
                      <span>Дата выполнения <em>необязательно</em></span>
                      <input id="edit-invoice-complete-date" type="date" value={completeDate} onChange={(e) => setCompleteDate(e.target.value)} />
                    </label>
                  </div>
                </section>

                <section className="newInvoiceSection newInvoiceWorksSummary" aria-labelledby="edit-invoice-works-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">05</span>
                    <div><h2 id="edit-invoice-works-heading">Оборудование и работы</h2><p>Связанные строки заявки доступны на вкладке «Табличная».</p></div>
                  </div>
                  <div className="newInvoiceWorksLine"><span>Работы по прейскуранту</span><strong>{invoiceWorks.filter((row) => row.work_id).length} из {invoiceWorks.length}</strong></div>
                  <button type="button" className="newInvoiceWorksAction" onClick={() => { setActivePage('works'); setWorkKindOpen(false); setExecutorOpen(false); }}>Открыть работы <IonIcon icon={chevronDownOutline} aria-hidden="true" /></button>
                  {validationErrors.works && <p className="newInvoiceError" role="alert">{validationErrors.works}</p>}
                </section>
              </div> : (
              <div className="newInvoiceForm">
                <section className="newInvoiceSection" aria-labelledby="new-invoice-account-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">01</span>
                    <div><h2 id="new-invoice-account-heading">Абонент</h2><p>Выберите лицевой счёт и проверьте данные заявителя.</p></div>
                  </div>
                  <button id="new-invoice-lic" type="button" className="newInvoicePicker" onClick={() => setPickLicOpen(true)} aria-invalid={!!validationErrors.lic}>
                    <span><small>Лицевой счёт <b>*</b></small><strong>{lic?.code || 'Найти лицевой счёт'}</strong>{lic?.name && <em>{lic.name}</em>}</span>
                    <IonIcon icon={searchOutline} aria-hidden="true" />
                  </button>
                  {validationErrors.lic && <p className="newInvoiceError" role="alert">{validationErrors.lic}</p>}
                  <div className="newInvoiceTwoFields">
                    <label className="newInvoiceField" htmlFor="new-invoice-applicant">
                      <span>Заявитель <b>*</b></span>
                      <input id="new-invoice-applicant" value={applicant} onChange={(e) => { setApplicant(e.target.value); setValidationErrors((prev) => ({ ...prev, applicant: '' })); }} aria-invalid={!!validationErrors.applicant} placeholder="ФИО заявителя" />
                      {validationErrors.applicant && <small className="newInvoiceError" role="alert">{validationErrors.applicant}</small>}
                    </label>
                    <label className="newInvoiceField" htmlFor="new-invoice-phone">
                      <span>Телефон <em>необязательно</em></span>
                      <input id="new-invoice-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Номер для связи" />
                    </label>
                  </div>
                </section>

                <section className="newInvoiceSection" aria-labelledby="new-invoice-address-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">02</span>
                    <div><h2 id="new-invoice-address-heading">Адрес объекта</h2><p>Адрес подставится из лицевого счёта; при необходимости его можно изменить.</p></div>
                  </div>
                  <label className="newInvoiceField newInvoiceAddressField" htmlFor="new-invoice-address">
                    <span>Адрес <b>*</b></span>
                    <span className="addressSuggest">
                      <AddressSuggestions
                        key={addressWidgetKey}
                        token={DADATA_TOKEN}
                        defaultQuery={address}
                        value={addressSuggest}
                        onChange={(suggestion) => {
                          if (!suggestion) { applyAddress(address, 0, 0, undefined); return; }
                          const { lat, lon } = coordsFromSuggestion(suggestion);
                          applyAddress(suggestion.value || '', lat, lon, suggestion);
                          setValidationErrors((prev) => ({ ...prev, address: '' }));
                        }}
                        inputProps={{
                          id: 'new-invoice-address',
                          placeholder: 'Улица, дом, населённый пункт',
                          className: 'addressSuggestInput',
                          'aria-invalid': !!validationErrors.address,
                          onChange: (e) => {
                            const next = (e.target as HTMLInputElement).value;
                            setAddress(next);
                            setValidationErrors((prev) => ({ ...prev, address: '' }));
                            if (!next.trim()) { setAddressSuggest(undefined); setAddressLat(0); setAddressLon(0); }
                          },
                        }}
                      />
                    </span>
                    {validationErrors.address && <small className="newInvoiceError" role="alert">{validationErrors.address}</small>}
                  </label>
                </section>

                <section className="newInvoiceSection" aria-labelledby="new-invoice-request-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">03</span>
                    <div><h2 id="new-invoice-request-heading">Заявка</h2><p>Укажите задачу и желаемый срок.</p></div>
                  </div>
                  <div className="newInvoiceTwoFields">
                    <div className="newInvoiceField newInvoiceSelect">
                      <span>Вид работ <em>необязательно</em></span>
                      <button type="button" className="newInvoicePicker" onClick={() => { setWorkKindOpen((value) => !value); setExecutorOpen(false); }} aria-expanded={workKindOpen}>
                        <strong>{workKindsLoading ? 'Загружаем виды работ…' : selectedWorkKind?.name || 'Выберите вид работ'}</strong>
                        <IonIcon icon={chevronDownOutline} aria-hidden="true" />
                      </button>
                      {workKindOpen && <div className="newInvoiceOptions">
                        <input type="search" aria-label="Поиск вида работ" placeholder="Найти вид работ" value={workKindSearch} onChange={(e) => setWorkKindSearch(e.target.value)} />
                        {workKindsLoading ? <p>Загрузка…</p> : <>
                          <button type="button" onClick={() => { setWorkKindId(''); setWorkKindName(''); setWorkKindOpen(false); }}>Не выбран</button>
                          {workKinds.filter((kind) => matchesQuery(workKindSearch, kind.name)).map((kind) => <button type="button" key={kind.id} onClick={() => { setWorkKindId(kind.id); setWorkKindName(kind.name); setWorkKindOpen(false); }}>{kind.name}</button>)}
                          {workKinds.filter((kind) => matchesQuery(workKindSearch, kind.name)).length === 0 && <p>Ничего не найдено</p>}
                        </>}
                      </div>}
                    </div>
                    <label className="newInvoiceField" htmlFor="new-invoice-plan-date">
                      <span>Планируемая дата <em>необязательно</em></span>
                      <input id="new-invoice-plan-date" type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
                    </label>
                  </div>
                  <label className="newInvoiceField" htmlFor="new-invoice-description">
                    <span>Описание работ <em>необязательно</em></span>
                    <textarea id="new-invoice-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Что нужно сделать на объекте" />
                  </label>
                  <label className="newInvoiceField" htmlFor="new-invoice-comment">
                    <span>Комментарий <em>необязательно</em></span>
                    <textarea id="new-invoice-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Дополнительная информация" />
                  </label>
                </section>

                <section className="newInvoiceSection" aria-labelledby="new-invoice-worker-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">04</span>
                    <div><h2 id="new-invoice-worker-heading">Исполнитель</h2><p>Назначьте сотрудника сейчас или оставьте заявку новой.</p></div>
                  </div>
                  <div className="newInvoiceField newInvoiceSelect">
                    <span>Сотрудник <em>необязательно</em></span>
                    <button type="button" className="newInvoicePicker" onClick={() => { setExecutorOpen((value) => !value); setWorkKindOpen(false); }} aria-expanded={executorOpen}>
                      <strong>{selectedExecutor?.name || 'Не назначать'}</strong>
                      <IonIcon icon={chevronDownOutline} aria-hidden="true" />
                    </button>
                    {executorOpen && <div className="newInvoiceOptions">
                      <input type="search" aria-label="Поиск сотрудника" placeholder="Найти сотрудника" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                      <button type="button" onClick={() => pickExecutor('')}>Не назначать</button>
                      {filteredWorkers.map((worker: any) => <button type="button" key={worker.id} onClick={() => pickExecutor(String(worker.id))}>{worker.name || 'Без имени'}{worker.role && <small>{worker.role}</small>}</button>)}
                      {filteredWorkers.length === 0 && <p>Сотрудники не найдены</p>}
                    </div>}
                  </div>
                </section>

                <section className="newInvoiceSection newInvoiceWorksSummary" aria-labelledby="new-invoice-works-heading">
                  <div className="newInvoiceSectionHead">
                    <span className="newInvoiceStep">05</span>
                    <div><h2 id="new-invoice-works-heading">Работы по прейскуранту <b>*</b></h2><p>Для сохранения выберите хотя бы одну работу по прейскуранту.</p></div>
                  </div>
                  <div className="newInvoiceWorksLine"><span>Выбрано работ</span><strong>{invoiceWorks.filter((row) => row.work_id).length} из {invoiceWorks.length}</strong></div>
                  <button type="button" className="newInvoiceWorksAction" onClick={() => { setActivePage('works'); setWorkKindOpen(false); setExecutorOpen(false); }}>Перейти к работам <IonIcon icon={chevronDownOutline} aria-hidden="true" /></button>
                  {validationErrors.works && <p className="newInvoiceError" role="alert">{validationErrors.works}</p>}
                </section>

                <details className="newInvoiceAdvanced">
                  <summary>Дополнительные параметры</summary>
                  <div className="newInvoiceTwoFields">
                    <div className="newInvoiceField"><span>Статус</span><div className="statusPills statusPillsWrap">{statusOptions.map((st) => <button key={st} type="button" className={statusPillClass(st, status === st)} onClick={() => pickStatus(st)} aria-pressed={status === st}>{st}</button>)}</div></div>
                    <label className="newInvoiceField" htmlFor="new-invoice-complete-date"><span>Дата выполнения <em>необязательно</em></span><input id="new-invoice-complete-date" type="date" value={completeDate} onChange={(e) => setCompleteDate(e.target.value)} /></label>
                  </div>
                </details>
              </div>
              )
            )}

            {activePage === 'works' && (
              <div className="worksWorkspace">
                <div className="worksWorkspaceIntro">
                  <div>
                    <p className="worksEyebrow">Состав заявки</p>
                    <h2>Оборудование и работы</h2>
                    <p>Выберите работу из прейскуранта. Для сохранения нужна хотя бы одна выбранная работа.</p>
                  </div>
                  <button type="button" className="worksAdd" onClick={addWork} disabled={!lic?.id} aria-label="Добавить работу">
                    <IonIcon icon={addOutline} aria-hidden="true" /> Добавить работу
                  </button>
                </div>

                <section className="worksEquipment" aria-labelledby="works-equipment-heading">
                  <div className="worksSectionHeading">
                    <h3 id="works-equipment-heading">Оборудование абонента</h3>
                    <span>{accountEquipments.length}</span>
                  </div>
                  {accountEquipments.length > 0 ? (
                    <div className="worksEquipmentList">
                      {accountEquipments.map((eq: any, index) => (
                        <div className="worksEquipmentItem" key={String(eq.id || eq.equip_id || index)}>
                          <IonIcon icon={constructOutline} aria-hidden="true" />
                          <strong>{equipLabel(eq) || 'Оборудование без названия'}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="worksEquipmentEmpty">{lic?.id ? 'Оборудование не найдено. Работу можно добавить без привязки к оборудованию.' : 'Оборудование появится после выбора лицевого счёта.'}</p>
                  )}
                </section>

                <section className="worksRowsSection" aria-labelledby="works-rows-heading">
                  <div className="worksSectionHeading">
                    <h3 id="works-rows-heading">Работы по прейскуранту</h3>
                    <span>{invoiceWorks.filter((row) => row.work_id).length} выбрано</span>
                  </div>
                  {validationErrors.works && <p className="newInvoiceError worksValidation" role="alert">{validationErrors.works}</p>}
                  {!lic?.id && <p className="worksNotice">Сначала выберите лицевой счёт на вкладке «Основное».</p>}
                  {invoiceWorks.length === 0 ? (
                    <div className="worksRowsEmpty">
                      <strong>Работы пока не добавлены</strong>
                      <p>Добавьте строку и выберите работу из реального прейскуранта.</p>
                    </div>
                  ) : (
                    <div className="worksRows">
                      {invoiceWorks.map((row, index) => {
                        const isOpenRow = openWorkId === row.id && priceListOpen;
                        const equipment = accountEquipments.find((eq: any) => String(eq.id || eq.equip_id || '') === String(row.equip_id || ''));
                        return (
                          <article id={`work-row-${row.id}`} key={row.id} className={`worksRow ${row.work_id ? 'worksRowReady' : 'worksRowPending'}`}>
                            <div className="worksRowHeader">
                              <div><span>Работа {index + 1}</span><strong>{row.work || 'Работа не выбрана'}</strong></div>
                              <button type="button" className="worksRowDelete" onClick={() => removeWork(row.id)} aria-label={`Удалить работу ${index + 1}`} title="Удалить работу">
                                <IonIcon icon={trashOutline} aria-hidden="true" />
                              </button>
                            </div>
                            <div className="worksRowGrid">
                              <div className="worksRowPicker">
                                <span className="worksControlLabel">Прейскурант <b>*</b></span>
                                <button type="button" className="worksPickerButton" onClick={() => {
                                  setOpenWorkId(isOpenRow ? '' : row.id);
                                  setPriceListOpen(!isOpenRow);
                                  setPriceSearch('');
                                }} aria-expanded={isOpenRow} aria-label={`Выбрать работу по прейскуранту для строки ${index + 1}`}>
                                  <span>{worksLoading ? 'Загружаем прейскурант…' : row.work || 'Выберите работу'}</span>
                                  {worksLoading ? <IonSpinner name="dots" /> : <IonIcon icon={chevronDownOutline} aria-hidden="true" />}
                                </button>
                                {isOpenRow && <div className="worksPickerMenu">
                                  <input id={`work-search-${row.id}`} type="search" autoFocus aria-label="Поиск по прейскуранту" placeholder="Найти работу" value={priceSearch} onChange={(e) => setPriceSearch(e.target.value)} />
                                  {worksLoading ? <p>Загрузка…</p> : filteredPriceWorks.length === 0 ? <p>{priceWorks.length ? 'Ничего не найдено' : 'Прейскурант пуст'}</p> : filteredPriceWorks.map((work) => (
                                    <button type="button" key={work.id} className={row.work_id === work.id ? 'worksPickerSelected' : ''} onClick={() => {
                                      setValidationErrors((prev) => ({ ...prev, works: '' }));
                                      patchWork(row.id, { work_id: work.id, work: work.name, price: Number(work.price) || 0 });
                                      setPriceListOpen(false);
                                      setOpenWorkId('');
                                      setPriceSearch('');
                                    }}>{work.name}<small>{money(Number(work.price) || 0)}</small></button>
                                  ))}
                                </div>}
                              </div>
                              <div className="worksRowEquipment">
                                <span className="worksControlLabel">Оборудование</span>
                                {accountEquipments.length > 1 ? (
                                  <select value={String(row.equip_id || '')} aria-label={`Оборудование для работы ${index + 1}`} onChange={(e) => {
                                    const selected = accountEquipments.find((eq: any) => String(eq.id || eq.equip_id || '') === e.target.value);
                                    patchWork(row.id, { equip_id: e.target.value, equipment: selected ? equipLabel(selected) : '' });
                                  }}>
                                    <option value="">Без оборудования</option>
                                    {accountEquipments.map((eq: any, eqIndex) => <option key={String(eq.id || eq.equip_id || eqIndex)} value={String(eq.id || eq.equip_id || '')}>{equipLabel(eq) || 'Оборудование без названия'}</option>)}
                                  </select>
                                ) : <div className="worksEquipmentValue">{equipment ? equipLabel(equipment) : row.equipment || 'Без оборудования'}</div>}
                              </div>
                              <label className="worksRowQuantity">
                                <span className="worksControlLabel">Количество</span>
                                <input type="number" min="1" step="1" inputMode="numeric" value={row.amount} onChange={(e) => patchWork(row.id, { amount: Math.max(1, Number(e.target.value) || 1) })} aria-label={`Количество для работы ${index + 1}`} />
                              </label>
                              <div className="worksRowAmount">
                                <span className="worksControlLabel">Цена · Сумма</span>
                                <strong>{row.work_id ? money(row.price) + ' · ' + money(row.sum) : '—'}</strong>
                              </div>
                            </div>
                            {!row.work_id && <p className={`worksRowHint ${validationErrors.works ? 'worksRowHintError' : ''}`}>{validationErrors.works ? 'Выберите работу по прейскуранту или удалите строку.' : 'Выберите прейскурант для этой строки; без него работа не войдёт в заявку.'}</p>}
                          </article>
                        );
                      })}
                    </div>
                  )}
                  <div className="worksTotal">
                    <span>Итого по выбранным работам</span>
                    <strong>{money(invoiceWorks.filter((row) => row.work_id).reduce((sum, row) => sum + (Number(row.sum) || 0), 0))}</strong>
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="create-invoice-modal__footer">
            {validationErrors.save && <p className="newInvoiceError newInvoiceSaveError" role="alert">{validationErrors.save}</p>}
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
                  : (isEdit ? 'Сохранить изменения' : 'Создать заявку')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <FindLics
        isOpen={pickLicOpen}
        onClose={() => setPickLicOpen(false)}
        onSelect={handlePickLic}
        contextClass={!isEdit ? 'create-invoice-lic-picker' : undefined}
      />
    </>
  );
}
