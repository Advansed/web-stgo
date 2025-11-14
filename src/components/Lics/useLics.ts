import { useState, useEffect } from 'react';
import { useData, useItem, useLoading } from '../../Store/licsStore';
import { post } from '../../Store/api';
import { useToken } from '../../Store/loginStore';
import { useToast } from '../Toast';

export const useLics = () => {

  const { data, setData } = useData()
  const { loading, setLoading } = useLoading()
  const { item, setItem } = useItem()
  const { token } = useToken()
  const toast = useToast()

  const loadLics          = async () => {
    
    setLoading(true);
    
    try {
      // Здесь будет вызов API метода get_lics
      const res = await post('get_lics', { token })
      console.log("lics", res.data)
      if (res.success) {
        setData(res.data);
      } else {
        toast.error( res.message || 'Ошибка загрузки данных' );
      }
    } catch (err:any) {
      toast.error('Error loading lics:', err.message);
    } finally {
      setLoading(false);
    }

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

  
  const handleLicClick    = ( lic: any ) => {
    // Навигация к детальной карточке
    setItem( lic )

  };


  const refreshData       = () => {
    loadLics();
  };


  useEffect(() => {
    loadLics();
  }, []);

  return {
    data,
    item,
    loading,
    
    setItem,
    refreshData,
    handleLicClick,
    addLics,
    deleteLics,
  };
};