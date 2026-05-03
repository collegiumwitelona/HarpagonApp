import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UserCard from '../components/UserCard';
import EmptyState from '../components/EmptyState';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { isAdmin } from '../services/auth';
import { getAuthToken, removeAuthToken } from '../utils/tokenHelper';
import { formatCurrencyByLanguage, formatDateOnly } from '../utils/formatters';

const AdminPage = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState('');
  const [deleteFeedback, setDeleteFeedback] = useState('');
  const [transactionFeedback, setTransactionFeedback] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [deletingTransactionId, setDeletingTransactionId] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [fromAmountFilter, setFromAmountFilter] = useState('');
  const [toAmountFilter, setToAmountFilter] = useState('');
  const [rawTransactions, setRawTransactions] = useState([]);
  const [visibleTransactions, setVisibleTransactions] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCount, setFilteredCount] = useState(0);
  const PAGE_SIZE = 10;

  const normalizeTransactionType = useCallback((transactionOrType, fallbackAmount = 0) => {
    const isObjectPayload = transactionOrType && typeof transactionOrType === 'object';
    const rawType = isObjectPayload
      ? (
          transactionOrType.type ||
          transactionOrType.transactionType ||
          transactionOrType.kind ||
          transactionOrType.categoryType ||
          transactionOrType.category?.type ||
          transactionOrType.category?.categoryType ||
          ''
        )
      : transactionOrType;

    if (isObjectPayload) {
      if (
        transactionOrType.isIncome === true ||
        transactionOrType.income === true ||
        transactionOrType.isInflow === true
      ) {
        return 'wpływ';
      }

      if (
        transactionOrType.isExpense === true ||
        transactionOrType.expense === true ||
        transactionOrType.isOutflow === true
      ) {
        return 'wydatek';
      }
    }

    const value = String(rawType || '').trim().toLowerCase();
    if (
      [
        'wpływ',
        'wplyw',
        'income',
        'inflow',
        'credit',
        'przychod',
        'przychód',
        '1',
      ].includes(value)
    ) {
      return 'wpływ';
    }

    if (
      [
        'wydatek',
        'expense',
        'outflow',
        'debit',
        'koszt',
        '0',
      ].includes(value)
    ) {
      return 'wydatek';
    }

    const amount = Number(
      isObjectPayload
        ? (transactionOrType.amount ?? transactionOrType.value ?? fallbackAmount)
        : fallbackAmount
    );

    if (!Number.isNaN(amount) && amount > 0) {
      return 'wpływ';
    }

    return 'wydatek';
  }, []);

  const extractTransactionsCollection = useCallback((payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const transactionKeys = [
      'transactions',
      'transactionHistory',
      'userTransactions',
      'operations',
      'items',
      'records',
      'data',
      'Data',
    ];

    for (const key of transactionKeys) {
      if (Array.isArray(payload[key])) {
        return payload[key];
      }
    }

    const nestedCandidates = [payload.data, payload.Data, payload.result, payload.Result, payload.user, payload.User];

    for (const candidate of nestedCandidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }

      if (candidate && typeof candidate === 'object') {
        for (const key of transactionKeys) {
          if (Array.isArray(candidate[key])) {
            return candidate[key];
          }
        }
      }
    }

    return [];
  }, []);

  const normalizeTransaction = useCallback((transaction, ownerId, txIndex) => {
    const amount = Number(transaction?.amount || transaction?.value || 0);

    return {
      id: transaction?.id || transaction?.transactionId || `${ownerId || 'user'}-${txIndex}`,
      accountId:
        transaction?.accountId ||
        transaction?.accountID ||
        transaction?.account?.id ||
        transaction?.account?.accountId ||
        '',
      date: transaction?.date || transaction?.transactionDate || transaction?.createdAt || '',
      category:
        transaction?.categoryName ||
        transaction?.category?.categoryName ||
        transaction?.category?.name ||
        (typeof transaction?.category === 'string' ? transaction.category : null) ||
        'Inne',
      description:
        transaction?.description ||
        transaction?.note ||
        transaction?.comment ||
        '',
      amount,
      type: normalizeTransactionType(transaction, amount),
    };
  }, [normalizeTransactionType]);

  const sortTransactionsNewestFirst = useCallback((transactionsList = []) => {
    if (!Array.isArray(transactionsList)) {
      return [];
    }

    return [...transactionsList].sort((a, b) => {
      const firstDate = new Date(a?.date || 0).getTime();
      const secondDate = new Date(b?.date || 0).getTime();

      return secondDate - firstDate;
    });
  }, []);


  const normalizeUser = useCallback((user, index) => {
    const transactionsData = extractTransactionsCollection(user);
    const normalizedTransactions = transactionsData.map((transaction, txIndex) =>
      normalizeTransaction(transaction, user?.id || index, txIndex)
    );

    return {
      id: user?.id || user?.userId || user?.accountId || `user-${index}`,
      email: user?.email || user?.mail || '',
      name: user?.name || user?.firstName || '',
      surname: user?.surname || user?.lastName || '',
      transactions: sortTransactionsNewestFirst(normalizedTransactions),
    };
  }, [extractTransactionsCollection, normalizeTransaction, sortTransactionsNewestFirst]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError('');

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await api.get('/Users', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        validateStatus: () => true,
      });

      if (response.status === 401) {
        removeAuthToken();
        navigate('/login');
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Nie udało się pobrać użytkowników (status ${response.status}).`);
      }

      const responseData = response.data;
      const usersData = Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(responseData?.Data)
          ? responseData.Data
          : Array.isArray(responseData)
            ? responseData
            : [];

      const normalizedUsers = usersData.map(normalizeUser);
      setUsers(normalizedUsers);
      setSelectedUserId((current) => {
        const selectedExists = normalizedUsers.some((user) => String(user.id) === String(current));
        return selectedExists ? current : normalizedUsers[0]?.id || '';
      });
    } catch (error) {
      console.error('Błąd ładowania użytkowników admina:', error);
      setUsersError(t('admin.loadUsersError'));
    } finally {
      setLoadingUsers(false);
    }
  }, [navigate, normalizeUser, t]);

  const loadSelectedUserTransactions = useCallback(async (userId) => {
    if (!userId) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setLoadingTransactions(true);
    setTransactionsError('');

    const userIdEncoded = encodeURIComponent(String(userId));
    const params = { Draw: 1, Start: 0, Length: 1000 };
    const endpoints = [
      { url: `/Users/${userIdEncoded}/Transactions`, params },
      { url: `/Users/${userIdEncoded}/transactions`, params },
    ];

    try {
      for (const endpoint of endpoints) {
        const response = await api.get(endpoint.url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          params: endpoint.params,
          validateStatus: () => true,
        });

        if (response.status === 401) {
          removeAuthToken();
          navigate('/login');
          return;
        }

        if (response.status === 404) {
          continue;
        }

        if (response.status >= 200 && response.status < 300) {
          const transactionsData = extractTransactionsCollection(response.data);

          
          if (!Array.isArray(transactionsData)) {
            continue;
          }

          const normalized = transactionsData.map((tx, i) => normalizeTransaction(tx, userId, i));
          setRawTransactions(normalized);
          return;
        }
      }

      setTransactionsError(t('admin.loadTransactionsError'));
    } catch (error) {
      console.error('Błąd ładowania transakcji użytkownika:', error);
      setTransactionsError(t('admin.loadTransactionsError'));
    } finally {
      setLoadingTransactions(false);
    }
  }, [extractTransactionsCollection, navigate, normalizeTransaction, t]);

  const categories = useMemo(() => {
    const seen = new Set();
    return rawTransactions
      .map((tx) => tx.category)
      .filter((name) => name && name !== 'Inne' && !seen.has(name) && seen.add(name))
      .sort();
  }, [rawTransactions]);

  const applyClientFilteringSortingPaging = useCallback((allTransactions) => {
    const fromDateParam = String(fromDateFilter || '').trim();
    const toDateParam = String(toDateFilter || '').trim();
    const fromAmount = Number(fromAmountFilter);
    const toAmount = Number(toAmountFilter);
    const searchNormalized = searchValue.trim().toLowerCase();

    const filtered = (allTransactions || []).filter((tx) => {
      const category = String(tx.category || '');
      const description = String(tx.description || '');
      const amount = Number(tx.amount || 0);
      const txDate = String(tx.date || '').split('T')[0];

      if (searchNormalized) {
        if (!`${category} ${description}`.toLowerCase().includes(searchNormalized)) return false;
      }
      if (categoryFilter.trim()) {
        if (category.toLowerCase() !== categoryFilter.trim().toLowerCase()) return false;
      }
      if (fromDateParam && txDate && txDate < fromDateParam) return false;
      if (toDateParam && txDate && txDate > toDateParam) return false;
      if (fromAmountFilter && !Number.isNaN(fromAmount) && amount < fromAmount) return false;
      if (toAmountFilter && !Number.isNaN(toAmount) && amount > toAmount) return false;

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
    setVisibleTransactions(filtered.slice(start, start + PAGE_SIZE));
    setFilteredCount(filtered.length);
  }, [categoryFilter, currentPage, fromAmountFilter, fromDateFilter, searchValue, sortBy, sortDirection, toAmountFilter, toDateFilter]);

  const handleDeleteUser = async () => {
    const selectedUser = users.find((user) => String(user.id) === String(selectedUserId));
    if (!selectedUser || deletingUserId) {
      return;
    }

    const confirmed = window.confirm(`${t('admin.deleteConfirm')} ${selectedUser.email || selectedUser.id}?`);
    if (!confirmed) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setDeleteFeedback('');
    setDeletingUserId(String(selectedUser.id));

    try {
      const response = await api.delete(`/Users/${selectedUser.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        validateStatus: () => true,
      });

      if (response.status === 401) {
        removeAuthToken();
        navigate('/login');
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Nie udało się usunąć użytkownika (status ${response.status}).`);
      }

      setUsers((currentUsers) => {
        const nextUsers = currentUsers.filter((user) => String(user.id) !== String(selectedUser.id));
        setSelectedUserId(nextUsers[0]?.id || '');
        return nextUsers;
      });
      setDeleteFeedback(t('admin.deleteSuccess'));
    } catch (error) {
      console.error('Błąd usuwania użytkownika:', error);
      setDeleteFeedback(t('admin.deleteError'));
    } finally {
      setDeletingUserId('');
    }
  };

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    const selectedUser = users.find((user) => String(user.id) === String(selectedUserId));
    if (!selectedUser || !transactionId || deletingTransactionId) {
      return;
    }

    const confirmed = window.confirm(t('admin.deleteTransactionConfirm'));
    if (!confirmed) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setTransactionFeedback('');
    setDeletingTransactionId(String(transactionId));

    const userIdEncoded = encodeURIComponent(String(selectedUser.id));
    const transactionIdEncoded = encodeURIComponent(String(transactionId));
    const deleteEndpoints = [
      `/Users/${userIdEncoded}/Transactions/${transactionIdEncoded}`,
      `/Users/${userIdEncoded}/transactions/${transactionIdEncoded}`,
      `/Transactions/${transactionIdEncoded}`,
      `/Me/Transactions/${transactionIdEncoded}`,
    ];

    try {
      let deleteSucceeded = false;

      for (const endpoint of deleteEndpoints) {
        const response = await api.delete(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          validateStatus: () => true,
        });

        if (response.status === 401) {
          removeAuthToken();
          navigate('/login');
          return;
        }

        if (response.status === 404 || response.status === 405) {
          continue;
        }

        if (response.status >= 200 && response.status < 300) {
          deleteSucceeded = true;
          break;
        }
      }

      if (!deleteSucceeded) {
        throw new Error('Nie znaleziono działającego endpointu usuwania transakcji.');
      }

      
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          String(user.id) === String(selectedUser.id)
            ? {
                ...user,
                transactions: (user.transactions || []).filter((tx) => String(tx.id) !== String(transactionId)),
              }
            : user
        )
      );

      setTransactionFeedback(t('admin.deleteTransactionSuccess'));
      await loadSelectedUserTransactions(selectedUser.id);
    } catch (error) {
      console.error('Błąd usuwania transakcji użytkownika:', error);
      setTransactionFeedback(t('admin.deleteTransactionError'));
    } finally {
      setDeletingTransactionId('');
    }
  }, [deletingTransactionId, loadSelectedUserTransactions, navigate, selectedUserId, t, users]);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [loadUsers, navigate]);

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
    setRawTransactions([]);
    setVisibleTransactions([]);
    setFilteredCount(0);
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadSelectedUserTransactions(selectedUserId);
  }, [selectedUserId, language, loadSelectedUserTransactions]);

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

  useEffect(() => {
    applyClientFilteringSortingPaging(rawTransactions);
  }, [applyClientFilteringSortingPaging, rawTransactions]);

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === String(selectedUserId)) || null,
    [selectedUserId, users]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const firstItemNumber = filteredCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItemNumber = Math.min(currentPage * PAGE_SIZE, filteredCount);

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <Navbar />

      <main className="grow flex items-start lg:items-center justify-center p-4 lg:p-6 min-h-0 overflow-visible lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full px-[8%] gap-4 lg:gap-6 items-stretch lg:h-full min-h-0">
          <section className="w-full lg:w-[30%] bg-white rounded-[2.5rem] p-5 lg:p-6 shadow-sm border border-slate-200 flex flex-col min-h-56 lg:min-h-0">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('admin.users')}</h2>
            {usersError ? <div className="mb-3 text-xs text-rose-600 font-semibold">{usersError}</div> : null}
            <div className="flex-1 overflow-auto pr-1 space-y-2">
              {loadingUsers ? (
                <div className="text-sm text-slate-500">{t('admin.loadingUsers')}</div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isSelected={user.id === selectedUserId}
                    onClick={() => setSelectedUserId(user.id)}
                  />
                ))
              ) : (
                <EmptyState title={t('admin.noUsersTitle')} message={t('admin.noUsersMessage')} />
              )}
            </div>
          </section>

          <section className="w-full lg:flex-1 bg-white rounded-[2.5rem] p-5 lg:p-6 shadow-sm border border-slate-200 flex flex-col min-h-88 lg:min-h-0 overflow-hidden">
            {selectedUser ? (
              <>
                <div className="mb-2 shrink-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-lg font-black tracking-tight text-slate-900 shrink-0">{t('admin.adminPanel')}</h2>
                    <span className="hidden lg:block truncate text-xs text-slate-400">{selectedUser.email}</span>
                    <span className="hidden lg:block truncate text-xs font-semibold text-slate-600">{`${selectedUser.name} ${selectedUser.surname}`.trim()}</span>
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      disabled={Boolean(deletingUserId)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      title={t('admin.deleteUser')}
                      aria-label={t('admin.deleteUser')}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFiltersOpen((prev) => !prev)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    {t('history.filtering')}
                  </button>
                </div>

                {isFiltersOpen && (
                  <div
                    onMouseLeave={() => setIsFiltersOpen(false)}
                    className="mb-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shrink-0 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(1); }}
                        placeholder={t('history.searchPlaceholder')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-0"
                      />
                      <select
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-0"
                      >
                        <option value="">{t('history.allCategories')}</option>
                        {categories.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={fromDateFilter}
                        onChange={(e) => { setFromDateFilter(e.target.value); setCurrentPage(1); }}
                        aria-label={t('history.fromDate')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-0"
                      />
                      <input
                        type="date"
                        value={toDateFilter}
                        onChange={(e) => { setToDateFilter(e.target.value); setCurrentPage(1); }}
                        aria-label={t('history.toDate')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fromAmountFilter}
                        onChange={(e) => { setFromAmountFilter(e.target.value); setCurrentPage(1); }}
                        placeholder={t('history.fromAmount')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-0"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={toAmountFilter}
                        onChange={(e) => { setToAmountFilter(e.target.value); setCurrentPage(1); }}
                        placeholder={t('history.toAmount')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-0"
                      />
                      <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-0"
                      >
                        <option value="date">{t('history.sortDate')}</option>
                        <option value="amount">{t('history.sortAmount')}</option>
                      </select>
                      <div className="flex gap-2">
                        <select
                          value={sortDirection}
                          onChange={(e) => { setSortDirection(e.target.value); setCurrentPage(1); }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-0"
                        >
                          <option value="desc">{t('history.descending')}</option>
                          <option value="asc">{t('history.ascending')}</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => { setSearchValue(''); setCategoryFilter(''); setFromDateFilter(''); setToDateFilter(''); setFromAmountFilter(''); setToAmountFilter(''); setSortBy('date'); setSortDirection('desc'); setCurrentPage(1); }}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          {t('history.clearFilters')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{t('admin.transactionList')}</h3>
                  <span className="text-xs font-semibold text-slate-500">{t('history.showingEntries', { from: firstItemNumber, to: lastItemNumber, total: filteredCount })}</span>
                </div>

                {transactionsError ? <div className="mb-3 text-xs text-rose-600 font-semibold">{transactionsError}</div> : null}

                {deleteFeedback ? <div className="mb-3 text-xs font-semibold text-slate-600">{deleteFeedback}</div> : null}
                {transactionFeedback ? <div className="mb-3 text-xs font-semibold text-slate-600">{transactionFeedback}</div> : null}

                <div className="flex-1 overflow-auto space-y-2 pr-1 mb-4">
                  {loadingTransactions ? (
                    <div className="text-sm text-slate-500">{t('admin.loadingTransactions')}</div>
                  ) : visibleTransactions.length > 0 ? (
                    visibleTransactions.map((tx) => (
                      <div key={tx.id} className="px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <p className="text-[11px] font-semibold text-slate-400 mb-1.5">{formatDateOnly(tx.date, language)}</p>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-800 w-1/4 truncate">{tx.category}</span>
                          <span className="flex-1 text-xs text-slate-500 text-center truncate">
                            {(() => { const d = String(tx.description || '').trim(); return (d && d.toLowerCase() !== String(tx.category || '').toLowerCase()) ? d.slice(0, 30) : t('common.noDescription'); })()}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`font-black text-sm ${tx.type === 'wpływ' ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {tx.type === 'wpływ' ? '+' : '-'}{formatCurrencyByLanguage(tx.amount, language)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              disabled={Boolean(deletingTransactionId)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t('admin.deleteTransaction')}
                              aria-label={t('admin.deleteTransaction')}
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState title={t('admin.noTransactionsTitle')} message={t('admin.noTransactionsMessage')} icon="💳" />
                  )}
                </div>

                <div className="mt-2 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 pt-2 mb-3">
                  <p className="text-xs text-slate-500">
                    {t('history.showingEntries', { from: firstItemNumber, to: lastItemNumber, total: filteredCount })}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loadingTransactions}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('history.previousPage')}
                    </button>
                    <span className="text-xs font-semibold text-slate-600 px-1">
                      {t('history.pageIndicator', { current: currentPage, total: totalPages })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages || loadingTransactions}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('history.nextPage')}
                    </button>
                  </div>
                </div>


              </>
            ) : loadingUsers ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">{t('admin.loadingUsers')}</div>
            ) : (
              <EmptyState title={t('admin.noUsersTitle')} message={t('admin.noUsersMessage')} />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;
