import { useState, useCallback } from 'react';
import {  useData, useGetLics, useLoading } from '../../Store/licsStore';
import { post } from '../../Store/api';
import { useToken } from '../../Store/loginStore';
import { useToast } from '../Toast';
// Импортируем useUpdate из navigationStore (КОСТЫЛЬ)
import { useAdd, useItem, useUpdate } from '../../Store/navigationStore';

export const formatSum            = (sum: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(sum || 0);
};

export const getTotalDebt         = (debts: any): number => {
  if(!debts) return 0;
  return debts.reduce((total: number, debt: any) => total + (debt.sum || 0), 0);
};

export const formatUUID           = (uuid: string): string => { return uuid; };
export const formatAddress        = (address: string): string => { return (address || '').replace(/,\s*/g, ', '); };

export const formatDate           = (dateString: string): string => {
  if (!dateString || dateString === 'не указано') return 'не указано';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch { return dateString; }
};

export const hasActiveDebts       = (debts: any): boolean => {
  if(!debts) return false;
  return debts.some((debt: any) => debt.sum > 0);
};

export const getDebtStatus        = (debts: any): any => {
  const total = getTotalDebt(debts);
  if (total === 0) return 'none';
  return total > 0 ? 'positive' : 'negative';
};

export const useLics = () => {
  const { data, setData }       = useData()
  const { loading, setLoading } = useLoading()
  const { item, setItem }       = useItem()
  const { token }               = useToken()
  const loadLics                = useGetLics()
  const toast                   = useToast()
  
  // ДОСТАЕМ ГЛОБАЛЬНЫЙ UPDATE (КОСТЫЛЬ)
  const { update, setUpdate }   = useUpdate();

  // Основная функция загрузки
  const get_lics = useCallback(async () => {
    if (typeof loadLics === 'function') {
        const res = await loadLics(token);
        if(!res.success) {
             console.log("Error loading lics:", res.message);
        }
    }
  }, [loadLics, token]);

  // === ФУНКЦИЯ С ПРОВЕРКОЙ (ТОРМОЗ) ===
  const refreshData = useCallback(() => {
    // Если update меньше 5 (например, 1), то грузим
    if (update < 5) {
        console.log("LICS FETCHING... Version:", update);
        setLoading(true);
        
        get_lics().finally(() => {
            setLoading(false);
            setUpdate(5); // СТАВИМ БЛОКИРОВКУ (5)
        });
    } else {
        console.log("LICS BLOCKED by update version:", update);
    }
  }, [update, setUpdate, get_lics, setLoading]);

  const addLics = useCallback(async ( data: any ) => {
    setLoading(true);
    try {
      const res = await post('add_lic',{ token, lc: data.code, id: data.id })
      if (res.success) {
        if(typeof loadLics === 'function') await loadLics(token);
        // Сбрасываем блокировку, чтобы обновить список
        setUpdate(1); 
        toast.success("Л/С добавлен");
      } else {
        toast.error(res.message || 'Ошибка');
      }
    } catch (err) {
      toast.error('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }, [token, loadLics, setLoading, toast, setUpdate]);

  const deleteLics = useCallback(async ( lc: string ) => {
    setLoading(true);
    try {
      const res = await post( 'deleteLic', { token, lc: lc } )
      if ( res.success) {
        if(typeof loadLics === 'function') await loadLics(token);
        setUpdate(1);
        toast.success("Л/С удален");
      } else {
        toast.error( res.message || 'Ошибка' );
      }
    } catch (err:any) {
      toast.error('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }, [token, loadLics, setLoading, toast, setUpdate]);

  return {
    data,
    item,
    loading,
    setItem,
    refreshData,
    addLics,
    deleteLics,
  };
};