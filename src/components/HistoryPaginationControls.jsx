import React from 'react';

const HistoryPaginationControls = ({
  t,
  currentPage,
  totalPages,
  loading,
  onPrev,
  onNext,
  className = '',
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <button
      type="button"
      onClick={onPrev}
      disabled={currentPage === 1 || loading}
      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {t('history.previousPage')}
    </button>
    <span className="text-xs font-semibold text-slate-600 px-1">
      {t('history.pageIndicator', { current: currentPage, total: totalPages })}
    </span>
    <button
      type="button"
      onClick={onNext}
      disabled={currentPage >= totalPages || loading}
      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {t('history.nextPage')}
    </button>
  </div>
);

export default HistoryPaginationControls;
