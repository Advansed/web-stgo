// src/pages/Lics/useLics.ts

// ЧИСТЫЙ ФАЙЛ. НИКАКИХ ИМПОРТОВ ИЗ СТОРА!
// НИКАКИХ ХУКОВ (useLics удален)!

export const formatSum = (sum: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(sum || 0);
};

export const getTotalDebt = (debts: any): number => {
  if(!debts) return 0;
  return debts.reduce((total: number, debt: any) => total + (debt.sum || 0), 0);
};

export const formatUUID = (uuid: string): string => { return uuid; };

export const formatAddress = (address: string): string => { 
    return (address || '').replace(/,\s*/g, ', '); 
};

export const formatDate = (dateString: string): string => {
  if (!dateString || dateString === 'не указано') return 'не указано';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch { return dateString; }
};

export const hasActiveDebts = (debts: any): boolean => {
  if(!debts) return false;
  return debts.some((debt: any) => debt.sum > 0);
};

export const getDebtStatus = (debts: any): any => {
  const total = getTotalDebt(debts);
  if (total === 0) return 'none';
  return total > 0 ? 'positive' : 'negative';
};

// Чтобы совместимость не ломалась, если где-то есть пустой импорт useLics
export const useLics = () => {
    return { item: null, setItem: () => {} }
}