import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UserCard from '../components/UserCard';
import InfoCard from '../components/InfoCard';
import EmptyState from '../components/EmptyState';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { isAdmin } from '../services/auth';
import { getAuthToken, removeAuthToken } from '../utils/tokenHelper';
import { translateCategoryName } from '../utils/categoryTranslations';
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
      date: transaction?.date || transaction?.transactionDate || transaction?.createdAt || '',
      category:
        transaction?.categoryName ||
        transaction?.category?.categoryName ||
        transaction?.category?.name ||
        transaction?.category ||
        'Inne',
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

  const mergeUserTransactions = useCallback((userId, transactionsData) => {
    const normalizedTransactions = Array.isArray(transactionsData)
      ? transactionsData.map((transaction, txIndex) => normalizeTransaction(transaction, userId, txIndex))
      : [];
    const sortedTransactions = sortTransactionsNewestFirst(normalizedTransactions);

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        String(user.id) === String(userId)
          ? { ...user, transactions: sortedTransactions }
          : user
      )
    );
  }, [normalizeTransaction, sortTransactionsNewestFirst]);

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
    const endpoints = [
      {
        url: `/Users/${userIdEncoded}/Transactions`,
        params: {
          Draw: 1,
          Start: 0,
          Length: 100,
          'Search.Value': '',
        },
      },
      {
        url: `/Users/${userIdEncoded}/transactions`,
        params: {
          Draw: 1,
          Start: 0,
          Length: 100,
          'Search.Value': '',
        },
      },
      {
        url: `/Users/${userIdEncoded}`,
      },
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

          mergeUserTransactions(userId, transactionsData);
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
  }, [extractTransactionsCollection, mergeUserTransactions, navigate, t]);

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
    if (!selectedUserId) {
      return;
    }

    loadSelectedUserTransactions(selectedUserId);
  }, [loadSelectedUserTransactions, selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === String(selectedUserId)) || null,
    [selectedUserId, users]
  );

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
                <div className="mb-5">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">{t('admin.adminPanel')}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <InfoCard label="Email" value={selectedUser.email} />
                  <InfoCard label={t('admin.fullName')} value={`${selectedUser.name} ${selectedUser.surname}`} />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{t('admin.transactionList')}</h3>
                  <span className="text-xs font-semibold text-slate-500">{t('admin.positions', { count: selectedUser.transactions.length })}</span>
                </div>

                {transactionsError ? <div className="mb-3 text-xs text-rose-600 font-semibold">{transactionsError}</div> : null}

                {deleteFeedback ? <div className="mb-3 text-xs font-semibold text-slate-600">{deleteFeedback}</div> : null}
                {transactionFeedback ? <div className="mb-3 text-xs font-semibold text-slate-600">{transactionFeedback}</div> : null}

                <div className="flex-1 overflow-auto space-y-2 pr-1 mb-4">
                  {loadingTransactions ? (
                    <div className="text-sm text-slate-500">{t('admin.loadingTransactions')}</div>
                  ) : selectedUser.transactions.length > 0 ? (
                    selectedUser.transactions.map((tx) => (
                      <div key={tx.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col items-start text-left">
                          <p className="text-left text-sm font-semibold text-slate-800 dark:text-slate-200">{translateCategoryName(tx.category, language)}</p>
                          <p className="text-left text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateOnly(tx.date, language)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm ${tx.type === 'wpływ' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
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
                    ))
                  ) : (
                    <EmptyState title={t('admin.noTransactionsTitle')} message={t('admin.noTransactionsMessage')} icon="💳" />
                  )}
                </div>

                <button
                  type="button"
                  className="w-full sm:w-auto sm:self-end rounded-xl bg-rose-600 text-white px-5 py-2.5 text-sm font-black hover:bg-rose-700 transition-colors disabled:opacity-50"
                  disabled={Boolean(deletingUserId)}
                  onClick={handleDeleteUser}
                >
                  {deletingUserId ? t('admin.deletingUser') : t('admin.deleteUser')}
                </button>
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
