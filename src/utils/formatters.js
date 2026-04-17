
export const getIntlLocale = (language = 'pl') => (language === 'en' ? 'en-US' : 'pl-PL');

export const formatDateTime = (value, language = 'pl') => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(getIntlLocale(language), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};


export const formatDateOnly = (dateValue, language = 'pl') => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat(getIntlLocale(language), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};


export const formatTimeOnly = (dateValue, language = 'pl') => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat(getIntlLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};


export const formatDateIso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


export const formatDateFromIso = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return formatDateOnly(date);
};


export const formatCurrency = (value) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatCurrencyByLanguage = (value, language = 'pl') =>
  new Intl.NumberFormat(getIntlLocale(language), {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));


export const formatNumber = (value) =>
  new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatNumberByLanguage = (value, language = 'pl') =>
  new Intl.NumberFormat(getIntlLocale(language), {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));


export const normalizeTransactionType = (type) => {
  const lowerType = String(type || '').toLowerCase();
  if (['wpływ', 'wplyw', 'income', 'inflow', 'credit'].includes(lowerType)) {
    return 'wpływ';
  }
  return 'wydatek';
};


export const normalizeCategoryType = (type) => {
  const lowerType = String(type || '').toLowerCase();
  return ['income', 'wpływ', 'wplyw', 'inflow', 'credit'].includes(lowerType)
    ? 'wpływ'
    : 'wydatek';
};


export const normalizeDate = (dateValue) => {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return parsedDate.toISOString().split('T')[0];
};


export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};


export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


export const formatTimeAgo = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Przed chwilą';
  if (diffMins < 60) return `${diffMins}m. temu`;
  if (diffHours < 24) return `${diffHours}h. temu`;
  if (diffDays < 7) return `${diffDays}d. temu`;

  return formatDateOnly(date);
};
