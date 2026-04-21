import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { translateCategoryName } from '../utils/categoryTranslations';

const normalizeDate = (dateValue) => {
  const d = new Date(dateValue);
  return Number.isNaN(d.getTime())
    ? new Date().toISOString().split('T')[0]
    : d.toISOString().split('T')[0];
};

const normalizeType = (type) =>
  ['wpływ', 'wplyw', 'income', 'inflow', 'credit'].includes(String(type || '').toLowerCase())
    ? 'wpływ'
    : 'wydatek';

const TransactionForm = ({ accountId, categories = [], onTransactionAdded }) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [formType, setFormType] = useState('wydatek');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [error, setError] = useState('');

  const getAuthToken = () => {
    const raw = localStorage.getItem('token') || '';
    return raw.trim().replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '');
  };

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.type === formType),
    [categories, formType]
  );

  useEffect(() => {
    if (!categoryOptions.length) {
      setSelectedCategoryId('');
      return;
    }
    const exists = categoryOptions.some((c) => String(c.id) === String(selectedCategoryId));
    if (!exists) setSelectedCategoryId(String(categoryOptions[0].id));
  }, [categoryOptions, selectedCategoryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const description = formData.get('description');

    if (Number.isNaN(amount) || amount <= 0) return;

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    if (!accountId || !selectedCategoryId) {
      setError(t('history.missingAccountOrCategory'));
      return;
    }

    const selectedCategory = categories.find((c) => String(c.id) === String(selectedCategoryId));

    try {
      const payload = {
        accountId,
        categoryId: selectedCategoryId,
        amount,
        description: String(description || selectedCategory?.categoryName || '').trim(),
      };

      let response = await api.post('/Me/Transactions', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      });

      if (response.status === 404 || response.status === 405) {
        response = await api.post('/Transactions', payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          validateStatus: () => true,
        });
      }

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        navigate('/login');
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Nie udało się dodać transakcji (status ${response.status}).`);
      }

      const data = response.data || {};
      const normalized = {
        id: data.id || data.transactionId || Date.now(),
        type: normalizeType(data.type || data.transactionType || formType),
        category:
          data.categoryName ||
          data.category?.name ||
          selectedCategory?.categoryName ||
          'Inne',
        description: data.description || String(description || '').trim(),
        amount,
        date: normalizeDate(data.date || data.transactionDate || data.createdAt),
      };

      onTransactionAdded?.(normalized);
      e.target.reset();
      setFormType('wydatek');
    } catch (err) {
      console.error('Błąd dodawania transakcji:', err);
      setError(t('history.addTransactionError'));
    }
  };

  return (
    <div className="bg-white rounded-[2.25rem] p-4 shadow-sm border border-slate-200 flex flex-col">
      <h2 className="text-base font-black tracking-tight mb-3">{t('history.newTransaction')}</h2>

      {error && (
        <div className="mb-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <select
            name="type"
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="wydatek">{t('common.expense')}</option>
            <option value="wpływ">{t('common.income')}</option>
          </select>

          <select
            name="categoryId"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-violet-500"
          >
            {categoryOptions.length > 0 ? (
              categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {translateCategoryName(c.categoryName, language)}
                </option>
              ))
            ) : (
              <option value="">{t('history.noCategoryOption')}</option>
            )}
          </select>

          <input
            name="amount"
            type="number"
            placeholder={t('dashboard.amountPlaceholder')}
            className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            required
          />

          <input
            name="description"
            type="text"
            placeholder={t('history.descriptionPlaceholder')}
            className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            maxLength={30}
          />
        </div>

        <button
          type="submit"
          disabled={!accountId || !selectedCategoryId}
          className="w-full bg-violet-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-violet-700 transition-all shadow-sm active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {t('common.add')}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
