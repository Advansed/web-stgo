// src/utils/format.ts

export const formatSum = (sum: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(sum || 0);
};

export const formatAddress = (address: string): string => {
  return (address || '').replace(/,\s*/g, ', ');
};

export const getDisplayAddress = (addr: any): string => {
  if (!addr) return 'Адрес не указан';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') return addr.address || addr.value || 'Адрес не указан';
  return 'Адрес не указан';
};

/** Парсит даты вида 23,06,2026 / 23.06.2026 / ISO */
export const formatDate = (dateString: string): string => {
  if (!dateString || dateString === 'не указано') return 'не указано';

  const raw = String(dateString).trim();

  const dmy = raw.match(/^(\d{1,2})[,.\-/](\d{1,2})[,.\-/](\d{2,4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${day}.${month}.${year}`;
  }

  try {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleDateString('ru-RU');
  } catch {
    return raw;
  }
};

/** Дата для списка заявок: Сегодня / Вчера / dd.mm.yyyy */
export const formatInvoiceDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return formatDate(dateString);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = (today.getTime() - target.getTime()) / 86400000;

    if (diff === 0) return 'Сегодня';
    if (diff === 1) return 'Вчера';
    return date.toLocaleDateString('ru-RU');
  } catch {
    return formatDate(dateString);
  }
};

export const getTotalDebt = (debts: any): number => {
  if (!debts) return 0;
  return debts.reduce((total: number, debt: any) => total + (debt.sum || 0), 0);
};

export const getDebtStatus = (debts: any): any => {
  const total = getTotalDebt(debts);
  if (total === 0) return 'none';
  return total > 0 ? 'positive' : 'negative';
};

export const hasActiveDebts = (debts: any): boolean => {
  if (!debts) return false;
  return debts.some((debt: any) => debt.sum > 0);
};
