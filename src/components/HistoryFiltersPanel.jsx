import React from 'react';

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-0';

const HistoryFiltersPanel = ({
  t,
  isOpen,
  onClose,
  searchValue,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  fromDateFilter,
  onFromDateChange,
  toDateFilter,
  onToDateChange,
  fromAmountFilter,
  onFromAmountChange,
  toAmountFilter,
  onToAmountChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  onClear,
  panelClassName = 'mb-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shrink-0 space-y-3',
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div onMouseLeave={onClose} className={panelClassName}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('history.searchPlaceholder')}
          className={inputClassName}
        />
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className={inputClassName}
        >
          <option value="">{t('history.allCategories')}</option>
          {(categoryOptions || []).map((option) => (
            <option key={option.key ?? option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromDateFilter}
          onChange={(e) => onFromDateChange(e.target.value)}
          aria-label={t('history.fromDate')}
          className={inputClassName}
        />
        <input
          type="date"
          value={toDateFilter}
          onChange={(e) => onToDateChange(e.target.value)}
          aria-label={t('history.toDate')}
          className={inputClassName}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <input
          type="number"
          min="0"
          step="0.01"
          value={fromAmountFilter}
          onChange={(e) => onFromAmountChange(e.target.value)}
          placeholder={t('history.fromAmount')}
          className={inputClassName}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={toAmountFilter}
          onChange={(e) => onToAmountChange(e.target.value)}
          placeholder={t('history.toAmount')}
          className={inputClassName}
        />
        <select value={sortBy} onChange={(e) => onSortByChange(e.target.value)} className={inputClassName}>
          <option value="date">{t('history.sortDate')}</option>
          <option value="amount">{t('history.sortAmount')}</option>
        </select>
        <div className="flex gap-2">
          <select value={sortDirection} onChange={(e) => onSortDirectionChange(e.target.value)} className={inputClassName}>
            <option value="desc">{t('history.descending')}</option>
            <option value="asc">{t('history.ascending')}</option>
          </select>
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {t('history.clearFilters')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryFiltersPanel;
