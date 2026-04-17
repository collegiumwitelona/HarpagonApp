import { useLanguage } from '../context/LanguageContext';
import { formatCurrencyByLanguage } from '../utils/formatters';

const CashStatCard = ({ title, value, color, tempValue, onTempChange, onSave }) => {
  const { language, t } = useLanguage();
  const themes = {
    violet: "bg-violet-50 border-violet-100 text-violet-600",
    blue: "bg-blue-50 border-blue-100 text-blue-600"
  };
  const buttonThemes = {
    violet: "bg-violet-600 hover:bg-violet-700",
    blue: "bg-blue-600 hover:bg-blue-700"
  };

  return (
    <div className={`${themes[color]} p-3 rounded-2xl border text-center`}>
      <p className="text-xl font-black text-slate-900">{title}</p>
      <h3 className="text-xl font-black text-slate-900">{formatCurrencyByLanguage(value, language)}</h3>
      <div className="flex gap-2 mt-1 max-w-50 mx-auto">
        <input 
          value={tempValue} 
          onChange={(e) => onTempChange(e.target.value)} 
          type="number" 
          className="flex-1 text-[10px] p-1 rounded-lg border border-opacity-50 outline-none" 
          placeholder={t('dashboard.editPlaceholder')} 
        />
        <button 
          onClick={onSave}
          className={`${buttonThemes[color]} text-white px-2 rounded-lg text-[9px] font-bold`}
        >
          {t('common.ok')}
        </button>
      </div>
    </div>
  );
};

export default CashStatCard;