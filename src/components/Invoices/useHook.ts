// src/hooks/useInvoices.ts
import { useCallback, useEffect } from 'react';
import { useInvoices } from '../../Store/invoiceStore';
import { useToken, useLoading } from '../../Store/loginStore';
import { useToast } from '../Toast';
import { post } from '../../Store/api';


export const useHook = () => {
  const { data: invoices, setData, update, setUpdate }   = useInvoices();
  const { token }                     = useToken();
  const toast                         = useToast();
  const { loading, setLoading}        = useLoading()    
  

  const refreshData                   = useCallback(async ( upd: number ) => {
    
    console.log( 'update', upd, update )

    if( update < upd ) {

      setLoading(true);
      try {
        const res = await post("invoices", { token } );
        console.log("invoices", res)
        if (res.success) {
          setData( res.data )
          setUpdate( upd )
          toast.success("Данные счетов получены");
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error('Ошибка сети или сервера при получении счетов');
      } finally {
        setLoading(false);
      }
      
    }


  }, []);

  const get_inv_status                = useCallback((invoice: any): any => {

    if( invoice.Статус === "Новый")
        return {
            text:   'Новый',
            color:  'tertiary'
        };
      
    if( invoice.Статус === "В работе")
        return {
            text:   'В работе',
            color:  'primary'
        };
      
    return {
        text:   'Обычная',
        color:  'success'
    };


  }, []);

    // Завершенная функция formatDate
  const format_date                   = useCallback((dateString: string): string => {
        if (!dateString || typeof dateString !== 'string') return '';
        
        try {
            const date = new Date(dateString);
            
            // Проверяем валидность даты
            if (isNaN(date.getTime())) return dateString;
            
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return 'Сегодня, ' + date.toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } else if (diffDays === 1) {
                return 'Вчера, ' + date.toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } else if (diffDays < 7) {
                return `${diffDays} дн. назад`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `${weeks} нед. назад`;
            } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                return `${months} мес. назад`;
            } else {
                // Для старых дат показываем полную дату
                return date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (err) {
            console.error('Error formatting date:', err);
            return dateString;
        }
  }, []);

    // Форматирование телефона
  const format_phone                  = useCallback((phone: string): string => {
        if (!phone || typeof phone !== 'string') return '';
        
        // Убираем все символы кроме цифр
        const digits = phone.replace(/\D/g, '');
        
        if (digits.length === 11 && digits.startsWith('7')) {
            // Российский номер: +7 (999) 999-99-99
            return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
        } else if (digits.length === 10) {
            // Номер без кода страны: (999) 999-99-99
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
        } else {
            // Возвращаем как есть, если формат неизвестен
            return phone;
        }
  }, []);


  const uppdate_address               = useCallback(async( id, address) => {
      console.log("set_inv_address", id, address )
      const res = await post("set_inv_address", { token, id: id, address: address.address, lat: address.lat, lon: address.lon })
      console.log("set_inv_address", res )
      if(res.success){
        const jarr = invoices.map( (inv) =>
              inv.Ссылка === id 
                ? { ...inv, Адрес: address }
                : inv
        )
        setData( jarr );

      } else toast.error("Ошибка обновления адреса")
      return res
  }, [ token, invoices, setData, toast ])


  const upd_worker                    = useCallback(async( id, worker ) => {
      console.log( "set_inv_worker", id, worker.worker, worker.status )
      const res = await post( "set_inv_worker", { token, id, worker: worker.worker.id, status: worker.status })
      console.log( "set_inv_worker", res )
      if(res.success){
        const jarr = invoices.map( ( inv ) =>
              inv.Ссылка === id 
                ? { ...inv, Работник: worker, Статус: worker.status }
                : inv
        )
        setData( jarr );
      } else toast.error("Ошибка обновления адреса")
      return res
  }, [ token, invoices, setData, toast ])

  return {
    update,
    loading,
    invoices,
    refreshData,
    get_inv_status,
    format_date,
    uppdate_address,
    upd_worker,
    format_phone
  };
};