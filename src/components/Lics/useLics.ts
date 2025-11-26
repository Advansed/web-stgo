import { useState, useEffect } from 'react';
import {  useData, useGetLics, useLoading } from '../../Store/licsStore';
import { post } from '../../Store/api';
import { useToken } from '../../Store/loginStore';
import { useToast } from '../Toast';
import { useAdd, useItem } from '../../Store/navigationStore';

export const formatSum            = (sum: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(sum);
};

export const getTotalDebt         = (debts: any): number => {
  return debts.reduce((total: number, debt: any) => total + debt.sum, 0);
};

export const formatUUID           = (uuid: string): string => {
  // Предполагается использование f_encode_uuid/f_decode_uuid из базы
  return uuid;
};

export const formatAddress        = (address: string): string => {
  return address.replace(/,\s*/g, ', ');
};

export const formatDate           = (dateString: string): string => {
  if (!dateString || dateString === 'не указано') return 'не указано';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch {
    return dateString;
  }
};

export const hasActiveDebts       = (debts: any): boolean => {
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

  const get_lics          = async () => {
    
    const res = await loadLics( token )
    if(res.success) toast.success("Данные получены")
    else toast.error(res.message)
  };

  
  const addLics           = async ( data: any ) => {


    try {
      // Здесь будет вызов API метода get_lics
      const res = await post('add_lic',{ token, lc: data.code, id: data.id })

      if (res.success) {
        loadLics()
      } else {
        toast.error(res.message || 'Ошибка загрузки данных');
      }
    } catch (err) {
      toast.error('Ошибка сети или сервера');
    } finally {
      setLoading(false);
    }

  }


  const deleteLics        = async ( lc: string ) => {

    try {
      // Здесь будет вызов API метода get_lics
      const res = await post( 'deleteLic', { token, lc: lc } )

      if ( res.success) {
        loadLics()
      } else {
        toast.error( res.message || 'Ошибка загрузки данных' );
      }
    } catch (err:any) {
      toast.error('Ошибка сети или сервера');
    } finally {
      setLoading(false);
    }

  }


  const refreshData       = () => {
    get_lics()
  };




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