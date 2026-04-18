import React, { useEffect, useState, useMemo, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CashStatCard from '../components/CashStatCard';
import TransactionItem from '../components/TransactionItem';
import SideMenu from '../components/SideMenu';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { CATEGORY_COLORS } from '../constants/colors';
import { getAuthToken, removeAuthToken } from '../utils/tokenHelper';
import { translateCategoryName } from '../utils/categoryTranslations';
import { normalizeTransactionType, normalizeCategoryType, normalizeDate, formatCurrencyByLanguage, formatDateIso } from '../utils/formatters';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [balance, setBalance] = useState(0);
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem('savingsGoal');
    return saved !== null ? Number(saved) : 100000;
  });
  const [tempBalance, setTempBalance] = useState("");
  const [tempGoal, setTempGoal] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [formType, setFormType] = useState('wydatek');
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState({
    totalExpenses: 0,
    totalIncomes: 0,
    expensesByCategory: {},
    incomesByCategory: {},
  });
  const hasLoadedDashboardRef = useRef(false);

  const getDashboardDateRange = () => {
    const today = new Date();

    return {
      FromDate: '2020-01-01',
      ToDate: formatDateIso(today),
    };
  };

  const buildSummaryFromTransactions = (transactionsList = []) => {
    const summary = {
      totalExpenses: 0,
      totalIncomes: 0,
      expensesByCategory: {},
      incomesByCategory: {},
    };

    if (!Array.isArray(transactionsList)) {
      return summary;
    }

    transactionsList.forEach((transaction) => {
      const amount = Math.abs(Number(transaction?.amount || 0));
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      const categoryName = String(transaction?.category || 'Inne');
      if (transaction?.type === 'wpływ') {
        summary.totalIncomes += amount;
        summary.incomesByCategory[categoryName] =
          Number(summary.incomesByCategory[categoryName] || 0) + amount;
      } else {
        summary.totalExpenses += amount;
        summary.expensesByCategory[categoryName] =
          Number(summary.expensesByCategory[categoryName] || 0) + amount;
      }
    });

    return summary;
  };

  const fetchDashboardSummary = async (token, fallbackTransactions = []) => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };

    const endpoints = ['/Me/Dashboard'];

    for (const endpoint of endpoints) {
      const dashboardResponse = await api.get(endpoint, {
        headers,
        params: getDashboardDateRange(),
        validateStatus: () => true,
      });

      if (dashboardResponse.status === 401) {
        removeAuthToken();
        navigate('/login');
        return;
      }

      if (dashboardResponse.status >= 200 && dashboardResponse.status < 300) {
        const dashboardData = dashboardResponse.data || {};

        setDashboardSummary({
          totalExpenses: Number(dashboardData.totalExpenses || 0),
          totalIncomes: Number(dashboardData.totalIncomes || 0),
          expensesByCategory: dashboardData.expensesByCategory || {},
          incomesByCategory: dashboardData.incomesByCategory || {},
        });
        return;
      }
    }

    
    setDashboardSummary(buildSummaryFromTransactions(fallbackTransactions));
  };

  const normalizeTransaction = (transaction, index, categoriesList = []) => {
    const transactionCategoryId =
      transaction.categoryId || transaction.categoryID || transaction.category?.id || '';

    const matchedCategory = categoriesList.find(
      (c) => String(c.id) === String(transactionCategoryId)
    );

    const transactionType =
      transaction.type ||
      transaction.transactionType ||
      transaction.kind ||
      matchedCategory?.type ||
      matchedCategory?.categoryType;

    return {
      id: transaction.id || transaction.transactionId || `${Date.now()}-${index}`,
      type: normalizeTransactionType(transactionType),
      category:
        transaction.categoryName ||
        transaction.category?.categoryName ||
        matchedCategory?.categoryName ||
        transaction.category ||
        transaction.title ||
        'Inne',
      amount: Number(transaction.amount || transaction.value || 0),
      date: normalizeDate(transaction.date || transaction.transactionDate || transaction.createdAt),
    };
  };

  const loadDashboardData = async () => {
    setError('');
    setLoading(true);

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };

      const fetchFirstSuccessfulGet = async (requests, errorMessage) => {
        let unauthorizedDetected = false;

        for (const request of requests) {
          const response = await api.get(request.url, {
            headers,
            params: request.params,
            validateStatus: () => true,
          });

          if (response.status === 401) {
            unauthorizedDetected = true;
            break;
          }

          if (response.status >= 200 && response.status < 300) {
            return response;
          }
        }

        if (unauthorizedDetected) {
          removeAuthToken();
          navigate('/login');
          return null;
        }

        throw new Error(errorMessage);
      };

      const accountsResponse = await api.get('/Me/Accounts', { headers, validateStatus: () => true });
      if (accountsResponse.status === 401) {
        removeAuthToken();
        navigate('/login');
        return;
      }

      if (accountsResponse.status < 200 || accountsResponse.status >= 300) {
        throw new Error(`Nie udało się pobrać konta (status ${accountsResponse.status}).`);
      }

      const transactionsResponse = await fetchFirstSuccessfulGet(
        [
          { url: '/Me/Transactions' },
          { url: '/Transactions/all' },
          {
            url: '/Transactions',
            params: {
              Draw: 1,
              Start: 0,
              Length: 500,
              'Search.Value': '',
            },
          },
        ],
        'Nie udało się pobrać transakcji.'
      );

      if (!transactionsResponse) {
        return;
      }

      const categoriesResponse = await fetchFirstSuccessfulGet(
        [
          { url: '/Me/Categories' },
          { url: '/Categories' },
        ],
        'Nie udało się pobrać kategorii.'
      );

      if (!categoriesResponse) {
        return;
      }

      const accounts = accountsResponse.data;
      const transactionsResponseData = transactionsResponse.data;
      const transactionsData = Array.isArray(transactionsResponseData?.data)
        ? transactionsResponseData.data
        : Array.isArray(transactionsResponseData?.Data)
          ? transactionsResponseData.Data
          : Array.isArray(transactionsResponseData)
            ? transactionsResponseData
            : [];
      const categoriesData = categoriesResponse.data;

      const normalizedCategories = Array.isArray(categoriesData)
        ? categoriesData.map((category) => ({
            id: category.id || category.categoryId,
            categoryName: category.categoryName || category.name || 'Inne',
            type: normalizeCategoryType(category.type || category.categoryType),
          }))
        : [];

      setCategories(normalizedCategories);

      const account = Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
      setAccountId(account?.id || account?.accountId || '');

      const accountBalance = Number(account?.balance ?? account?.currentBalance ?? 0);
      setBalance(Number.isNaN(accountBalance) ? 0 : accountBalance);

      const normalizedTransactions = Array.isArray(transactionsData)
        ? transactionsData.map((transaction, index) =>
            normalizeTransaction(transaction, index, normalizedCategories)
          )
        : [];

      normalizedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(normalizedTransactions);
      await fetchDashboardSummary(token, normalizedTransactions);
    } catch (err) {
      console.error('Błąd ładowania dashboardu:', err);
      setError(t('dashboard.dashboardError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedDashboardRef.current) {
      return;
    }

    hasLoadedDashboardRef.current = true;
    loadDashboardData();
  });

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.type === formType),
    [categories, formType]
  );

  useEffect(() => {
    if (!categoryOptions.length) {
      setSelectedCategoryId('');
      return;
    }

    const selectedExists = categoryOptions.some(
      (category) => String(category.id) === String(selectedCategoryId)
    );

    if (!selectedExists) {
      setSelectedCategoryId(String(categoryOptions[0].id));
    }
  }, [categoryOptions, selectedCategoryId]);

  const handleSaveBalance = async () => {
    setError('');

    const normalizedTempBalance = String(tempBalance || '').trim().replace(',', '.');
    const parsedBalance = Number(normalizedTempBalance);

    if (!normalizedTempBalance || Number.isNaN(parsedBalance)) {
      setError(t('dashboard.saveBalanceInvalid'));
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    if (!accountId) {
      setError(t('dashboard.missingAccountOrCategory'));
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };

    try {
      let response = await api.patch('/Me/Accounts', {
        accountId,
        newBalance: parsedBalance,
      }, {
        headers,
        validateStatus: () => true,
      });

      if (response.status === 404 || response.status === 405) {
        response = await api.patch('/Accounts', {
          accountId,
          newBalance: parsedBalance,
        }, {
          headers,
          validateStatus: () => true,
        });
      }

      if (response.status === 401) {
        removeAuthToken();
        navigate('/login');
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Nie udało się zapisać salda (status ${response.status}).`);
      }

      const responseData = response.data || {};
      const responseBalance = Number(
        responseData.balance ??
        responseData.currentBalance ??
        responseData.account?.balance ??
        responseData.account?.currentBalance
      );

      setBalance(Number.isNaN(responseBalance) ? parsedBalance : responseBalance);
      setTempBalance('');
      await fetchDashboardSummary(token, transactions);
    } catch (err) {
      console.error('Błąd zapisu salda konta:', err);
      setError(t('dashboard.saveBalanceError'));
    }
  };

  const pieData = useMemo(() => [
    { name: t('dashboard.current'), value: balance },
    { name: t('dashboard.remaining'), value: Math.max(0, goal - balance) }
  ], [balance, goal, t]);

  const expensesPieData = useMemo(
    () =>
      Object.entries(dashboardSummary.expensesByCategory || {})
        .map(([name, value]) => ({ name, value: Number(value || 0) }))
        .filter((item) => item.value > 0),
    [dashboardSummary.expensesByCategory]
  );

  const incomesPieData = useMemo(
    () =>
      Object.entries(dashboardSummary.incomesByCategory || {})
        .map(([name, value]) => ({ name, value: Number(value || 0) }))
        .filter((item) => item.value > 0),
    [dashboardSummary.incomesByCategory]
  );

  const handleAddTransaction = async (e) => {
    e.preventDefault();

    setError('');

    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const type = formData.get('type');
    const categoryId = formData.get('categoryId');
    const description = formData.get('description');

    if (isNaN(amount) || amount <= 0) return;

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    if (!accountId || !categoryId) {
      setError(t('dashboard.missingAccountOrCategory'));
      return;
    }

    const selectedCategory = categories.find(
      (category) => String(category.id) === String(categoryId)
    );

    try {
      const payload = {
        accountId,
        categoryId,
        amount,
        description: String(description || selectedCategory?.categoryName || '').trim(),
      };

      let response = await api.post('/Me/Transactions', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        validateStatus: () => true,
      });

      if (response.status === 404 || response.status === 405) {
        response = await api.post('/Transactions', payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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
        throw new Error(`Nie udało się dodać transakcji (status ${response.status}).`);
      }

      const createdTransaction = response.data || null;

      const normalizedCreated = createdTransaction
        ? normalizeTransaction(createdTransaction, 0, categories)
        : {
            id: Date.now(),
            type,
            category: selectedCategory?.categoryName || 'Inne',
            amount,
            date: new Date().toISOString().split('T')[0],
          };

      setTransactions((prev) => [normalizedCreated, ...prev]);
      setBalance((prev) => (type === 'wpływ' ? prev + amount : prev - amount));
      await fetchDashboardSummary(token);

      e.target.reset();
      setFormType('wydatek');
    } catch (err) {
      console.error('Błąd dodawania transakcji:', err);
      setError(t('dashboard.addTransactionError'));
    }
  };

  const localizedIncomesPieData = useMemo(
    () => incomesPieData.map((item) => ({ ...item, displayName: translateCategoryName(item.name, language) })),
    [incomesPieData, language]
  );

  const localizedExpensesPieData = useMemo(
    () => expensesPieData.map((item) => ({ ...item, displayName: translateCategoryName(item.name, language) })),
    [expensesPieData, language]
  );

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <Navbar onOpenMenu={() => setIsMenuOpen(true)} />

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="grow flex items-start lg:items-center justify-center p-4 lg:p-6 min-h-0 overflow-visible lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full max-w-350 lg:h-full lg:max-h-195">
          
          <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 flex flex-col min-h-0">
            <h2 className="text-xl font-bold mb-4 tracking-tight">{t('dashboard.transactions')}</h2>

            {error && (
              <div className="mb-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                {error}
              </div>
            )}

            <form onSubmit={handleAddTransaction} className="space-y-3 mb-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 shrink-0 min-w-0">
              <div className="flex flex-wrap gap-2 min-w-0">
                <select 
                  name="type" 
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="flex-1 basis-36 min-w-0 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="wydatek">{t('common.expense')}</option>
                  <option value="wpływ">{t('common.income')}</option>
                </select>

                <select
                  name="categoryId"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="flex-1 basis-44 min-w-0 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {categoryOptions.length > 0 ? (
                    categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {translateCategoryName(category.categoryName, language)}
                      </option>
                    ))
                  ) : (
                    <option value="">{t('common.noCategories')}</option>
                  )}
                </select>
              </div>

              <div className="flex flex-wrap gap-2 min-w-0">
                <input name="amount" type="number" placeholder={t('dashboard.amountPlaceholder')} className="flex-1 basis-48 min-w-0 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-violet-500" required />
                <button type="submit" disabled={!accountId || !selectedCategoryId} className="shrink-0 whitespace-nowrap bg-violet-600 text-white px-5 rounded-xl font-bold text-sm hover:bg-violet-700 transition-all shadow-sm active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed">{t('common.add')}</button>
              </div>

              <input
                name="description"
                type="text"
                placeholder={t('dashboard.descriptionPlaceholder')}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </form>

            <div className="grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {loading ? (
                <p className="text-sm text-slate-500">{t('dashboard.loadingTransactions')}</p>
              ) : transactions.length > 0 ? (
                transactions.map(t => <TransactionItem key={t.id} {...t} />)
              ) : (
                <p className="text-sm text-slate-500">{t('dashboard.noTransactions')}</p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 flex flex-col min-h-120 lg:min-h-0">
            <div className="grid grid-cols-1 gap-2 mb-4 shrink-0"> 
              <CashStatCard 
                title={t('dashboard.accountBalance')} value={balance} color="violet" 
                tempValue={tempBalance} onTempChange={setTempBalance}
                onSave={handleSaveBalance}
              />
              <CashStatCard 
                title={t('dashboard.savingsGoal')} value={goal} color="blue" 
                tempValue={tempGoal} onTempChange={setTempGoal}
                onSave={() => {
                  const parsedGoal = Number(String(tempGoal || '').trim().replace(',', '.'));
                  if (Number.isNaN(parsedGoal) || parsedGoal <= 0) {
                    return;
                  }
                  localStorage.setItem('savingsGoal', parsedGoal);
                  setGoal(parsedGoal);
                  setTempGoal('');
                }}
              />
            </div>

            <div className="relative h-48 sm:h-52 lg:h-60 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius="64%" outerRadius="84%" paddingAngle={5} dataKey="value" stroke="none">
                    <Cell fill="#7c3aed" /><Cell fill="#60a5fa" />
                  </Pie>
                  <Tooltip cornerRadius={10} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl lg:text-3xl font-black text-slate-900 leading-none">{Math.round((balance/goal)*100)}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">{t('dashboard.completion')}</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-4 lg:p-6 shadow-sm border border-slate-200 grid grid-cols-2 gap-3 lg:gap-4 min-h-0">
            <div className="min-h-0 min-w-0 rounded-3xl border border-slate-100 bg-slate-50 p-3 lg:p-4 flex flex-col">
              <div className="mb-2 shrink-0">
                <h3 className="text-xl font-black text-slate-900">{t('dashboard.totalIncome')}</h3>
                <p className="text-xl font-black text-emerald-600">{formatCurrencyByLanguage(dashboardSummary.totalIncomes, language)}</p>
              </div>
              <div className="h-28 lg:h-36 shrink-0">
                <ResponsiveContainer width="100%" height={112}>
                  <PieChart>
                    <Pie data={localizedIncomesPieData} dataKey="value" nameKey="displayName" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                      {localizedIncomesPieData.map((_, index) => (
                        <Cell key={`income-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrencyByLanguage(value, language)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grow overflow-y-auto pr-1 space-y-1 text-[11px] lg:text-xs">
                {localizedIncomesPieData.length > 0 ? (
                  localizedIncomesPieData.map((item, index) => (
                    <div key={`income-legend-${item.name}`} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                        <span className="truncate text-slate-600">{item.displayName}</span>
                      </div>
                      <span className="font-semibold text-slate-700">{formatCurrencyByLanguage(item.value, language)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">{t('dashboard.noIncomeData')}</p>
                )}
              </div>
            </div>

            <div className="min-h-0 min-w-0 rounded-3xl border border-slate-100 bg-slate-50 p-3 lg:p-4 flex flex-col">
              <div className="mb-2 shrink-0">
                <h3 className="text-xl font-black text-slate-900">{t('dashboard.totalExpense')}</h3>
                <p className="text-xl font-black text-rose-600">{formatCurrencyByLanguage(dashboardSummary.totalExpenses, language)}</p>
              </div>
              <div className="h-28 lg:h-36 shrink-0">
                <ResponsiveContainer width="100%" height={112}>
                  <PieChart>
                    <Pie data={localizedExpensesPieData} dataKey="value" nameKey="displayName" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                      {localizedExpensesPieData.map((_, index) => (
                        <Cell key={`expense-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrencyByLanguage(value, language)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grow overflow-y-auto pr-1 space-y-1 text-[11px] lg:text-xs">
                {localizedExpensesPieData.length > 0 ? (
                  localizedExpensesPieData.map((item, index) => (
                    <div key={`expense-legend-${item.name}`} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                        <span className="truncate text-slate-600">{item.displayName}</span>
                      </div>
                      <span className="font-semibold text-slate-700">{formatCurrencyByLanguage(item.value, language)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">{t('dashboard.noExpenseData')}</p>
                )}
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;