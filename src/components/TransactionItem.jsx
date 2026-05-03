import { useLanguage } from '../context/LanguageContext';
import { formatCurrencyByLanguage, formatDateOnly } from '../utils/formatters';

const TransactionItem = ({ category, date, amount, type }) => {
  const { language } = useLanguage();

  return (
    <div className="flex items-center p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm gap-3">
      <div className="flex-1 min-w-0 text-left">
        <p className="font-bold text-sm truncate">{category}</p>
        <p className="text-[10px] text-slate-400 font-medium">{formatDateOnly(date, language)}</p>
      </div>
      <span className={`font-bold text-sm shrink-0 ${type === 'wpływ' ? 'text-emerald-600' : 'text-rose-500'}`}>
        {type === 'wpływ' ? '+' : '-'}{formatCurrencyByLanguage(amount, language)}
      </span>
    </div>
  );
};

export default TransactionItem;