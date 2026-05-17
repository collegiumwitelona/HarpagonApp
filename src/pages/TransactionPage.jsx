import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SideMenu from '../components/SideMenu';
import TransactionForm from '../components/TransactionForm';
import HistoryFiltersPanel from '../components/HistoryFiltersPanel';
import HistoryPaginationControls from '../components/HistoryPaginationControls';
import HistoryTransactionRow from '../components/HistoryTransactionRow';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { isAdmin } from '../services/auth';
import { getAuthToken, removeAuthToken } from '../utils/tokenHelper';
import { normalizeCategoryType } from '../utils/formatters';
import { normalizeTransactionRecord } from '../utils/transactions';
import { fetchAllFromFirstSuccessfulEndpoint, fetchFirstSuccessfulGet } from '../utils/apiFallbacks';
import { useDataFetch } from '../utils/hooks';

const TransactionPage = () => {
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  useEffect(() => {
    if (isAdmin()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [fromAmountFilter, setFromAmountFilter] = useState('');
  const [toAmountFilter, setToAmountFilter] = useState('');
  const [accountId, setAccountId] = useState(() => localStorage.getItem('activeAccountId') || '');
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('wydatek');
  const [categoryError, setCategoryError] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const normalizeFilterDateParam = (rawValue) => {
    const value = String(rawValue || '').trim();
    if (!value) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const plDateMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (plDateMatch) {
      const [, day, month, year] = plDateMatch;
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  };

  const applyClientFilteringSortingPaging = useCallback((rawTransactions) => {
    const normalized = Array.isArray(rawTransactions)
      ? rawTransactions.map((transaction, index) =>
          normalizeTransactionRecord(transaction, {
            index,
            categoriesList: categories,
            includeDescription: true,
            normalizeDateValue: true,
          })
        )
      : [];

    const fromDateParam = normalizeFilterDateParam(fromDateFilter);
    const toDateParam = normalizeFilterDateParam(toDateFilter);
    const fromAmount = Number(fromAmountFilter);
    const toAmount = Number(toAmountFilter);
    const searchNormalized = searchValue.trim().toLowerCase();

    const filtered = normalized.filter((transaction) => {
      if (accountId && String(transaction.accountId) !== String(accountId)) {
        return false;
      }

      const category = String(transaction.category || '');
      const description = String(transaction.description || '');
      const amount = Number(transaction.amount || 0);
      const transactionDate = normalizeFilterDateParam(transaction.date);

      if (searchNormalized) {
        const haystack = `${category} ${description}`.toLowerCase();
        if (!haystack.includes(searchNormalized)) {
          return false;
        }
      }

      if (categoryFilter.trim()) {
        if (category.toLowerCase() !== categoryFilter.trim().toLowerCase()) {
          return false;
        }
      }

      if (fromDateParam && transactionDate && transactionDate < fromDateParam) {
        return false;
      }

      if (toDateParam && transactionDate && transactionDate > toDateParam) {
        return false;
      }

      if (fromAmountFilter && !Number.isNaN(fromAmount) && amount < fromAmount) {
        return false;
      }

      if (toAmountFilter && !Number.isNaN(toAmount) && amount > toAmount) {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'amount') {
        return sortDirection === 'asc'
          ? Number(a.amount || 0) - Number(b.amount || 0)
          : Number(b.amount || 0) - Number(a.amount || 0);
      }

      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = filtered.slice(start, start + PAGE_SIZE);

    setTransactions(pageData);
    setFilteredCount(filtered.length);
  }, [
    accountId,
    categories,
    currentPage,
    fromAmountFilter,
    fromDateFilter,
    searchValue,
    sortBy,
    sortDirection,
    toAmountFilter,
    toDateFilter,
    categoryFilter,
    PAGE_SIZE,
  ]);

  const fetchFormData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      throw new Error('No auth token');
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      const [accountsResponse, categoriesResponse] = await Promise.all([
        api.get('/Me/Accounts', { headers, validateStatus: () => true }),
        fetchFirstSuccessfulGet({
          requests: ['/Me/Categories', '/Categories'],
          headers,
          baseParams: { _ts: Date.now() },
          baseHeaders: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          onUnauthorized: () => {
            removeAuthToken();
            navigate('/login');
          },
        }),
      ]);

      if (!categoriesResponse) {
        throw new Error(t('history.historyError'));
      }

      if (accountsResponse.status === 401) {
        removeAuthToken();
        navigate('/login');
        throw new Error('Unauthorized');
      }

      const accountsData = accountsResponse.data;
      const preferredAccountId = localStorage.getItem('activeAccountId') || '';
      const account = Array.isArray(accountsData) && accountsData.length > 0
        ? accountsData.find((item) => String(item?.id || item?.accountId || '') === preferredAccountId) || accountsData[0]
        : null;
      const resolvedAccountId = String(account?.id || account?.accountId || '');
      setAccountId(resolvedAccountId);
      if (resolvedAccountId) {
        localStorage.setItem('activeAccountId', resolvedAccountId);
      }

      const categoriesData = categoriesResponse.data;
      const normalizedCategories = Array.isArray(categoriesData)
        ? categoriesData.map((category) => ({
            id: category.id || category.categoryId,
            categoryName: category.categoryName || category.name || 'Inne',
            type: normalizeCategoryType(category.type || category.categoryType),
          }))
        : [];

      setCategories((previousCategories) => {
        const byId = new Map();
        previousCategories.forEach((category) => {
          byId.set(String(category.id), category);
        });
        normalizedCategories.forEach((category) => {
          byId.set(String(category.id), { ...byId.get(String(category.id)), ...category });
        });
        return Array.from(byId.values());
      });

      return { accountId: resolvedAccountId, categories: normalizedCategories };
    } catch (error) {
      console.error('Błąd ładowania danych formularza:', error);
      throw error;
    }
  }, [navigate, t]);

  const fetchTransactions = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      throw new Error('No auth token');
    }

    try {
      const requestParams = {
        Draw: 1,
        'Search.Value': searchValue.trim(),
      };

      const fromAmount = Number(fromAmountFilter);
      const toAmount = Number(toAmountFilter);
      const fromDateParam = normalizeFilterDateParam(fromDateFilter);
      const toDateParam = normalizeFilterDateParam(toDateFilter);

      if (fromDateParam) {
        requestParams['Filters.FromDate'] = fromDateParam;
      }
      if (toDateParam) {
        requestParams['Filters.ToDate'] = toDateParam;
      }
      if (fromAmountFilter && !Number.isNaN(fromAmount)) {
        requestParams['Filters.FromAmount'] = fromAmount;
      }
      if (toAmountFilter && !Number.isNaN(toAmount)) {
        requestParams['Filters.ToAmount'] = toAmount;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      const transactionsResponse = await fetchAllFromFirstSuccessfulEndpoint({
        requests: [
          {
            url: '/Me/Transactions',
            params: requestParams,
          },
          {
            url: '/Transactions',
            params: requestParams,
          },
        ],
        headers,
        onUnauthorized: () => {
          removeAuthToken();
          navigate('/login');
        },
      });

      if (!transactionsResponse) {
        throw new Error('Transactions fetch failed');
      }

      return Array.isArray(transactionsResponse.data) ? transactionsResponse.data : [];
    } catch (error) {
      console.error('Błąd ładowania transakcji:', error);
      throw error;
    }
  }, [fromAmountFilter, fromDateFilter, navigate, searchValue, toAmountFilter, toDateFilter]);

  const formDataHook = useDataFetch(fetchFormData);
  const transactionsHook = useDataFetch(fetchTransactions);

  useEffect(() => {
    applyClientFilteringSortingPaging(transactionsHook.data || []);
  }, [applyClientFilteringSortingPaging, transactionsHook.data, searchValue, categoryFilter, fromDateFilter, toDateFilter, fromAmountFilter, toAmountFilter, sortBy, sortDirection, currentPage]);

  useEffect(() => {
    setSearchValue('');
    setCategoryFilter('');
    setFromDateFilter('');
    setToDateFilter('');
    setFromAmountFilter('');
    setToAmountFilter('');
    setSortBy('date');
    setSortDirection('desc');
    setCurrentPage(1);
  }, [language]);

  const handleTransactionAdded = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      return;
    }
    transactionsHook.retry();
  };

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const firstItemNumber = filteredCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItemNumber = Math.min(currentPage * PAGE_SIZE, filteredCount);
  const categoryOptions = categories.map((category) => ({
    key: category.id,
    value: category.rawCategoryName || category.categoryName,
    label: category.categoryName,
  }));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setSearchValue('');
    setCategoryFilter('');
    setFromDateFilter('');
    setToDateFilter('');
    setFromAmountFilter('');
    setToAmountFilter('');
    setSortBy('date');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    setCategoryError('');
    setCategorySuccess('');
    setAddingCategory(true);

    const token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const existing = categories.find(
        (c) => c.categoryName.toLowerCase() === name.toLowerCase() && c.type === newCategoryType
      );

      if (existing) {
        let delResponse = await api.delete(`/Me/Categories/${existing.id}`, {
          headers,
          validateStatus: () => true,
        });

        if (delResponse.status === 404 || delResponse.status === 405) {
          delResponse = await api.delete(`/Categories/${existing.id}`, {
            headers,
            validateStatus: () => true,
          });
        }

        if (delResponse.status === 401) {
          removeAuthToken();
          navigate('/login');
          return;
        }

        if (delResponse.status < 200 || delResponse.status >= 300) {
          setCategoryError(`${t('history.deleteCategoryError')} (status ${delResponse.status}).`);
          return;
        }

        setCategories((prev) => prev.filter((c) => c.id !== existing.id));
        setNewCategoryName('');
        setCategorySuccess(t('history.categoryRemoved'));
        setTimeout(() => setCategorySuccess(''), 3000);
        await formDataHook.retry();
      } else {
        const apiType = newCategoryType === 'wpływ' ? 'Income' : 'Expense';
        const payload = { categoryName: name, type: apiType, description: '' };

        let response = await api.post('/Me/Categories', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        });

        if (response.status === 404 || response.status === 405) {
          response = await api.post('/Categories', payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            validateStatus: () => true,
          });
        }

        if (response.status === 401) {
          removeAuthToken();
          navigate('/login');
          return;
        }

        if (response.status < 200 || response.status >= 300) {
          setCategoryError(`${t('history.addCategoryError')} (status ${response.status}).`);
          return;
        }

        const created = response.data;
        setCategories((prev) => [
          ...prev,
          {
            id: created.id || created.categoryId || `${Date.now()}`,
            categoryName: created.categoryName || name,
            type: newCategoryType,
          },
        ]);
        setNewCategoryName('');
        setCategorySuccess(t('history.categoryAdded'));
        setTimeout(() => setCategorySuccess(''), 3000);
        await formDataHook.retry();
      }
    } catch (err) {
      console.error('Błąd dodawania kategorii:', err);
      setCategoryError(t('history.categoryAddError'));
    } finally {
      setAddingCategory(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <Navbar onOpenMenu={() => setIsMenuOpen(true)} />

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="grow flex items-start lg:items-center justify-center p-4 lg:p-6 min-h-0 overflow-visible lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full px-[10%] lg:gap-5 gap-3 items-stretch lg:h-full">
          <div className="w-full lg:w-1/4 lg:flex-none flex flex-col gap-3 lg:h-full lg:justify-between">
            <div>
              <TransactionForm
                accountId={accountId}
                categories={categories}
                onTransactionAdded={handleTransactionAdded}
              />
            </div>
            <div className="bg-white rounded-[2.25rem] p-4 shadow-sm border border-slate-200 flex flex-col">
              <h2 className="text-base font-black tracking-tight mb-3">{t('history.newCategory')}</h2>
              <form onSubmit={handleAddCategory} className="flex flex-col gap-2.5">
                <div className="flex rounded-xl overflow-hidden border border-slate-200 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('wydatek')}
                    className={`flex-1 py-2 transition-colors ${newCategoryType === 'wydatek' ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {t('common.expense')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('wpływ')}
                    className={`flex-1 py-2 transition-colors ${newCategoryType === 'wpływ' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {t('common.income')}
                  </button>
                </div>

                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('history.categoryNamePlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-0"
                  maxLength={64}
                />

                {categoryError && (
                  <p className="text-xs font-medium text-rose-500">{categoryError}</p>
                )}
                {categorySuccess && (
                  <p className="text-xs font-medium text-emerald-600">{categorySuccess}</p>
                )}

                <button
                  type="submit"
                  disabled={addingCategory || !newCategoryName.trim()}
                  className="w-full rounded-xl bg-slate-900 py-2 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {addingCategory ? t('history.adding') : t('common.add')}
                </button>
              </form>
            </div>

          </div>

          <div className="w-full lg:w-3/4 lg:flex-none bg-white rounded-[2.5rem] p-4 lg:p-4 shadow-sm border border-slate-200 flex flex-col min-h-[70vh] lg:min-h-0 lg:h-full">
          <div className="mb-2 lg:mb-3 shrink-0 flex items-center justify-between gap-3">
            <h1 className="text-xl lg:text-2xl font-black tracking-tight">{t('history.title')}</h1>
            <button
              type="button"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              {t('history.filtering')}
            </button>
          </div>

          <HistoryFiltersPanel
            t={t}
            isOpen={isFiltersOpen}
            onClose={() => setIsFiltersOpen(false)}
            searchValue={searchValue}
            onSearchChange={(value) => {
              setSearchValue(value);
              setCurrentPage(1);
            }}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}
            categoryOptions={categoryOptions}
            fromDateFilter={fromDateFilter}
            onFromDateChange={(value) => {
              setFromDateFilter(value);
              setCurrentPage(1);
            }}
            toDateFilter={toDateFilter}
            onToDateChange={(value) => {
              setToDateFilter(value);
              setCurrentPage(1);
            }}
            fromAmountFilter={fromAmountFilter}
            onFromAmountChange={(value) => {
              setFromAmountFilter(value);
              setCurrentPage(1);
            }}
            toAmountFilter={toAmountFilter}
            onToAmountChange={(value) => {
              setToAmountFilter(value);
              setCurrentPage(1);
            }}
            sortBy={sortBy}
            onSortByChange={(value) => {
              setSortBy(value);
              setCurrentPage(1);
            }}
            sortDirection={sortDirection}
            onSortDirectionChange={(value) => {
              setSortDirection(value);
              setCurrentPage(1);
            }}
            onClear={handleClearFilters}
            panelClassName="mb-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-700/40 p-3 shrink-0 space-y-3"
          />

          {transactionsHook.error && (
            <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 shrink-0">
              {transactionsHook.error}
            </div>
          )}

          <div className="grow min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-1.5">
            {transactionsHook.loading ? (
              <p className="text-sm text-slate-500">{t('history.loading')}</p>
            ) : transactions.length > 0 ? (
              transactions.map((transaction) => (
                <HistoryTransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  language={language}
                  t={t}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">{t('history.noTransactions')}</p>
            )}
          </div>

          <div className="mt-2 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 pt-2">
            <p className="text-xs text-slate-500">
              {t('history.showingEntries', {
                from: firstItemNumber,
                to: lastItemNumber,
                total: filteredCount,
              })}
            </p>

            <HistoryPaginationControls
              t={t}
              currentPage={currentPage}
              totalPages={totalPages}
              loading={transactionsHook.loading}
              onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            />
          </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TransactionPage;
