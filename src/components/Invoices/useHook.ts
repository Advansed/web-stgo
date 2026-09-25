import { useCallback }        from 'react';
import { useInvoices, 
    useInvoicesStore, 
    saveInvoice, 
    SetInvoiceOverrides }     from '../../Store/invoiceStore';
import { useToken }           from '../../Store/loginStore';
import { useToast }           from '../Toast';
import { formatInvoiceDate }  from '../../utils/format';

const findInvoice   = (invoices: any[], id: string) =>
  invoices.find((inv: any) => inv.id === id || inv.Ссылка === id);

const patchInvoiceInList = (
  invoices: any[],
  id: string,
  patch: Record<string, any>
) =>
  invoices.map((inv: any) =>
    inv.id === id || inv.Ссылка === id ? { ...inv, ...patch } : inv
  );

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

  const get_inv_status  = useCallback((invoice: any): any => {
    const s = invoice.status || invoice.Статус;
    if (s === 'Новый') return { text: 'Новый', color: 'tertiary' };
    if (s === 'Назначен') return { text: 'Назначен', color: 'secondary' };
    if (s === 'В работе') return { text: 'В работе', color: 'warning' };
    if (s === 'Отложен') return { text: 'Отложен', color: 'medium' };
    if (s === 'Завершен') return { text: 'Завершен', color: 'success' };
    return { text: s || 'Новый', color: 'tertiary' };
  }, []);

  const format_date     = useCallback((dateString: string) => formatInvoiceDate(dateString), []);

  
  const format_phone    = useCallback((phone: string): string => {
    if (!phone || typeof phone !== 'string') return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('7')) {
      return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
    }
    return phone;
  }, []);

  const persistInvoice  = useCallback(
    async (
      id: string,
      overrides: SetInvoiceOverrides,
      localPatch: Record<string, any>,
      successMessage: string
    ) => {
      const invoice = findInvoice(invoices, id);
      if (!invoice) {
        toast.error('Заявка не найдена');
        return { success: false, message: 'Заявка не найдена' };
      }
      if (!token) {
        toast.error('Нет token — перелогинься');
        return { success: false, message: 'Нет token' };
      }

      const res = await saveInvoice(invoice, token, overrides);
      if (res.success) {
        const jarr = patchInvoiceInList(invoices, id, localPatch);
        setData(jarr);
        useInvoicesStore.getState().updateItem({ id, ...localPatch });
        toast.success(successMessage);
      } else {
        toast.error(res.message || 'Ошибка сохранения');
      }
      return res;
    },
    [token, invoices, setData, toast]
  );

  const upd_address     = useCallback(
    async (id: string, address: any) => {
      const addrVal = typeof address === 'string' ? address : (address.address || address.value);
      const lat = address.lat || 0;
      const lon = address.lon || 0;

      return persistInvoice(
        id,
        { address: addrVal, lat, lon },
        { address: addrVal, Адрес: addrVal, lat, lon },
        'Адрес сохранен'
      );
    },
    [persistInvoice]
  );

  const upd_worker      = useCallback(
    async (id: string, payload: any) => {
      const overrides: SetInvoiceOverrides = {
        status: payload.status,
      };

      if (payload.worker === null) {
        overrides.executor = null;
      } else if (payload.worker?.id) {
        overrides.executor = payload.worker.id;
      }

      if (payload.comment != null) {
        overrides.comment = payload.comment;
      }

      const localPatch: Record<string, any> = {
        status: payload.status,
        Статус: payload.status,
      };

      if (payload.worker === null) {
        localPatch.worker = null;
        localPatch.Работник = null;
        localPatch.executor = undefined;
      } else if (payload.worker) {
        localPatch.worker = payload.worker;
        localPatch.Работник = payload.worker;
        localPatch.executor = payload.worker.id;
      }

      if (payload.comment != null) {
        localPatch.comment = payload.comment;
        localPatch.Комментарий = payload.comment;
        localPatch.complete_text = payload.comment;
      }

      return persistInvoice(id, overrides, localPatch, 'Сохранено');
    },
    [persistInvoice]
  );

  return {
    loading,
    invoices,
    refreshData,
    loadInvoices,
    get_inv_status,
    format_date,
    upd_address,
    upd_worker,
    format_phone,
  };
};
