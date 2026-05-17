import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SideMenu from '../components/SideMenu';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertCard from '../components/AlertCard';
import EmptyState from '../components/EmptyState';
import { api } from '../services/api';
import { useDarkMode } from '../context/useDarkMode';
import { useLanguage } from '../context/LanguageContext';
import { CHART_COLORS } from '../constants/colors';
import { getAuthToken, removeAuthToken } from '../utils/tokenHelper';
import { getIntlLocale, normalizeCategoryType, formatCurrencyByLanguage } from '../utils/formatters';
import { normalizeTransactionRecord } from '../utils/transactions';
import { fetchAllFromFirstSuccessfulEndpoint, fetchFirstSuccessfulGet } from '../utils/apiFallbacks';
import { useDataFetch } from '../utils/hooks';

const MONTH_END = { year: 2026, month: 0 };

const AnalysisPage = () => {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const { language, t } = useLanguage();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chartMode, setChartMode] = useState('wydatek');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    const startYear = now.getFullYear();
    const startMonth = now.getMonth();
    const endYear = MONTH_END.year;
    const endMonth = MONTH_END.month;
    const options = [];

    let year = startYear;
    let month = startMonth;

    while (year > endYear || (year === endYear && month >= endMonth)) {
      const date = new Date(year, month, 1);
      const monthLabel = date.toLocaleDateString(getIntlLocale(language), {
        month: 'long',
        year: 'numeric',
      });

      options.push({
        key: `${year}-${String(month + 1).padStart(2, '0')}`,
        year,
        month,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      });

      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
    }

    return options;
  }, [language]);

  const [selectedMonthKey, setSelectedMonthKey] = useState('');

  useEffect(() => {
    if (!selectedMonthKey && monthOptions.length) {
      setSelectedMonthKey(monthOptions[0].key);
    }
  }, [monthOptions, selectedMonthKey]);

  const loadAnalysisData = useCallback(async () => {
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

      const accountsResponse = await api.get('/Me/Accounts', {
        headers,
        validateStatus: () => true,
      });

      if (accountsResponse.status === 401) {
        removeAuthToken();
        navigate('/login');
        throw new Error('Unauthorized');
      }

      const accounts = Array.isArray(accountsResponse.data) ? accountsResponse.data : [];
      const storedAccountId = localStorage.getItem('activeAccountId') || '';
      const selectedAccount = accounts.find(
        (item) => String(item?.id || item?.accountId || '') === storedAccountId
      ) || accounts[0] || null;
      const resolvedAccountId = String(selectedAccount?.id || selectedAccount?.accountId || '');
      if (resolvedAccountId) {
        localStorage.setItem('activeAccountId', resolvedAccountId);
      }

      const [transactionsResponse, categoriesResponse] = await Promise.all([
        fetchAllFromFirstSuccessfulEndpoint({
          requests: [
          {
            url: '/Me/Transactions',
            params: {
              Draw: 1,
              'Search.Value': '',
            },
          },
          { url: '/Transactions/all', paginate: false },
          {
            url: '/Transactions',
            params: {
              Draw: 1,
              'Search.Value': '',
            },
          },
          ],
          headers,
          onUnauthorized: () => {
            removeAuthToken();
            navigate('/login');
          },
        }),
        fetchFirstSuccessfulGet({
          requests: [
          { url: '/Me/Categories' },
          { url: '/Categories' },
          ],
          headers,
          onUnauthorized: () => {
            removeAuthToken();
            navigate('/login');
          },
        }),
      ]);

      if (!transactionsResponse || !categoriesResponse) {
        throw new Error(t('analysis.analysisError'));
      }

      const categoriesData = categoriesResponse.data;
      const transactionsData = Array.isArray(transactionsResponse.data)
        ? transactionsResponse.data
        : [];

      const normalizedCategories = Array.isArray(categoriesData)
        ? categoriesData.map((category) => ({
            id: category.id || category.categoryId,
            categoryName: category.categoryName || category.name || 'Inne',
            type: normalizeCategoryType(category.type || category.categoryType),
          }))
        : [];

      const normalizedTransactions = Array.isArray(transactionsData)
        ? transactionsData.map((transaction, index) =>
            normalizeTransactionRecord(transaction, {
              index,
              categoriesList: normalizedCategories,
              includeDescription: false,
              normalizeDateValue: true,
            })
          )
        : [];

      const accountTransactions = normalizedTransactions.filter(
        (transaction) => String(transaction.accountId) === String(resolvedAccountId)
      );

      setCategories(normalizedCategories);
      setTransactions(accountTransactions);

      return { categories: normalizedCategories, transactions: accountTransactions };
    } catch (err) {
      console.error('Błąd ładowania analizy:', err);
      throw err;
    }
  }, [navigate, t]);

  const analysisDataHook = useDataFetch(loadAnalysisData);

  const selectedMonth = useMemo(
    () => monthOptions.find((item) => item.key === selectedMonthKey) || null,
    [monthOptions, selectedMonthKey]
  );

  const visibleCategories = useMemo(() => {
    const typesByName = new Map();

    categories.forEach((category) => {
      const name = String(category.categoryName || '').trim();
      if (!name) {
        return;
      }

      if (!typesByName.has(name)) {
        typesByName.set(name, normalizeCategoryType(category.type));
      }
    });

    return Array.from(typesByName.entries())
      .filter(([, type]) => type === chartMode)
      .map(([name]) => name);
  }, [categories, chartMode]);

  const chartData = useMemo(() => {
    if (!selectedMonth) {
      return [];
    }

    const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();

    const data = Array.from({ length: daysInMonth }, (_, index) => ({
      day: String(index + 1).padStart(2, '0'),
      total: 0,
    }));

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== selectedMonth.year ||
        date.getMonth() !== selectedMonth.month ||
        transaction.type !== chartMode
      ) {
        return;
      }

      const dayIndex = date.getDate() - 1;
      if (!data[dayIndex]) {
        return;
      }

      const categoryName = String(transaction.category || 'Inne').trim() || 'Inne';
      data[dayIndex][categoryName] = Number(data[dayIndex][categoryName] || 0) + Number(transaction.amount || 0);
      data[dayIndex].total += Number(transaction.amount || 0);
    });

    return data;
  }, [chartMode, selectedMonth, transactions]);

  const categoryKeys = useMemo(() => {
    if (!chartData.length) {
      return visibleCategories;
    }

    const keysSet = new Set(visibleCategories);

    chartData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== 'day' && key !== 'total') {
          keysSet.add(key);
        }
      });
    });

    return Array.from(keysSet).filter((key) => {
      const hasAnyValue = chartData.some((row) => Number(row[key] || 0) > 0);
      return hasAnyValue;
    });
  }, [chartData, visibleCategories]);

  const categoryColors = useMemo(() => {
    const colorsMap = {};
    categoryKeys.forEach((key, index) => {
      colorsMap[key] = CHART_COLORS[index % CHART_COLORS.length];
    });
    return colorsMap;
  }, [categoryKeys]);

  const totalForMonth = useMemo(
    () => chartData.reduce((sum, dayRow) => sum + Number(dayRow.total || 0), 0),
    [chartData]
  );

  const chartTitle = chartMode === 'wydatek' ? t('analysis.expenses') : t('analysis.incomes');

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <Navbar onOpenMenu={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="grow flex items-start lg:items-center justify-center p-4 lg:p-6 min-h-0 overflow-visible lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full px-[8%] gap-4 lg:gap-6 items-stretch lg:h-full min-h-0">
          <section className="w-full lg:w-[30%] bg-white rounded-[2.5rem] p-5 lg:p-6 shadow-sm border border-slate-200 flex flex-col min-h-56 lg:min-h-0">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('analysis.months')}</h2>
            <div className="flex-1 overflow-auto pr-1 space-y-2">
              {monthOptions.map((month) => {
                const isSelected = month.key === selectedMonthKey;
                return (
                  <button
                    key={month.key}
                    type="button"
                    onClick={() => setSelectedMonthKey(month.key)}
                    className={`w-full text-left rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {month.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="w-full lg:flex-1 bg-white rounded-[2.5rem] p-5 lg:p-6 shadow-sm border border-slate-200 flex flex-col min-h-88 lg:min-h-0 relative overflow-visible">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  {chartTitle} {selectedMonth ? `- ${selectedMonth.label}` : ''}
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {t('analysis.monthSum', { value: formatCurrencyByLanguage(totalForMonth, language) })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChartMode((prev) => (prev === 'wydatek' ? 'wpływ' : 'wydatek'))}
              className={`absolute top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full border border-slate-200 bg-white/90 backdrop-blur text-slate-700 shadow-sm hover:bg-slate-100 dark:bg-slate-800/95 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors ${
                chartMode === 'wydatek' ? 'right-4' : 'left-4'
              }`}
              aria-label={
                chartMode === 'wydatek' ? t('analysis.showIncomeChart') : t('analysis.showExpenseChart')
              }
            >
              {chartMode === 'wydatek' ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              )}
            </button>

            <div className="h-72 sm:h-80 lg:h-96">
              {analysisDataHook.loading ? (
                <div className="h-full flex items-center justify-center text-sm font-semibold text-slate-500">
                  {t('analysis.loading')}
                </div>
              ) : analysisDataHook.error ? (
                <div className="h-full flex items-center justify-center text-sm font-semibold text-rose-500 text-center px-6">
                  {analysisDataHook.error}
                </div>
              ) : totalForMonth <= 0 ? (
                <div className="h-full flex items-center justify-center text-sm font-semibold text-slate-500 text-center px-6">
                  {t('analysis.noData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 28, right: 16, left: 12, bottom: 16 }}
                    barCategoryGap="0%"
                    barGap="-100%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                      interval={2}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      width={70}
                      tickFormatter={(value) => t('analysis.currencyAxis', { value: Math.round(value) })}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(51, 65, 85, 0.45)' : '#f8fafc' }}
                      formatter={(value, name) => [formatCurrencyByLanguage(value, language), name]}
                      labelFormatter={(label) => t('analysis.dayLabel', { value: label })}
                      wrapperStyle={{ zIndex: 60, pointerEvents: 'none' }}
                    />

                    {categoryKeys.map((categoryName) => (
                      <Bar
                        key={categoryName}
                        dataKey={categoryName}
                        stackId="daily"
                        fill={categoryColors[categoryName]}
                        radius={[4, 4, 0, 0]}
                        name={categoryName}
                      />
                    ))}

                    <Bar dataKey="total" fill="transparent" stackId="totals" legendType="none">
                      <LabelList
                        dataKey="total"
                        position="top"
                        formatter={(value) => (value > 0 ? t('analysis.currencyAxis', { value: Math.round(value) }) : '')}
                        style={{ fill: isDark ? '#f8fafc' : '#334155', fontSize: 10, fontWeight: 700 }}
                      />
                    </Bar>

                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AnalysisPage;
