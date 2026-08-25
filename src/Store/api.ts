const url = 'https://fhd.aostng.ru/mi/'

export interface TResponse {
    success: boolean;
    data: any;
    message: string;
    error?: boolean;
}

/** Единая проверка ответа API (1С: success / error) */
export const isApiOk = (res: any): boolean =>
  res?.success === true || res?.error === false;

export async function post(method: string, params: any) {
    try {
        const response = await fetch(url + method, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка:', error);
        return { success: false, message: 'Ошибка сети' };
    }
}

export async function getData(method: string, params: any) {
    try {
        const response = await fetch('https://fhd.aostng.ru/inter_vesta/hs/API_STNG/V2/' + method, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка:', error);
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

// --- Invoices ---
export async function getInvoices(token: string) {
    return post('invoices', { token });
}

export async function setInvoice(payload: any) {
    return post('set_invoice', payload);
}

export async function setInvAddress(
    token: string,
    id: string,
    address: string,
    lat: number,
    lon: number
) {
    return post('set_inv_address', { token, id, address, lat, lon });
}

export async function setInvWorker(body: any) {
    return post('set_inv_worker', body);
}

export async function setInvLic(token: string, id: string, lic: string) {
    return post('set_inv_lic', { token, id, lic });
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
