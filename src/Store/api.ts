import { useLoginStore } from './loginStore';

const url = import.meta.env.DEV ? '/mi/' : 'https://fhd.aostng.ru/mi/';

export interface TResponse {
  success: boolean;
  data: any;
  message: string;
  error?: boolean;
}

export interface   ApiActionResult {
  success: boolean;
  message?: string;
  data?: any;
}

/** Единая проверка ответа API (1С: success / error) */
export const isApiOk = (res: any): boolean =>
  res?.success === true || res?.error === false;

/** Ответ сервера: токен отсутствует или невалиден */
export const isInvalidTokenResponse = (res: any): boolean => {
  const parts = [res?.message, typeof res?.data === 'string' ? res.data : '']
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!parts) return false;

  console.log(parts);

  return (
    parts.includes('Токен не найден') ||
    parts.includes('токен невалиден') ||
    parts.includes('невалидный токен') ||
    (parts.includes('токен') && parts.includes('невалиден')) ||
    parts.includes('token not found') ||
    parts.includes('invalid token') ||
    parts.includes('unauthorized')
  );
};

const handleAuthFailure = (method: string, data: any) => {
  if (method === 'login') return;
  if (!isInvalidTokenResponse(data)) return;
  console.warn(`[API] ${method}: невалидный токен → logout`);
  useLoginStore.getState().logout();
};

export async function post(method: string, params: any) {
  console.log(`[API] POST ${method}`, { params });
  try {
    const response = await fetch(url + method, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    console.log(`[API] POST ${method} ←`, data);
    if (!data.success) {
      console.log(`success false`);
      if (!isInvalidTokenResponse(data)) return data;
      console.warn(`[API] ${method}: невалидный токен → logout`);
      useLoginStore.getState().logout();
    }
    return data;
  } catch (error) {
    console.error(`[API] POST ${method} ✕`, error);
    return { success: false, message: 'Ошибка сети' };
  }
}

export async function getData(method: string, params: any) {
  console.log(`[API] getData ${method}`, { params });
  try {
    const response = await fetch('https://fhd.aostng.ru/inter_vesta/hs/API_STNG/V2/' + method, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    console.log(`[API] getData ${method} ←`, data);
    handleAuthFailure(method, data);
    return data;
  } catch (error) {
    console.error(`[API] getData ${method} ✕`, error);
    return { success: false, message: 'Ошибка сети' };
  }
}

// --- Auth ---
export async function login(data: any) {
  return post('login', data);
}

// --- Workers ---
export async function getWorkers(token: string) {
  return post('workers', { token });
}

// --- Works (прейскурант) ---
export interface WorkType {
  id: string;
  name: string;
  price?: number;
}

export async function getWorks(token: string) {
  const res = await post('get_works', { token });
  let raw = res?.data;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = []; }
  }
  if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) raw = raw.data;
  const list = Array.isArray(raw) ? raw : [];
  const data = list.map((item: any) => ({
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    price: Number(item.price ?? item.tarif ?? 0) || 0,
  })).filter((item: WorkType) => item.id && item.name);
  return { ...res, ok: isApiOk(res), data };
}

// --- Виды работ ---
export interface WorkKind {
  id: string;
  name: string;
}

export async function getWorkTypes(token: string) {
  const res = await post('get_work_types', { token });
  let raw = res?.data;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = []; }
  }
  if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) raw = raw.data;
  const list = Array.isArray(raw) ? raw : [];
  const data = list.map((item: any) => ({
    id: String(item.id ?? item.work_type_id ?? ''),
    name: String(item.name ?? item.work_type ?? item.title ?? ''),
  })).filter((item: WorkKind) => item.id && item.name);
  return { ...res, ok: isApiOk(res), data };
}

// --- Lics ---
export async function getLic(token: string, code: string) {
  const res = await post('get_lic', { token, code });
  const raw = res?.data !== undefined ? res.data : res;
  const data = Array.isArray(raw) ? raw[0] : raw;
  const ok = isApiOk(res) || (res?.error !== true && data && typeof data === 'object');
  return { ...res, ok, data };
}

export async function getLics(token: string) {
  const res = await post('get_lics', { token });
  const list = Array.isArray(res?.data) ? res.data : [];
  return { ...res, ok: isApiOk(res), data: list };
}

export async function addLic(token: string, lc: string, id: string) {
  return post('add_lic', { token, lc, id });
}

export async function delLic(token: string, lc: string) {
  return post('del_lic', { token, lc });
}

// --- Поиск лицевого счёта по адресу ---
const asList = (raw: any): any[] => {
  let value = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { value = []; }
  }
  if (value && !Array.isArray(value) && Array.isArray(value.data)) value = value.data;
  return Array.isArray(value) ? value : [];
};

const plotLabel = (item: any): string => {
  if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
  return String(item?.plot ?? item?.name ?? item?.title ?? '').trim();
};

export async function getPlots(token: string) {
  const res = await post('mp_plots', { token });
  const data = [...new Set(asList(res?.data).map(plotLabel).filter(Boolean))];
  return { ...res, ok: isApiOk(res), data };
}

export interface FoundLicByAddress {
  code: string;
  address_go: string;
  plot: string;
}

export async function findLicsByAddress(token: string, plot: string, address: string) {
  const res = await post('mp_find_lics', { token, plot, address });
  const data: FoundLicByAddress[] = asList(res?.data).map((item: any) => ({
    code: String(item?.code ?? '').trim(),
    address_go: String(item?.address_go ?? item?.address ?? '').trim(),
    plot: String(item?.plot ?? plot).trim(),
  })).filter((item: FoundLicByAddress) => item.code);
  return { ...res, ok: isApiOk(res), data };
}

// --- Адресный справочник ---
export async function getSettlements(token: string) {
  return getData('getSettlements', { token });
}

export async function getStreets(token: string, s_id: string) {
  return getData('getStreets', { token, s_id });
}

export async function getHouses(params: { token: string; ids: any }) {
  return getData('getHouses', params);
}

// --- Acts ---
export async function getCompletedAct(invoice_id: string, user_id: string) {
  return post('COMPLETED_GET', { invoice_id, user_id });
}

export async function createCompletedAct(token: string, actComplete: any) {
  return post('COMPLETED_CREATE', { token, ...actComplete });
}