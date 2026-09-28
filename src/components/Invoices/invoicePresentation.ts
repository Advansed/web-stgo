export type InvoiceFilter = 'all' | 'open' | 'overdue' | 'completed';
export type InvoiceTone = 'neutral' | 'new' | 'assigned' | 'work' | 'hold' | 'success';

const OPEN = new Set(['новый', 'новая', 'назначен', 'назначена', 'в работе', 'отложен', 'отложена']);
const COMPLETED = new Set(['завершен', 'завершён', 'завершено', 'завершена', 'выполнена', 'выполнено']);

export const invoiceStatus = (invoice: any): { label: string; tone: InvoiceTone; open: boolean; completed: boolean } => {
  const label = String(invoice.status || invoice.Статус || '').trim();
  const key = label.toLocaleLowerCase('ru-RU');
  return {
    label: label || 'Без статуса',
    tone: COMPLETED.has(key) ? 'success' : key === 'в работе' ? 'work' : key === 'назначен' || key === 'назначена' ? 'assigned' : key === 'отложен' || key === 'отложена' ? 'hold' : key === 'новый' || key === 'новая' ? 'new' : 'neutral',
    open: OPEN.has(key),
    completed: COMPLETED.has(key),
  };
};

const dayKey = (raw: unknown): string | null => {
  if (!raw) return null;
  const value = String(raw).trim();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const ru = value.match(/^(\d{2})[.,/](\d{2})[.,/](\d{4})/);
  if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
};

export const isInvoiceOverdue = (invoice: any, today: string): boolean => {
  const due = dayKey(invoice.plan_date);
  return invoiceStatus(invoice).open && !!due && due < today;
};

export const formatDeadline = (raw: unknown): string => {
  const day = dayKey(raw);
  if (!day) return 'Срок не указан';
  const [year, month, date] = day.split('-').map(Number);
  const value = new Date(year, month - 1, date);
  return value.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', ...(year !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
};

export const invoiceAddress = (invoice: any): string => {
  const raw = invoice.address || invoice.Адрес;
  return typeof raw === 'string' ? raw.trim() || 'Адрес не указан' : String(raw?.address || raw?.value || 'Адрес не указан');
};

export const matchesInvoiceSearch = (invoice: any, query: string): boolean => {
  const words = query.toLocaleLowerCase('ru-RU').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const fields = [
    invoice.number, invoice.Номер, invoiceAddress(invoice), invoice.description, invoice.service,
    invoice.comment, invoice.applicant, invoice.lic, invoiceStatus(invoice).label, invoice.worker?.name,
    ...(Array.isArray(invoice.works) ? invoice.works.flatMap((work: any) => [work.work, work.equipment]) : []),
  ];
  const text = fields.map((value) => String(value || '')).join(' ').toLocaleLowerCase('ru-RU');
  return words.every((word) => text.includes(word));
};

export const matchesInvoiceFilter = (invoice: any, filter: InvoiceFilter, today: string): boolean => {
  if (filter === 'all') return true;
  if (filter === 'open') return invoiceStatus(invoice).open;
  if (filter === 'completed') return invoiceStatus(invoice).completed;
  return isInvoiceOverdue(invoice, today);
};
