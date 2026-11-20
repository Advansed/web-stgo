import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { post, isApiOk, ApiActionResult } from './api'; // ✅ импортируем post из api.ts (нужно экспортировать)

// ============================================================
// 1. ТИПЫ (локальные)
// ============================================================


interface   SetInvoicePayload {
  token:            string;
  id:               string;
  lic_id:           string;
  number:           string;
  date:             string;
  lic:              string;
  applicant:        string;
  phone?:           string;
  address:          string;
  lat?:             number;
  lon?:             number;
  executor?:        string;
  description:      string;
  comment:          string;
  works?:           any[];
  status?:          string;
  service?:         string;
  plan_date?:       string;
  complete_date?:   string;
  work_type_id?:    string;
  work_type?:       string;
  serv_id?:         string;
}

export interface   SetInvoiceOverrides {
  lic_id?:          string;
  lic?:             string;
  applicant?:       string;
  phone?:           string;
  address?:         string | { address?: string; value?: string; lat?: number; lon?: number };
  lat?:             number;
  lon?:             number;
  status?:          string;
  date?:            string;
  number?:          string;
  executor?:        string | null;
  description?:     string;
  comment?:         string;
  complete_text?:   string;
  works?:           any[];
  work_type_id?:    string;
  work_type?:       string;
  serv_id?:         string;
  plan_date?:       string;
  complete_date?:   string;
}

// ============================================================
// 2. STORE (Zustand)
// ============================================================
let loadInvoicesInFlight:     Promise<any> | null = null;
let loadInvoicesToken:        string | null = null;

interface InvoicesStore {
  data:                       any[];
  loading:                    boolean;
  loaded:                     boolean;
  error:                      string | null;
  setData:                    (invoices: any[]) => void;
  setLoading:                 (loading: boolean) => void;
  updateItem:                 (updates: Partial<any>) => void;
  loadInvoices:               (token: string, force?: boolean) => Promise<any>;
  applyRemoteInvoices:        (res: any) => void;
  assignWorker:               (token: string, invoiceId: string, workerObj: any) => Promise<any>;
}

export const useInvoicesStore = create<InvoicesStore>()(

  devtools(
    (set, get) => ({
      data:                   [],
      loading:                false,
      loaded:                 false,
      error:                  null,

      setData:                (invoices) => set({ data: invoices }),
      setLoading:             (loading) => set({ loading }),

      updateItem:             (updates) => {
        const currentData = get().data;
        const newData = currentData.map((inv: any) => {
          if (inv.id === updates.id || inv.Ссылка === updates.id) {
            return { ...inv, ...updates };
          }
          return inv;
        });
        set({ data: newData });
      },

      loadInvoices:           async (token, force = false) => {
        if (!force && loadInvoicesInFlight && loadInvoicesToken === token) {
          return loadInvoicesInFlight;
        }
        loadInvoicesToken = token;
        loadInvoicesInFlight = (async () => {
          set({ loading: true, error: null });
          try {
            const res = await getInvoices(token);
            const read = readInvoiceList(res);
            if (read.ok) {
              set({ data: read.list, loading: false, loaded: true, error: null });
            } else {
              set({ loading: false, error: String(read.parsed.message || res.message || 'Проверьте соединение и повторите попытку.') });
            }
            return read.parsed.success !== undefined ? read.parsed : res;
          } catch (e) {
            console.error(e);
            set({ loading: false, error: 'Проверьте соединение и повторите попытку.' });
            return { success: false, message: 'Ошибка сети' };
          } finally {
            loadInvoicesInFlight = null;
            loadInvoicesToken = null;
          }
        })();
        return loadInvoicesInFlight;
      },

      applyRemoteInvoices:    (res) => {
        const read = readInvoiceList(res);
        if (!read.ok) return;
        set({ data: read.list, loaded: true, error: null });
      },

      assignWorker:           async (token, invoiceId, workerObj) => {
        try {
          const invoice = get().data.find(
            (inv: any) => inv.id === invoiceId || inv.Ссылка === invoiceId
          );
          if (!invoice) {
            return { success: false, message: 'Заявка не найдена' };
          }
          const res = await saveInvoice(invoice, token, {
            executor: workerObj.id,
            status: 'Назначен',
          });
          if (res.success || isApiOk(res)) {
            const currentData = get().data;
            const newData = currentData.map((inv: any) => {
              if (inv.id === invoiceId || inv.Ссылка === invoiceId) {
                return {
                  ...inv,
                  worker: workerObj,
                  executor: workerObj.id,
                  status: 'Назначен',
                  Статус: 'Назначен',
                };
              }
              return inv;
            });
            set({ data: newData });
          }
          return res;
        } catch (e) {
          console.error(e);
          return { success: false, message: 'Ошибка сети' };
        }
      },
      
    }),
    { name: 'invoices-store' }
  )

);

