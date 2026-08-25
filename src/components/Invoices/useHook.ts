import { useCallback } from 'react';
import { useInvoices, useInvoicesStore } from '../../Store/invoiceStore';
import { useToken } from '../../Store/loginStore';
import { useToast } from '../Toast';
import { setInvAddress, setInvWorker, setInvLic } from '../../Store/api';
import { formatInvoiceDate } from '../../utils/format';

export const useHook = () => {
  const { data: invoices, loading, setData, loadInvoices } = useInvoices();
  const { token } = useToken();
  const toast = useToast();

  const refreshData = useCallback(async (_upd?: number) => {
    if (!token) return;
    const res = await loadInvoices(token, true);
    if (res && !(res.success || res.error === false) && res.message) {
      toast.error(res.message);
    }
  }, [token, loadInvoices, toast]);

  const get_inv_status = useCallback((invoice: any): any => {
    const s = invoice.status || invoice.Статус;
    if (s === 'Новый') return { text: 'Новый', color: 'tertiary' };
    if (s === 'В работе') return { text: 'В работе', color: 'primary' };
    return { text: s || 'Обычная', color: 'success' };
  }, []);

  const format_date = useCallback((dateString: string) => formatInvoiceDate(dateString), []);

  const format_phone = useCallback((phone: string): string => {
    if (!phone || typeof phone !== 'string') return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('7')) {
      return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
    }
    return phone;
  }, []);

  const uppdate_address = useCallback(async (id: string, address: any) => {
    const addrVal = typeof address === 'string' ? address : (address.address || address.value);
    const lat = address.lat || 0;
    const lon = address.lon || 0;

    const res = await setInvAddress(token!, id, addrVal, lat, lon);

    if (res.success) {
      const jarr = invoices.map((inv: any) =>
        (inv.id === id || inv.Ссылка === id)
          ? { ...inv, address: addrVal, Адрес: addrVal, lat, lon }
          : inv
      );
      setData(jarr);
      toast.success('Адрес сохранен');
    } else {
      toast.error('Ошибка обновления адреса');
    }
    return res;
  }, [token, invoices, setData, toast]);

  const upd_worker = useCallback(async (id: string, payload: any) => {
    const body: any = {
      token,
      id,
      status: payload.status,
    };
    const workerId = payload.worker?.id;
    if (payload.worker === null) {
      body.worker = '';
    } else if (workerId) {
      body.worker = workerId;
    }
    if (payload.comment != null && payload.comment !== '') {
      body.comment = payload.comment;
    }

    const res = await setInvWorker(body);
    if (res.success) {
      const jarr = invoices.map((inv: any) =>
        (inv.id === id || inv.Ссылка === id)
          ? {
              ...inv,
              ...(payload.worker === null
                ? { worker: null, Работник: null }
                : payload.worker
                  ? { worker: payload.worker, Работник: payload.worker }
                  : {}),
              status: payload.status,
              Статус: payload.status,
              ...(payload.comment != null
                ? { comment: payload.comment, Комментарий: payload.comment }
                : {}),
            }
          : inv
      );
      setData(jarr);
      toast.success('Сохранено');
    } else {
      toast.error('Ошибка сохранения');
    }
    return res;
  }, [token, invoices, setData, toast]);

  const upd_lic = useCallback(async (id: string, lic: any) => {
    const res = await setInvLic(token!, id, lic.id);
    if (res.success) {
      const jarr = invoices.map((inv: any) =>
        (inv.id === id || inv.Ссылка === id) ? { ...inv, lic } : inv
      );
      setData(jarr);
      useInvoicesStore.getState().updateItem({ id, lic });
    } else {
      toast.error('Ошибка назначения');
    }
    return res;
  }, [token, invoices, setData, toast]);

  return {
    loading,
    invoices,
    refreshData,
    loadInvoices,
    get_inv_status,
    format_date,
    uppdate_address,
    upd_worker,
    upd_lic,
    format_phone,
  };
};
