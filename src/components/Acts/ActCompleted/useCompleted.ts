import { useCallback, useState } from 'react';
import { useToast } from '../../Toast';
import { useLoginStore, useToken } from '../../../Store/loginStore';
import { post } from '../../../Store/api';
import { actsActions, useActsStore } from '../../../Store/actStore';
import { ActCompletedData } from '../../../Store/types';

// —–––––––––––––––––
// Начальные поля формы
// —–––––––––––––––––
const initialFieldErrors: Partial<Record<keyof ActCompletedData, string>> = {};

export const useCompleted = (actId?: string) => {
  const actComplete                     = useActsStore(state => state.actComplete);
  const loading                         = useActsStore(state => state.loading);
  const user                            = useLoginStore(state => state.user);
  const token                           = useToken();
  
  const [fieldErrors, setFieldErrors]   = useState(initialFieldErrors);
  const toast                           = useToast();

  
  const updateField                     = useCallback((field: keyof ActCompletedData, value: string) => {
    actsActions.setField(0, field, value);
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  
  const validateForm                    = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof ActCompletedData, string>> = {};
    
    // Базовая валидация
    const required: (keyof ActCompletedData)[] = [
      'act_date', 'executor_name', 'client_name', 'work_description'
    ];
    
    required.forEach(field => {
      if (!actComplete[field]?.toString().trim()) {
        newErrors[field] = 'Поле обязательно для заполнения';
      }
    });
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [actComplete]);


  const loadActByInvoice                = useCallback(async (invoiceId: string) => {
    actsActions.setLoading(true);
    try {
      const result = await post('COMPLETED_GET', { 
        invoice_id: invoiceId, 
        user_id: user.id 
      });
      
      if (result.success) {
        actsActions.setData(0, result.data);
      }
    } catch {
      toast.error('Ошибка загрузки акта');
    } finally {
      actsActions.setLoading(false);
    }
  }, [user.id]);


  const saveAct                         = useCallback(async (): Promise<ActCompletedData | null> => {
    if (!validateForm()) return null;
    
    actsActions.setLoading(true);
    try {
      const result = await post('COMPLETED_CREATE', { token, ...actComplete });
      if (result.success) {
        actsActions.setData(0, result.data);
        toast.success('Акт выполненных работ сохранен');
        return result.data;
      }
      toast.error(result.message || 'Ошибка сохранения акта');
      return null;
    } catch {
      toast.error('Ошибка сохранения акта');
      return null;
    } finally {
      actsActions.setLoading(false);
    }
  }, [actComplete, validateForm, token]);


  
  const setExecutorFromProfile          = useCallback(() => {
    if (user) {
      updateField('executor_name', user.full_name || '');
      updateField('executor_position', user.position || '');
    }
  }, [user, updateField]);


  const setDefaultQualityAssessment     = useCallback(() => {
    if (!actComplete.quality_assessment) {
      updateField('quality_assessment', 'Работы выполнены в соответствии с техническими требованиями');
    }
  }, [actComplete.quality_assessment, updateField]);


  const getFieldValue                   = useCallback((field: keyof ActCompletedData) => 
    actComplete[field] || '', [actComplete]);


  const getFieldError                   = useCallback((field: keyof ActCompletedData) => 
    fieldErrors[field] || '', [fieldErrors]);


  return {
    actComplete,
    loading,
    updateField,
    validateForm,
    loadActByInvoice,
    saveAct,
    setExecutorFromProfile,
    setDefaultQualityAssessment,
    getFieldValue,
    getFieldError
  };
};