// ============================================================
// 3. ХУК ДЛЯ УДОБНОГО ИСПОЛЬЗОВАНИЯ
// ============================================================
export const useInvoices      = () => {

  const data                  = useInvoicesStore((state) => state.data);
  const loading               = useInvoicesStore((state) => state.loading);
  const loaded                = useInvoicesStore((state) => state.loaded);
  const error                 = useInvoicesStore((state) => state.error);
  const setData               = useInvoicesStore((state) => state.setData);
  const updateItem            = useInvoicesStore((state) => state.updateItem);
  const loadInvoices          = useInvoicesStore((state) => state.loadInvoices);
  const assignWorker          = useInvoicesStore((state) => state.assignWorker);

  return { data, loading, loaded, error, setData, updateItem, loadInvoices, assignWorker };

};

// ============================================================
// 4. API-ФУНКЦИИ (используют импортированный `post`)
// ============================================================
  const getInvoices           = async (token: string) => {

      return post('invoices', { token });

  }

  const setInvoice            = async (payload: SetInvoicePayload): Promise<ApiActionResult> => {

      const res = await post('set_invoice', payload);
      return parseJsonDataField(res);

  }

  export const saveInvoice           = (
      invoice: any,
      token: string,
      overrides: SetInvoiceOverrides = {}
  ): Promise<ApiActionResult>  => {
      const invoiceId = invoice?.id || invoice?.Ссылка;
      const stored = useInvoicesStore.getState().data.find(
        (inv: any) => inv.id === invoiceId || inv.Ссылка === invoiceId
      );
      const merged = { ...stored, ...invoice };
      merged.lic_id = extractLicId(invoice, overrides) || extractLicId(stored) || extractLicId(merged);
      return setInvoice(buildSetInvoicePayload(merged, token, overrides));
  }

// ============================================================
// 5. УТИЛИТЫ
// ============================================================

const parseJsonDataField      = (res: any): ApiActionResult => {
  if (res?.success === true || res?.success === false) {
    let data = res.data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object' && 'success' in parsed) {
          return { success: !!parsed.success, message: parsed.message, data: parsed.data };
        }
        data = parsed;
      } catch {
        // keep original string
      }
    }
    return { success: !!res.success, message: res.message, data };
  }
  if (typeof res?.data === 'string') {
    try {
      const parsed = JSON.parse(res.data);
      if (parsed && typeof parsed === 'object' && 'success' in parsed) {
        return { success: !!parsed.success, message: parsed.message, data: parsed.data };
      }
      return { success: isApiOk(res), message: res?.message, data: parsed };
    } catch {
      // ignore
    }
  }
  return { success: isApiOk(res), message: res?.message, data: res?.data };
};


const asInvoiceList          = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return asInvoiceList(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};


const guidFrom               = (raw: any): string => {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'object') {
    return guidFrom(raw.id ?? raw.uuid ?? raw.value);
  }
  const s = String(raw).trim();
  if (!s || s === '[object Object]') return '';
  return s;
};


const extractLicCode          = (invoice: any): string => {
  const raw = invoice?.lic ?? invoice?.ЛС ?? invoice?.лс ?? invoice?.lic_code ?? invoice?.lc ?? '';
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string' || typeof raw === 'number') {
    const s = String(raw).trim();
    return s === '[object Object]' ? '' : s;
  }
  if (typeof raw === 'object') {
    return String(raw.code ?? raw.lc ?? raw.name ?? '').trim();
  }
  return '';
};


