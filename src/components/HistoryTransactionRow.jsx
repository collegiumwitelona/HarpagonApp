import React from 'react';
import { formatCurrencyByLanguage, formatDateOnly } from '../utils/formatters';

const HistoryTransactionRow = ({
  transaction,
  language,
  t,
  onDelete = null,
  deleting = false,
  deleteTitle,
}) => {
  const description = String(transaction?.description || '').trim();
  const category = String(transaction?.category || 'Inne');
  const hasDescription = description && description.toLowerCase() !== category.toLowerCase();

  return (
    <div className="px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
      <div className="grid grid-cols-3 items-center gap-3 mb-1.5">
        <span className="text-[11px] font-semibold text-slate-400 text-center col-start-2">
          {formatDateOnly(transaction?.date, language)}
        </span>
      </div>

      <div className="grid grid-cols-3 items-center gap-3">
        <span className="font-bold text-sm text-slate-800 truncate">{category}</span>
        <span className="text-xs text-slate-500 text-center truncate">
          {hasDescription ? description.slice(0, 30) : t('common.noDescription')}
        </span>
        <div className="flex items-center gap-2 shrink-0 justify-self-end">
          <span className={`font-black text-sm ${transaction?.type === 'wpływ' ? 'text-emerald-600' : 'text-rose-500'}`}>
            {transaction?.type === 'wpływ' ? '+' : '-'}{formatCurrencyByLanguage(transaction?.amount, language)}
          </span>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={deleteTitle}
              aria-label={deleteTitle}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default HistoryTransactionRow;
