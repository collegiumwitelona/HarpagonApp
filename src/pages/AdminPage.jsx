import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UserCard from '../components/UserCard';
import EmptyState from '../components/EmptyState';
import HistoryFiltersPanel from '../components/HistoryFiltersPanel';
import HistoryPaginationControls from '../components/HistoryPaginationControls';
import HistoryTransactionRow from '../components/HistoryTransactionRow';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { isAdmin } from '../services/auth';
import { getAuthToken, removeAuthToken } from '../utils/tokenHelper';
import { fetchAllFromFirstSuccessfulEndpoint } from '../utils/apiFallbacks';
import { extractTransactionsCollection, normalizeTransactionRecord } from '../utils/transactions';
import { useDataFetch } from '../utils/hooks';

const AdminPage = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [selectedUserId, setSelectedUserId] = useState('');
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
  const [visibleTransactions, setVisibleTransactions] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCount, setFilteredCount] = useState(0);
  const PAGE_SIZE = 10;

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
      normalizeTransactionRecord(transaction, {
        ownerId: user?.id || index,
        index: txIndex,
        includeDescription: true,
        normalizeDateValue: false,
      })
    );
    const emailConfirmedRaw =
      user?.emailConfirmed ??
      user?.EmailConfirmed ??
      user?.isEmailConfirmed ??
      user?.IsEmailConfirmed ??
      user?.emailVerified ??
      user?.EmailVerified;

    return {
      id: user?.id || user?.userId || user?.accountId || `user-${index}`,
      email: user?.email || user?.mail || '',
      emailConfirmed: emailConfirmedRaw === true,
      name: user?.name || user?.firstName || '',
      surname: user?.surname || user?.lastName || '',
      transactions: sortTransactionsNewestFirst(normalizedTransactions),
    };
  }, [sortTransactionsNewestFirst]);

  const fetchUsers = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      throw new Error('No authentication token');
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
        throw new Error('Unauthorized');
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(t('admin.loadUsersError'));
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
      return normalizedUsers;
    } catch (error) {
      console.error('Błąd ładowania użytkowników admina:', error);
      throw error;
    }
  }, [navigate, normalizeUser, t]);

  const fetchTransactions = useCallback(async () => {
    if (!selectedUserId) {
      return [];
    }

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      throw new Error('No authentication token');
    }

    const userIdEncoded = encodeURIComponent(String(selectedUserId));
    const params = { Draw: 1 };
    const endpoints = [
      { url: `/Users/${userIdEncoded}/Transactions`, params },
      { url: `/Users/${userIdEncoded}/transactions`, params },
    ];

    try {
      const response = await fetchAllFromFirstSuccessfulEndpoint({
        requests: endpoints,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        onUnauthorized: () => {
          removeAuthToken();
          navigate('/login');
        },
      });

      if (!response) {
        throw new Error(t('admin.loadTransactionsError'));
      }

      const transactionsData = extractTransactionsCollection(response.data);

      const normalized = transactionsData.map((tx, i) =>
        normalizeTransactionRecord(tx, {
          ownerId: selectedUserId,
          index: i,
          includeDescription: true,
          normalizeDateValue: false,
        })
      );

      return normalized;
    } catch (error) {
      console.error('Błąd ładowania transakcji użytkownika:', error);
      throw error;
    }
  }, [selectedUserId, navigate, t]);

  const usersData = useDataFetch(fetchUsers);
  const transactionsData = useDataFetch(fetchTransactions);
  
  const users = useMemo(() => usersData.data || [], [usersData.data]);
  const rawTransactions = useMemo(() => transactionsData.data || [], [transactionsData.data]);

  const categories = useMemo(() => {
    const seen = new Set();
    return rawTransactions
      .map((tx) => tx.category)
      .filter((name) => name && name !== 'Inne' && !seen.has(name) && seen.add(name))
      .sort();
  }, [rawTransactions]);

  const categoryOptions = useMemo(
    () => categories.map((name) => ({ key: name, value: name, label: name })),
    [categories]
  );

  const handleClearFilters = useCallback(() => {
    setSearchValue('');
    setCategoryFilter('');
    setFromDateFilter('');
    setToDateFilter('');
    setFromAmountFilter('');
    setToAmountFilter('');
    setSortBy('date');
    setSortDirection('desc');
    setCurrentPage(1);
  }, []);

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

      setDeleteFeedback(t('admin.deleteSuccess'));
      usersData.retry();
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

      setTransactionFeedback(t('admin.deleteTransactionSuccess'));
      transactionsData.retry();
    } catch (error) {
      console.error('Błąd usuwania transakcji użytkownika:', error);
      setTransactionFeedback(t('admin.deleteTransactionError'));
    } finally {
      setDeletingTransactionId('');
    }
  }, [deletingTransactionId, selectedUserId, navigate, t, users, transactionsData]);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0]?.id || '');
    }
  }, [users, selectedUserId]);

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
    setVisibleTransactions([]);
    setFilteredCount(0);
  }, [selectedUserId]);

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
  }, [applyClientFilteringSortingPaging, rawTransactions, searchValue, categoryFilter, fromDateFilter, toDateFilter, fromAmountFilter, toAmountFilter, sortBy, sortDirection, currentPage]);

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
            {usersData.error ? <div className="mb-3 text-xs text-rose-600 font-semibold">{usersData.error}</div> : null}
            <div className="flex-1 overflow-auto pr-1 space-y-2">
              {usersData.loading ? (
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
                    <span className={`hidden lg:block truncate text-xs font-semibold ${selectedUser.emailConfirmed ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedUser.email}
                    </span>
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
                />

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{t('admin.transactionList')}</h3>
                  <span className="text-xs font-semibold text-slate-500">{t('history.showingEntries', { from: firstItemNumber, to: lastItemNumber, total: filteredCount })}</span>
                </div>

                {transactionsData.error ? <div className="mb-3 text-xs text-rose-600 font-semibold">{transactionsData.error}</div> : null}

                {deleteFeedback ? <div className="mb-3 text-xs font-semibold text-slate-600">{deleteFeedback}</div> : null}
                {transactionFeedback ? <div className="mb-3 text-xs font-semibold text-slate-600">{transactionFeedback}</div> : null}

                <div className="flex-1 overflow-auto space-y-2 pr-1 mb-4">
                  {transactionsData.loading ? (
                    <div className="text-sm text-slate-500">{t('admin.loadingTransactions')}</div>
                  ) : visibleTransactions.length > 0 ? (
                    visibleTransactions.map((tx) => (
                      <HistoryTransactionRow
                        key={tx.id}
                        transaction={tx}
                        language={language}
                        t={t}
                        onDelete={() => handleDeleteTransaction(tx.id)}
                        deleting={Boolean(deletingTransactionId)}
                        deleteTitle={t('admin.deleteTransaction')}
                      />
                    ))
                  ) : (
                    <EmptyState title={t('admin.noTransactionsTitle')} message={t('admin.noTransactionsMessage')} icon="💳" />
                  )}
                </div>

                <div className="mt-2 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 pt-2 mb-3">
                  <p className="text-xs text-slate-500">
                    {t('history.showingEntries', { from: firstItemNumber, to: lastItemNumber, total: filteredCount })}
                  </p>
                  <HistoryPaginationControls
                    t={t}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    loading={transactionsData.loading}
                    onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  />
                </div>


              </>
            ) : usersData.loading ? (
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