const extractLicId           = (invoice: any, overrides?: SetInvoiceOverrides): string => {
  return (
    guidFrom(overrides?.lic_id) ||
    guidFrom(invoice?.lic_id) ||
    guidFrom(invoice?.Lic_id) ||
    guidFrom(invoice?.licId) ||
    guidFrom(typeof invoice?.lic === 'object' ? invoice.lic?.id : undefined)
  );
};


const formatSetInvoiceDate    = (raw?: string | null, fallbackNow = false): string => {
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    const s = String(raw).trim();
    if (s) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00`;
      return s.length >= 19 ? s.slice(0, 19) : s;
    }
  }
  if (!fallbackNow) return '';
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};


const mapWorksPayload         = (works: any[]) =>
  works.map((row: any) => ({
    id: String(row.id || ''),
    equip_id: String(row.equip_id || ''),
    work_id: String(row.work_id || ''),
    work: String(row.work || ''),
    equipment: String(row.equipment || ''),
    amount: Number(row.amount) || 1,
    price: Number(row.price) || 0,
    sum: Number(row.sum) || 0,
    sum_vat: Number(row.sum_vat) || 0,
  }));


const extractAddressFields    = (invoice: any, overrides?: SetInvoiceOverrides) => {
  const addrSrc = overrides?.address ?? invoice.address ?? invoice.Адрес;
  let address = '';
  let lat = invoice.lat ?? 0;
  let lon = invoice.lon ?? 0;
  if (typeof addrSrc === 'string') {
    address = addrSrc;
  } else if (addrSrc && typeof addrSrc === 'object') {
    address = addrSrc.address || addrSrc.value || '';
    if (overrides?.lat === undefined) lat = addrSrc.lat ?? lat;
    if (overrides?.lon === undefined) lon = addrSrc.lon ?? lon;
  }
  if (overrides && 'lat' in overrides) lat = overrides.lat ?? 0;
  if (overrides && 'lon' in overrides) lon = overrides.lon ?? 0;
  return { address, lat: parseFloat(String(lat)) || 0, lon: parseFloat(String(lon)) || 0 };
};


const buildSetInvoicePayload  = (
  invoice: any,
  token: string,
  overrides: SetInvoiceOverrides = {}
): SetInvoicePayload => {
  const { address, lat, lon } = extractAddressFields(invoice, overrides);
  const licCode = overrides.lic ?? extractLicCode(invoice);
  const description = String(
    overrides.description ??
    invoice.description ??
    invoice.service ??
    ''
  ).trim();
  const comment = String(
    overrides.comment ??
    overrides.complete_text ??
    invoice.comment ??
    invoice.complete_text ??
    invoice.Комментарий ??
    ''
  ).trim();
  const isNew = !invoice.number && !invoice.Номер && !invoice.date && !invoice.Дата;
  const number = String(
    overrides.number ??
    invoice.number ??
    invoice.Номер ??
    ''
  ).trim();
  const date = formatSetInvoiceDate(
    overrides.date ?? invoice.date ?? invoice.Дата,
    isNew
  );
  const planDateRaw = overrides.plan_date ?? invoice.plan_date ?? '';
  const completeDateRaw = overrides.complete_date ?? invoice.complete_date ?? '';
  const plan_date = planDateRaw ? formatSetInvoiceDate(planDateRaw) : '';
  const complete_date = completeDateRaw ? formatSetInvoiceDate(completeDateRaw) : '';
  const workTypeId = String(
    overrides.work_type_id ??
    overrides.serv_id ??
    invoice.work_type_id ??
    invoice.serv_id ??
    invoice.Serv_id ??
    ''
  ).trim();
  const workTypeName = String(
    overrides.work_type ??
    invoice.work_type ??
    invoice.character ??
    ''
  ).trim();

  const payload: SetInvoicePayload = {
    token,
    id: String(invoice.id || invoice.Ссылка || ''),
    lic_id: extractLicId(invoice, overrides),
    number,
    date,
    lic: licCode,
    applicant: String(overrides.applicant ?? invoice.applicant ?? invoice.Контрагент ?? '').trim(),
    phone: String(overrides.phone ?? invoice.phone ?? invoice.Телефон ?? '').trim(),
    address,
    lat,
    lon,
    description,
    comment,
    status: overrides.status ?? invoice.status ?? invoice.Статус,
    service: description,
  };

  if (plan_date) payload.plan_date = plan_date;
  if (complete_date) payload.complete_date = complete_date;

  if (workTypeId) {
    payload.work_type_id = workTypeId;
    payload.serv_id = workTypeId;
  }
  if (workTypeName) payload.work_type = workTypeName;

  const works = overrides.works ?? invoice.works;
  if (Array.isArray(works) && works.length > 0) {
    payload.works = mapWorksPayload(works);
  }

  const executorOverride = overrides.executor;
  if (executorOverride !== null && executorOverride !== '') {
    const executorId = executorOverride ?? invoice.executor ?? invoice.worker?.id ?? '';
    if (executorId) payload.executor = String(executorId);
  }

  return payload;
};


const parseWorks              = (raw: any): any[] => {
  let list: any[] = [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : [];
    } catch {
      list = [];
    }
  } else if (Array.isArray(raw)) {
    list = raw;
  }
  return list.map((w: any) => ({
    ...w,
    id: w.id,
    equip_id: w.equip_id ?? w.equipment_id,
    work_id: w.work_id,
    equipment: String(w.equipment ?? '').trim(),
    work: String(w.work ?? '').trim(),
    amount: Number(w.amount) || 0,
    price: Number(w.price) || 0,
    sum: Number(w.sum) || 0,
    sum_vat: Number(w.sum_vat) || 0,
  }));
};


const normalizeInvoice        = (inv: any) => {
  const works = parseWorks(inv.works);
  const comment = inv.comment ?? inv.Комментарий ?? '';
  const description = inv.description ?? inv.service ?? '';
  const licRaw = inv.lic ?? inv.ЛС ?? '';
  const lic =
    typeof licRaw === 'string' || typeof licRaw === 'number'
      ? String(licRaw).trim()
      : String(licRaw?.code ?? licRaw?.name ?? licRaw?.lc ?? '').trim();
  const lic_id = extractLicId(inv);
  const work_type_id =
    guidFrom(inv.work_type_id) ||
    guidFrom(inv.serv_id) ||
    guidFrom(inv.Serv_id);
  const work_type = String(
    inv.work_type ?? inv.character ?? inv.work_type_name ?? ''
  ).trim();
  const serv_id = work_type_id;
  const address =
    typeof inv.address === 'string'
      ? inv.address
      : (inv.address?.address || inv.Адрес || '');
  const nestedAddress = typeof inv.address === 'object' ? inv.address : null;
  const lat = Number(inv.lat) || Number(nestedAddress?.lat ?? nestedAddress?.Lat) || 0;
  const lon = Number(inv.lon) || Number(nestedAddress?.lon ?? nestedAddress?.Lon) || 0;
  return {
    ...inv,
    id: inv.id || inv.Ссылка,
    lic_id,
    serv_id,
    work_type_id,
    work_type,
    character: work_type || inv.character || '',
    number: inv.number || inv.Номер,
    date: inv.date || inv.Дата,
    plan_date: inv.plan_date || '',
    complete_date: inv.complete_date || '',
    description,
    comment,
    lic,
    applicant: inv.applicant ?? inv.Контрагент ?? '',
    address,
    lat,
    lon,
    executor: inv.executor ?? null,
    status: inv.status ?? inv.Статус ?? '',
    works,
    primaryWork: works[0] || null,
    service: description,
  };
};

const readInvoiceList = (res: any): { ok: boolean; list: any[]; parsed: any } => {
  const parsed = parseJsonDataField(res);
  const ok = Boolean(isApiOk(parsed) || parsed.success || isApiOk(res) || res?.success);
  return {
    ok,
    list: ok ? asInvoiceList(parsed.data ?? res?.data).map(normalizeInvoice) : [],
    parsed,
  };
};